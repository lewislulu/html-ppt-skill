---
name: html-ppt
설명: HTML PPT Studio — 템플릿을 기반으로 다양한 스타일, 레이아웃 및 애니메이션으로 전문적인 정적 HTML 프레젠테이션을 작성합니다. 사용자가 프리젠테이션, PPT, 슬라이드, 키노트, 데크, 슬라이드쇼, "파워포인트", "슬라이드 만들기", 공개 스타일 HTML 데크, 작은 문서 또는 세련되고 키보드 탐색과 함께 사용할 수 있어야 하는 모든 종류의 다중 슬라이드 피치/보고서/공유 문서를 요청할 때 사용합니다. 트리거에는 "프레젠테이션", "ppt", "슬라이드", "덱", "키노트", "공개", "슬라이드쇼", "슬라이드", "연설", "공유", "작은 이야기", "토크 슬라이드", "피치 덱", "기술 공유", "기술 프레젠테이션"과 같은 키워드가 포함됩니다.
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
- **15 full-deck templates** (`templates/full-decks/<name>/`) — complete multi-slide decks with scoped `.tpl-<name>` CSS. 실제 덱에서 추출한 8개(xhs-white-editor, graphify-dark-graph, Knowledge-arch-blueprint, hermes-cyber-terminal, obsidian-claude-gradient, Testing-safety-alert, xhs-pastel-card, dir-key-nav-minimal), 7개의 시나리오 비계(피치 덱, 제품 출시, 기술 공유, 주간 보고서, xhs-post 3:4, 코스 모듈, **발표자 모드-공개** — 스피커 모드만 해당)
- **31 layouts** (`templates/single-page/*.html`) with realistic demo data
- **27 CSS animations** (`assets/animations/animations.css`) via `data-anim`
- **20 canvas FX animations** (`assets/animations/fx/*.js`) via `data-fx` — particle-burst, confetti-cannon, firework, starfield, matrix-rain, knowledge-graph (force-directed), neural-net (pulses), constellation, orbit-ring, galaxy-swirl, word-cascade, letter-explode, chain-react, magnetic-field, data-stream, gradient-blob, sparkle-trail, shockwave, typewriter-multi, counter-explosion
- **Keyboard runtime** (`assets/runtime.js`) — arrows, T (theme), A (anim), F/O, **S (presenter mode: magnetic-card popup with CURRENT / NEXT / SCRIPT / TIMER cards)**, N (notes drawer), R (reset timer in presenter)
- **FX runtime** (`assets/animations/fx-runtime.js`) — auto-inits `[data-fx]` on slide enter, cleans up on leave
- **Showcase decks** for themes / layouts / animations / full-decks gallery
- **Headless Chrome render script** for PNG export

## When to use

Use when the user asks for any kind of slide-based output or wants to turn
text/notes into a presentable deck. Prefer this over building from scratch.

### 🎤 발표자 모드(발표자 모드 + 축어)

사용자가 **연설/공유/음성 메모/축어적/발표자 노트/발표자 보기/발표자 보기/텔레프롬프터** 중 하나를 언급하거나 "팀에게 xxx라고 말할 거예요", "기술 공유를 하고 싶습니다", "말이 유창하지 못할 것 같아 걱정됩니다", "말 그대로 PPT를 원합니다"와 같은 말을 하는 경우 — ** `presenter-mode-reveal` 전체 자료 템플릿** 및 각 슬라이드에 150~300단어를 그대로 작성합니다. `<aside class="notes">`.

See [references/presenter-mode.md](references/presenter-mode.md) for the full authoring guide including the 3 rules of speaker script writing:
1. **강의 노트가 아니라 알림입니다** — 굵은 핵심 단어 + 독립 문단으로의 전환 문장
2. **페이지당 150~300단어** — 2~3분/페이지 케이던스
3. **문자가 아닌 말로 사용** — "그러므로" → "그래서", "이 계획" → "이 계획"

