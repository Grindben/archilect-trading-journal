# Archilect — Trading Day Checklist

Static, dependency-free web app: no build step, no bundler, no framework.
Three real HTML pages, served as-is from any static host (or opened directly
as local files).

## Pages

```
index.html              Dashboard — session summary, accounts, P&L, objective,
                         quick access to the other two pages
trading-checklist.html  The 5-step checklist: Conditions, Bias, Setup,
                         Journal (quick-log), Trade Review
trading-journal.html    The full Trading Journal — stats, equity curve,
                         trade table, CSV import/export
```

Each page has its own `<head>`/header/scripts and is independently
navigable — the header's brand mark and nav links are plain `<a href>`s
between the three files, not JS view-switching.

## Structure

```
css/
  tokens.css          Design tokens (colours, fonts) — light theme default, dark theme override
  layout.css          Header, status strip, stepper, page layout, summary cards
  components.css      Checklist items, toggles, form fields, custom dropdown, tables, modals
  journal-widget.css   The quick-log "Journal" step inside the checklist
  home.css            Shared header/nav link styles + the Dashboard's hero/snapshot/page-cards
  journal-page.css    The full Trading Journal page (stats, chart, form, table)
  navigation.css       Bottom-of-panel navigation, footer, responsive breakpoints
  dashboard.css        Dashboard-only: accounts grid, objective progress bar (index.html only)
js/
  utils.js                    Tiny generic helpers (el, fmtPct, clamp, median3) — checklist only
  market-conditions.js        Builds the Conditions checklist + scores it — checklist only
  bias-pools.js                Builds the Bias liquidity-pool rows — checklist only
  bias.js                      Bias computation (Session Sweep / Monday / OF+Liquidity) — checklist only
  setup.js                     Setup computation (2 Stages, Reverse, Catch Up) — checklist only
  render.js                    The main recomputeAll() orchestrator + status lights — checklist only
  checklist-state.js           Persists checklist inputs + computed snapshot to localStorage,
                                so the Dashboard can read them and the checklist page survives
                                navigation/reload — checklist only
  router.js                    In-page panel switching for the checklist's 5 steps — checklist only
  reset.js                     The "Reset" button handler — checklist only
  trading-journal-engine.js    Trade math, stats, equity chart, the full table, refreshJournalUI() —
                                shared by all three pages
  trading-journal-quicklog.js  The in-checklist quick-log widget (log/edit/delete entries) — checklist only
  trading-journal-review.js    Trade Review step + the "want to review now?" prompt — checklist only
  trading-journal-form.js      The full trade-entry form — Trading Journal page only
  trading-journal-csv.js       CSV export / import — shared (export button exists on both
                                the checklist and the Trading Journal page; guarded so it's
                                safe to load on either)
  dashboard.js                 Session snapshot, accounts, P&L, objective — Dashboard only
  init.js                      Boots the checklist page
  journal-init.js              Boots the Trading Journal page
  theme-preboot.js            Tiny inline-equivalent script in <head> — resolves
                               dark/light before first paint (must stay first, unminified,
                               included on every page)
components/
  segmented-toggle.js  The Yes/No toggle used throughout the checklist
  chip-set.js           Generic multi-select tag/chip widget
  collapsible.js        Animated show/hide wrapper for conditional checklist sections — checklist only
  custom-dropdown.js    Styled replacement for native <select> menus — all pages
  theme-toggle.js       Dark/light mode switch + persistence — all pages
data/
  reference-data.js    Static reference tables (scoring criteria, grading tables,
                       liquidity pool lists, key levels) — checklist only
assets/
  (reserved for local images/icons if the project ever needs them)
```

## Important: script load order matters

This is plain, non-module JavaScript — every script on a given page shares
one global scope. Each page loads only the `<script>` tags it actually needs,
**in a specific order** — some files depend on functions or data defined by
earlier ones (e.g. `render.js` must load before `checklist-state.js` calls
`recomputeAll()` at page-load time). If you reorder the `<script src="...">`
tags in any of the three HTML files, re-test thoroughly — several files call
shared functions immediately when they load, not just from inside click
handlers. Functions called across pages that may not always be present (e.g.
`refreshTradeReviewState`, `renderQuickList`) are guarded with
`typeof X === "function"` checks rather than assumed to exist.

## Data persistence

All data — trades, checklist inputs, the computed session snapshot, and the
P&L objective — is stored in the browser's `localStorage`, scoped to
whichever domain/file the app is opened from. There is no backend and no
build step — this is intentional, so the app keeps working identically
whether opened as local files or hosted on a static site. Because
`localStorage` is shared across same-origin pages, this is also how the
Dashboard reads the checklist's latest state and how the Trading Journal page
picks up the checklist's current bias for a new manual trade entry — neither
page runs the checklist's own computation itself.
