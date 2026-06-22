# World Cup 2026 calendar

A subscribable iCal feed of all FIFA World Cup 2026 matches, rendered in US
Eastern time, kept current (scores after matches finish, knockout teams as
groups resolve) by an hourly GitHub Action.

**Subscribe:** `webcal://marklemerise.com/worldcup2026/calendar.ics`

## How it works

- `build-calendar.mjs` fetches fixtures from the [football-data.org](https://www.football-data.org)
  API (competition `WC`) and writes `calendar.ics` (RFC 5545) plus
  `data/sequences.json` (tracks per-event `SEQUENCE` so clients update events
  in place instead of duplicating).
- `lib/` holds the static maps: team → flag emoji, API stage → label, and
  venues. The free API tier returns no venue, so `lib/venues-by-id.js` maps
  each match ID to "City, State, Country" (sourced from the official schedule
  via the public-domain [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)
  dataset); `lib/venues.js` is a stadium-name fallback if the API ever
  populates `venue`.
- `.github/workflows/update-worldcup.yml` runs the script hourly and commits
  the regenerated feed straight to the default branch (where GitHub Pages
  serves from). No per-run involvement needed.

Zero dependencies — Node 20+ with native `fetch`.

## One-time setup

1. Get a free API token at football-data.org and add it as a repository secret
   named **`FOOTBALL_DATA_TOKEN`** (Settings → Secrets and variables → Actions).
2. Merge this to the default branch. The hourly job then generates and
   publishes `calendar.ics` on its own; trigger the first build immediately via
   Actions → "Update World Cup 2026 calendar" → Run workflow.

## Run locally

```sh
FOOTBALL_DATA_TOKEN=your-token node worldcup2026/build-calendar.mjs
```
