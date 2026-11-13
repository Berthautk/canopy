"""Vérifie la Bible convertie : 66 livres, 1189 chapitres, versets de contrôle, absence de balises résiduelles.
Usage : python3 -I tools/bible/verifier.py <dossier_json> [fichier_beblia.xml pour la comparaison]"""
import os, sys, json, re, unicodedata

def norm(s):  # comparaison insensible à la typographie (apostrophes, espaces avant : ; ! ?)
    s = s.replace("’", "'").replace(" ", " ").replace(" ", " ").replace("\n", " ")
    s = re.sub(r"\s+([:;!?])", r"\1", s); s = re.sub(r"\s+", " ", s)
    return s.strip()

def mots(s):
    s = unicodedata.normalize("NFD", s.replace("’", "'")); s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.findall(r"[a-z]+", s)

d = sys.argv[1]
idx = json.load(open(os.path.join(d, "index.json")))
livres = {l["code"]: json.load(open(os.path.join(d, l["fichier"]))) for l in idx["livres"]}
def v(code, c, n): return livres[code]["chapitres"][c - 1][n - 1]

ok = True
def test(nom, cond, detail=""):
    global ok; ok &= cond; print(("OK   " if cond else "ÉCHEC"), nom, detail)

nch = sum(len(l["chapitres"]) for l in livres.values())
nvs = sum(1 for l in livres.values() for c in l["chapitres"] for x in c if x)
test("66 livres", len(livres) == 66, f"({len(livres)})")
test("1 189 chapitres", nch == 1189, f"({nch})")
print("     versets non vides :", nvs)
JEAN = "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle."
PS = "Le salut est auprès de l'Éternel : Que ta bénédiction soit sur ton peuple !"
test("Jean 3:16", norm(v("JHN", 3, 16)) == norm(JEAN), "\n       fichier : " + v("JHN", 3, 16))
ps = norm(v("PSA", 3, 9))
test("Psaume 3:9", ps == norm(PS) or ps == norm(PS) + " — Pause.", "\n       fichier : " + v("PSA", 3, 9).replace("\n", " / "))
residus = [(c, i + 1, j + 1) for c, l in livres.items() for i, ch in enumerate(l["chapitres"]) for j, x in enumerate(ch) if x and ("\\" in x or "|" in x)]
test("aucune balise USFM résiduelle", not residus, str(residus[:5]))
trous = [(c, i + 1, j + 1) for c, l in livres.items() for i, ch in enumerate(l["chapitres"]) for j, x in enumerate(ch) if x is None]
print("     numéros de verset absents :", len(trous), trous[:12])
if len(sys.argv) > 2:
    import xml.etree.ElementTree as ET
    bb = ET.parse(sys.argv[2]).getroot().findall(".//book")
    ecarts = []
    for i, l in enumerate(idx["livres"]):
        a = len(mots(" ".join(x or "" for c in livres[l["code"]]["chapitres"] for x in c)))
        b = len(mots(" ".join(x.text or "" for x in bb[i].iter("verse"))))
        if abs(a - b) > max(4, b * 0.003): ecarts.append((l["code"], a, b, a - b))
    test("nombre de mots identique à la source Beblia (±0,3 %)", not ecarts, str(ecarts))
print("\nRÉSULTAT :", "TOUT EST CONFORME" if ok else "À CORRIGER")
