#!/usr/bin/env bash
# html-ppt :: bundle.sh — bundle a deck into a self-contained single HTML file
#   Inlines ALL themes, base CSS, animations, and JS (runtime.js, fx-runtime.js).
#   Theme switching uses inlined data — no external files needed.
#   Fixes @media print for PDF export.
#
# Usage:
#   bundle.sh <deck.html> [output.html]
#
# If output is omitted, writes to <deck-name>.bundle.html in the same directory.

set -euo pipefail

FILE="${1:-}"
OUT="${2:-}"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "usage: bundle.sh <deck.html> [output.html]" >&2
  exit 1
fi

HERE="$(cd "$(dirname "$0")/.." && pwd)"
ABS="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"
OUT="${OUT:-${FILE%.*}.bundle.html}"
OUT_ABS="$(cd "$(dirname "$OUT")" && pwd)/$(basename "$OUT")"

# Pass paths via env vars to avoid bash interpolation into the Python heredoc
export PYTHON_ABS="$ABS"
export PYTHON_OUT="$OUT_ABS"
export PYTHON_HERE="$HERE"

python3 << 'PYEOF'
import os, re, json, glob, sys

abs_path = os.environ["PYTHON_ABS"]
out_path = os.environ["PYTHON_OUT"]
skill    = os.environ["PYTHON_HERE"]

def read_file(path, label="file"):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: {label} not found: {path}", file=sys.stderr)
        sys.exit(1)

html = read_file(abs_path, "Deck HTML")

# Read asset files
base_css = read_file(f"{skill}/assets/base.css", "base.css")
fonts_css = read_file(f"{skill}/assets/fonts.css", "fonts.css")
anim_css = read_file(f"{skill}/assets/animations/animations.css", "animations.css")
runtime_js = read_file(f"{skill}/assets/runtime.js", "runtime.js")

fx_runtime_path = f"{skill}/assets/animations/fx-runtime.js"
fx_runtime_js = ""
if os.path.exists(fx_runtime_path):
    with open(fx_runtime_path) as f:
        fx_runtime_js = f.read()

# Read ALL theme CSS files — inline them so no external loading is needed
theme_data = {}
themes_dir = f"{skill}/assets/themes"
if not os.path.isdir(themes_dir):
    print(f"Error: themes directory not found: {themes_dir}", file=sys.stderr)
    sys.exit(1)
for theme_file in sorted(glob.glob(f"{themes_dir}/*.css")):
    name = os.path.splitext(os.path.basename(theme_file))[0]
    try:
        with open(theme_file) as f:
            theme_data[name] = f.read()
    except FileNotFoundError:
        print(f"Warning: theme file vanished: {theme_file}", file=sys.stderr)

theme_json = json.dumps(theme_data, ensure_ascii=False)

# Determine current active theme from the deck HTML
current_theme_match = re.search(
    r'''<link[^>]*id=["']theme-link["'][^>]*href=["']([^"']+)["']''',
    html
)
if current_theme_match:
    current_theme = os.path.splitext(os.path.basename(current_theme_match.group(1)))[0]
else:
    m = re.search(r'data-theme\s*=\s*"([^"]+)"', html)
    current_theme = m.group(1) if m else "tokyo-night"

# Use the current theme's CSS in the main combined block
active_theme_css = theme_data.get(current_theme, theme_data.get("tokyo-night", ""))
combined_css = base_css + "\n" + active_theme_css + "\n" + anim_css

# Inline runtime.js and fx-runtime.js FIRST (before removal loop)
# Use data URIs instead of direct inlining to avoid HTML parser issues:
# runtime.js contains "</script>" and "<script>" inside JS strings (presenter
# HTML builder), which can prematurely close/open <script> tags when inlined.
import base64

def inline_script(html, keyword, content):
    pat = re.compile(
        rf'(<script\s+[^>]*src=(["\'])[^"\'"]*{re.escape(keyword)}[^"\'"]*\2[^>]*>)'
        rf'(.*?)</script>',
        re.IGNORECASE | re.DOTALL
    )
    return pat.sub(lambda m: f"<script>{content}</script>", html)

def inline_script_data_uri(html, keyword, content):
    """Replace external <script src="...keyword..."> with base64 data URI.
    Avoids HTML parser issues when JS contains </script> or <script strings."""
    b64 = base64.b64encode(content.encode('utf-8')).decode('ascii')
    data_uri = f'<script src="data:text/javascript;base64,{b64}"></script>'
    pat = re.compile(
        rf'<script\s+[^>]*src=(["\'])[^"\'"]*{re.escape(keyword)}[^"\'"]*\1[^>]*>\s*</script>',
        re.IGNORECASE
    )
    return pat.sub(data_uri, html)

