# paper-presentation — 学术论文演示

11-slide academic paper presentation template designed for presenting CS/engineering research papers.

**Visual traits:** cream paper background, serif fonts, zero-radius corners, no shadows, no animations. Blue (`#1a3a7a`) academic accent. Light-background code blocks with theme-aware syntax highlighting.

**Recommended theme:** `academic-paper` (default). Also works well with `editorial-serif`, `corporate-clean`, `engineering-whiteprint`.

## Slide structure

| # | Type | Purpose |
|---|---|---|
| 1 | Cover | Title, authors, venue, one-sentence core claim |
| 2 | Motivation | Problem statement + Figure 1 (paradigm overview) |
| 3 | Background | Technical background + Figure 2 (data structure) |
| 4 | Protocol 1 | Core algorithm with code block + explanation cards |
| 5 | Protocol 1 safety | 3 requirements + 2 callout boxes |
| 6 | Protocol 2 | Comparison table (OLC vs new protocol) + trade-off cards |
| 7 | Protocol 2 impl | Implementation details + numbered step list |
| 8 | Eval — scalability | Single large figure + 2 data-reading callouts |
| 9 | Eval — conditions | Two related figures + per-figure analysis callouts |
| 10 | Complexity + related work | LOC table + 4 related-work cards |
| 11 | Summary | 3 takeaway cards + terminal-style quote box |

## Key design decisions

- **Atomic slides:** each slide presents exactly one topic. Figures are split across slides — max 2 figures per slide.
- **Figure + text pairing:** every figure has a numbered caption and at least one callout box interpreting the data.
- **No animations:** zero `data-anim` attributes. All content is static and stable.
- **Theme-native:** uses `var(--text-1)`, `var(--accent)`, etc. exclusively. Press `T` to cycle through compatible light themes.
- **Code blocks:** light-background (`var(--surface-2)`), syntax-highlighted with theme tokens (keywords in `--accent`, strings in green, comments in `--text-3` italic).

## Authoring from this template

1. Replace the kicker (venue/date), h1 title, and author block on slide 1.
2. Replace card content and figure references on each slide.
3. Keep the structural classes (`.card-accent`, `.callout`, `.table-cmp`, `.code-sm`, `.img-framed`) — they give this template its identity.
4. The scoped CSS is under `.tpl-paper-presentation` — will not affect other templates if loaded together.

## Theme compatibility

The template is designed for light themes with serif fonts and squared corners. Best results with:
- `academic-paper` (default)
- `editorial-serif`
- `corporate-clean`
- `engineering-whiteprint`
- `minimal-white`
