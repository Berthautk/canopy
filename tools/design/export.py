"""Exporte les vignettes découpées en WebP optimisés dans public/assets/."""
import sys, os, json, io
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from noms import P, EXCLUS, MANUEL

src, boxes_json, out = sys.argv[1], sys.argv[2], sys.argv[3]
boxes = json.load(open(boxes_json))
LIM_ILLU, LIM_ICONE = 200_000, 50_000
rapport = []

def save_webp(img, path, limit, maxdim):
    img = img.convert("RGB"); img.thumbnail((maxdim, maxdim), Image.LANCZOS)
    for q in (82, 76, 70, 62, 55, 48):
        buf = io.BytesIO(); img.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= limit: break
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "wb").write(buf.getvalue())
    return buf.tell(), q, img.size

def emit(img, folder, name, origine):
    icone = folder == "icones" and not name.startswith("fond-")
    limit, maxdim = (LIM_ICONE, 160) if icone else (LIM_ILLU, 900)
    rel = f"{folder}/{name}.webp"
    size, q, dim = save_webp(img, os.path.join(out, rel), limit, maxdim)
    rapport.append({"fichier": rel, "origine": origine, "octets": size, "qualite": q, "dim": list(dim),
                    "ok_budget": size <= limit})

for f, bx in boxes.items():
    letter = f.split("_")[1].lower(); im = Image.open(os.path.join(src, f)).convert("RGB")
    for i, b in enumerate(bx, 1):
        key = f"{letter}-{i:02d}"; crop = im.crop(tuple(b))
        if key == "j-01":   # deux photos collées : coupure à x=369
            w = crop.size[0]
            emit(crop.crop((0, 0, 369, crop.size[1])), "nouveau-converti", "joie-de-la-rencontre", key + " (gauche)")
            emit(crop.crop((369, 0, w, crop.size[1])), "nouveau-converti", "accompagnement-pasteur", key + " (droite)")
            continue
        tgt = P.get(key)
        if tgt: emit(crop, tgt[0], tgt[1], key)
    for folder, name, box in MANUEL.get(f[:9], []):
        emit(im.crop(box), folder, name, f"{letter} (découpe manuelle)")

json.dump({"exports": rapport, "exclus": EXCLUS}, open(os.path.join(out, "_inventaire.json"), "w"),
          ensure_ascii=False, indent=1)
tot = sum(r["octets"] for r in rapport)
print(len(rapport), "fichiers,", round(tot/1e6, 2), "Mo ; hors budget :", [r["fichier"] for r in rapport if not r["ok_budget"]])
print("plus gros :", max(rapport, key=lambda r: r["octets"])["octets"])
