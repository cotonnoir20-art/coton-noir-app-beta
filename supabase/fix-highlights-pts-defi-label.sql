-- Met à jour le libellé Hydra Challenge (pts défi, pas CotonCoins).
-- Réexécutable.

update public.highlights
set footer_left = '+30 pts défi/jour'
where footer_left in ('+30 pts palier/jour', '+30 pts/jour', '+30 pts défi palier/jour');
