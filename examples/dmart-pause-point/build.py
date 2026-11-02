# -*- coding: utf-8 -*-
"""
build.py — render deck_spec.py to three targets from one shared API:
  --pptx   the deliverable (native shapes, editable in PowerPoint/Keynote/Slides)
  --html   a static preview of the same geometry (keyboard nav + notes)
  --png    flat renders for visual QA (no browser in this sandbox)

    python3 build.py --pptx --html --png
"""
import os
import sys
import html as _html

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import deck_spec as D  # noqa: E402

W_IN, H_IN = 13.333, 7.5


# ===================================================================== PPTX
class PptxSlide:
    def __init__(self, prs, idx, layout):
        self.prs = prs
        self.idx = idx
        self.layout = layout
        self.slide = prs.slides.add_slide(prs.slide_layouts[6])

    # -- primitives ------------------------------------------------------
    def _finish(self, shp, fill, line, lw, alpha, rot):
        from pptx.dml.color import RGBColor
        from pptx.util import Pt
        if fill:
            shp.fill.solid()
            shp.fill.fore_color.rgb = RGBColor.from_string(fill)
            if alpha is not None:
                _set_alpha(shp.fill.fore_color._xFill, alpha)
        else:
            shp.fill.background()
        if line:
            shp.line.color.rgb = RGBColor.from_string(line)
            shp.line.width = Pt(lw or 1)
        else:
            shp.line.fill.background()
        if rot:
            shp.rotation = rot
        shp.shadow.inherit = False
        return shp

    def rect(self, x, y, w, h, fill, line=None, lw=0, alpha=None, rot=0, **kw):
        from pptx.util import Inches
        from pptx.enum.shapes import MSO_SHAPE
        shp = self.slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y),
                                          Inches(w), Inches(h))
        return self._finish(shp, fill, line, lw, alpha, rot)

    def oval(self, x, y, w, h, fill, line=None, lw=0, alpha=None, rot=0, **kw):
        from pptx.util import Inches
        from pptx.enum.shapes import MSO_SHAPE
        shp = self.slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y),
                                          Inches(w), Inches(h))
        return self._finish(shp, fill, line, lw, alpha, rot)

    def tri(self, x, y, w, h, fill, d="down", **kw):
        from pptx.util import Inches
        from pptx.enum.shapes import MSO_SHAPE
        shp = self.slide.shapes.add_shape(MSO_SHAPE.ISOSCELES_TRIANGLE, Inches(x), Inches(y),
                                          Inches(w), Inches(h))
        shp.rotation = {"down": 180, "left": 270, "right": 90}.get(d, 0)
        return self._finish(shp, fill, None, 0, None, 0)

    def text(self, x, y, w, h, p, **kw):
        from pptx.util import Inches, Pt
        from pptx.dml.color import RGBColor
        from pptx.enum.text import PP_ALIGN, MSO_ANCHOR, MSO_AUTO_SIZE
        tb = self.slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.auto_size = MSO_AUTO_SIZE.NONE
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        tf.vertical_anchor = MSO_ANCHOR.TOP
        align = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER, "r": PP_ALIGN.RIGHT}[p["align"]]
        lines = p["t"].split("\n")
        for i, ln in enumerate(lines):
            para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            para.alignment = align
            para.line_spacing = p["ls"]
            para.space_before = Pt(0)
            para.space_after = Pt(p["sa"])
            run = para.add_run()
            run.text = ln
            f = run.font
            f.name = "Trebuchet MS" if p["font"] == D.HEAD else "Calibri"
            f.size = Pt(p["size"])
            f.bold = p["bold"]
            f.color.rgb = RGBColor.from_string(p["color"])
            if p.get("track"):
                run._r.get_or_add_rPr().set("spc", str(int(p["track"] * p["size"] * 100)))
        return tb

    def head(self, text_x):
        self.text(D.M, D.Y_HEAD, 11.0, 1.16,
                  D._p(text_x, D.S_H1, D.INK, bold=True, font=D.HEAD, ls=1.08))

    # -- shared chrome ---------------------------------------------------
    def chrome(self, kicker, page):
        self.text(D.M, 0.52, 7.4, 0.22,
                  D._p(kicker, D.S_KICK, D.GREEN, bold=True, track=1.9))
        self.text(13.333 - D.M - 3.4, 0.52, 3.4, 0.22,
                  D._p("DMART  ×  PAUSE POINT", D.S_KICK, D.MUTED, bold=True, track=1.6, align="r"))
        self.rect(D.M, 0.90, D.W, 0.008, D.LINE)
        self.text(D.M, 7.12, 6.0, 0.2,
                  D._p("HCD MODULE, SEM 3  ·  GROUP 7", 7.5, D.MUTED, bold=True, track=1.5))
        self.text(13.333 - D.M - 3.0, 7.12, 3.0, 0.2,
                  D._p("%02d / 10  ·  %s" % (page, D.SLIDE_TITLES[page - 1].upper()),
                       7.5, D.MUTED, bold=True, track=1.5, align="r"))
        self.progress(page)

    def progress(self, page, dark=False):
        self.rect(0, H_IN - 0.055, W_IN, 0.055, D.GREEN_D if dark else D.LINE)
        self.rect(0, H_IN - 0.055, W_IN * page / 10.0, 0.055, D.CREAM if dark else D.GREEN)

    def notes(self, text):
        self.slide.notes_slide.notes_text_frame.text = text


