-- ═══════════════════════════════════════════════════════════════════════════
-- Migration : Offres partenaires (brand_offers + user_claimed_offers)
-- À exécuter dans le SQL Editor du dashboard Supabase.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Tables ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS brand_offers (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand                  text        NOT NULL,
  title                  text        NOT NULL,
  description            text,
  discount               text        NOT NULL,           -- ex: '-15%', 'Livraison offerte'
  icon_name              text        DEFAULT 'pricetag-outline', -- Ionicons
  color_theme            text        DEFAULT 'amber',    -- 'amber' | 'rose' | 'sage'
  code_type              text        NOT NULL DEFAULT 'generic'
                                     CHECK (code_type IN ('generic', 'pool')),
  code_value             text,                           -- code unique si code_type = 'generic'
  partner_url            text,
  eligibility_min_level  integer     NOT NULL DEFAULT 1
                                     CHECK (eligibility_min_level BETWEEN 1 AND 10),
  eligibility_min_coins  integer     NOT NULL DEFAULT 0,
  stock_remaining        integer,                        -- NULL = illimité
  expires_at             timestamptz,
  active                 boolean     NOT NULL DEFAULT true,
  sort_order             integer     NOT NULL DEFAULT 0,
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- Pool de codes uniques pour code_type = 'pool'
CREATE TABLE IF NOT EXISTS offer_code_pool (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    uuid        NOT NULL REFERENCES brand_offers(id) ON DELETE CASCADE,
  code        text        NOT NULL,
  assigned_to uuid        REFERENCES auth.users(id),
  assigned_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Codes réclamés par les utilisatrices
CREATE TABLE IF NOT EXISTS user_claimed_offers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id),
  offer_id      uuid        NOT NULL REFERENCES brand_offers(id),
  code_assigned text,
  claimed_at    timestamptz NOT NULL DEFAULT now(),
  used_at       timestamptz,
  UNIQUE (user_id, offer_id)
);

-- ── 2. Index ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_brand_offers_active
  ON brand_offers (active, sort_order);

CREATE INDEX IF NOT EXISTS idx_offer_code_pool_offer
  ON offer_code_pool (offer_id, assigned_to);

CREATE INDEX IF NOT EXISTS idx_user_claimed_offers_user
  ON user_claimed_offers (user_id);

CREATE INDEX IF NOT EXISTS idx_user_claimed_offers_offer
  ON user_claimed_offers (offer_id);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE brand_offers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_code_pool     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_claimed_offers ENABLE ROW LEVEL SECURITY;

-- brand_offers : toutes les utilisatrices authentifiées lisent les offres actives
CREATE POLICY "brand_offers_read_active"
  ON brand_offers FOR SELECT
  USING (active = true);

-- offer_code_pool : chaque utilisatrice voit uniquement ses codes assignés
CREATE POLICY "offer_code_pool_read_own"
  ON offer_code_pool FOR SELECT
  USING (assigned_to = auth.uid());

-- user_claimed_offers : lecture + création limitées à l'utilisatrice
CREATE POLICY "claimed_offers_read_own"
  ON user_claimed_offers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "claimed_offers_insert_own"
  ON user_claimed_offers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "claimed_offers_update_own"
  ON user_claimed_offers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 4. Fonction claim_brand_offer (atomique, SECURITY DEFINER) ───────────────
--
-- Gère en une seule transaction :
--   - vérification d'éligibilité
--   - assignation d'un code (generic ou pool)
--   - décrémentation du stock
--   - enregistrement du claim
--
-- Retourne : { ok: bool, code: text|null, already_claimed: bool, error: text|null }

