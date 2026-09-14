---
name: html-ppt
description: HTML PPT Studio — author professional static HTML presentations in many styles, layouts, and animations, all driven by templates. Use when the user asks for a presentation, PPT, slides, keynote, deck, slideshow, "幻灯片", "演讲稿", "做一份 PPT", "做一份 slides", a reveal-style HTML deck, a 小红书 图文, or any kind of multi-slide pitch/report/sharing document that should look tasteful and be usable with keyboard navigation. Triggers include keywords like "presentation", "ppt", "slides", "deck", "keynote", "reveal", "slideshow", "幻灯片", "演讲稿", "分享稿", "小红书图文", "talk slides", "pitch deck", "tech sharing", "technical presentation".
---

# html-ppt — HTML PPT Studio

Author professional HTML presentations as static files. One theme file = one
look. One layout file = one page type. One animation class = one entry effect.
All pages share a token-based design system in `assets/base.css`.

## Install

```bash
npx skills add https://github.com/lewislulu/html-ppt-skill
```

One command, no build. Pure static HTML/CSS/JS with only CDN webfonts.

No network on the target machine? Point the CLI at a local copy
(`npx skills add ./html-ppt-skill`), or just copy this folder into your agent's
skills directory — `~/.claude/skills/html-ppt/` for Claude Code. Decks render
offline; only the webfonts fall back to the system stack. See
[README.md](README.md#offline--manual-install).

## What the skill gives you

- **36 themes** (`assets/themes/*.css`) — minimal-white, editorial-serif, soft-pastel, sharp-mono, arctic-cool, sunset-warm, catppuccin-latte/mocha, dracula, tokyo-night, nord, solarized-light, gruvbox-dark, rose-pine, neo-brutalism, glassmorphism, bauhaus, swiss-grid, terminal-green, xiaohongshu-white, rainbow-gradient, aurora, blueprint, memphis-pop, cyberpunk-neon, y2k-chrome, retro-tv, japanese-minimal, vaporwave, midcentury, corporate-clean, academic-paper, news-broadcast, pitch-deck-vc, magazine-bold, engineering-whiteprint
- **15 full-deck templates** (`templates/full-decks/<name>/`) — complete multi-slide decks with scoped `.tpl-<name>` CSS. 8 extracted from real-world decks (xhs-white-editorial, graphify-dark-graph, knowledge-arch-blueprint, hermes-cyber-terminal, obsidian-claude-gradient, testing-safety-alert, xhs-pastel-card, dir-key-nav-minimal), 7 scenario scaffolds (pitch-deck, product-launch, tech-sharing, weekly-report, xhs-post 3:4, course-module, **presenter-mode-reveal** — 演讲者模式专用)
- **36 layouts** (`templates/single-page/*.html`) with realistic demo data, including **5 real-image layouts** (single / full-bleed / image+text / gallery / before-after)
- **27 CSS animations** (`assets/animations/animations.css`) via `data-anim`
- **20 canvas FX animations** (`assets/animations/fx/*.js`) via `data-fx` — particle-burst, confetti-cannon, firework, starfield, matrix-rain, knowledge-graph (force-directed), neural-net (pulses), constellation, orbit-ring, galaxy-swirl, word-cascade, letter-explode, chain-react, magnetic-field, data-stream, gradient-blob, sparkle-trail, shockwave, typewriter-multi, counter-explosion
- **Keyboard runtime** (`assets/runtime.js`) — arrows, T (theme), A (anim), F/O, **S (presenter mode: magnetic-card popup with CURRENT / NEXT / SCRIPT / TIMER cards)**, N (notes drawer), R (reset timer in presenter)
- **Touch navigation** — swipe left/right to change slides on phones and tablets
- **FX runtime** (`assets/animations/fx-runtime.js`) — auto-inits `[data-fx]` on slide enter, cleans up on leave
- **Showcase decks** for themes / layouts / animations / full-decks gallery
- **Headless Chrome render script** for PNG export

## When to use

Use when the user asks for any kind of slide-based output or wants to turn
text/notes into a presentable deck. Prefer this over building from scratch.

### 🎤 Presenter Mode (演讲者模式 + 逐字稿)

If the user mentions any of: **演讲 / 分享 / 讲稿 / 逐字稿 / speaker notes / presenter view / 演讲者视图 / 提词器**, or says things like "我要去给团队讲 xxx", "要做一场技术分享", "怕讲不流畅", "想要一份带逐字稿的 PPT" — **use the `presenter-mode-reveal` full-deck template** and write 150–300 words of 逐字稿 in each slide's `<aside class="notes">`.

See [references/presenter-mode.md](references/presenter-mode.md) for the full authoring guide including the 3 rules of speaker script writing:
1. **不是讲稿，是提示信号** — 加粗核心词 + 过渡句独立成段
2. **每页 150–300 字** — 2–3 分钟/页的节奏
3. **用口语，不用书面语** — "因此"→"所以"，"该方案"→"这个方案"

All full-deck templates support the S key presenter mode (it's built into `runtime.js`). **S opens a new popup window with 4 magnetic cards**:
- 🔵 **CURRENT** — pixel-perfect iframe preview of the current slide
- 🟣 **NEXT** — pixel-perfect iframe preview of the next slide
- 🟠 **SPEAKER SCRIPT** — large-font 逐字稿 (scrollable)
- 🟢 **TIMER** — elapsed time + slide counter + prev/next/reset buttons

Each card is **draggable by its header** and **resizable by the bottom-right corner handle**. Card positions/sizes persist to `localStorage` per deck. A "Reset layout" button restores the default arrangement.

**Why the previews are pixel-perfect**: each preview is an `<iframe>` that loads the actual deck HTML with a `?preview=N` query param; `runtime.js` detects this and renders only slide N with no chrome. So the preview uses the **same CSS, theme, fonts, and viewport as the audience view** — colors and layout are guaranteed identical.

**Smooth navigation**: on slide change, the presenter window sends `postMessage({type:'preview-goto', idx:N})` to each iframe. The iframe just toggles `.is-active` between slides — **no reload, no flicker**. The two windows also stay in sync via `BroadcastChannel`.

Only `presenter-mode-reveal` is designed from the ground up around the feature with proper example 逐字稿 on every slide.

Keyboard in presenter window: `← →` navigate (syncs audience) · `R` reset timer · `Esc` close popup.
Keyboard in audience window: `S` open presenter · `T` cycle theme · `← →` navigate (syncs presenter) · `F` fullscreen · `O` overview.

## Before you author anything — ALWAYS ask or recommend

**Do not start writing slides until you understand three things.** Either ask
the user directly, or — if they already handed you rich content — propose a
tasteful default and confirm.

1. **Content & audience.** What's the deck about, how many slides, who's
   watching (engineers / execs / 小红书读者 / 学生 / VC)?
2. **Style / theme.** Which of the 36 themes fits? If unsure, recommend 2-3
   candidates based on tone:
   - Business / investor pitch → `pitch-deck-vc`, `corporate-clean`, `swiss-grid`
   - Tech sharing / engineering → `tokyo-night`, `dracula`, `catppuccin-mocha`,
     `terminal-green`, `blueprint`
   - 小红书图文 → `xiaohongshu-white`, `soft-pastel`, `rainbow-gradient`,
     `magazine-bold`
   - Academic / report → `academic-paper`, `editorial-serif`, `minimal-white`
   - Edgy / cyber / launch → `cyberpunk-neon`, `vaporwave`, `y2k-chrome`,
     `neo-brutalism`
3. **Starting point.** One of the 15 full-deck templates, or scratch? Point
   to the closest `templates/full-decks/<name>/` and ask if it fits. If the
   user's content suggests something obvious (e.g. "我要做产品发布会" →
   `product-launch`), propose it confidently instead of asking blindly.

A good opening message looks like:

> 我可以给你做这份 PPT！先确认三件事：
> 1. 大致内容 / 页数 / 观众是谁？
> 2. 风格偏好？我建议从这 3 个主题里选一个：`tokyo-night`（技术分享默认好看）、`xiaohongshu-white`（小红书风）、`corporate-clean`（正式汇报）。
> 3. 要不要用我现成的 `tech-sharing` 全 deck 模板打底？

Only after those are clear, scaffold the deck and start writing.

## Quick start

1. **Scaffold a new deck.** From the repo root:
   ```bash
   ./scripts/new-deck.sh my-talk
   open examples/my-talk/index.html
   ```
2. **Pick a theme.** Open the deck and press `T` to cycle. Or hard-code it
   (`../assets/` here is a placeholder — use whatever prefix the rest of the
   file already uses; `new-deck.sh` has set it to the right depth):
   ```html
   <link rel="stylesheet" id="theme-link" href="../assets/themes/aurora.css">
   ```
   Catalog in [references/themes.md](references/themes.md).
3. **Pick layouts.** Copy `<section class="slide">...</section>` blocks out of
   files in `templates/single-page/` into your deck. Replace the demo data.
   Catalog in [references/layouts.md](references/layouts.md).
4. **Add animations.** Put `data-anim="fade-up"` (or `class="anim-fade-up"`) on
   any element. On `<ul>`/grids, use `anim-stagger-list` for sequenced reveals.
   For canvas FX, use `<div data-fx="knowledge-graph">...</div>` and include
   `<script src="../assets/animations/fx-runtime.js"></script>`.
   Catalog in [references/animations.md](references/animations.md).
5. **Use a full-deck template.** Scaffold from it, don't copy it by hand —
   the template's `../../../assets/` is relative to *its own* location, so a
   manual copy lands the paths at the wrong depth:
   ```bash
   ./scripts/new-deck.sh my-talk -t pitch-deck
   ```
   Each folder is self-contained with scoped CSS. Catalog in
   [references/full-decks.md](references/full-decks.md) and gallery at
   `templates/full-decks-index.html`.
6. **Render to PNG.**
   ```bash
   ./scripts/render.sh templates/theme-showcase.html       # one shot
   ./scripts/render.sh examples/my-talk/index.html 12      # 12 slides
   ```

## Authoring rules (important)

- **Always start from a template.** Don't author slides from scratch — copy the
  closest layout from `templates/single-page/` first, then replace content.
- **Use tokens, not literal colors.** Every color, radius, shadow should come
  from CSS variables defined in `assets/base.css` and overridden by a theme.
  Good: `color: var(--text-1)`. Bad: `color: #111`.
- **Don't invent new layout files.** Prefer composing existing ones. Only add
  a new `templates/single-page/*.html` if none of the 36 fit.
- **Putting images on a slide?** Start from one of the five `image-*` layouts and
  use `.img-frame` — see *Images* below. Never drop a bare `<img>` into a slide:
  an unframed image ignores the slide's height and pushes the rest off the page.
- **Respect chrome slots.** `.deck-header`, `.deck-footer`, `.slide-number`
  and the progress bar are provided by `assets/base.css` + `runtime.js`.
- **Add a logo declaratively, once.** Put `data-logo` on `<body>` — don't paste
  an `<img>` into every slide. See *Custom logo* below.
- **Keyboard-first.** Always include the runtime, e.g.
  `<script src="../assets/runtime.js"></script>`, so the deck supports
  ← → / T / A / F / S / O / hash deep-links.
- **Never hand-edit the `../` depth in asset paths.** Every `assets/` reference
  is relative to the file that holds it: `templates/deck.html` uses
  `../assets/`, `templates/single-page/*.html` use `../../assets/`, and
  `templates/full-decks/*/index.html` use `../../../assets/`. Copying a file to
  a new depth silently breaks all of them. Scaffold with
  `./scripts/new-deck.sh <name> [parent] [-t <template>]`, which computes the
  prefix for wherever the deck lands and verifies every reference resolves.
- **One `.slide` per logical page.** `runtime.js` makes `.slide.is-active`
  visible; all others are hidden.
- **Supply notes.** Wrap speaker notes in `<div class="notes">…</div>` inside
  each slide. Press S to open the overlay.
- **NEVER put presenter-only text on the slide itself.** Descriptive text like
  "这一页展示了……" or "Speaker: 这里可以补充……" or small explanatory captions
  aimed at the presenter MUST go inside `<div class="notes">`, NOT as visible
  `<p>` / `<span>` elements on the slide. The `.notes` class is `display:none`
  by default — it only appears in the S overlay. Slides should contain ONLY
  audience-facing content (titles, bullet points, data, charts, images).

## Images

Five layouts in `templates/single-page/` take real images. Pick by how many
images the page has to carry:

| I have… | Use | Why |
|---|---|---|
| one screenshot / diagram / chart | `image-single.html` | `.img-frame.contain` — letterboxed, **never cropped** |
| one photo that should carry the page | `image-full-bleed.html` | fills the slide, gradient scrim keeps the title readable |
| one image plus an argument | `image-text-split.html` | 50/50; add `flip` to `.split` to move the image right |
| 3–6 images | `image-gallery.html` | uniform grid; mixed source ratios are normalised by the frame |
| a before and an after | `image-compare.html` | both sides identical size, conclusion under each |

`image-grid.html` and `image-hero.html` are **not** in this list: they are
gradient-placeholder layouts with no `<img>` at all. Reach for them when you
want the shape of a bento wall without supplying pictures.

All five are built on one primitive from `assets/base.css`:

```html
<figure class="img-frame"><img src="shot.png" alt=""></figure>
<figure class="img-frame contain" style="--img-ratio:4/3"><img src="diagram.svg" alt=""></figure>
```

- `.img-frame` owns the **aspect ratio and the crop**; the `<img>` fills it with
  `object-fit: cover`. That's what lets a user swap in a photo of any shape
  without the layout breaking.
- `.img-frame.contain` letterboxes instead of cropping — **always use it for
  screenshots, diagrams and logos.**
- `--img-ratio` (default `16/10`) and `--img-pos` (`object-position`) tune it.
- `.img-scrim` / `.img-cap` / `.img-tag` are the scrim, caption and corner pill.
- Images referenced from a deck are resolved relative to the deck's own
  `index.html` — keep them in the deck folder, e.g. `examples/my-talk/shot.png`.
- `assets/demo-images/` holds the placeholder artwork used by these layouts:
  hand-written SVG, ~1 KB each, **no network needed**.

## Custom logo

To brand a deck with a company / product logo, declare it once on `<body>`:

```html
<body data-logo="logo.svg"
      data-logo-position="bottom-right"
      data-logo-size="40px">
```

| Attribute | Default | Notes |
|---|---|---|
| `data-logo` | — | Image URL, relative to the deck's own HTML file. Required. |
| `data-logo-position` | `top-right` | `top-left` / `top-right` / `bottom-left` / `bottom-right` |
| `data-logo-size` | `44px` | Any CSS length; sets the logo's **height**, width follows the aspect ratio |
| `data-logo-opacity` | `.9` | `1` for full strength |
| `data-logo-alt` | `""` | Alt text |

- **Skip it on one slide** with `<section class="slide" data-no-logo>` — usually
  the cover and any full-bleed image slide that carries its own branding.
- **Fine-tune the inset** with `--logo-inset-x` / `--logo-inset-y` on `.deck-logo`.
- **Place it by hand** instead, if you want it inside the chrome slots or in a
  spot the four presets don't cover:
  ```html
  <div class="deck">
    <img class="deck-logo" data-pos="bottom-left" src="logo.svg" alt="">
  ```
  This path needs no JS at all — `base.css` styles both the same way.
- The logo shows in the **presenter preview**, and on **every page of a
  print/PDF export** (unlike the header/footer/progress chrome, which print
  hides). `data-no-logo` slides are skipped there too. Per-page printing is
  painted by `runtime.js` + `@media print`; a deck that omits the runtime still
  gets the logo on screen, but only on one page of a PDF.

## Writing guide

See [references/authoring-guide.md](references/authoring-guide.md) for a
step-by-step walkthrough: file structure, naming, how to transform an outline
into a deck, how to choose layouts and themes per audience, how to do a
Chinese + English deck, and how to export.

## Catalogs (load when needed)

- [references/themes.md](references/themes.md) — all 36 themes with when-to-use.
- [references/layouts.md](references/layouts.md) — all 36 layout types.
- [references/animations.md](references/animations.md) — 27 CSS + 20 canvas FX animations.
- [references/full-decks.md](references/full-decks.md) — all 15 full-deck templates.
- [references/presenter-mode.md](references/presenter-mode.md) — **演讲者模式 + 逐字稿编写指南（技术分享/演讲必看）**.
- [references/authoring-guide.md](references/authoring-guide.md) — full workflow.

## File structure

```
html-ppt/
├── SKILL.md                 (this file)
├── references/              (detailed catalogs, load as needed)
├── assets/
│   ├── base.css             (tokens + primitives — do not edit per deck)
│   ├── demo-images/*.svg    (tiny offline placeholders for the image-* layouts)
│   ├── fonts.css            (webfont imports)
│   ├── runtime.js           (keyboard + presenter + overview + theme cycle)
│   ├── themes/*.css         (36 token overrides, one per theme)
│   └── animations/
│       ├── animations.css   (27 named CSS entry animations)
│       ├── fx-runtime.js    (auto-init [data-fx] on slide enter)
│       └── fx/*.js          (20 canvas FX modules: particles/graph/fireworks…)
├── templates/
│   ├── deck.html                  (minimal 6-slide starter)
│   ├── theme-showcase.html        (36 slides, iframe-isolated per theme)
│   ├── layout-showcase.html       (iframe tour of all 36 layouts)
│   ├── animation-showcase.html    (20 FX + 27 CSS animation slides)
│   ├── full-decks-index.html      (gallery of all 15 full-deck templates)
│   ├── full-decks/<name>/         (15 scoped multi-slide deck templates)
│   └── single-page/*.html         (36 layout files with demo data)
├── scripts/
│   ├── new-deck.sh                (scaffold a deck from deck.html)
│   └── render.sh                  (headless Chrome → PNG)
└── examples/demo-deck/            (complete working deck)
```

## Rendering to PNG

`scripts/render.sh` wraps headless Chrome at
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. For multi-slide
capture, runtime.js exposes `#/N` deep-links, and render.sh iterates 1..N.

```bash
./scripts/render.sh templates/single-page/kpi-grid.html        # single page
./scripts/render.sh examples/demo-deck/index.html 8 out-dir    # 8 slides, custom dir
```

## Keyboard cheat sheet

```
←  →  Space  PgUp  PgDn  Home  End    navigate
swipe left / right (touch)              navigate — phones and tablets, no keyboard needed
F                                       fullscreen
S                                       open presenter window (magnetic cards: current/next/script/timer)
N                                       quick notes drawer (bottom overlay)
R                                       reset timer (in presenter window)
?preview=N                              URL param — force preview-only mode (single slide, no chrome)
O                                       slide overview grid
T                                       cycle themes (reads data-themes attr)
A                                       cycle demo animation on current slide
#/N in URL                              deep-link to slide N
Esc                                     close all overlays
```

## License & author

MIT. Copyright (c) 2026 lewis &lt;sudolewis@gmail.com&gt;.
