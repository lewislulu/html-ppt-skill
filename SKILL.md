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

## What the skill gives you

- **36 themes** (`assets/themes/*.css`) — minimal-white, editorial-serif, soft-pastel, sharp-mono, arctic-cool, sunset-warm, catppuccin-latte/mocha, dracula, tokyo-night, nord, solarized-light, gruvbox-dark, rose-pine, neo-brutalism, glassmorphism, bauhaus, swiss-grid, terminal-green, xiaohongshu-white, rainbow-gradient, aurora, blueprint, memphis-pop, cyberpunk-neon, y2k-chrome, retro-tv, japanese-minimal, vaporwave, midcentury, corporate-clean, academic-paper, news-broadcast, pitch-deck-vc, magazine-bold, engineering-whiteprint
- **14 full-deck templates** (`templates/full-decks/<name>/`) — complete multi-slide decks with scoped `.tpl-<name>` CSS. 8 extracted from real-world decks (xhs-white-editorial, graphify-dark-graph, knowledge-arch-blueprint, hermes-cyber-terminal, obsidian-claude-gradient, testing-safety-alert, xhs-pastel-card, dir-key-nav-minimal), 6 scenario scaffolds (pitch-deck, product-launch, tech-sharing, weekly-report, xhs-post 3:4, course-module)
- **31 layouts** (`templates/single-page/*.html`) with realistic demo data
- **27 CSS animations** (`assets/animations/animations.css`) via `data-anim`
- **20 canvas FX animations** (`assets/animations/fx/*.js`) via `data-fx` — particle-burst, confetti-cannon, firework, starfield, matrix-rain, knowledge-graph (force-directed), neural-net (pulses), constellation, orbit-ring, galaxy-swirl, word-cascade, letter-explode, chain-react, magnetic-field, data-stream, gradient-blob, sparkle-trail, shockwave, typewriter-multi, counter-explosion
- **Keyboard runtime** (`assets/runtime.js`) — arrows, T (theme), A (anim), F/S/O
- **FX runtime** (`assets/animations/fx-runtime.js`) — auto-inits `[data-fx]` on slide enter, cleans up on leave
- **Showcase decks** for themes / layouts / animations / full-decks gallery
- **Headless Chrome render script** for PNG export

## When to use

Use when the user asks for any kind of slide-based output or wants to turn
text/notes into a presentable deck. Prefer this over building from scratch.

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
3. **Starting point.** One of the 14 full-deck templates, or scratch? Point
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
2. **Pick a theme.** Open the deck and press `T` to cycle. Or hard-code it:
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
5. **Use a full-deck template.** Copy `templates/full-decks/<name>/` into
   `examples/my-talk/` as a starting point. Each folder is self-contained with
   scoped CSS. Catalog in [references/full-decks.md](references/full-decks.md)
   and gallery at `templates/full-decks-index.html`.
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
  a new `templates/single-page/*.html` if none of the 30 fit.
- **Respect chrome slots.** `.deck-header`, `.deck-footer`, `.slide-number`
  and the progress bar are provided by `assets/base.css` + `runtime.js`.
- **Keyboard-first.** Always include `<script src="../assets/runtime.js"></script>`
  so the deck supports ← → / T / A / F / S / O / hash deep-links.
- **One `.slide` per logical page.** `runtime.js` makes `.slide.is-active`
  visible; all others are hidden.
- **Supply notes.** Wrap speaker notes in `<div class="notes">…</div>` inside
  each slide. Press S to open the overlay.

## Writing guide

See [references/authoring-guide.md](references/authoring-guide.md) for a
step-by-step walkthrough: file structure, naming, how to transform an outline
into a deck, how to choose layouts and themes per audience, how to do a
Chinese + English deck, and how to export.

## Catalogs (load when needed)

- [references/themes.md](references/themes.md) — all 36 themes with when-to-use.
- [references/layouts.md](references/layouts.md) — all 31 layout types.
- [references/animations.md](references/animations.md) — 27 CSS + 20 canvas FX animations.
- [references/full-decks.md](references/full-decks.md) — all 14 full-deck templates.
- [references/authoring-guide.md](references/authoring-guide.md) — full workflow.

## File structure

```
html-ppt/
├── SKILL.md                 (this file)
├── references/              (detailed catalogs, load as needed)
├── assets/
│   ├── base.css             (tokens + primitives — do not edit per deck)
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
│   ├── layout-showcase.html       (iframe tour of all 31 layouts)
│   ├── animation-showcase.html    (20 FX + 27 CSS animation slides)
│   ├── full-decks-index.html      (gallery of all 14 full-deck templates)
│   ├── full-decks/<name>/         (14 scoped multi-slide deck templates)
│   └── single-page/*.html         (31 layout files with demo data)
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
F                                       fullscreen
S                                       speaker notes overlay
O                                       slide overview grid
T                                       cycle themes (reads data-themes attr)
A                                       cycle demo animation on current slide
#/N in URL                              deep-link to slide N
```

## License & author

MIT. Copyright (c) 2026 lewis &lt;sudolewis@gmail.com&gt;.