# Inject applyTheme override inside the ready() callback, right after the final
# go(idx); call and before the closing }). Use a sentinel comment marker first;
# fall back to searching for go(idx); for backward compatibility.
override_js = '''
    applyTheme = function(name) {
      var style = document.getElementById('theme-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'theme-style';
        document.head.appendChild(style);
      }
      var data = window.__htmlPptThemeData || {};
      style.textContent = data[name] || '';
      root.setAttribute('data-theme', name);
      var ind = document.querySelector('.theme-indicator');
      if (ind) ind.textContent = name;
    };'''
pos = runtime_js.find('/* @bundle-inject-point */')
if pos < 0:
    pos = runtime_js.rfind('go(idx);')
if pos >= 0:
    line_end = runtime_js.find('\n', pos)
    if line_end < 0:
        line_end = len(runtime_js)
    runtime_js = runtime_js[:line_end] + '\n' + override_js + runtime_js[line_end:]
else:
    print("Error: cannot find injection point in runtime.js — cannot inject applyTheme override", file=sys.stderr)
    sys.exit(1)

html = inline_script_data_uri(html, "runtime.js", runtime_js)
if fx_runtime_js:
    html = inline_script_data_uri(html, "fx-runtime.js", fx_runtime_js)

# Remove remaining external CSS/JS link/script tags
QUOT = """["']"""

for pat_suffix in (
    'fonts\\.css',
    'base\\.css',
    'themes/[^"\'"]*\\.css',
    'animations\\.css',
):
    full_pat = rf'<link[^>]*href={QUOT}[^"\']*{pat_suffix}{QUOT}[^>]*>'
    html = re.sub(full_pat, '', html, flags=re.IGNORECASE)

for pat_suffix in (
    'runtime\\.js',
    'fx-runtime\\.js',
):
    full_pat = rf'<script[^>]*src={QUOT}[^"\']*{pat_suffix}{QUOT}[^>]*>.*?</script>'
    html = re.sub(full_pat, '', html, flags=re.IGNORECASE | re.DOTALL)

# Insert fonts @import + combined CSS before </head>
fonts_block = f"<style>\n{fonts_css}\n</style>"
inject = f"{fonts_block}<style>{combined_css}</style>\n"
html = html.replace("</head>", inject + "</head>")

# Add window.__htmlPptThemeData initialization before the closing </body> or </html>
boot_script = f'<script>window.__htmlPptThemeData={theme_json};</script>'
if "</body>" in html:
    html = html.replace("</body>", boot_script + "\n</body>")
else:
    html = html.replace("</html>", boot_script + "\n</html>")

# Remove any remaining data-theme-base attribute (no longer needed)
html = re.sub(r'\s*data-theme-base="[^"]*"', '', html)


# Inline local images as base64 data URIs
deck_dir = os.path.dirname(abs_path)
img_pat = re.compile(r'(src)=(["\'])((?!(?:https?:|data:))[^"\']+\.(?:png|jpg|jpeg|gif|svg|webp))\2', re.IGNORECASE)
inlined_count = 0
def inline_image(m):
    global inlined_count
    attr, quote, src = m.group(1), m.group(2), m.group(3)
    img_path = os.path.normpath(os.path.join(deck_dir, src))
    if not os.path.isfile(img_path):
        print(f"  Warning: image not found: {img_path}", file=sys.stderr)
        return m.group(0)
    try:
        with open(img_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")
    except OSError as e:
        print(f"  Warning: cannot read image {img_path}: {e}", file=sys.stderr)
        return m.group(0)
    ext = os.path.splitext(src)[1].lower().lstrip(".")
    mime_map = {"png":"image/png","jpg":"image/jpeg","jpeg":"image/jpeg","gif":"image/gif","svg":"image/svg+xml","webp":"image/webp"}
    mime = mime_map.get(ext, "application/octet-stream")
    inlined_count += 1
    print(f"  Inlined image: {os.path.basename(src)} ({len(b64)//1024} KB)")
    return f'{attr}={quote}data:{mime};base64,{b64}{quote}'
html = img_pat.sub(inline_image, html)
if inlined_count:
    print(f"  Total images inlined: {inlined_count}")

try:
    with open(out_path, "w") as f:
        f.write(html)
        f.write("\n")
except OSError as e:
    print(f"Error: cannot write to {out_path}: {e}", file=sys.stderr)
    sys.exit(1)

size = os.path.getsize(out_path)
print(f"Done: {size} bytes -> {out_path}")
PYEOF
