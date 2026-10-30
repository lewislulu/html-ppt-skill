# -*- coding: utf-8 -*-
"""
verify_pptx.py — independent QA: read the produced .pptx (its XML, not the
spec) and re-draw every slide with PIL. Catches geometry, z-order, fill,
rotation and text-alignment problems in the real deliverable.
"""
import sys
from pptx import Presentation
from pptx.util import Emu
from PIL import Image, ImageDraw, ImageFont

K = 110                      # px per inch
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
P = "{http://schemas.openxmlformats.org/presentationml/2006/main}"

BOLD_F = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG_F = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def rgb_of(el):
    """solidFill under an element -> (r,g,b,alpha) or None."""
    if el is None:
        return None
    f = el.find(f"{A}solidFill")
    if f is None:
        return None
    srgb = f.find(f"{A}srgbClr")
    if srgb is None:
        return None
    h = srgb.get("val")
    al = srgb.find(f"{A}alpha")
    a = int(al.get("val")) / 100000.0 if al is not None else 1.0
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def blend(c, bg=(255, 255, 255)):
    r, g, b, a = c
    return (int(r * a + bg[0] * (1 - a)), int(g * a + bg[1] * (1 - a)),
            int(b * a + bg[2] * (1 - a)))


def draw_text(d, shp, W):
    tf = shp.text_frame
    tx = shp.left / 914400 * K
    ty = shp.top / 914400 * K
    tw = shp.width / 914400 * K
    body = shp._element.find(f"{P}txBody")
    if body is None:
        return
    y = ty
    for para in body.findall(f"{A}p"):
        pPr = para.find(f"{A}pPr")
        algn = pPr.get("algn", "l") if pPr is not None else "l"
        lnSpc = None
        if pPr is not None:
            ls = pPr.find(f"{A}lnSpc")
            if ls is not None:
                pct = ls.find(f"{A}spcPct")
                if pct is not None:
                    lnSpc = int(pct.get("val")) / 100000.0
        runs = para.findall(f"{A}r")
        if not runs:
            continue
        rPr = runs[0].find(f"{A}rPr")
        size = int(rPr.get("sz", "1800")) / 100.0 if rPr is not None else 18
        bold = (rPr.get("b") == "1") if rPr is not None else False
        col = rgb_of(rPr) if rPr is not None else None
        col = blend(col) if col else (0, 0, 0)
        f = ImageFont.truetype(BOLD_F if bold else REG_F, max(6, int(size * K / 72)))
        text = "".join(r.findtext(f"{A}t") or "" for r in runs)
        lh = size * 1.22 * (lnSpc or 1.0) * K / 72
        # PowerPoint word-wraps inside the frame; mimic it
        words, lines, cur = text.split(" "), [], ""
        for wd in words:
            trial = (cur + " " + wd).strip()
            if d.textlength(trial, font=f) > tw and cur:
                lines.append(cur)
                cur = wd
            else:
                cur = trial
        lines.append(cur)
        for ln in lines:
            if algn == "ctr":
                x = tx + (tw - d.textlength(ln, font=f)) / 2
            elif algn == "r":
                x = tx + tw - d.textlength(ln, font=f)
            else:
                x = tx
            d.text((x, y), ln, font=f, fill=col)
            y += lh


def slide_image(slide, W_in, H_in):
    im = Image.new("RGB", (int(W_in * K), int(H_in * K)), (255, 255, 255))
    d = ImageDraw.Draw(im)
    for shp in slide.shapes:
        x, y = shp.left / 914400 * K, shp.top / 914400 * K
        w, h = shp.width / 914400 * K, shp.height / 914400 * K
        geom = shp._element.find(f".//{A}prstGeom")
        kind = geom.get("prst") if geom is not None else None
        spPr = shp._element.find(f"{P}spPr")
        fill = rgb_of(spPr)
        ln = spPr.find(f"{A}ln") if spPr is not None else None
        line = rgb_of(ln)
        lw = 1
        if ln is not None and ln.get("w"):
            lw = max(1, int(int(ln.get("w")) / 12700 * K / 72))
        rot = shp.rotation
        if kind == "ellipse":
            d.ellipse([x, y, x + w, y + h], fill=blend(fill) if fill else None,
                      outline=blend(line) if line else None, width=lw)
        elif kind == "triangle":
            pts = [(x + w / 2, y + h), (x, y), (x + w, y)]          # apex down
            if rot == 180:
                d.polygon([(x + w / 2, y), (x, y + h), (x + w, y + h)], fill=blend(fill) if fill else None)
            elif rot == 270:   # points left
                d.polygon([(x, y + h / 2), (x + w, y), (x + w, y + h)], fill=blend(fill) if fill else None)
            elif rot == 90:    # points right
                d.polygon([(x + w, y + h / 2), (x, y), (x, y + h)], fill=blend(fill) if fill else None)
            else:
                d.polygon(pts, fill=blend(fill) if fill else None)
        else:  # rect / textbox
            if fill:
                d.rectangle([x, y, x + w, y + h], fill=blend(fill))
            if line and lw:
                d.rectangle([x, y, x + w, y + h], outline=blend(line), width=lw)
        if shp.has_text_frame and shp.text_frame.text.strip():
            draw_text(d, shp, W_in)
    return im


def main(path, out, cols=2):
    prs = Presentation(path)
    W_in = prs.slide_width / 914400
    H_in = prs.slide_height / 914400
    ims = [slide_image(s, W_in, H_in) for s in prs.slides]
    rows = (len(ims) + cols - 1) // cols
    pad = 18
    cw, ch = ims[0].size
    sheet = Image.new("RGB", (cw * cols + pad * (cols + 1), ch * rows + pad * (rows + 1)), (226, 232, 228))
    for i, im in enumerate(ims):
        sheet.paste(im, (pad + (i % cols) * (cw + pad), pad + (i // cols) * (ch + pad)))
    sheet.save(out)
    return out


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "DMart-Pause-Point-Pitch.pptx"
    dst = sys.argv[2] if len(sys.argv) > 2 else "verify-sheet.png"
    prs = Presentation(src)
    for i, s in enumerate(prs.slides, 1):
        slide_image(s, prs.slide_width / 914400, prs.slide_height / 914400).save(
            "verify-s%02d.png" % i)
    print(main(src, dst))
