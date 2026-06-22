import type { IngredientInfo } from './ingredientAnalysis';

// Source : CurlsBotAPI (melissamcewen/curlsbotAPI) — mappé vers le système Coton Noir
// Ces entrées complètent ingredientAnalysis.ts (notre DB détaillée a priorité dans le parser)

export const CURLSBOT_INGREDIENTS: IngredientInfo[] = [

  // ══════ ROUGE — SULFATES ══════

  { id: 'ammonium_lauryl_sulfate', name: 'Ammonium Lauryl Sulfate', aliases: ['ALS', 'ammonium dodecyl sulfate'],
    rating: 'rouge', category: 'Tensioactif sulfaté',
    effect: 'Nettoyant moussant puissant',
    why: 'Sulfate très décapant qui élimine le film hydrolipidique naturel, assèche et fragilise les cheveux texturés.' },

  { id: 'sodium_laureth_sulfate', name: 'Sodium Laureth Sulfate', aliases: ['SLES', 'sodium lauryl ether sulfate'],
    rating: 'rouge', category: 'Tensioactif sulfaté éthoxylé',
    effect: 'Nettoyant moussant large spectre',
    why: 'Variante éthoxylée du SLS — moins irritant mais toujours asséchant pour les cheveux bouclés et crépus.' },

  { id: 'ammonium_laureth_sulfate', name: 'Ammonium Laureth Sulfate', aliases: ['ammonium lauryl ether sulfate'],
    rating: 'rouge', category: 'Tensioactif sulfaté',
    effect: 'Nettoyant moussant',
    why: 'Sulfate décapant, fragilise la barrière capillaire et assèche les cheveux naturellement secs.' },

  { id: 'tea_lauryl_sulfate', name: 'TEA-Lauryl Sulfate', aliases: ['triethanolamine lauryl sulfate'],
    rating: 'rouge', category: 'Tensioactif sulfaté',
    effect: 'Nettoyant moussant',
    why: 'Sulfate irritant pour le cuir chevelu, très décapant pour les cheveux texturés.' },

  { id: 'coco_sulfate', name: 'Coco Sulfate', aliases: ['sodium coco sulfate', 'SCS'],
    rating: 'rouge', category: 'Tensioactif sulfaté',
    effect: 'Nettoyant moussant dérivé du coco',
    why: 'Mélange de sulfates aussi décapant que le SLS malgré son origine naturelle.' },

  { id: 'coceth_sulfate', name: 'Coceth Sulfate', aliases: [],
    rating: 'rouge', category: 'Tensioactif sulfaté',
    effect: 'Nettoyant et émulsifiant',
    why: 'Sulfate à éviter pour les cheveux texturés qui nécessitent un nettoyage doux.' },

  { id: 'cetearyl_sulfate', name: 'Cetearyl Sulfate', aliases: [],
    rating: 'rouge', category: 'Tensioactif sulfaté',
    effect: 'Émulsifiant et nettoyant',
    why: 'Sulfate qui perturbe le film hydrolipidique protecteur de la fibre capillaire.' },

  // ══════ ROUGE — SILICONES NON HYDROSOLUBLES ══════

  { id: 'amodimethicone', name: 'Amodimethicone', aliases: ['aminopropyl dimethicone'],
    rating: 'rouge', category: 'Silicone non hydrosoluble',
    effect: 'Lisse la cuticule et apporte brillance',
    why: "S'accumule préférentiellement sur les zones abîmées, bloque l'hydratation et nécessite des sulfates pour être éliminé." },

  { id: 'cetearyl_methicone', name: 'Cetearyl Methicone', aliases: [],
    rating: 'rouge', category: 'Silicone non hydrosoluble',
    effect: 'Agent de texture et de glissant',
    why: "Silicone lourd qui s'accumule et crée des dépôts difficiles à éliminer." },

  { id: 'cyclohexasiloxane', name: 'Cyclohexasiloxane', aliases: ['D6'],
    rating: 'rouge', category: 'Silicone cyclique',
    effect: 'Légèreté et lissage immédiat',
    why: 'Silicone cyclique suspecté perturbateur endocrinien qui s\'accumule sur la fibre.' },

  { id: 'dimethiconol', name: 'Dimethiconol', aliases: ['bis-hydroxy/methoxy amodimethicone'],
    rating: 'rouge', category: 'Silicone non hydrosoluble',
    effect: 'Brillance et lissage durable',
    why: "S'accumule plus que le diméthicone classique, imperméabilise et bloque les soins." },

  { id: 'phenyl_trimethicone', name: 'Phenyl Trimethicone', aliases: ['trimethylsiloxy phenyl dimethicone'],
    rating: 'rouge', category: 'Silicone non hydrosoluble',
    effect: 'Brillance intense et protection thermique',
    why: 'Silicone lourd qui s\'accumule rapidement, impossible à éliminer sans shampoing sulfaté.' },

  { id: 'stearoxytrimethylsilane', name: 'Stearoxytrimethylsilane', aliases: [],
    rating: 'rouge', category: 'Silicone non hydrosoluble',
    effect: 'Lissage et contrôle des frisottis',
    why: 'Silicone non hydrosoluble qui génère des dépôts sur les cheveux bouclés.' },

  { id: 'trimethylsiloxysilicate', name: 'Trimethylsiloxysilicate', aliases: [],
    rating: 'rouge', category: 'Silicone non hydrosoluble',
    effect: 'Tenue et lissage longue durée',
    why: "L'un des silicones les plus difficiles à éliminer — génère des dépôts importants." },

  // ══════ ROUGE — ALCOOLS ASSÉCHANTS ══════

  { id: 'ethyl_alcohol', name: 'Ethyl Alcohol', aliases: ['ethanol', 'grain alcohol'],
    rating: 'rouge', category: 'Alcool asséchant',
    effect: 'Agent de texture, antiseptique',
    why: "S'évapore rapidement en emportant l'humidité de la fibre, fragilise les cheveux bouclés et crépus." },

  { id: 'isopropyl_alcohol', name: 'Isopropyl Alcohol', aliases: ['isopropanol', 'rubbing alcohol', '2-propanol'],
    rating: 'rouge', category: 'Alcool asséchant',
    effect: 'Solvant et agent de pénétration',
    why: 'Très asséchant, pénètre la fibre et élimine les lipides naturels protecteurs.' },

  { id: 'propyl_alcohol', name: 'Propyl Alcohol', aliases: ['n-propanol', '1-propanol'],
    rating: 'rouge', category: 'Alcool asséchant',
    effect: 'Solvant',
    why: 'Alcool asséchant qui fragilise la fibre et perturbe l\'hydratation capillaire.' },

  // ══════ ROUGE — HUILES PÉTROLIÈRES ══════

  { id: 'mineral_oil_cb', name: 'Mineral Oil', aliases: ['paraffinum liquidum', 'liquid paraffin', 'white mineral oil', 'huile minérale'],
    rating: 'rouge', category: 'Huile minérale pétrolière',
    effect: 'Forme une couche imperméable sur la fibre',
    why: 'Dérivé pétrolier qui bloque l\'hydratation de l\'intérieur et génère des dépôts lourds.',
    tip: 'Remplace par de l\'huile de noix de coco, mangue ou karité.' },

  { id: 'petrolatum', name: 'Petrolatum', aliases: ['petroleum jelly', 'vaseline', 'white petrolatum'],
    rating: 'rouge', category: 'Dérivé pétrolier',
    effect: 'Scelle et imperméabilise la fibre',
    why: 'Crée une barrière imperméable qui bloque l\'hydratation et génère des dépôts très lourds.',
    tip: 'Préfère du beurre de karité pour l\'effet scellant.' },

  // ══════ ORANGE — CIRES NON HYDROSOLUBLES ══════

  { id: 'beeswax', name: 'Beeswax', aliases: ['cera alba', 'cire d\'abeille'],
    rating: 'orange', category: 'Cire non hydrosoluble',
    effect: 'Scelle et définit la coiffure',
    why: "S'accumule à l'usage répété, alourdit les boucles et nécessite un nettoyant fort pour être éliminée." },

  { id: 'candelilla_wax', name: 'Candelilla Wax', aliases: ['euphorbia cerifera wax', 'cire candelilla'],
    rating: 'orange', category: 'Cire non hydrosoluble',
    effect: 'Texture et définition végétale',
    why: "Alternative végane à la cire d'abeille, mais génère aussi des dépôts avec l'usage répété." },

  { id: 'carnauba_wax', name: 'Carnauba Wax', aliases: ['cera carnauba', 'brazil wax'],
    rating: 'orange', category: 'Cire non hydrosoluble',
    effect: 'Brillance et durabilité',
    why: "Cire très dure qui s'accumule sur la fibre et bloque les soins hydratants." },

  { id: 'paraffin_wax', name: 'Paraffin Wax', aliases: ['paraffine', 'cire de paraffine'],
    rating: 'orange', category: 'Cire pétrolière',
    effect: 'Enrobe et protège la fibre',
    why: "Cire pétrolière qui s'accumule rapidement, alourdissant les boucles." },

  { id: 'microcrystalline_wax', name: 'Microcrystalline Wax', aliases: ['cire microcristalline'],
    rating: 'orange', category: 'Cire pétrolière',
    effect: 'Texture flexible et tenue',
    why: 'Cire dérivée du pétrole difficile à éliminer, génère des dépôts lourds.' },

  { id: 'ozokerite', name: 'Ozokerite', aliases: ['ozokerite wax', 'ceresin'],
    rating: 'orange', category: 'Cire minérale',
    effect: 'Épaissit et stabilise les formules',
    why: "Cire minérale qui peut s'accumuler, difficile à éliminer sans nettoyant fort." },

  // ══════ ORANGE — SILICONES HYDROSOLUBLES / ÉVAPORATIFS ══════

  { id: 'dimethicone_copolyol', name: 'Dimethicone Copolyol', aliases: ['peg dimethicone'],
    rating: 'orange', category: 'Silicone hydrosoluble',
    effect: 'Brillance et douceur légère',
    why: "Plus facile à éliminer qu'un silicone classique mais peut tout de même s'accumuler." },

  { id: 'cyclomethicone', name: 'Cyclomethicone', aliases: ['cyclic dimethicone'],
    rating: 'orange', category: 'Silicone évaporatif',
    effect: 'Légèreté et lissage temporaire',
    why: "S'évapore après application mais peut entraîner de la déshydratation à l'usage répété." },

  { id: 'peg_7_amodimethicone', name: 'PEG-7 Amodimethicone', aliases: [],
    rating: 'orange', category: 'Silicone hydrosoluble',
    effect: 'Démêlage et douceur',
    why: 'Silicone hydrosoluble moins problématique, mais surveiller l\'accumulation.' },

  // ══════ ORANGE — PROTÉINES ══════

  { id: 'hydrolyzed_wheat_protein', name: 'Hydrolyzed Wheat Protein',
    aliases: ['wheat amino acids', 'protéine de blé hydrolysée'],
    rating: 'orange', category: 'Protéine capillaire',
    effect: 'Renforce et répare la fibre endommagée',
    why: 'Efficace pour la réparation mais peut provoquer une surcharge protéinique sur les cheveux à faible élasticité.',
    tip: 'Alterner avec des soins hydratants pour éviter la rigidité.' },

  { id: 'hydrolyzed_keratin', name: 'Hydrolyzed Keratin',
    aliases: ['kératine hydrolysée', 'keratin protein'],
    rating: 'orange', category: 'Protéine capillaire',
    effect: 'Lisse et renforce la kératine naturelle',
    why: 'Peut entraîner une surcharge protéinique sur les cheveux fins ou à faible élasticité.',
    tip: 'Utiliser ponctuellement, pas à chaque soin.' },

  { id: 'hydrolyzed_collagen', name: 'Hydrolyzed Collagen',
    aliases: ['collagen amino acids', 'collagène hydrolysé', 'soluble collagen'],
    rating: 'orange', category: 'Protéine capillaire',
    effect: 'Élasticité et résistance de la fibre',
    why: 'Protéine qui renforce mais peut saturer les cheveux prédisposés à la surcharge protéinique.' },

  { id: 'hydrolyzed_oat_protein', name: 'Hydrolyzed Oat Protein',
    aliases: ['avena sativa protein', 'oat amino acids'],
    rating: 'orange', category: 'Protéine capillaire',
    effect: 'Douceur, brillance et résistance',
    why: 'Protéine de petite taille qui pénètre la fibre — à utiliser modérément pour éviter la rigidité.' },

  { id: 'hydrolyzed_silk', name: 'Hydrolyzed Silk',
    aliases: ['silk amino acids', 'sericin', 'silk protein', 'séricine'],
    rating: 'orange', category: 'Protéine soyeuse',
    effect: 'Brillance et douceur soyeuse',
    why: "Protéine légère qui peut s'accumuler. Surveiller si les cheveux deviennent raides." },

  { id: 'hydrolyzed_elastin', name: 'Hydrolyzed Elastin',
    aliases: ['elastin', 'elastine hydrolysée'],
    rating: 'orange', category: 'Protéine capillaire',
    effect: 'Élasticité et rebond des boucles',
    why: 'Bénéfique pour l\'élasticité mais à doser avec modération pour éviter la surcharge.' },

  // ══════ ORANGE — TENSIOACTIFS ANIONIQUES ══════

  { id: 'sodium_lauroyl_sarcosinate', name: 'Sodium Lauroyl Sarcosinate',
    aliases: ['sarcosinate', 'sarcosinates'],
    rating: 'orange', category: 'Tensioactif anionique doux',
    effect: 'Nettoyage doux avec mousse légère',
    why: 'Moins agressif que les sulfates mais peut encore décaper sur les cheveux très secs.' },

  { id: 'disodium_cocoyl_glutamate', name: 'Disodium Cocoyl Glutamate', aliases: [],
    rating: 'orange', category: 'Tensioactif anionique doux',
    effect: 'Nettoyant doux à pH respectueux',
    why: 'Globalement bien toléré, mais peut être légèrement décapant sur les cheveux très secs.' },

  // ══════ ORANGE — ASTRINGENTS & POLYQUATS ══════

  { id: 'witch_hazel', name: 'Witch Hazel',
    aliases: ['hamamelis virginiana', 'hamamélis', 'hamamelis water'],
    rating: 'orange', category: 'Astringent végétal',
    effect: 'Resserre les pores, régule le sébum du cuir chevelu',
    why: 'Peut assécher le cuir chevelu avec un usage fréquent. À utiliser ponctuellement.' },

  { id: 'polyquaternium_10', name: 'Polyquaternium-10', aliases: ['polyquat-10'],
    rating: 'orange', category: 'Polyquaternaire',
    effect: 'Conditionne, démêle et réduit l\'électricité statique',
    why: 'Efficace mais peut générer des dépôts à l\'usage répété, alourdissant les boucles fines.' },

  { id: 'polyquaternium_11', name: 'Polyquaternium-11', aliases: ['polyquat-11'],
    rating: 'orange', category: 'Polyquaternaire',
    effect: 'Fixation et conditionnement',
    why: 'Polymère filmogène qui peut s\'accumuler sur la fibre à long terme.' },

  // ══════ VERT — ALCOOLS GRAS ══════

  { id: 'myristyl_alcohol', name: 'Myristyl Alcohol', aliases: ['1-tetradecanol'],
    rating: 'vert', category: 'Alcool gras émollient',
    effect: 'Adoucit et améliore la texture du produit',
    why: 'Alcool gras nourrissant — à ne pas confondre avec les alcools asséchants.' },

  { id: 'oleyl_alcohol', name: 'Oleyl Alcohol', aliases: ['(z)-octadec-9-en-1-ol'],
    rating: 'vert', category: 'Alcool gras émollient',
    effect: 'Hydrate, adoucit et facilite l\'application',
    why: 'Alcool gras dérivé de l\'huile d\'olive, excellent émollient pour la fibre capillaire.' },

  { id: 'lauryl_alcohol', name: 'Lauryl Alcohol', aliases: ['1-dodecanol', 'dodecanol'],
    rating: 'vert', category: 'Alcool gras émollient',
    effect: 'Émollient et agent de texture',
    why: 'Alcool gras à chaîne longue qui nourrit sans dessécher.' },

  { id: 'lanolin_alcohol', name: 'Lanolin Alcohol', aliases: ['wool alcohol', 'lanolin'],
    rating: 'vert', category: 'Alcool gras émollient',
    effect: 'Nourrit intensément et retient l\'humidité',
    why: 'Émollient proche des lipides naturels du cuir chevelu, excellent pour les cheveux très secs.' },

  // ══════ VERT — HUILES PÉNÉTRANTES ══════

  { id: 'murumuru_butter', name: 'Murumuru Butter',
    aliases: ['astrocaryum murumuru seed butter', 'beurre de murumuru'],
    rating: 'vert', category: 'Beurre végétal pénétrant',
    effect: 'Nourrit, définit et réduit les frisottis',
    why: 'Beurre amazonien riche en acide laurique, excellent pour les cheveux crépus et bouclés.',
    tip: 'Idéal dans les leave-in et beurres capillaires.' },

  { id: 'baobab_oil', name: 'Baobab Oil',
    aliases: ['adansonia digitata seed oil', 'huile de baobab'],
    rating: 'vert', category: 'Huile pénétrante',
    effect: 'Nourrit en profondeur et renforce la fibre',
    why: 'Riche en vitamines A, D, E et acides gras essentiels — excellent pour les cheveux afro et crépus.' },

  { id: 'cocoa_butter', name: 'Cocoa Butter',
    aliases: ['theobroma cacao seed butter', 'beurre de cacao'],
    rating: 'vert', category: 'Beurre végétal pénétrant',
    effect: 'Nourrit, scelle l\'humidité et adoucit',
    why: 'Riche en acides gras et antioxydants naturels, excellent pour les soins des cheveux crépus.' },

  { id: 'kokum_butter', name: 'Kokum Butter',
    aliases: ['garcinia indica seed butter', 'beurre de kokum'],
    rating: 'vert', category: 'Beurre végétal',
    effect: 'Hydrate intensément et réduit les frisottis',
    why: 'Très riche en acide stéarique, excellent pour les cheveux très secs et très bouclés.' },

  { id: 'palm_kernel_oil', name: 'Palm Kernel Oil',
    aliases: ['elaeis guineensis kernel oil', 'huile de palmiste'],
    rating: 'vert', category: 'Huile pénétrante',
    effect: 'Nourrit et protège la fibre capillaire',
    why: 'Similaire à l\'huile de noix de coco, pénètre bien la fibre et nourrit les cheveux secs.' },

  // ══════ VERT — HUILES LÉGÈRES ══════

  { id: 'grapeseed_oil', name: 'Grapeseed Oil',
    aliases: ['vitis vinifera seed oil', 'huile de pépin de raisin'],
    rating: 'vert', category: 'Huile légère scellante',
    effect: 'Scelle l\'humidité et apporte brillance sans alourdir',
    why: 'Légère et non grasse, idéale pour les cheveux fins qui ont besoin de brillance.' },

  { id: 'squalane', name: 'Squalane',
    aliases: ['squalène hydrogéné', 'olive squalane'],
    rating: 'vert', category: 'Huile légère émolliente',
    effect: 'Hydrate, lisse et protège la cuticule',
    why: 'Proche des lipides naturels de la fibre, absorbe rapidement sans laisser de résidu gras.' },

  { id: 'hemp_seed_oil', name: 'Hemp Seed Oil',
    aliases: ['cannabis sativa seed oil', 'huile de chanvre'],
    rating: 'vert', category: 'Huile légère',
    effect: 'Nourrit et renforce la fibre',
    why: 'Riche en oméga 3 et 6, nourrit sans alourdir les cheveux bouclés et texturés.' },

  { id: 'rice_bran_oil', name: 'Rice Bran Oil',
    aliases: ['oryza sativa bran oil', 'huile de son de riz'],
    rating: 'vert', category: 'Huile légère',
    effect: 'Lisse, nourrit et protège la fibre',
    why: 'Contient de la gamma-oryzanol qui renforce la fibre et protège contre la chaleur.' },

  { id: 'rosehip_oil', name: 'Rosehip Oil',
    aliases: ['rosa canina fruit oil', 'rosa rubiginosa seed oil', 'huile de rose musquée'],
    rating: 'vert', category: 'Huile légère régénérante',
    effect: 'Répare et régénère la fibre endommagée',
    why: 'Riche en acide linoléique, excellent pour les cheveux colorés ou chimiquement traités.' },

  { id: 'camellia_oil', name: 'Camellia Oil',
    aliases: ['camellia sinensis seed oil', 'camellia japonica seed oil', 'huile de camélia'],
    rating: 'vert', category: 'Huile légère',
    effect: 'Brillance, légèreté et protection',
    why: 'Légère et pénétrante, utilisée depuis des siècles dans les soins capillaires asiatiques.' },

  { id: 'marula_oil', name: 'Marula Oil',
    aliases: ['sclerocarya birrea seed oil', 'huile de marula'],
    rating: 'vert', category: 'Huile légère pénétrante',
    effect: 'Nourrit rapidement sans laisser de résidu',
    why: 'Riche en acide oléique et antioxydants, s\'absorbe rapidement sur les cheveux texturés.',
    tip: 'Excellente en soin nocturne ou en finisseur léger.' },

  // ══════ VERT — HUILES MOYENNES ══════

  { id: 'sweet_almond_oil', name: 'Sweet Almond Oil',
    aliases: ['prunus amygdalus dulcis oil', 'huile d\'amande douce'],
    rating: 'vert', category: 'Huile nourrissante',
    effect: 'Nourrit, adoucit et facilite le démêlage',
    why: 'Riche en acides gras et vitamine E, parfaite pour les soins avant shampoing.' },

  { id: 'sesame_oil', name: 'Sesame Seed Oil',
    aliases: ['sesamum indicum seed oil', 'huile de sésame'],
    rating: 'vert', category: 'Huile nourrissante',
    effect: 'Nourrit et protège contre la chaleur',
    why: 'Contient des antioxydants naturels et pénètre bien la fibre capillaire.' },

  { id: 'apricot_kernel_oil', name: 'Apricot Kernel Oil',
    aliases: ['prunus armeniaca kernel oil', 'huile d\'abricot'],
    rating: 'vert', category: 'Huile nourrissante légère',
    effect: 'Hydrate et apporte brillance',
    why: 'Légère et riche en vitamine E, convient aux cheveux fins.' },

  { id: 'olive_oil', name: 'Olive Oil',
    aliases: ['olea europaea fruit oil', 'huile d\'olive'],
    rating: 'vert', category: 'Huile nourrissante',
    effect: 'Nourrit intensément et améliore l\'élasticité',
    why: 'Riche en squalane et acide oléique, excellente pour les soins profonds des cheveux crépus.' },

  { id: 'sunflower_oil', name: 'Sunflower Seed Oil',
    aliases: ['helianthus annuus seed oil', 'huile de tournesol'],
    rating: 'vert', category: 'Huile légère',
    effect: 'Hydrate et scelle sans alourdir',
    why: 'Légère et riche en vitamine E, bonne huile de base pour les mélanges capillaires.' },

  { id: 'macadamia_oil', name: 'Macadamia Oil',
    aliases: ['macadamia integrifolia seed oil', 'huile de macadamia'],
    rating: 'vert', category: 'Huile émolliente',
    effect: 'Répare et adoucit la fibre',
    why: 'Riche en acide palmitoléique, proche des lipides capillaires naturels. Excellente pour les cheveux secs.' },

  // ══════ VERT — HUMECTANTS ══════

  { id: 'butylene_glycol', name: 'Butylene Glycol',
    aliases: ['1,3-butanediol', '1,3-butylène glycol'],
    rating: 'vert', category: 'Humectant',
    effect: 'Attire et retient l\'humidité dans la fibre',
    why: 'Humectant léger et bien toléré qui aide à maintenir l\'hydratation des cheveux bouclés.' },

  { id: 'sodium_hyaluronate', name: 'Sodium Hyaluronate',
    aliases: ['hyaluronic acid', 'acide hyaluronique', 'hyaluronate de sodium'],
    rating: 'vert', category: 'Humectant haute performance',
    effect: 'Hydratation intense et longue durée',
    why: 'Capable de retenir jusqu\'à 1000 fois son poids en eau — hydratation durable pour les cheveux poreux.',
    tip: 'Particulièrement efficace sur les cheveux très poreux ou chimiquement traités.' },

  { id: 'honey', name: 'Honey',
    aliases: ['mel', 'miel', 'organic honey'],
    rating: 'vert', category: 'Humectant naturel',
    effect: 'Hydrate, nourrit et apporte brillance',
    why: 'Humectant naturel riche en sucres, vitamines et antioxydants. Excellent dans les masques DIY.' },

  { id: 'sorbitol', name: 'Sorbitol', aliases: ['glucitol'],
    rating: 'vert', category: 'Humectant',
    effect: 'Retient l\'humidité dans la fibre',
    why: 'Humectant dérivé du sucre, doux et efficace pour maintenir l\'hydratation des boucles.' },

  { id: 'urea', name: 'Urea', aliases: ['carbamide', 'urée'],
    rating: 'vert', category: 'Humectant kératolytique',
    effect: 'Hydrate profondément et améliore la pénétration des soins',
    why: 'Composant naturel du NMF (Natural Moisturizing Factor) de la peau et de la kératine.' },

  { id: 'sodium_pca', name: 'Sodium PCA',
    aliases: ['sodium pyrrolidone carboxylic acid', 'NaPCA'],
    rating: 'vert', category: 'Humectant naturel',
    effect: 'Hydratation profonde et maintien de l\'élasticité',
    why: 'Composant majeur du NMF naturel de la kératine. Très efficace pour les cheveux secs et crépus.' },

  // ══════ VERT — HUMECTANTS FILMOGÈNES ══════

  { id: 'guar_gum', name: 'Guar Gum',
    aliases: ['cyamopsis tetragonoloba guar', 'gomme de guar'],
    rating: 'vert', category: 'Humectant filmogène',
    effect: 'Définit les boucles et retient l\'humidité',
    why: 'Forme un film protecteur naturel autour de la fibre qui maintient la définition et l\'hydratation.' },

  { id: 'xanthan_gum', name: 'Xanthan Gum', aliases: ['gomme xanthane'],
    rating: 'vert', category: 'Humectant filmogène',
    effect: 'Géllifie et définit les coiffures bouclées',
    why: 'Polysaccharide naturel qui améliore la définition des boucles sans résidu lourd.' },

  { id: 'flaxseed_extract', name: 'Flaxseed Extract',
    aliases: ['linum usitatissimum seed extract', 'gel de lin', 'linseed extract'],
    rating: 'vert', category: 'Humectant filmogène',
    effect: 'Définit et hydrate les boucles naturellement',
    why: 'Riche en oméga 3 et mucilages naturels, le gel de lin est un favori des cheveux crépus.',
    tip: 'Peut être préparé maison : faire bouillir des graines de lin dans l\'eau.' },

  // ══════ VERT — AGENTS CONDITIONNEURS ══════

  { id: 'behentrimonium_chloride', name: 'Behentrimonium Chloride',
    aliases: ['docosyltrimethylammonium chloride', 'BTAC'],
    rating: 'vert', category: 'Agent conditionneur cationique',
    effect: 'Démêle, adoucit et réduit l\'électricité statique',
    why: 'Conditionneur cationique puissant qui se lie à la fibre pour faciliter le démêlage des cheveux texturés.' },

  { id: 'cetrimonium_chloride', name: 'Cetrimonium Chloride',
    aliases: ['CTAC', 'cetyl trimethyl ammonium chloride'],
    rating: 'vert', category: 'Agent conditionneur cationique',
    effect: 'Adoucit et démêle la fibre capillaire',
    why: 'Conditionneur cationique léger, adapté aux après-shampoings pour cheveux texturés.' },

  { id: 'stearamidopropyl_dimethylamine', name: 'Stearamidopropyl Dimethylamine',
    aliases: ['SAPDA'],
    rating: 'vert', category: 'Agent conditionneur',
    effect: 'Démêle, adoucit et améliore la maniabilité',
    why: 'Conditionneur efficace pour les formules sans silicone, idéal pour les cheveux crépus.' },

  // ══════ VERT — TENSIOACTIFS DOUX ══════

  { id: 'cocamidopropyl_betaine', name: 'Cocamidopropyl Betaine',
    aliases: ['CAPB', 'cocamidopropyl bétaïne'],
    rating: 'vert', category: 'Tensioactif amphotère doux',
    effect: 'Nettoyage doux, conditionnant et moussant',
    why: "L'un des tensioactifs les plus doux, nettoie sans décaper et améliore la texture.",
    tip: 'Idéal dans les Co-wash et shampoings sans sulfate.' },

  { id: 'coco_betaine', name: 'Coco Betaine', aliases: ['cocoamidopropyl betaine'],
    rating: 'vert', category: 'Tensioactif amphotère doux',
    effect: 'Nettoyant doux et conditionneur léger',
    why: 'Tensioactif naturel dérivé du coco, nettoyage en douceur sans agresser la fibre.' },

  { id: 'coco_glucoside', name: 'Coco Glucoside', aliases: ['coconut glucoside'],
    rating: 'vert', category: 'Tensioactif non ionique doux',
    effect: 'Nettoyage ultra-doux, naturel',
    why: 'Dérivé du sucre et du coco, très doux et biodégradable. Parfait pour le Co-wash.' },

  { id: 'decyl_glucoside', name: 'Decyl Glucoside', aliases: ['decyl polyglucoside'],
    rating: 'vert', category: 'Tensioactif non ionique doux',
    effect: 'Nettoyage doux et mousse légère',
    why: 'Tensioactif naturel très doux dérivé du maïs. Respecte l\'équilibre du cuir chevelu.' },

  { id: 'lauryl_glucoside', name: 'Lauryl Glucoside', aliases: [],
    rating: 'vert', category: 'Tensioactif non ionique doux',
    effect: 'Nettoyage doux et biodégradable',
    why: 'Dérivé végétal du sucre, excellent dans les formules sans sulfate pour cheveux texturés.' },

  { id: 'sodium_cocoyl_isethionate', name: 'Sodium Cocoyl Isethionate',
    aliases: ['SCI', 'sodium cocoyl isethionate'],
    rating: 'vert', category: 'Tensioactif ultra-doux',
    effect: 'Nettoyage crémeux et conditionneur',
    why: 'Tensioactif très doux qui préserve l\'hydratation du cuir chevelu et des fibres capillaires.',
    tip: 'Présent dans de nombreux shampoings solides naturels.' },

  // ══════ VERT — ACIDES AMINÉS & GRAS ══════

  { id: 'arginine', name: 'Arginine', aliases: ['l-arginine'],
    rating: 'vert', category: 'Acide aminé',
    effect: 'Répare et renforce la structure de la kératine',
    why: 'Acide aminé constitutif de la kératine. Répare sans risque de surcharge protéinique.' },

  { id: 'glutamic_acid', name: 'Glutamic Acid',
    aliases: ['l-glutamic acid', 'acide glutamique'],
    rating: 'vert', category: 'Acide aminé humectant',
    effect: 'Hydrate et renforce la fibre',
    why: 'Acide aminé naturellement présent dans la kératine, améliore l\'élasticité et la résistance.' },

  { id: 'lauric_acid', name: 'Lauric Acid',
    aliases: ['acide laurique', 'dodecanoic acid'],
    rating: 'vert', category: 'Acide gras pénétrant',
    effect: 'Nourrit la fibre capillaire en profondeur',
    why: 'Acide gras principal de l\'huile de noix de coco — pénètre la fibre et nourrit sans résidu lourd.' },

  { id: 'oleic_acid', name: 'Oleic Acid',
    aliases: ['acide oléique'],
    rating: 'vert', category: 'Acide gras pénétrant',
    effect: 'Pénètre et nourrit la fibre en profondeur',
    why: 'Acide gras monoinsaturé qui pénètre facilement dans le cortex capillaire.' },

  { id: 'linoleic_acid', name: 'Linoleic Acid',
    aliases: ['acide linoléique', 'omega-6'],
    rating: 'vert', category: 'Acide gras essentiel',
    effect: 'Répare la barrière lipidique et nourrit',
    why: 'Oméga 6 essentiel pour les membranes cellulaires, renforce la structure de la fibre capillaire.' },
];
