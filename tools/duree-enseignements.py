# Estime la durée d'écoute (voix de synthèse, ~150 mots/min) d'un enseignement, versets lus compris.
import json, glob, re, sys
sys.path.insert(0, 'tools')
NOMS = {}
def versets(ref):
    m = re.match(r'^(\d? ?[A-Za-zÉéèûôÎî]+)\.? ?(\d+):(\d+)(?:-(\d+))?$', ref.strip())
    return m
def mots(t): return len(re.findall(r"\w+", t))
for f in sys.argv[1:]:
    d = json.load(open(f)); n = mots(d.get('introduction', '')) + mots(d.get('resume', ''))
    nv = 0
    for s in d['sections']:
        n += mots(s['titre'])
        for b in s['blocs']:
            if 'verset' in b: nv += 1
            else: n += mots(b.get('texte', b.get('sous_titre', '')))
    total = n + nv * 35   # ~35 mots par verset ou passage lu
    print(f"{f.split('/')[-1]}: {n} mots + {nv} versets ≈ {round(total/150)} min")
