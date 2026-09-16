# demo-images

Placeholder artwork for the `image-*` layouts in `templates/single-page/`.

They are hand-written SVG (1–2 KB each, no external references), so the
layout files render correctly **offline** and stay copy-paste-able. When you
build a real deck, drop your own `.jpg` / `.png` / `.svg` next to the deck's
`index.html` and swap the `src` — nothing else changes, because the framing is
done by `.img-frame` in `assets/base.css`, not by the image itself.

Aspect ratios are deliberately mixed (16:10, 3:4, 1:1, 21:9) so the layouts
demonstrate that `object-fit: cover` handles whatever you throw at it.
