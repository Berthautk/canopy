# Nom de fichier pour chaque vignette : "lettre-numéro" -> (dossier, nom)
# None = volontairement exclu (raison dans EXCLUS)
P = {}
def add(letter, folder, names):
    for i, n in enumerate(names, 1):
        P[f"{letter}-{i:02d}"] = (folder, n) if n else None

add("a", "jesus", ["jesus-portrait-serein","jesus-main-tendue","jesus-regard-vers-le-ciel","jesus-en-priere",
    "jesus-marche-sur-le-chemin","jesus-assis-coucher-de-soleil","jesus-sourire","jesus-etreinte-enfant"])
add("b", "personnages", ["homme-en-priere","femme-foulard-en-priere","jeune-homme-joyeux","fille-en-priere",
    "femme-voilee-regard-ciel","homme-lunettes-reflexion","femme-souriante","famille-lit-la-bible","amis-lisent-la-bible",
    "jeune-ecoute-au-casque","femme-louange","predicateur-bible-en-main","vieillard-biblique","berger-biblique",
    "femme-biblique","roi-biblique","vieillard-biblique-en-priere","soldat-romain","homme-biblique-joyeux","enfant-biblique"])
add("c", "objets-bibliques", ["bible-ouverte","bible-noire-croix","livres-et-diplome","rouleau-parchemin","couronne-or",
    "coupe-or","pain-et-raisin","couronne-epines","lanterne","croix-sur-colline","colombe","shofar","baton-de-berger",
    "tables-de-la-loi","pains-et-poissons","tombeau-vide","creche","jarre-argile","barque-et-filets","lampe-a-huile"])
add("d", "lieux-bibliques", ["tombeau-ouvert","jerusalem-vue-generale","temple","lac-et-olivier","ruelle-de-village",
    "maison-en-pierre","village-sur-colline","sentier-coucher-de-soleil","riviere","tente","marche-de-village",
    "ruines-antiques","oliveraie","cour-bancs-de-pierre","barque-sur-le-rivage","grotte"])
add("e", "paysages", ["lever-soleil-collines","montagne","coucher-soleil-lac","chemin-oliviers","champ-de-ble",
    "collines-vertes","cascade","oliveraie-ensoleillee","champ-de-fleurs","moutons-au-paturage",
    "coucher-soleil-montagnes","rivage-du-lac","sentier-de-montagne","riviere","arbre-coucher-de-soleil"])
add("f", "vie-chretienne", ["femme-en-priere","homme-louange-soleil","femme-lit-la-bible","homme-etudie-la-bible",
    "groupe-etude-biblique","predicateur-en-chaire","culte-louange","evangelisation-dans-la-rue","bapteme","sainte-cene",
    "groupe-de-priere","famille-et-bible","entraide-don","priere-au-pied-de-la-croix","communaute-silhouettes",
    "eglise-batiment","mains-en-priere-sur-bible"])
add("g", "icones", ["accueil","bible","priere","meditations","ecouter","formations","foi","croissance","liberation",
    "protection","guerison","famille","communaute","plan-de-lecture","defis","favoris","telecharger","parametres",
    "finances","travail","mariage","service","evangelisation","royaume",
    "fond-croix-montagne","fond-bible-lumiere","fond-montagnes-soleil", None])
add("h", "jeux", ["banniere-quiz-biblique","banniere-duel-biblique","banniere-enigme-biblique", None, None, None, None, None, None])
add("i", "scenes-bibliques", ["guerison-aveugle","sermon-sur-la-montagne","multiplication-des-pains","tempete-apaisee",
    "marche-sur-les-eaux","parabole-du-semeur","bon-samaritain","brebis-perdue","femmes-au-tombeau-vide",
    "jesus-ressuscite-et-disciples","guerison-malade","resurrection-de-lazare","appel-des-pecheurs","pentecote",
    "paul-ecrit-une-lettre","dernier-repas"])
add("j", "nouveau-converti", [None,"bapteme","etude-de-la-bible","priere-a-la-bougie","louange-au-soleil",
    "groupe-de-partage","temoignage-a-eglise","liste-de-progres","marche-vers-la-croix","service-et-don","joie-bible-en-main"])
add("k", "evangelisation", ["partage-bible-dans-la-rue","dialogue-entre-femmes","dialogue-avec-un-ancien","don-de-livre",
    "enseignement-au-tableau","priere-pour-quelqu-un","temoignage-au-micro","joie-de-la-conversion","etreinte",
    "reunion-en-plein-air"])
add("l", "audio", ["homme-ecoute-au-casque","casque-et-bible","micro-de-studio","femme-ecouteurs","telephone-lecteur-audio",
    "animateur-podcast","bible-et-cafe-du-matin","studio-et-console","femme-casque-en-priere","casque-et-micro",
    "enceinte-portable","homme-casque-nature","enregistrement-ordinateur","femme-casque-repos",
    "telephone-micro-et-bible","homme-casque-reflexion"])
