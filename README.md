# Samsara Gacha 🎴🌏

**Play it live:** https://gino2013.github.io/Samsara-Gacha/

A single-page, browser-based gacha game about reincarnation. Pull the wheel of samsara and find out which country you'd be reborn in — presented as a loot-box rarity system (UR / SSR / R / N) over a real, spinning 3D globe.

This is a promotional / awareness mini-game: each country is tagged with a tier derived from a composite of publicly reported happiness index, GDP per capita, and cost-of-living index, so a single pull becomes a small, shareable snapshot of global quality-of-life disparity.

## How it works

- **Single pull** or **10x pull** — classic gacha mechanics, with a pity system: if you haven't hit SSR or higher within 10 pulls, the 10th pull is guaranteed SSR/UR.
- **Rarity tiers** — UR (1%), SSR (6%), R (25%), N (68%), each mapped to a pool of real countries.
- **Interactive globe** — click any pull result (or history chip) to rotate and zoom a canvas-rendered 3D globe to that country's coordinates, with a pin and a stat card explaining the score.
- **Pull history & stats** — running totals per rarity and a scrollable history of recent pulls.

## Tech

Pure vanilla HTML/CSS/JS in a single `index.html`. No build step, no dependencies, no backend — the globe projection, particle effects, and gacha logic are all hand-rolled with `<canvas>` and CSS animations.

## Run it locally

```bash
open index.html
```

or serve it with any static file server, e.g.:

```bash
python3 -m http.server
```

## Disclaimer

This is entertainment and a probability simulation. Country tiers are derived from a simple composite of commonly reported public indicators and do not represent a judgment of any country, culture, or its people. All beings are equal — wherever you land, live well.
