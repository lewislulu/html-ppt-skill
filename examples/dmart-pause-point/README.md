# Pause Point — a 10-slide marketing pitch for DMart

Built from one source only: `HCD module, FMCG, Group 7` (28 pages). Every number
and every claim on the slides traces back to a page in that deck. Anything the
source does not contain is written as **[NEEDED]** instead of being invented.

**Deliverable:** `DMart-Pause-Point-Pitch.pptx` — 16:9, 13.333 × 7.5 in, native
PowerPoint shapes and text boxes (no images, so everything stays editable),
speaker notes on all 10 slides.

## Files

| file | what it is |
|---|---|
| `DMart-Pause-Point-Pitch.pptx` | the deck. Open in PowerPoint / Keynote / Slides |
| `index.html` | the same geometry as a static HTML preview (← → navigate, N notes) |
| `deck_spec.py` | single source of truth: tokens + per-slide geometry + notes |
| `build.py` | renders the spec to `.pptx`, `.html` and a QA `.png` |
| `verify_pptx.py` | independent QA: re-reads the produced `.pptx` XML and re-draws every slide |
| `qa/pptx-sheet.png` | contact sheet rendered **from the actual .pptx**, used for visual QA |

```bash
python3 build.py --pptx --html      # rebuild the deck and the preview
python3 verify_pptx.py              # QA render from the .pptx itself
```

## Design system

Follows the html-ppt skill: a fixed canvas, one shared header/footer grid, tokens
instead of literals, one layout per page, and presenter-only text kept inside
`.notes`.

- **Canvas** 13.333 × 7.5 in · side margin 0.85 in · 11.633 in content width
- **Rhythm** kicker 0.52 · rule 0.90 · headline 1.02 · body 2.34 · footer 7.12
- **Type** Trebuchet MS (display, tight tracking) / Calibri (body)
- **Colour** DMart green `#046D39`, brand cream `#F7E1B5`, near-black ink
  `#0B1F17`, pale mint surfaces, one alarm tone `#B4401E` used *only* for
  today's pain and for `[NEEDED]` gaps
- **Rules held** one headline that states the takeaway, max 3 supporting points,
  one visual or data element per slide, flat cards, no clip-art, no walls of text

## Slide → source map

| # | Slide | Source pages |
|---|---|---|
| 1 | Hook — "The last hour of the shop is the hour DMart loses" | p10 (75%), p11 (1.5–2 hrs), p9 (≈50 responses), p12 ("just want to bill and exit") |
| 2 | Problem — nowhere to sit, worst at the billing line | p8, p13, p14, p10, p12 ("should I just blinkit things?") |
| 3 | Insight — put the seat on the trolley, not in the aisle | p12, p13, p14 |
| 4 | Ideation — 8 → 4 → 2 → 1 + the four solution gates | p5, p6, p8, p18, p22 |
| 5 | Prototype — the brake came out of a failure | p23 (envelope + materials), p26 (counterweight / brake), p27 |
| 6 | Product — fold, lock, stow + trolley schematic | p13, p23, p26 |
| 7 | Key functions — 5 features → 5 DMart benefits | p18, p23, p26 |
| 8 | Design — journey map + 3 interaction moments | p14, p15, p18 |
| 9 | Measurement — KPIs, baseline vs target, cadence | p10 (only baseline we own); DMart numbers are `[NEEDED]` |
| 10 | Ask — one store, four baselines, two owners | p8 (no staff access), p26 (implementation risk) |

## Gaps — everything marked `[NEEDED]` in the deck

1. **DMart baselines and targets** for footfall, basket size, repeat rate and
   campaign ROI (slide 9). Only one baseline exists in the source — our own
   survey: 75% say there is nowhere to sit (n ≈ 50).
2. **Pilot store, unit count, length and dates** (slide 10).
3. **Cost per unit, fitting cost and total investment** (slide 10). The source
   names materials but no prices.
4. **Structured user trial results** — load rating, durability cycle, and any
   task-success or comfort measure (slide 5). Only the mechanism POC exists.
5. **Measured in-store effect sizes** — no footfall, basket or repeat-rate data
   was collected in the source; slide 10's outcome is therefore presented as
   what the pilot would establish, not as a promise.
6. **Store and category mix for the pilot** (e.g. whether the store is a
   high-footfall weekend store) — not in the source.
