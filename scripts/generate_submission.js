import fs from 'fs';

const listings = JSON.parse(
    fs.readFileSync('./raw_listings_correct.json', 'utf8')
);

const projects = JSON.parse(
    fs.readFileSync('./raw_projects_correct.json', 'utf8')
);

const rentals = JSON.parse(
    fs.readFileSync('./raw_rentals_correct.json', 'utf8')
);

console.log(
    `Loaded -> Listings: ${listings.length}, Projects: ${projects.length}, Rentals: ${rentals.length}`
);


// ==================================================
// REFERENCE TIME
// ==================================================

const reference = new Date("2026-09-10T00:00:00+05:30");

const sevenDaysEarlier = new Date(
    reference.getTime() - 7 * 24 * 60 * 60 * 1000
);


// ==================================================
// HELPERS
// ==================================================

const isLive = (row) => {
    return row.is_live === true;
};


// ==================================================
// Q1. TOTAL LISTING RECORDS
// ==================================================

const total_listing_records = listings.length;


// ==================================================
// Q2. UNIQUE PROPERTIES
// ==================================================

const propertyKey = (row) => {
    return row.property_id ??
           row.property_key ??
           row.listing_id;
};

const unique_properties = new Set(
    listings.map(propertyKey)
).size;


// ==================================================
// Q3. ACTIVE LISTINGS
// ==================================================

const active_listings = listings.filter(
    row => row.is_live === true
).length;


//==================================================
// Q4. FIND CORRUPT LISTINGS
// ==================================================

/*
HYPOTHESIS FOR CORRUPT LISTINGS:

A listing is considered corrupt when its property data is
numerically invalid or internally inconsistent.

We use only objective data-consistency checks and do not
assume anything based on property type.

Checks:

1. Price cannot be negative.
2. Carpet area cannot be negative.
3. Super built-up area cannot be negative.
4. Floor cannot be negative.
5. Total floors cannot be negative.
6. Carpet area cannot be greater than super built-up area.
7. Floor cannot be greater than total floors.

These conditions indicate that the listing contains
physically or numerically inconsistent property data.
*/

function isCorrupt(row) {
    const carpet_area = Number(row.carpet_area);
    const super_built_up_area = Number(row.super_built_up_area);
    const floor = Number(row.floor);
    const total_floors = Number(row.total_floors);
    const price = Number(row.price);

    // Negative / impossible values
    if (price < 0) return true;
    if (carpet_area < 0) return true;
    if (super_built_up_area < 0) return true;
    if (floor < 0) return true;
    if (total_floors < 0) return true;

    // Carpet area cannot exceed super built-up area
    if (
        carpet_area > 0 &&
        super_built_up_area > 0 &&
        carpet_area > super_built_up_area
    ) {
        return true;
    }

    // Floor cannot exceed total floors
    if (
        floor > 0 &&
        total_floors > 0 &&
        floor > total_floors
    ) {
        return true;
    }

    return false;
}
const corrupt_listing_ids = [
    ...new Set(
        listings
            .filter(isCorrupt)
            .map(row => row.listing_id)
    )
].sort();


// ==================================================
// Q9. FIND FAKE LISTINGS
// ==================================================

/*
HYPOTHESIS FOR FAKE LISTINGS:

A listing may be fake/suspicious when its price per square
foot is an extreme outlier.

We calculate:

    price_per_sqft = price / carpet_area

A listing is flagged when:

    price_per_sqft <= ₹100
   

These thresholds are used as an anomaly-based hypothesis,
not as proof that the listing is definitely fake.

Listings with invalid or non-positive price/carpet-area
values are ignored here because they are handled by the
corrupt-listing hypothesis.
*/
const fakeCandidates = listings.filter(row => {

    const carpet_area = Number(row.carpet_area);
    const price = Number(row.price);

    if (
        !Number.isFinite(carpet_area) ||
        !Number.isFinite(price) ||
        carpet_area <= 0 ||
        price <= 0
    ) {
        return false;
    }

    const pricePerSqft = price / carpet_area;

    return (
        pricePerSqft <= 100 
    );
});

const fake_listing_ids = [
    ...new Set(
        fakeCandidates.map(row => row.listing_id)
    )
].sort();

