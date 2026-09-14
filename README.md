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

* `POST /auth/login` with persisted 24-hour session and server-side logout
* Listings with locality, bedroom, furnishing, filters, and pagination
* Listing details with seller contact, verification, area, and price-per-square-foot display
* Per-user favourites using the API
* Rentals and projects with rupee and square-foot formatting
* Analytics summary with locality and BHK visualizations
* Loading, empty, and API error states
* Responsive mobile layout and keyboard-friendly native form controls

## Investigation & Hypotheses

I followed a hypothesis-driven approach to investigate potentially unreliable API data.

* **Corrupt listings:** Checked logical inconsistencies such as `carpet_area > super_built_up_area`, `floor > total_floors`, and negative numerical values.
* **Fake listings:** Used `price_per_sqft = price / carpet_area` to identify extreme pricing outliers and verified suspicious records.
* **Endpoint discrepancies:** Compared documented API behaviour with actual responses, including pagination, filters, sorting, response metadata, and project listing counts.

Only findings reproducible from the API were included in the final submission.

## AI Tools Used

The following AI tools were used during development and investigation:

* **ChatGPT** — coding, debugging, API analysis, and documentation
* **Gemini Flash** — coding and debugging assistance
* **Antigravity** — development and implementation assistance

All final implementation and API findings were reviewed and verified against the Ivy Homes API using my assigned key.

## Build

```bash
npm run build
```

## Deployment

Deploy as a Vite static site on Vercel, Netlify, Cloudflare Pages, or Render.

Add `VITE_IVY_API_URL` and `VITE_IVY_API_KEY` as build environment variables, then use the generated `dist` directory or the platform's Vite preset.

## Submission

The final `submission.json` contains the assignment answers and only the API findings reproduced using my assigned key.

The reproducible data collection and calculation logic is available in [`scripts/generate_submission.js`](scripts/generate_submission.js).

The API key is not included in the README, source files, screenshots, or git history.
