# Aurum — Macro Tracker v5

A premium, mobile-first nutrition and macro tracking web app. No backend, no installs — runs entirely in the browser with `localStorage`.

## Features

- **Calorie ring** with animated progress and over-goal warning
- **Macro tracking** — Protein, Carbs, Fat with progress bars
- **Meal split** — Budget per meal (Breakfast 25% · Lunch 35% · Dinner 30% · Snacks 10%)
- **Day score** (0–100) based on how close you hit your goals
- **Streak tracker** with 7-day dot indicators and sparkline chart
- **Water intake** with quick-add buttons (+1 glass, +250ml, +500ml, +1L)
- **Exercise logging** with preset activities and auto calorie calculation
- **BMR / TDEE calculator** (Mifflin-St Jeor formula with activity multiplier)
- **Weight log** with trend chart (last 20 entries)
- **My Foods library** — save foods, auto-scale by weight (per 100g), autocomplete
- **Recent foods** — last 20 logged items for quick re-logging
- **Repeat yesterday** — copy all meals from the previous day in one tap
- **Optional nutrients** — toggle Sugar, Fiber, Sodium tracking on/off
- **Progress screen** — line chart (7D/30D), donut macro ratio, radial gauges, 4-week consistency calendar
- **Swipe to delete** meal items on mobile

## Screens

| Screen | Description |
|--------|-------------|
| Home | Today's summary — ring, macros, meals, streak |
| Progress | Charts, gauges, weight trend, weekly stats |
| My Foods | Searchable, filterable saved food library |
| Goals | Daily targets, BMR/TDEE calculator, preferences |

## File Structure

```
aurum-part1-css-home.css    # Design tokens, home screen, nav, animations
aurum-part2-css-screens.css # Progress, Foods, Settings screens + modals
aurum-part3-html.html       # All HTML markup (paste inside <body><div id="app">)
aurum-part4-js-core.js      # State, storage, boot, navigation, home render
aurum-part5-js-features.js  # Add food, autocomplete, charts, BMR, settings
```

## Usage

Paste `aurum-part3-html.html` inside `<body><div id="app">...</div></body>`, load both CSS files in `<head>`, and load both JS files before `</body>`. Requires the two Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## Design

Dark luxury aesthetic — gold accent (`#C8A84B`), max-width 430px, `Cormorant Garamond` for display numbers, `Outfit` for UI text. All data persists in `localStorage` keyed by date.