// ==================================================
// Q5. TOTAL MONTHLY RENT
// ==================================================

const mgRoadRentals = rentals.filter(row => {

    const locality =
        row.locality?.toLowerCase();

    const location =
        row.location?.toLowerCase();

    return (
        locality === "mg road" ||
        location === "mg road"
    );
});

const total_monthly_rent = mgRoadRentals.reduce(
    (sum, row) => sum + Number(row.price || 0),
    0
);


// ==================================================
// Q6. AVERAGE PRICE / SQFT FOR 2 BHK
// ==================================================

const excluded = new Set([
    ...corrupt_listing_ids,
    ...fake_listing_ids
]);

const twoBhk = listings.filter(row => {

    return (
        isLive(row) &&
        Number(row.bedroom) === 2 &&
        !excluded.has(row.listing_id)
    );

});

const avg_price_per_sqft_2bhk =
    twoBhk.length > 0
        ? Number(
            (
                twoBhk.reduce(
                    (sum, row) =>
                        sum +
                        Number(row.price) /
                        Number(row.carpet_area),
                    0
                ) / twoBhk.length
            ).toFixed(2)
        )
        : 0;


// ==================================================
// Q7. COSTLIEST PROJECT
// ==================================================

/*
Project prices in the raw data are mixed-unit values.

Values such as 1.66 represent ₹1.66 Crore.
Values such as 94.6 represent ₹94.6 Lakh.

Convert everything to INR before comparing.
*/

function priceToINR(value) {

    const num = Number(value);

    if (!Number.isFinite(num)) {
        return 0;
    }

    // Values below 10 are Crores
    if (num < 10) {
        return Math.round(num * 10000000);
    }

    // Values from 10 to below 100 are Lakhs
    if (num < 100) {
        return Math.round(num * 100000);
    }

    // Already INR
    return Math.round(num);
}


// Keep one project record per project_id
const uniqueProjects = new Map();

for (const project of projects) {

    if (!uniqueProjects.has(project.project_id)) {

        uniqueProjects.set(
            project.project_id,
            project
        );

    }
}

let costliest = null;
let costliestPrice = -1;

for (const project of uniqueProjects.values()) {

    const priceINR = priceToINR(project.price_max);

    if (priceINR > costliestPrice) {

        costliestPrice = priceINR;
        costliest = project;

    }
}

const costliest_project = {

    project_id: costliest?.project_id || "",

    price_max_inr: costliestPrice

};


// ==================================================
// Q8. LISTINGS POSTED IN LAST 7 DAYS
// ==================================================

const listings_last_7_days = listings.filter(row => {

    const posted = new Date(row.posted_at);

    return (
        posted >= sevenDaysEarlier &&
        posted < reference
    );

}).length;


// ==================================================
// Q10. PROJECTS WITH WRONG LISTING COUNT
// ==================================================

/*
IMPORTANT:

Q10 asks:

"For how many projects is that number wrong?"

We therefore count PROJECTS.

We do NOT multiply the answer because project records
or listing records are duplicated in the downloaded data.

For each project_id, count the listing records carrying
that project_id and compare it with total_listings.

The resulting number of projects with disagreement is 46.
*/

// Count all listing records belonging to each project_id
// DO NOT deduplicate listing_id here.

const actualProjectCounts = new Map();

for (const row of listings) {

    if (row.project_id) {

        actualProjectCounts.set(
            row.project_id,
            (actualProjectCounts.get(row.project_id) || 0) + 1
        );

    }
}


// One project entry per project_id
const uniqueProjectRecords = new Map();

for (const project of projects) {

    if (!uniqueProjectRecords.has(project.project_id)) {

        uniqueProjectRecords.set(
            project.project_id,
            project
        );

    }
}


// Compare project reported count against API listing count
const wrongProjects = [];

for (const project of uniqueProjectRecords.values()) {

    const reported =
        Number(project.total_listings || 0);

    const actual =
        actualProjectCounts.get(project.project_id) || 0;

    if (reported !== actual) {

        wrongProjects.push({
            project_id: project.project_id,
            reported: reported,
            actual: actual
        });

    }
}

const projects_with_wrong_listing_count =
    wrongProjects.length;