def _set_alpha(color_xml_obj, pct):
    """pct = opacity 0-100 -> write <a:alpha val="pct*1000"/> into the srgbClr."""
    from lxml import etree
    ns = "http://schemas.openxmlformats.org/drawingml/2006/main"
    srgb = color_xml_obj._srgbClr
    for old in srgb.findall("{%s}alpha" % ns):
        srgb.remove(old)
    a = etree.SubElement(srgb, "{%s}alpha" % ns)
    a.set("val", str(int(pct * 1000)))


def build_pptx(path):
    from pptx import Presentation
    from pptx.util import Inches
    prs = Presentation()
    prs.slide_width = Inches(W_IN)
    prs.slide_height = Inches(H_IN)
    for s in D.build(lambda i, layout: PptxSlide(prs, i, layout)):
        s.notes(D.NOTES[s.idx - 1])
    prs.core_properties.title = "Pause Point — a DMart marketing pitch"
    prs.core_properties.author = "Group 7 · HCD Module, Sem 3"
    prs.core_properties.subject = "10-slide marketing pitch for the Head of Marketing, DMart"
    prs.save(path)
    return path


# ===================================================================== HTML
class HtmlSlide:
    def __init__(self, idx, layout):
        self.idx, self.layout, self.parts = idx, layout, []

    def _px(self, v):
        return round(v * 96, 2)

    def _div(self, x, y, w, h, style):
        self.parts.append(
            '<div style="position:absolute;left:%spx;top:%spx;width:%spx;height:%spx;%s"></div>'
            % (self._px(x), self._px(y), self._px(w), self._px(h), style))

    def rect(self, x, y, w, h, fill, line=None, lw=0, alpha=None, rot=0, **kw):
        st = "background:#%s;" % fill
        if alpha is not None:
            st = "background:rgba(%d,%d,%d,%.2f);" % (int(fill[0:2], 16), int(fill[2:4], 16),
                                                      int(fill[4:6], 16), alpha / 100.0)
        if line:
            st += "border:%spx solid #%s;" % (lw or 1, line)
        if rot:
            st += "transform:rotate(%sdeg);" % rot
        self._div(x, y, w, h, st)

    def oval(self, x, y, w, h, fill, line=None, lw=0, alpha=None, rot=0, **kw):
        st = "background:#%s;border-radius:50%%;" % fill
        if line:
            st += "border:%spx solid #%s;" % (lw or 1, line)
        if not line and fill:
            st = "background:#%s;border-radius:50%%;" % fill
        self._div(x, y, w, h, st)

    def tri(self, x, y, w, h, fill, d="down", **kw):
        clip = {"down": "polygon(50% 100%,0 0,100% 0)",
                "left": "polygon(0 50%,100% 0,100% 100%)",
                "right": "polygon(100% 50%,0 0,0 100%)"}[d]
        self._div(x, y, w, h, "background:#%s;clip-path:%s;" % (fill, clip))

    def text(self, x, y, w, h, p, **kw):
        al = {"l": "left", "c": "center", "r": "right"}[p["align"]]
        fam = "'Trebuchet MS',Verdana,sans-serif" if p["font"] == D.HEAD else \
              "'Calibri','Segoe UI',system-ui,sans-serif"
        st = ("color:#%s;font-size:%.2fpx;line-height:%.2f;font-family:%s;font-weight:%s;"
              "text-align:%s;letter-spacing:%.2fem;"
              % (p["color"], p["size"] * 96 / 72.0, p["ls"], fam,
                 "700" if p["bold"] else "400", al, p["track"]))
        body = _html.escape(p["t"]).replace("\n", "<br>")
        self.parts.append(
            '<div style="position:absolute;left:%spx;top:%spx;width:%spx;height:%spx;%s">%s</div>'
            % (self._px(x), self._px(y), self._px(w), self._px(h), st, body))

    def head(self, text_x):
        self.text(D.M, D.Y_HEAD, 11.0, 1.16,
                  D._p(text_x, D.S_H1, D.INK, bold=True, font=D.HEAD, ls=1.08))

    def head(self, text_x):
        self.text(D.M, D.Y_HEAD, 11.0, 1.16,
                  D._p(text_x, D.S_H1, D.INK, bold=True, font=D.HEAD, ls=1.08))

    def head(self, text_x):
        self.text(D.M, D.Y_HEAD, 11.0, 1.16,
                  D._p(text_x, D.S_H1, D.INK, bold=True, font=D.HEAD, ls=1.08))

    def chrome(self, kicker, page):
        self.text(D.M, 0.52, 7.4, 0.22, D._p(kicker, D.S_KICK, D.GREEN, bold=True, track=1.9))
        self.text(13.333 - D.M - 3.4, 0.52, 3.4, 0.22,
                  D._p("DMART  ×  PAUSE POINT", D.S_KICK, D.MUTED, bold=True, track=1.6, align="r"))
        self.rect(D.M, 0.90, D.W, 0.008, D.LINE)
        self.text(D.M, 7.12, 6.0, 0.2,
                  D._p("HCD MODULE, SEM 3  ·  GROUP 7", 7.5, D.MUTED, bold=True, track=1.5))
        self.text(13.333 - D.M - 3.0, 7.12, 3.0, 0.2,
                  D._p("%02d / 10  ·  %s" % (page, D.SLIDE_TITLES[page - 1].upper()),
                       7.5, D.MUTED, bold=True, track=1.5, align="r"))
        self.progress(page)

    def progress(self, page, dark=False):
        self.rect(0, H_IN - 0.055, W_IN, 0.055, D.GREEN_D if dark else D.LINE)
        self.rect(0, H_IN - 0.055, W_IN * page / 10.0, 0.055, D.CREAM if dark else D.GREEN)

    def notes(self, text):
        self.parts.append('<div class="notes">%s</div>' % _html.escape(text))


