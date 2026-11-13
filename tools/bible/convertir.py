"""Convertit la LSG 1910 (USFM de l'Alliance biblique universelle) en JSON compact : un fichier par livre.

Usage : python3 -I tools/bible/convertir.py <dossier_usfm> <dossier_sortie>
On ne garde QUE le texte des versets : les introductions, titres de section, renvois
et notes ajoutés par l'édition moderne sont retirés. Les vers poétiques (\\q) sont
séparés par un saut de ligne « \\n ».
"""
import os, re, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from livres import LIVRES

NOTES = re.compile(r"\\(f|fe|x|ef|ex)\s.*?\\\1\*", re.S)          # notes et renvois
MOT = re.compile(r"\\\+?w\s+([^|\\]*?)(\|[^\\]*?)?\\\+?w\*")          # \w mot|attributs\w*
MARQUE_CAR = re.compile(r"\\\+?[a-z]+[0-9]*\*?")                      # \qs, \nd*, \add …
EXCLUS = {"id","ide","h","toc1","toc2","toc3","mt","mt1","mt2","mt3","imt","imt1","imt2","imt3","ip","ipi","im","is","is1","is2",
          "iot","io","io1","io2","ili","ie","ib","ior","s","s1","s2","s3","ms","ms1","ms2","r","mr","sr","d","cl","sp","rem","cp","ca","va","vp",
          "periph","mte","mte1","mte2","mte7","mte9","sd","sd1","sd2","sd3","tr","th1","th2","tc1","tc2","tc3"}

# Corrections de saisie connues dans la source USFM (vérifiées une à une) :
CORRECTIONS = {
    # Ps 119:115 est saisi « \v 11 5Éloignez » : le numéro est coupé en deux.
    ("PSA", "\\v 11 5Éloignez"): "\\v 115 Éloignez",
}
POESIE = {"q","q1","q2","q3","qc","qr","qm","qm1","qm2","li","li1","li2","pi","pi1","pi2"}

def nettoyer(t):
    t = NOTES.sub("", t)
    t = MOT.sub(r"\1", t)
    t = MARQUE_CAR.sub("", t)
    t = re.sub(r"[ \t]+", " ", t)
    return t

def convertir(chemin):
    chap = {}; c = v = None; tampon = []
    def vider():
        if c is not None and v is not None:
            texte = "".join(tampon)
            texte = "\n".join(l.strip() for l in nettoyer(texte).split("\n"))
            texte = re.sub(r"\n+", "\n", texte).strip()
            chap.setdefault(c, {})[v] = texte
    code = os.path.basename(chemin)[:-4]
    for ligne in open(chemin, encoding="utf-8-sig"):
        ligne = ligne.rstrip("\n")
        for (livre, avant), apres in CORRECTIONS.items():
            if livre == code and avant in ligne: ligne = ligne.replace(avant, apres)
        m = re.match(r"\\([a-z]+[0-9]*)\s?(.*)", ligne)
        if not m:
            if v is not None: tampon.append(" " + ligne)
            continue
        mq, reste = m.group(1), m.group(2)
        if mq == "c":
            vider(); c = int(reste.split()[0]); v = None; tampon = []
        elif mq == "v":
            vider(); num, _, texte = reste.partition(" ")
            if c in chap and num in chap[c]: raise ValueError(f"{code} {c}:{num} en double")
            v = num; tampon = [texte]
        elif mq in EXCLUS:
            continue
        elif mq in POESIE:
            if v is not None: tampon.append("\n" + reste)
        elif mq in {"b"}:
            continue
        else:   # \p, \m, \nb, \pmo … : suite du verset
            if v is not None: tampon.append(" " + reste)
    vider()
    return chap

# Ajustements de numérotation : l'édition UBS s'écarte ici de la Louis Segond 1910 imprimée.
# Le texte n'est pas modifié, seuls les numéros de versets sont remis à leur place.
def ajuster(code, chapitres):
    def fusion(c, a):          # le verset a+1 est rattaché au verset a
        ch = chapitres[c - 1]; ch[a - 1] = ch[a - 1] + " " + ch[a]; del ch[a]
    if code == "MRK":
        fusion(9, 50)          # Mc 9:50 « Le sel est une bonne chose… Ayez du sel en vous-mêmes… »
        fusion(10, 52)         # Mc 10:52 « Va, ta foi t'a sauvé. Aussitôt il recouvra la vue… »
    if code == "ECC":          # Ec 11:9-10 (« Jeune homme, réjouis-toi… ») placés à tort en 12:1-2
        chapitres[10] += chapitres[11][:2]; chapitres[11] = chapitres[11][2:]
    return chapitres

FINE = "\u202f"   # espace fine insécable (typographie française)
def typographie(t):
    if not t: return t
    t = re.sub(r"[ \u00a0\u202f]*([;:!?»])", lambda m: (FINE if m.group(1) != "»" else "\u00a0") + m.group(1), t)
    t = re.sub(r"«[ \u00a0\u202f]*", "«\u00a0", t)
    t = re.sub(r"\n" + FINE, "\n", t)            # pas d'espace en début de vers
    t = re.sub(r"(\d)" + FINE + r":" + FINE + r"?(\d)", r"\1:\2", t)   # références « 3:16 »
    return t

def main(src, out):
    os.makedirs(out, exist_ok=True)
    index = []
    for i, (code, nom, abr) in enumerate(LIVRES, 1):
        chap = convertir(os.path.join(src, code + ".sfm"))
        chapitres = []
        for cn in sorted(chap):
            vs = chap[cn]; liste = []
            for vn, texte in vs.items():
                if "-" in vn:               # plage de versets (ex. « 14-15 ») : texte sur le 1er, rien sur les suivants
                    a, b = map(int, vn.split("-")); liste.append((a, texte)); liste += [(n, "") for n in range(a + 1, b + 1)]
                else: liste.append((int(vn), texte))
            n = max(x for x, _ in liste); tab = [None] * n
            for x, t in liste: tab[x - 1] = t
            chapitres.append([typographie(x) for x in tab])
        chapitres = ajuster(code, chapitres)
        json.dump({"code": code, "nom": nom, "chapitres": chapitres}, open(os.path.join(out, f"{i:02d}-{code}.json"), "w", encoding="utf-8"),
                  ensure_ascii=False, separators=(",", ":"))
        index.append({"n": i, "code": code, "nom": nom, "abr": abr, "chapitres": [len(c) for c in chapitres],
                      "fichier": f"{i:02d}-{code}.json"})
    json.dump({"traduction": "Louis Segond 1910", "livres": index}, open(os.path.join(out, "index.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
