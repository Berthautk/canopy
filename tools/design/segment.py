"""Découpe les planches en vignettes en détectant les bandes blanches."""
import sys, os, json
from PIL import Image
import numpy as np

def bands(mask_1d, min_len):
    """Renvoie les segments [a,b) où mask est True, de longueur >= min_len."""
    segs, start = [], None
    for i, v in enumerate(list(mask_1d) + [False]):
        if v and start is None: start = i
        elif not v and start is not None:
            if i - start >= min_len: segs.append((start, i))
            start = None
    return segs

def segment(path, thr=236):
    im = Image.open(path).convert("RGB"); a = np.asarray(im).astype(int)
    H, W, _ = a.shape
    white = (a.min(axis=2) >= thr)
    # lignes de contenu : moins de 97 % de blanc
    rows = bands(white.mean(axis=1) < 0.97, 25)
    tiles = []
    for (r0, r1) in rows:
        band = white[r0:r1]
        cols = bands(band.mean(axis=0) < 0.90, 25)
        for (c0, c1) in cols:
            sub = white[r0:r1, c0:c1]
            rr = bands(sub.mean(axis=1) < 0.90, 10)
            if not rr: continue
            y0, y1 = r0 + rr[0][0], r0 + rr[-1][1]
            tiles.append((c0, y0, c1, y1))
    return im, tiles

if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True); report = {}
    for f in sorted(os.listdir(src)):
        if not f.startswith("Planche_"): continue
        letter = f.split("_")[1].lower()
        im, tiles = segment(os.path.join(src, f))
        W, H = im.size; kept = []
        for (x0, y0, x1, y1) in tiles:
            w, h = x1 - x0, y1 - y0
            if w > 0.85 * W: continue          # bandeau d'en-tête
            if w < 60 or h < 60: continue      # bruit
            kept.append([x0, y0, x1, y1])
        report[f] = kept
        for i, (x0, y0, x1, y1) in enumerate(kept, 1):
            im.crop((x0, y0, x1, y1)).save(os.path.join(out, f"{letter}-{i:02d}.png"))
    json.dump(report, open(os.path.join(out, "_boites.json"), "w"), indent=1)
    for k, v in report.items(): print(k, len(v))