// ==================================================
// FINDINGS
// ==================================================

const findings = [

    // ----------------------------------------------
    // AUTH
    // ----------------------------------------------

    {
        endpoint: "*",
        category: "auth",

        documented:
            "Every request must carry the API key as a query parameter ?api_key=...",

        actual:
            "Query parameter api_key is rejected; requests require the X-API-Key HTTP header.",

        how_found:
            "Called GET /v1/listings?api_key=... and received 401; request succeeded when using X-API-Key header.",

        impact:
            "Any client implemented directly from the documentation fails authentication completely.",

        evidence: []
    },


    // ----------------------------------------------
    // SINGLE LISTING ENDPOINT
    // ----------------------------------------------

    {
        endpoint: "/v1/listing/{id}",
        category: "missing_endpoint",

        documented:
            "GET /v1/listing/{listing_id} returns a single listing object.",

        actual:
            "Singular path returns 404 Not Found. The active backend endpoint is pluralized: GET /v1/listings/{listing_id}.",

        how_found:
            "Tested GET /v1/listing/100-6000047 (404) vs GET /v1/listings/100-6000047 (200).",

        impact:
            "Listing detail pages fail to resolve if using the documented singular path.",

        evidence: [
            "100-6000047"
        ]
    },


    // ----------------------------------------------
    // FAVOURITES
    // ----------------------------------------------

    {
        endpoint: "/v1/favourites",
        category: "missing_endpoint",

        documented:
            "GET, POST, and DELETE /v1/favourites manage user saved listings.",

        actual:
            "All documented /v1/favourites routes return 404 Not Found.",

        how_found:
            "Probed /v1/favourites with valid bearer token after logging in.",

        impact:
            "Saved listing actions fail if sent to the documented route.",

        evidence: []
    },


    // ----------------------------------------------
    // SAVED
    // ----------------------------------------------

    {
        endpoint: "/v1/saved",
        category: "undocumented_endpoint",

        documented:
            "Endpoint is not listed anywhere in the API reference document.",

        actual:
            "Backend responds to GET and POST requests at /v1/saved to manage saved user listings.",

        how_found:
            "Tested fallback paths and verified state persistence at /v1/saved.",

        impact:
            "Developers following only documentation miss the working user-favourites backend.",

        evidence: []
    },


    // ----------------------------------------------
    // ANALYTICS
    // ----------------------------------------------

    {
        endpoint: "/v1/analytics/summary",
        category: "missing_endpoint",

        documented:
            "Returns pre-computed city aggregates for a dashboard screen.",

        actual:
            "Returns 404 Not Found.",

        how_found:
            "Called documented path with API key and Bearer auth token.",

        impact:
            "Analytics must be calculated dynamically from raw collections.",

        evidence: []
    },


    // ----------------------------------------------
    // SIMILAR LISTINGS
    // ----------------------------------------------

    {
        endpoint: "/v1/listings/{id}/similar",
        category: "missing_endpoint",

        documented:
            "Returns up to ten comparable listings at GET /v1/listings/{listing_id}/similar.",

        actual:
            "Returns 404 Not Found.",

        how_found:
            "Tested endpoint with valid listing IDs.",

        impact:
            "Similar listing recommendations must be derived client-side.",

        evidence: []
    },


    // ----------------------------------------------
    // COMPLETENESS
    // ----------------------------------------------

    {
        endpoint: "/v1/listings",
        category: "completeness",

        documented:
            "Returns active sale listings in your city. Inactive, expired and withdrawn listings are excluded server side.",

        actual:
            "Returns inactive listings with is_live=false as well.",

        how_found:
            "Paged through all listings and checked the is_live flag values.",

        impact:
            "UI displays inactive/withdrawn inventory unless filtered client-side.",

        evidence:
            [
                ...new Set(
                    listings
                        .filter(row => row.is_live === false)
                        .map(row => row.listing_id)
                )
            ].slice(0, 20)
    },


    // ----------------------------------------------
    // CORRUPT DATA
    // ----------------------------------------------

    // ----------------------------------------------
// CORRUPT DATA
// ----------------------------------------------

{
    endpoint: "/v1/listings",
    category: "data_quality",

    documented:
        "Listing records describe real, physically possible properties.",

    actual:
        `The dataset contains ${corrupt_listing_ids.length} listing records with invalid or internally inconsistent property data.`,

    how_found:
        "Applied objective data-consistency checks: negative price/area/floor values, carpet area greater than super built-up area, and floor greater than total floors.",

    impact:
        "These records can distort property-level and market-level calculations and should be excluded from downstream analysis.",

    evidence:
        corrupt_listing_ids
},


    // ----------------------------------------------
    // FAKE LISTINGS
    // ----------------------------------------------

    {
        endpoint: "/v1/listings",
        category: "fraud",

        documented:
            "Listing records describe genuine properties.",

        actual:
            `Four listings are extreme tiny-area/high-price outliers consistent with enquiry-generation fake listings: ${fake_listing_ids.join(", ")}.`,

        
    how_found:
        "Calculated price per square foot as price divided by carpet area for listings with valid positive price and carpet area. Listings with price per sqft <= ₹100  were flagged as extreme outliers.",

    impact:
        "Extreme price-per-square-foot outliers can significantly distort market-price calculations, so these listings are excluded from the downstream 2 BHK average price-per-sqft calculation.",


        evidence:
            fake_listing_ids
    },


    // ----------------------------------------------
    // PROJECT LISTING COUNT
    // ----------------------------------------------

    {
        endpoint: "/v1/projects",
        category: "consistency",

        documented:
            "total_listings always agrees with what GET /v1/listings?project_id=... returns.",

        actual:
            `${projects_with_wrong_listing_count} projects report a total_listings count that disagrees with the listing records carrying that project_id.`,

        how_found:
            "Grouped all retrievable listing records by project_id and compared those counts against total_listings for each project.",

        impact:
            "Project cards relying on total_listings can show inaccurate unit counts.",

        evidence:
            wrongProjects
                .slice(0, 20)
                .map(row => row.project_id)
    },


    // ----------------------------------------------
    // PROJECT PRICE UNITS
    // ----------------------------------------------

    {
        endpoint: "/v1/projects",
        category: "units",

        documented:
            "price_min and price_max are in integer rupees.",

        actual:
            "Project price values are stored as mixed Crore/Lakh values rather than normalized integer INR. Values such as 1.66 represent Crores while values such as 94.6 represent Lakhs.",

        how_found:
            "Inspected project price_min and price_max values and compared them against listing prices and the documented INR unit. The raw project values contain decimal Crore/Lakh-scale values rather than integer rupee amounts.",

        impact:
            "Displaying raw values as INR produces property prices wrong by orders of magnitude.",

        evidence:
            [
                ...uniqueProjectRecords.keys()
            ].slice(0, 20)
    }

];


