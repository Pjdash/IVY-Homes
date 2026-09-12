import fs from "fs";

const BASE = process.env.IVY_API_URL || "https://solve.ivy.homes";
const KEY = process.env.IVY_API_KEY || "IVY26-40298FE9B48A";
const TOKEN = process.env.IVY_TOKEN || "eyJleHAiOjE3ODkyMjkyNDEsImlhdCI6MTc4OTIyODM0MSwia2V5IjoiSVZZMjYtNDAyOThGRTlCNDhBIiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.OJ7Wvfq1XHOzEHKiZQCtPAnTnklLzAA5JYdjiYvy3AI";
const TARGET_LOCALITY = "mg road"; // Assigned locality hardcoded to prevent unfiltered city dumps

// Custom fetch helper using proper X-API-Key and Bearer headers
async function get(path, params = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  });

  const headers = {
    Accept: "application/json",
    "X-API-Key": KEY,
  };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  const response = await fetch(url, { headers });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// Collect paginated rows safely checking returned page_size
async function collect(path, params = {}) {
  const first = await get(path, { ...params, page: 1, limit: 200 });
  const rows = [...(first.results || first.items || (Array.isArray(first) ? first : []))];
  
  const pageSize = first.page_size || first.limit || first.count || 50;
  const total = first.total || rows.length;
  const pages = Math.ceil(total / pageSize);

  console.log(`[${path}] Page 1 loaded (${rows.length}/${total}). Total Pages: ${pages}`);

  for (let page = 2; page <= pages; page++) {
    const result = await get(path, { ...params, page, limit: pageSize });
    const items = result.results || result.items || (Array.isArray(result) ? result : []);
    if (!items.length) break;
    rows.push(...items);
  }
  return rows;
}

async function run() {
  console.log("=== 1. COLLECTING EVERY PAGE ===");
  const listings = await collect("/v1/listings");
  const rentals = await collect("/v1/rentals");
  const projects = await collect("/v1/projects");

  // Save raw dumps for local reference
  fs.writeFileSync("raw_listings.json", JSON.stringify(listings, null, 2));
  fs.writeFileSync("raw_rentals.json", JSON.stringify(rentals, null, 2));
  fs.writeFileSync("raw_projects.json", JSON.stringify(projects, null, 2));
  console.log("\nRaw JSON dumps saved: raw_listings.json, raw_rentals.json, raw_projects.json");

  console.log("\n=== 2. RUNNING 10 ANSWER CALCULATIONS ===");
  const reference = new Date("2026-09-10T00:00:00+05:30");
  const sevenDaysEarlier = new Date(reference.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. total_listing_records
  const total_listing_records = listings.length;

  // 2. unique_properties (composite physical key)
  const propertyKey = (row) => 
    `${row.apartment_name}_${row.locality}_${row.bedroom}_${row.floor}_${row.carpet_area}`;
  const unique_properties = new Set(listings.map(propertyKey)).size;

  // 3. active_listings
  const isLive = (row) => row.is_live === true || row.status === "active";
  const active_listings = listings.filter(isLive).length;

  // 4. corrupt_listing_ids
  const corrupt_candidates = listings
    .filter(
      (row) =>
        row.price <= 0 ||
        row.carpet_area <= 0 ||
        (row.super_built_up_area > 0 && row.carpet_area > row.super_built_up_area) ||
        (row.total_floors && row.floor > row.total_floors)
    )
    .map((row) => row.listing_id || row.id)
    .sort();

  // 9. fake_listing_ids
  const fake_listing_ids = listings
    .filter((row) => {
      const contact = String(row.posted_by_contact || row.seller_phone || "");
      const desc = String(row.description || "").toLowerCase();
      return (
        row.is_fake === true ||
        row.is_verified === false ||
        contact.includes("000000") ||
        contact.includes("123456") ||
        desc.includes("test listing")
      );
    })
    .map((row) => row.listing_id || row.id)
    .filter(Boolean)
    .sort();

  // 5. total_monthly_rent (Targeted filter for MG Road)
  const total_monthly_rent = rentals
    .filter((row) => String(row.locality || "").trim().toLowerCase() === TARGET_LOCALITY)
    .reduce((sum, row) => sum + Number(row.price || row.rent || 0), 0);

  // 6. avg_price_per_sqft_2bhk (Excludes BOTH corrupt AND fake)
  const excluded = new Set([...corrupt_candidates, ...fake_listing_ids]);
  const twoBhk = listings.filter(
    (row) =>
      isLive(row) &&
      (row.bedroom === 2 || row.bhk === 2) &&
      !excluded.has(row.listing_id || row.id) &&
      row.carpet_area > 0
  );
  
  const avg_price_per_sqft_2bhk = twoBhk.length
    ? Number(
        (
          twoBhk.reduce((sum, row) => sum + row.price / row.carpet_area, 0) /
          twoBhk.length
        ).toFixed(2)
      )
    : 0;

  // 7. costliest_project
  const costliest = projects.reduce(
    (best, row) =>
      Number(row.price_max || row.price_max_inr || 0) >
      Number(best?.price_max || best?.price_max_inr || -1)
        ? row
        : best,
    null
  );
  
  const costliest_project = {
    project_id: costliest?.project_id || costliest?.id || "",
    price_max_inr: Number(costliest?.price_max || costliest?.price_max_inr || 0),
  };

  // 8. listings_last_7_days
  const listings_last_7_days = listings.filter((row) => {
    const posted = new Date(row.posted_at || row.created_at || row.created_date || 0);
    return posted >= sevenDaysEarlier && posted < reference;
  }).length;

  // 10. projects_with_wrong_listing_count
  const projects_with_wrong_listing_count = projects.filter((project) => {
    const pId = project.project_id || project.id;
    const actual = listings.filter((row) => row.project_id === pId).length;
    const reportedCount = project.total_listings ?? project.listing_count;
    return actual !== reportedCount;
  }).length;

  const results = {
    total_listing_records,
    unique_properties,
    active_listings,
    corrupt_listing_ids: corrupt_candidates,
    total_monthly_rent,
    avg_price_per_sqft_2bhk,
    costliest_project,
    listings_last_7_days,
    fake_listing_ids,
    projects_with_wrong_listing_count,
  };

  console.log("\n=== FINAL GENERATED SUBMISSION ANSWERS ===");
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync("calculated_answers.json", JSON.stringify(results, null, 2));
  console.log("\nSaved generated answers to calculated_answers.json");
}

run();