add("m", "famille-quotidien", ["mariage","famille-lecture","couple-en-priere","mere-et-enfants","travail-ordinateur",
    "commercante-au-marche","medecin-et-patiente","visite-a-hopital","consolation-deuil","souvenir-deuil","aide-colis",
    "groupe-mains-jointes","mere-aide-aux-devoirs","mentorat-jeune","couple-et-budget","meditation-face-a-la-croix"])
add("n", "eglise", ["louange-assemblee","pasteur-predication","chorale","batteur","louange-guitare","priere-assemblee",
    "table-sainte-cene","accueil-poignee-de-main","etude-biblique-en-groupe","distribution-de-dons","ecole-du-dimanche",
    "accueil-a-la-porte","facade-eglise","assemblee-au-culte","bapteme-en-bassin","entretien-de-eglise"])
add("o", "objets-quotidien", ["telephone","bible-cuir","bible-ouverte-sur-table","carnet-et-stylo","calendrier","casque",
    "ecouteurs","sac-a-dos","sacoche","lampe-de-bureau","ordinateur","pile-de-livres","eau-et-the","reveil","surligneurs",
    "globe","boussole-et-jumelles","croix-et-lanterne","gourde-et-tapis","crayons-et-notes"])
add("p", "symboles", ["croix-coucher-de-soleil","colombe-dans-le-ciel","bible-dans-la-lumiere","chemin-sur-la-colline",
    "tombeau-lumineux","porte-ouverte","semence-dans-la-main","jeune-pousse","couronne-epines","couronne-de-gloire",
    "agneau","coupe-et-pain","priere-silhouette","linceul-sur-la-pierre","ancre-esperance","mains-ouvertes-lumiere"])
q = [None]*40
q[0]="fond-montagnes-aube"; q[1]="fond-lumiere-feuilles"; q[2]="fond-ciel-bleu"; q[3]="fond-bible-croix"
q[7]="cadre-laurier"; q[8]="fanion-bleu"; q[9]="medaille-or"; q[34]="illustration-hors-ligne"; q[39]="rubans-banniere"
add("q", "interface", q)
add("r", "priere", ["femme-en-priere","mains-levees","combat-spirituel","priere-en-famille","priere-pour-un-malade",
    "priere-en-groupe","priere-pour-la-nation","priere-pour-eglise","priere-pour-la-ville","priere-pour-le-monde",
    "priere-avec-larmes","priere-et-bible"])
add("s", "etude-biblique", ["la-sainte-bible","bible-annotee","livres-des-testaments","rouleau-ancien","manuscrit",
    None,"carnet-etude",None,"loupe-et-carte",None,None,None,"bible-surlignee","boussole-et-carnet",None,"bible-et-tasse"])
add("t", "temoignage", ["temoignage-au-micro","avant-apres","reconnaissance","victoire-bras-leves","bapteme",
    "joie-bible-contre-coeur","chaines-brisees","louange-au-casque","famille-restauree","reussite-au-travail",
    "couple-marie","croix-sur-colline","artiste-peintre","nouveau-depart","nouvelle-pousse","jesus-accompagne"])

EXCLUS = {
 "g-28": "planche d'éléments décoratifs en mosaïque (vagues, colombe, pastilles) : à refaire en SVG/CSS",
 "h-04": "panneau composite (Moïse, Abraham) : portraits découpés à la main séparément",
 "h-05": "panneau composite (6 héros) : portraits découpés à la main séparément",
 "h-06": "panneau composite types de jeux + niveaux + récompenses avec textes incrustés",
 "h-07": "panneau composite indices et aides avec textes incrustés",
 "h-08": "panneau composite résultats avec textes incrustés",
 "h-09": "bannière « Bravo ! » avec confettis : utilisable seulement entière, texte incrusté",
 "j-01": "deux photos collées sans marge : séparées en deux fichiers",
 "s-06": "contient le texte de Jean 3:16 incrusté (règle : aucun verset tiré d'une image)",
 "s-08": "frise « grandes étapes de la Bible » avec textes incrustés non vérifiés",
 "s-10": "onglets des livres avec texte déformé (« Lévitique » mal écrit)",
 "s-11": "contient le texte du Psaume 23 incrusté",
 "s-12": "contient le texte de Romains 12 incrusté",
 "s-15": "contient le texte du Psaume 119:105 incrusté",
}
for k in [f"q-{i:02d}" for i in range(1,41)]:
    if P.get(k) is None and k not in EXCLUS:
        EXCLUS[k] = "élément d'interface mal isolé (bouton, case, interrupteur, barre, cadre) : à faire en CSS/SVG"

# Découpes manuelles (coordonnées dans la planche d'origine)
MANUEL = {
 "Planche_H": [("jeux","personnage-moise",(13,451,170,627)),("jeux","personnage-abraham",(13,634,170,804)),
               ("jeux","personnage-david",(183,451,339,627)),("jeux","personnage-daniel",(346,451,493,627)),
               ("jeux","personnage-esther",(499,451,640,627)),("jeux","personnage-joseph",(183,634,330,804)),
               ("jeux","personnage-ruth",(337,634,490,804)),("jeux","personnage-paul",(499,634,640,804))],
}
