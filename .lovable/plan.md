

# Critique

The current layout is `[icon] [text] [check]` in a single horizontal row. On a ~170px-wide card (half of 390px minus padding/gap), the text column gets roughly 70px — barely enough for one short word. Long names like "Strength training" or "Under calori..." get truncated or squished between the two 38px/28px fixed elements.

Your suggestion to move text below the icon row is the right call. A **stacked layout** — icon and check on top, label below — gives the full card width for text, eliminating truncation entirely.

---

# Plan: Stacked Habit Card Layout

## Change

Switch from horizontal `[icon] [text] [check]` to a vertical stack:

```text
┌─────────────────┐
│ [icon]   [check] │  ← top row, space-between
│                   │
│ Strength          │  ← label uses full width
│ training          │    line-clamp-2, no truncation
└─────────────────┘
```

## Details

**`src/components/HabitCard.tsx`** — one file, layout-only change:

- Change the inner flex from `flex items-center gap-3` (horizontal) to a vertical column layout
- Top row: icon chip (left) and check circle (right) in a `flex justify-between items-center` row
- Bottom: habit name spanning full width, `line-clamp-2`, `text-sm font-semibold`
- Keep same min-height (88px), same padding, same visual states — only the arrangement changes
- Text gets ~140px of width instead of ~70px, so most habit names fit on one line; longer ones wrap cleanly to two

No other files change. All styling, animations, and completion states remain identical.