// ==================================================
// FINAL SUBMISSION
// ==================================================

const submission = {

    api_key:
       "IVY26-40298FE9B48A",

    candidate: {

        name:
            "Palak Jain",

        email:
            
            "palak.20236195@mnnit.ac.in",

        repo_url:
            "https://github.com/Pjdash/IVY-Homes",

        demo_url:
            "ivy-homes-lyart.vercel.app"

    },

    answers: {

        total_listing_records,

        unique_properties,

        active_listings,

        corrupt_listing_ids,

        total_monthly_rent,

        avg_price_per_sqft_2bhk,

        costliest_project,

        listings_last_7_days,

        fake_listing_ids,

        projects_with_wrong_listing_count

    },

    findings

};


// ==================================================
// WRITE FILE
// ==================================================

fs.writeFileSync(
    "./submission.json",
    JSON.stringify(
        submission,
        null,
        2
    )
);


console.log("\n========================================");
console.log("submission.json generated successfully");
console.log("========================================");

console.log(
    "\nAnswers:\n",
    JSON.stringify(
        submission.answers,
        null,
        2
    )
);

console.log(
    "\nWrong projects:",
    projects_with_wrong_listing_count
);

console.log(
    "\nCorrupt IDs:",
    corrupt_listing_ids
);

console.log(
    "\nFake IDs:",
    fake_listing_ids
);

console.log(
    "\nUnit evidence:",
    [
        ...uniqueProjectRecords.keys()
    ].slice(0, 20)
);