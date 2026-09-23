# Art slots

Drop generated art here at these exact paths. Every slot is optional — each
screen is designed to read without its image, so a missing file degrades to the
CSS-only treatment rather than breaking.

| Path | Used by | Aspect | Notes |
| --- | --- | --- | --- |
| `auth-hero.webp` | `src/pages/Auth.tsx` | 3:4 portrait | Full bleed, anchored `center bottom`. The piece is composed with the skyline along its bottom edge and open sky above; the form sits in that sky. Keep the upper two thirds quiet. |
| `levelup-<n>.webp` | level-up sheet in `src/pages/Today.tsx` | 3:4 portrait | Full bleed behind the unlock panel, `center 30%`. Can be maximal; it is seen rarely. Three pieces cycle across the ten levels. |
| `exercise/<slug>.webp` | Records banners, via `src/lib/exerciseArt.ts` | 3:4 portrait | Cropped to a 210px strip — about 44% of the frame — at a focal point stored per slug in `FOCUS_BY_SLUG`. Also used as a 42×56 thumbnail on backoff cards. |
| `empty-history.webp` | History empty state in `src/pages/History.tsx` | 16:9 landscape | Quiet, wide, low contrast. |

The `exercise/` slugs are not free-form: `src/lib/exerciseArt.ts` owns the
mapping from an exercise name to a slug, and its tests fail if a file here has
no rule pointing at it, or a rule points at a file that is not here. Add the
rule and the file together.

Because the art is portrait and the banner is a wide strip, **where** each one
is cropped matters more than the ratio. `FOCUS_BY_SLUG` in `exerciseArt.ts`
holds a Y percentage per exercise, picked by eye against the real render: an
overhead press sits near the top of its frame, a bench press near the bottom,
and one global value cannot serve both. A new image needs a new entry — the
tests fail if a slug has none.

The banner scrim is deliberately kept off the middle of the frame. A
full-height wash looks fine on its own but crushes the lower half of the band,
which is where the bar and plates land on every hinging lift.

**Known gap:** there is no art for a plain barbell bench press, though
`strengthStandards.ts` rates one. That card falls back to the icon treatment.

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