All full-deck templates support the S key presenter mode (it's built into `runtime.js`). **S opens a new popup window with 4 magnetic cards**:
- 🔵 **CURRENT** — pixel-perfect iframe preview of the current slide
- 🟣 **NEXT** — pixel-perfect iframe preview of the next slide
- 🟠 **발표자 스크립트** — 큰 글꼴 축어 스크립트(스크롤 가능)
- 🟢 **TIMER** — elapsed time + slide counter + prev/next/reset buttons

Each card is **draggable by its header** and **resizable by the bottom-right corner handle**. Card positions/sizes persist to `localStorage` per deck. A "Reset layout" button restores the default arrangement.

**Why the previews are pixel-perfect**: each preview is an `<iframe>` that loads the actual deck HTML with a `?preview=N` query param; `runtime.js` detects this and renders only slide N with no chrome. So the preview uses the **same CSS, theme, fonts, and viewport as the audience view** — colors and layout are guaranteed identical.

**Smooth navigation**: on slide change, the presenter window sends `postMessage({type:'preview-goto', idx:N})` to each iframe. The iframe just toggles `.is-active` between slides — **no reload, no flicker**. The two windows also stay in sync via `BroadcastChannel`.

Only `presenter-mode-reveal` 모든 슬라이드에 적절한 예를 그대로 포함하여 기능을 중심으로 처음부터 설계되었습니다.

Keyboard in presenter window: `← →` navigate (syncs audience) · `R` reset timer · `Esc` close popup.
Keyboard in audience window: `S` open presenter · `T` cycle theme · `← →` navigate (syncs presenter) · `F` fullscreen · `O` overview.

## Before you author anything — ALWAYS ask or recommend

**Do not start writing slides until you understand three things.** Either ask
the user directly, or — if they already handed you rich content — propose a
tasteful default and confirm.

1. **Content & audience.** What's the deck about, how many slides, who's
   보고 계시나요(엔지니어/임원/샤오홍슈 독자/학생/VC)?
2. **Style / theme.** Which of the 36 themes fits? If unsure, recommend 2-3
   candidates based on tone:
   - Business / investor pitch → `pitch-deck-vc`, `corporate-clean`, `swiss-grid`
   - Tech sharing / engineering → `tokyo-night`, `dracula`, `catppuccin-mocha`,
     `terminal-green`, `blueprint`
   - 작은 빨간 책 그림 및 텍스트 → `xiaohongshu-white`, `soft-pastel`, `rainbow-gradient`,
     `magazine-bold`
   - Academic / report → `academic-paper`, `editorial-serif`, `minimal-white`
   - Edgy / cyber / launch → `cyberpunk-neon`, `vaporwave`, `y2k-chrome`,
     `neo-brutalism`
3. **Starting point.** One of the 14 full-deck templates, or scratch? Point
   to the closest `templates/full-decks/<name>/` and ask if it fits. If the
   사용자의 콘텐츠가 명백한 내용을 암시하는 경우(예: "제품 출시를 원합니다" →
   `product-launch`), propose it confidently instead of asking blindly.

A good opening message looks like:

> 이 PPT는 제가 만들어 드릴 수 있어요! 먼저 다음 세 가지를 확인하세요.
> 1. 일반 내용/페이지 수/청취자는 누구인가요?
> 2. 스타일 선호? 다음 3가지 주제 중 하나를 선택하는 것이 좋습니다.`tokyo-night`(기술 공유는 기본적으로 좋아보이네요),`xiaohongshu-white`(샤오홍 서예 스타일),`corporate-clean`(공식 보고서).
> 3. 제가 만든 것을 사용하시겠습니까? `tech-sharing` 전체 데크 템플릿 기반?

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
- **NEVER put presenter-only text on the slide itself.** Descriptive text like
  "이 페이지에는..." 또는 "발표자: 여기에..." 또는 작은 설명 캡션이 표시됩니다.
  aimed at the presenter MUST go inside `<div class="notes">`, NOT as visible
  `<p>` / `<span>` elements on the slide. The `.notes` class is `display:none`
  by default — it only appears in the S overlay. Slides should contain ONLY
  audience-facing content (titles, bullet points, data, charts, images).

## Writing guide

See [references/authoring-guide.md](references/authoring-guide.md) for a
step-by-step walkthrough: file structure, naming, how to transform an outline
into a deck, how to choose layouts and themes per audience, how to do a
Chinese + English deck, and how to export.

## Catalogs (load when needed)

- [references/themes.md](references/themes.md) — all 36 themes with when-to-use.
- [references/layouts.md](references/layouts.md) — all 31 layout types.
- [references/animations.md](references/animations.md) — 27 CSS + 20 canvas FX animations.
- [references/full-decks.md](references/full-decks.md) — all 15 full-deck templates.
- [references/presenter-mode.md](references/presenter-mode.md) — **스피커 모드 + 축어적 글쓰기 가이드(기술 공유/연설을 위해 읽어야 함)**.
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
