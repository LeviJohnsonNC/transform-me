# Art slots

Drop generated art here at these exact paths. Every slot is optional — each
screen is designed to read without its image, so a missing file degrades to the
CSS-only treatment rather than breaking.

| Path | Used by | Aspect | Notes |
| --- | --- | --- | --- |
| `auth-hero.webp` | `src/pages/Auth.tsx` | 3:4 portrait | Sits behind the sign-in panel at 40% opacity under a scrim. Must read at low contrast — keep the centre quiet. |
| `levelup-<n>.webp` | level-up sheet (not wired yet) | 3:4 portrait | Full-bleed behind the unlock panel. Can be maximal; it is seen rarely. |
| `exercise/<slug>.webp` | Records banners (not wired yet) | 16:9 landscape | Cropped to a 128px strip. Keep the subject left-of-centre; the right side sits under a gradient. |
| `empty-history.webp` | History empty state (not wired yet) | 16:9 landscape | Quiet, wide, low contrast. |

## Rules that make art work behind UI

- **Export `.webp` at ~80 quality.** The existing PNGs in `public/lovable-uploads`
  run 250 KB–1 MB each; the same images as WebP land nearer 60–120 KB.
- **Keep the centre of any hero quiet.** Text sits over it. Detail belongs at
  the edges.
- **Crop the bottom-right corner off anything Gemini generated** — that is where
  its watermark sits.
- **Check any burned-in text.** Generated signage and numerals are frequently
  garbled; if a ruler or sign is legible in the render, read it before shipping.
- **Nothing above 1600px on the long edge.** These are phone backgrounds.

## Palette to match

Magenta `#FF2E97`, cyan `#2BE8FF`, violet `#A855F7`, on near-black violet
`#0B0619`. The art should sit in that range so it blends with the UI rather
than fighting it.
