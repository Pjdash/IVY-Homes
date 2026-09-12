# Answer Queries

Use these queries with your own API key. They are intentionally written as a Node.js workflow rather than guessed final values: the assignment data is city-scoped and the reference documentation may be wrong.

## 1. Collect every page

Create `analysis.mjs`, set `API_KEY` and `ASSIGNED_LOCALITY`, then run `node analysis.mjs`.

```js
const BASE = process.env.IVY_API_URL || "https://solve.ivy.homes";
const KEY = process.env.IVY_API_KEY;
const LOCALITY = process.env.IVY_ASSIGNED_LOCALITY;

async function get(path, params = {}) {
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  });
  const response = await fetch(url, {
    headers: process.env.IVY_TOKEN ? { Authorization: `Bearer ${process.env.IVY_TOKEN}` } : {}
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function collect(path, params = {}) {
  const first = await get(path, { ...params, page: 1, limit: 200 });
  const rows = [...(first.results || [])];
  const pages = Math.ceil((first.total || rows.length) / (first.page_size || 200));
  for (let page = 2; page <= pages; page++) {
    const result = await get(path, { ...params, page, limit: 200 });
    rows.push(...(result.results || []));
  }
  return rows;
}

const listings = await collect("/v1/listings");
const rentals = await collect("/v1/rentals", { locality: LOCALITY });
const projects = await collect("/v1/projects");
console.log({ listings: listings.length, rentals: rentals.length, projects: projects.length });
```

Do not assume `limit=200` is accepted without checking the returned `page_size`. If the server clamps it, use that returned size. Keep the raw JSON response as evidence.

## 2. Inspect the schema before calculating

```js
console.log("listing keys", Object.keys(listings[0] || {}));
console.log("rental keys", Object.keys(rentals[0] || {}));
console.log("project keys", Object.keys(projects[0] || {}));
console.table(listings.slice(0, 5));
```

Look for the actual fields that replace documented fields such as `is_live`, property identity, units, and timestamps. Use the observed field names in the calculations below, not assumptions from the reference.

## 3. Ten answer calculations

```js
const reference = new Date("2026-09-10T00:00:00+05:30");
const sevenDaysEarlier = new Date(reference.getTime() - 7 * 24 * 60 * 60 * 1000);

// 1. total_listing_records
const total_listing_records = listings.length;

// 2. unique_properties: replace propertyKey with the identity field you
// established from repeated records, not automatically listing_id.
const propertyKey = (row) => row.property_id ?? row.property_key ?? row.listing_id;
const unique_properties = new Set(listings.map(propertyKey)).size;

// 3. active_listings: use the observed live-status field and inspect its type.
const isLive = (row) => row.is_live === true || row.status === "active";
const active_listings = listings.filter(isLive).length;

// 4. corrupt_listing_ids: derive from reproducible impossible values.
// Example checks to investigate, not automatic truth:
const corrupt_candidates = listings.filter((row) =>
  row.price < 0 || row.carpet_area <= 0 || row.bedroom < 0 ||
  (row.total_floors && row.floor > row.total_floors)
).map((row) => row.listing_id).sort();

// 5. total_monthly_rent
const total_monthly_rent = rentals.reduce((sum, row) => sum + Number(row.price || 0), 0);

// 6. avg_price_per_sqft_2bhk
const excluded = new Set([...corrupt_candidates /* replace with verified list */]);
const twoBhk = listings.filter((row) => isLive(row) && row.bedroom === 2 && !excluded.has(row.listing_id));
const avg_price_per_sqft_2bhk = twoBhk.reduce((sum, row) => sum + row.price / row.carpet_area, 0) / twoBhk.length;

// 7. costliest_project
const costliest = projects.reduce((best, row) => Number(row.price_max) > Number(best?.price_max || -1) ? row : best, null);
const costliest_project = { project_id: costliest?.project_id, price_max_inr: costliest?.price_max };

// 8. listings_last_7_days
const listings_last_7_days = listings.filter((row) => {
  const posted = new Date(row.posted_at);
  return posted >= sevenDaysEarlier && posted < reference;
}).length;

// 9. fake_listing_ids: use evidence such as repeated seller contacts,
// impossible inventory, or a reproduced fraud signal. Do not guess this list.
const fake_listing_ids = [];

// 10. projects_with_wrong_listing_count
const projects_with_wrong_listing_count = projects.filter((project) => {
  const actual = listings.filter((row) => row.project_id === project.project_id).length;
  return actual !== project.total_listings;
}).length;

console.log({ total_listing_records, unique_properties, active_listings,
  corrupt_candidates, total_monthly_rent, avg_price_per_sqft_2bhk,
  costliest_project, listings_last_7_days, fake_listing_ids,
  projects_with_wrong_listing_count });
```

## 4. Required checks before submission

- Check whether the API returns `is_live` or another status field and document the exact rule used for `active_listings`.
- Group by every plausible property identity field and inspect groups with more than one record for `unique_properties`.
- Reproduce each corrupt or fake record manually and list only IDs supported by evidence.
- Verify whether `price`, `carpet_area`, `deposit`, and project area fields match their documented units.
- Test every documented filter and sort with a small result page and compare the returned values.
- Compare every project's reported `total_listings` against independently collected listing rows.
- Convert all timestamps to IST before applying the fixed reference window.
- Save raw responses and cite up to twenty identifiers in each record-level `findings` item.
