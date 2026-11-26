# Luminary design system: the cognitive performance studio

Status: proposal, awaiting Sandra's approval (25 November 2026).

Luminary should feel like a premium cognitive performance studio: intelligent, confident,
scientific, modern and encouraging. It is not a wellness app and not a children's brain game.
Premium means knowing what not to illuminate.

## Audit of the current design (before)

- **Colour:** 37 different hard-coded hex colours across 19 files, plus two theme sets. Navy, blue,
  purple, gold and four skill colours all compete for attention on the same screens.
- **Shape:** 10 different corner radii (3 to 22) and two border weights.
- **Type:** 13 font sizes with no scale, all in the system font. Metrics use proportional numerals,
  so scores jump in width as they change.
- **Reusable already:** `Screen`, `Card`, `Button`, `Field`, `ScalePicker`, `Checkbox` (components/ui),
  `Icon` and `GameBadge` (line icons and game tiles), `BrainMap` (a neural network drawn on a
  brain outline, the natural seed for the signature visual), `Metric`, `SharpnessCard`.
- **Light theme:** the default background (#F6F5F2) is too bright for Sandra. The app will become
  dark-first, with a proper light mode designed later (not an inverted dark theme).

## Tokens

| Token | Hex | Use |
| --- | --- | --- |
| Midnight | #0B1020 | App background |
| Deep Navy | #171D38 | Panels and cards |
| Electric Violet | #7561E8 | Primary actions and interaction |
| Soft Lavender | #A995FF | Secondary accents, active navigation |
| Warm Gold | #E8BD72 | Achievements and milestones only |
| Focus Teal | #2DB6A3 | Attention and focus elements |
| Cloud White | #F1F0FA | Primary text |
| Muted Slate | #9298B3 | Secondary text and labels |
| Line | Cloud White at 8% | Fine 1px borders |

Task accents (each game keeps one, used only on that game's icon, bars and glow):

| Task | Skill | Accent |
| --- | --- | --- |
| Speed Match | Processing speed | Electric blue #4F8CFF |
| Memory Grid | Working memory | Violet #9B7BFF |
| Star Tracker | Working memory | Indigo #6672FF |
| Catch the Light | Attention control | Teal #2DB6A3 |
| Colour Clash | Attention control | Coral #FF7D6B |
| Switch It | Flexibility | Amber #F2A65A (kept distinct from achievement gold) |

## Type

- **Display:** Sora, semibold, tight letter spacing. Headings and big numbers.
- **Body:** Inter. Everything else.
- **Metrics:** tabular numerals everywhere a number can change.
- **Scale:** 11 overline (caps, tracked), 12.5 caption, 15 body, 17 section heading,
  24 screen title, 52 hero metric. Nothing else.
- Fonts ship inside the app, so it works offline.

## Shape, depth and motion

- Corners: 12 small controls, 16 rows, 22 panels.
- Spacing on a 4-point grid. Screen gutter 20.
- Depth comes from one fine border and a subtle top-lit gradient, not heavy shadows.
- Motion is subtle and never constant: scores count up, bars fill, the network brightens once on
  open. Reduced motion turns all of it off.

## Components

- **Panel:** Deep Navy gradient, 1px line border, radius 22.
- **Primary button:** Electric Violet, radius 14, 52 high, soft violet glow.
- **Chip:** 26 high. Gold for achievements, teal for focus, outline for filters.
- **Skill icon:** accent at 12% fill with a 1px accent border and accent line icon (replaces the
  bright gradient squares).
- **Game row and game card:** icon, name, skill in its accent, level and a thin progress bar.
- **Tab bar:** five destinations, a glowing lavender indicator above the active tab.
- **Skill network:** one region per task (twelve) of connected points, brightness from measured
  performance. Always captioned as a map of results in Luminary, not brain activity.

## Rollout order

1. Tokens, fonts and core components, then the Today screen.
2. Train, then Progress with the skill network.
3. Results, Focus, Learn.
4. Accessibility settings: reduced motion, larger text, high contrast, lower stimulation.

No games, data, scoring logic or progress history are removed at any step.