CREATE OR REPLACE FUNCTION claim_brand_offer(p_offer_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_offer   brand_offers%ROWTYPE;
  v_code    text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  -- Récupérer l'offre active
  SELECT * INTO v_offer FROM brand_offers
  WHERE id = p_offer_id AND active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'offer_not_found');
  END IF;

  -- Expirée ?
  IF v_offer.expires_at IS NOT NULL AND v_offer.expires_at < now() THEN
    RETURN json_build_object('ok', false, 'error', 'expired');
  END IF;

  -- Déjà réclamée ? → retourner le code existant
  IF EXISTS (
    SELECT 1 FROM user_claimed_offers
    WHERE user_id = v_user_id AND offer_id = p_offer_id
  ) THEN
    SELECT code_assigned INTO v_code FROM user_claimed_offers
    WHERE user_id = v_user_id AND offer_id = p_offer_id;
    RETURN json_build_object('ok', true, 'code', v_code, 'already_claimed', true);
  END IF;

  -- Stock épuisé ?
  IF v_offer.stock_remaining IS NOT NULL AND v_offer.stock_remaining <= 0 THEN
    RETURN json_build_object('ok', false, 'error', 'out_of_stock');
  END IF;

  -- Obtenir le code
  IF v_offer.code_type = 'generic' THEN
    v_code := v_offer.code_value;

  ELSIF v_offer.code_type = 'pool' THEN
    UPDATE offer_code_pool
    SET assigned_to = v_user_id, assigned_at = now()
    WHERE id = (
      SELECT id FROM offer_code_pool
      WHERE offer_id = p_offer_id AND assigned_to IS NULL
      LIMIT 1 FOR UPDATE SKIP LOCKED
    )
    RETURNING code INTO v_code;

    IF v_code IS NULL THEN
      RETURN json_build_object('ok', false, 'error', 'out_of_stock');
    END IF;
  END IF;

  -- Décrémenter le stock
  IF v_offer.stock_remaining IS NOT NULL THEN
    UPDATE brand_offers
    SET stock_remaining = stock_remaining - 1
    WHERE id = p_offer_id;
  END IF;

  -- Enregistrer le claim
  INSERT INTO user_claimed_offers (user_id, offer_id, code_assigned)
  VALUES (v_user_id, p_offer_id, v_code);

  RETURN json_build_object('ok', true, 'code', v_code, 'already_claimed', false);
END;
$$;

-- ── 5. Données de test (optionnel — à supprimer en production) ───────────────
--
-- INSERT INTO brand_offers (brand, title, description, discount, icon_name, color_theme, code_type, code_value, partner_url, eligibility_min_level, eligibility_min_coins, sort_order)
-- VALUES
--   ('NaturalLab', '-10% sur ta commande', 'Valable sur tout le site', '-10%', 'flask-outline', 'amber', 'generic', 'COTON10', 'https://naturallab.fr', 1, 0, 1),
--   ('AfroKosher', 'Livraison offerte', 'Sans minimum d''achat', 'Livraison', 'bicycle-outline', 'sage', 'generic', 'LIVRAISON', 'https://afrokosher.fr', 2, 100, 2),
--   ('KinkyCurls', '-20% dès le niveau 4', 'Offre exclusive Coton Noir', '-20%', 'sparkles-outline', 'rose', 'generic', 'KINKY20', 'https://kinkycurls.fr', 4, 0, 3);

-- ═══════════════════════════════════════════════════════════════════════════
-- ADMIN — Gérer les offres via le Table Editor Supabase
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Table : brand_offers
-- Champs clés à remplir pour chaque offre partenaire :
--
--   brand                  → Nom de la marque (ex: "NaturalLab")
--   title                  → Titre de l'offre (ex: "-10% sur ta commande")
--   description            → Détails (ex: "Valable sur tout le site jusqu'au 31/12")
--   discount               → Libellé réduction (ex: "-10%", "Livraison offerte")
--   icon_name              → Icône Ionicons (ex: "flask-outline", "bag-handle-outline")
--   color_theme            → "amber" | "rose" | "sage"
--   code_type              → "generic" (même code pour toutes) | "pool" (codes uniques)
--   code_value             → Le code promo si code_type = 'generic' (ex: "COTON10")
--   partner_url            → URL du site partenaire
--   eligibility_min_level  → Niveau minimum (1 = toutes, 4 = Glow Fro+, etc.)
--   eligibility_min_coins  → Coins minimum dans le portefeuille (0 = pas de condition)
--   stock_remaining        → Nombre de codes dispo (NULL = illimité)
--   expires_at             → Date d'expiration (NULL = pas de limite)
--   active                 → true pour afficher, false pour masquer
--   sort_order             → Ordre d'affichage (0 = en premier)
--
-- Pour les offres code_type = 'pool' :
--   → Insérer les codes individuels dans la table offer_code_pool
--   → (offer_id, code) pour chaque code unique fourni par la marque
-- ═══════════════════════════════════════════════════════════════════════════
