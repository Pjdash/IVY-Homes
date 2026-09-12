# Ivy Homes

A focused property discovery frontend for the Ivy Homes internship assignment. It includes login, paginated listings, filters, URL-addressable listing details, favourites, rentals, projects, and an insights screen.

## Run locally

```bash
npm install
copy .env.example .env
# edit .env and add the API key from your Ivy email
npm run dev
```

The app uses the real API at `https://solve.ivy.homes`. The API key is required by the service. Because this is a browser app, a Vite environment value is visible to the browser; never commit your real `.env` file or reuse this key outside the assignment.

## What is implemented

- `POST /auth/login` with persisted 24-hour session and server-side logout
- listings with locality, bedroom, furnishing and pagination controls
- listing details, seller contact, verification, area and price-per-square-foot display
- per-user favourites using the API
- rentals and projects with rupee and square-foot formatting
- analytics summary with locality and BHK visualizations
- loading, empty and API error states
- responsive mobile layout and keyboard-friendly native form controls

## Investigation

The reference is intentionally unreliable. I treated the API as the source of truth, paged through collections, checked response metadata, tested filters and sorting, compared project counts with listings, and checked dates and numeric fields before trusting them. The reproducible collection and calculation queries are in [ANSWER_QUERIES.md](ANSWER_QUERIES.md).

The final `submission.json` should contain the answers and only findings personally reproduced against your own key. Do not put the API key in README, source files, screenshots, or git history.

## Build

```bash
npm run build
```

## Deployment

Deploy as a Vite static site on Vercel, Netlify, Cloudflare Pages, or Render. Add `VITE_IVY_API_URL` and `VITE_IVY_API_KEY` as build environment variables, then use the generated `dist` directory or the platform's Vite preset.

## AI disclosure

This implementation was created with an LLM and reviewed locally with a production build. API findings and submission answers must be generated and checked by the candidate using their assigned key.