HTML_TPL = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pause Point — DMart marketing pitch</title>
<style>
  :root{{ --fit:1 }}
  *{{box-sizing:border-box}}
  html,body{{margin:0;height:100%;background:#0E1411;font-family:'Calibri',system-ui,sans-serif;
    display:flex;align-items:center;justify-content:center;overflow:hidden}}
  #deck{{position:relative;width:1280px;height:720px;background:#fff;
    transform:scale(var(--fit));transform-origin:center center;flex:none}}
  .slide{{position:absolute;inset:0;display:none;background:#fff}}
  .slide.on{{display:block}}
  .notes{{display:none}}
  #bar{{position:fixed;left:0;right:0;bottom:0;padding:8px 14px;display:flex;gap:10px;
    align-items:center;color:#B9C6BE;font-size:12px;letter-spacing:.04em;background:rgba(14,20,17,.92)}}
  #bar b{{color:#F7E1B5;font-weight:700}}
  #bar span{{color:#7E8C84}}
  #notes{{position:fixed;left:0;right:0;bottom:34px;max-height:38vh;overflow:auto;display:none;
    background:rgba(247,225,181,.97);color:#0B1F17;padding:18px 22px;font-size:15px;line-height:1.5}}
  #notes.on{{display:block}}
  @media print{{
    #bar{{display:none}} html,body{{background:#fff;display:block;overflow:visible}}
    #deck{{transform:none;width:1280px;height:auto}}
    .slide{{display:block;position:relative;page-break-after:always;height:720px}}
  }}
</style></head><body>
<div id="deck">{slides}</div>
<div id="notes"></div>
<div id="bar"><b id="n">01</b><span id="t">Hook</span>
  <span style="margin-left:auto">← → navigate · N notes · F fullscreen</span></div>
<script>
  var slides=[].slice.call(document.querySelectorAll('.slide')), cur=0;
  function fit(){{var s=Math.min(innerWidth/1280,(innerHeight-40)/720);document.documentElement.style.setProperty('--fit',s);}}
  function go(i){{cur=(i+slides.length)%slides.length;
    slides.forEach(function(s,k){{s.classList.toggle('on',k===cur);}});
    document.getElementById('n').textContent=('0'+(cur+1)).slice(-2);
    document.getElementById('t').textContent=slides[cur].dataset.t;
    document.getElementById('notes').innerHTML='<b>Speaker notes</b><br>'+slides[cur].dataset.notes;}}
  addEventListener('keydown',function(e){{
    if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown')go(cur+1);
    if(e.key==='ArrowLeft'||e.key==='PageUp')go(cur-1);
    if(e.key==='n'||e.key==='N')document.getElementById('notes').classList.toggle('on');
    if(e.key==='f'||e.key==='F')document.documentElement.requestFullscreen();
    if(e.key>='1'&&e.key<='9')go(+e.key-1);
    if(e.key==='0')go(9);
  }});
  addEventListener('resize',fit);
  fit(); go(0);
</script></body></html>"""


def build_html(path):
    slides = D.build(lambda i, layout: HtmlSlide(i, layout))
    out = []
    for s in slides:
        body = "".join(s.parts)
        out.append('<section class="slide" data-t="%s" data-notes="%s">%s</section>'
                   % (D.SLIDE_TITLES[s.idx - 1], _html.escape(D.NOTES[s.idx - 1]), body))
    open(path, "w", encoding="utf-8").write(HTML_TPL.format(slides="\n".join(out)))
    return path


# ====================================================================== PNG
class PilSlide:
    """Rough flat render used only for visual QA (layout collisions, overflow)."""
    WARN = []

    def __init__(self, idx, layout, draw, scale=96):
        self.idx, self.layout, self.d, self.k = idx, layout, draw, scale

    def _box(self, x, y, w, h):
        return [x * self.k, y * self.k, (x + w) * self.k, (y + h) * self.k]

    def _rgb(self, c, alpha=None, bg=(255, 255, 255)):
        r, g, b = int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
        if alpha is None:
            return (r, g, b)
        a = alpha / 100.0
        return (int(r * a + bg[0] * (1 - a)), int(g * a + bg[1] * (1 - a)), int(b * a + bg[2] * (1 - a)))

    def rect(self, x, y, w, h, fill, line=None, lw=0, alpha=None, rot=0, **kw):
        b = self._box(x, y, w, h)
        self.d.rectangle(b, fill=self._rgb(fill, alpha))
        if line:
            self.d.rectangle(b, outline=self._rgb(line), width=max(1, int(lw * self.k / 72)))

    def oval(self, x, y, w, h, fill, line=None, lw=0, alpha=None, rot=0, **kw):
        b = self._box(x, y, w, h)
        self.d.ellipse(b, fill=self._rgb(fill, alpha), outline=self._rgb(line) if line else None,
                       width=max(1, int((lw or 1) * self.k / 72)))

    def tri(self, x, y, w, h, fill, d="down", **kw):
        b = self._box(x, y, w, h)
        pts = {"down": [(b[0] + (b[2] - b[0]) / 2, b[3]), (b[0], b[1]), (b[2], b[1])],
               "left": [(b[0], b[1] + (b[3] - b[1]) / 2), (b[2], b[1]), (b[2], b[3])],
               "right": [(b[2], b[1] + (b[3] - b[1]) / 2), (b[0], b[1]), (b[0], b[3])]}[d]
        self.d.polygon(pts, fill=self._rgb(fill))

    def text(self, x, y, w, h, p, **kw):
        from PIL import ImageFont
        px = p["size"] * self.k / 72.0
        font_path = ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if p["bold"]
                     else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
        f = ImageFont.truetype(font_path, max(6, int(round(px))))
        # wrap (explicit \n breaks first, then word wrap per block)
        lines = []
        for block in p["t"].split("\n"):
            cur = ""
            for word in block.split(" "):
                trial = (cur + " " + word).strip()
                if self.d.textlength(trial, font=f) > w * self.k - 2 and cur:
                    lines.append(cur)
                    cur = word
                else:
                    cur = trial
            lines.append(cur)
        lh = px * p["ls"] * 1.02
        need = len(lines) * lh
        if need > h * self.k + 1.5:
            PilSlide.WARN.append("slide %02d: text overflow %.2fin>%.2fin  %r"
                                 % (self.idx, need / self.k, h, p["t"][:48]))
            self.d.rectangle(self._box(x, y, w, h), outline=(200, 40, 40), width=2)
        for i, ln in enumerate(lines):
            tx = x * self.k
            if p["align"] == "c":
                tx = x * self.k + (w * self.k - self.d.textlength(ln, font=f)) / 2
            elif p["align"] == "r":
                tx = (x + w) * self.k - self.d.textlength(ln, font=f)
            self.d.text((tx, y * self.k + i * lh), ln, font=f, fill=self._rgb(p["color"]))

    chrome = PptxSlide.chrome
    progress = PptxSlide.progress

    def notes(self, text):
        pass


def build_png(path, cols=2):
    """Capture every draw call once, then replay each slide onto its own canvas."""
    from PIL import Image, ImageDraw
    k = 96
    recs = []

    def mk(i, layout):
        r = _Recorder(i, layout)
        recs.append(r)
        return r

    D.build(mk)
    rows = (len(recs) + cols - 1) // cols
    pad = 22
    cw, ch = int(W_IN * k), int(H_IN * k)
    sheet = Image.new("RGB", (cw * cols + pad * (cols + 1), ch * rows + pad * (rows + 1)),
                      (226, 232, 228))
    for i, r in enumerate(recs):
        im = Image.new("RGB", (cw, ch), (255, 255, 255))
        dr = ImageDraw.Draw(im)
        target = PilSlide(r.idx, r.layout, dr, k)
        for name, args, kw in r.calls:
            getattr(target, name)(*args, **kw)
        x = pad + (i % cols) * (cw + pad)
        y = pad + (i // cols) * (ch + pad)
        sheet.paste(im, (x, y))
        d2 = ImageDraw.Draw(sheet)
        d2.rectangle([x - 1, y - 1, x + cw, y + ch], outline=(120, 134, 126))
    sheet.save(path)
    return path


class _Recorder(PptxSlide):
    """Records draw calls (never touches a real surface) so PNG can replay them."""
    def __init__(self, idx, layout):
        self.idx, self.layout, self.calls = idx, layout, []

    def _rec(self, name, args, kw):
        self.calls.append((name, args, kw))

    def rect(self, *a, **k):
        self._rec("rect", a, k)

    def oval(self, *a, **k):
        self._rec("oval", a, k)

    def tri(self, *a, **k):
        self._rec("tri", a, k)

    def text(self, *a, **k):
        self._rec("text", a, k)

    def progress(self, *a, **k):
        self._rec("progress", a, k)

    def notes(self, *a, **k):
        pass

    def head(self, text_x):
        self.text(D.M, D.Y_HEAD, 11.0, 1.16,
                  D._p(text_x, D.S_H1, D.INK, bold=True, font=D.HEAD, ls=1.08))

    def head(self, text_x):
        self.text(D.M, D.Y_HEAD, 11.0, 1.16,
                  D._p(text_x, D.S_H1, D.INK, bold=True, font=D.HEAD, ls=1.08))

    def head(self, text_x):
        self.text(D.M, D.Y_HEAD, 11.0, 1.16,
                  D._p(text_x, D.S_H1, D.INK, bold=True, font=D.HEAD, ls=1.08))

    def chrome(self, kicker, page):
        self.text(D.M, 0.52, 7.4, 0.22, D._p(kicker, D.S_KICK, D.GREEN, bold=True, track=1.9))
        self.text(13.333 - D.M - 3.4, 0.52, 3.4, 0.22,
                  D._p("DMART  ×  PAUSE POINT", D.S_KICK, D.MUTED, bold=True, track=1.6, align="r"))
        self.rect(D.M, 0.90, D.W, 0.008, D.LINE)
        self.text(D.M, 7.12, 6.0, 0.2,
                  D._p("HCD MODULE, SEM 3  ·  GROUP 7", 7.5, D.MUTED, bold=True, track=1.5))
        self.text(13.333 - D.M - 3.0, 7.12, 3.0, 0.2,
                  D._p("%02d / 10  ·  %s" % (page, D.SLIDE_TITLES[page - 1].upper()),
                       7.5, D.MUTED, bold=True, track=1.5, align="r"))
        self.progress(page)


if __name__ == "__main__":
    out = HERE
    if "--pptx" in sys.argv:
        print("pptx ->", build_pptx(os.path.join(out, "DMart-Pause-Point-Pitch.pptx")))
    if "--html" in sys.argv:
        print("html ->", build_html(os.path.join(out, "index.html")))
    if "--png" in sys.argv:
        p = build_png(os.path.join(out, "qa-sheet.png"))
        print("png  ->", p)
        for w in PilSlide.WARN:
            print("  !", w)


def build_png_slide(idx, path, k=160):
    """High-res single-slide render for close inspection."""
    from PIL import Image, ImageDraw
    recs = []

    def mk(i, layout):
        r = _Recorder(i, layout)
        recs.append(r)
        return r

    D.build(mk)
    r = recs[idx - 1]
    im = Image.new("RGB", (int(W_IN * k), int(H_IN * k)), (255, 255, 255))
    dr = ImageDraw.Draw(im)
    target = PilSlide(r.idx, r.layout, dr, k)
    for name, args, kw in r.calls:
        getattr(target, name)(*args, **kw)
    im.save(path)
    return path
