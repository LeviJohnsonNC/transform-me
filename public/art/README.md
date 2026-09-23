# Art slots

Drop generated art here at these exact paths. Every slot is optional — each
screen is designed to read without its image, so a missing file degrades to the
CSS-only treatment rather than breaking.

| Path | Used by | Aspect | Notes |
| --- | --- | --- | --- |
| `auth-hero.webp` | `src/pages/Auth.tsx` | 3:4 portrait | Full bleed, anchored `center bottom`. The piece is composed with the skyline along its bottom edge and open sky above; the form sits in that sky. Keep the upper two thirds quiet. |
| `levelup-<n>.webp` | level-up sheet in `src/pages/Today.tsx` | 3:4 portrait | Full bleed behind the unlock panel, `center 30%`. Can be maximal; it is seen rarely. Three pieces cycle across the ten levels. |
| `exercise/<slug>.webp` | Records banners, via `src/lib/exerciseArt.ts` | **16:9 landscape** | Shown whole in a 16:9 box — nothing is cropped. Also used as a 64×36 thumbnail on backoff cards. |
| `empty-history.webp` | History empty state in `src/pages/History.tsx` | 16:9 landscape | Quiet, wide, low contrast. |

The `exercise/` slugs are not free-form: `src/lib/exerciseArt.ts` owns the
mapping from an exercise name to a slug, and its tests fail if a file here has
no rule pointing at it, or a rule points at a file that is not here. Add the
rule and the file together.

**Exercise art must be 16:9.** The banner is a 16:9 box, so a 16:9 image is
shown whole and needs no focal point. The first set was 3:4 portrait, which
meant cropping to a strip and hand-tuning a Y offset per exercise so the crop
landed on the lift rather than a torso; all of that is gone. A portrait image
added later would silently crop instead, so `exerciseArt.test.ts` reads the
dimensions of every shipped file and fails if one is not 16:9.

The banner scrim is deliberately kept off the middle of the frame: it stays
clear until the last third, where the label needs a backing, rather than
washing the whole image down.

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
