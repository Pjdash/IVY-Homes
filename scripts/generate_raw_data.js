import fs from "fs";

const API_KEY =
    process.env.VITE_IVY_API_KEY

const TOKEN =
    process.env.IVY_TOKEN 

const BASE_URL = process.env.VITE_IVY_API_URL;



async function fetchAll(endpoint) {

    const allRecords = [];
    let offset = 0;
    const limit = 20;

    while (true) {

        const url =
            `${BASE_URL}${endpoint}?limit=${limit}&offset=${offset}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-API-Key": API_KEY,
                "Authorization": `Bearer ${TOKEN}`,
                "Accept": "application/json"
            }
        });

        const text = await response.text();

        if (!response.ok) {
            console.log("\nERROR");
            console.log("Endpoint:", endpoint);
            console.log("Status:", response.status);
            console.log("Response:", text);

            throw new Error(
                `Request failed: ${response.status} ${response.statusText}`
            );
        }

        const data = JSON.parse(text);

        // API returns records under results
        const rows =
            Array.isArray(data.results)
                ? data.results
                : Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data.listings)
                        ? data.listings
                        : Array.isArray(data.projects)
                            ? data.projects
                            : Array.isArray(data.rentals)
                                ? data.rentals
                                : [];

        console.log(
            `${endpoint} | ` +
            `offset=${offset}, ` +
            `returned=${rows.length}, ` +
            `total=${data.total}, ` +
            `has_more=${data.has_more}`
        );

        allRecords.push(...rows);

        // Nothing returned
        if (rows.length === 0) {
            console.log("No rows returned. Stopping.");
            break;
        }

        // API says there are no more records
        if (data.has_more === false) {
            break;
        }

        // Reached reported total
        if (
            data.total !== undefined &&
            allRecords.length >= Number(data.total)
        ) {
            break;
        }

        // IMPORTANT:
        // Advance by actual number returned
        offset += rows.length;
    }

    return allRecords;
}


// ===============================
// MAIN
// ===============================

async function main() {

    // ---------------------------
    // LISTINGS
    // ---------------------------

    console.log("\n==============================");
    console.log("FETCHING LISTINGS");
    console.log("==============================");

    const listings = await fetchAll("/v1/listings");


    // ---------------------------
    // PROJECTS
    // ---------------------------

    console.log("\n==============================");
    console.log("FETCHING PROJECTS");
    console.log("==============================");

    const projects = await fetchAll("/v1/projects");


    // ---------------------------
    // RENTALS
    // ---------------------------

    console.log("\n==============================");
    console.log("FETCHING RENTALS");
    console.log("==============================");

    const rentals = await fetchAll("/v1/rentals");


    // ===============================
    // SUMMARY
    // ===============================

    console.log("\n\n================================");
    console.log("FINAL EXTRACTION SUMMARY");
    console.log("================================");

    console.log("LISTINGS:", listings.length);
    console.log("PROJECTS:", projects.length);
    console.log("RENTALS :", rentals.length);


    // ===============================
    // UNIQUE IDS
    // ===============================

    const listingIds = listings
        .map(row => row.listing_id || row.id)
        .filter(Boolean);

    const projectIds = projects
        .map(row => row.project_id || row.id)
        .filter(Boolean);

    const rentalIds = rentals
        .map(row => row.rental_id || row.id)
        .filter(Boolean);


    console.log("\n================================");
    console.log("UNIQUE ID SUMMARY");
    console.log("================================");

    console.log(
        "Listings - total:",
        listings.length,
        "unique:",
        new Set(listingIds).size,
        "duplicates:",
        listingIds.length - new Set(listingIds).size
    );

    console.log(
        "Projects - total:",
        projects.length,
        "unique:",
        new Set(projectIds).size,
        "duplicates:",
        projectIds.length - new Set(projectIds).size
    );

    console.log(
        "Rentals - total:",
        rentals.length,
        "unique:",
        new Set(rentalIds).size,
        "duplicates:",
        rentalIds.length - new Set(rentalIds).size
    );



    fs.writeFileSync(
        "./raw_listings_correct.json",
        JSON.stringify(listings, null, 2)
    );

    fs.writeFileSync(
        "./raw_projects_correct.json",
        JSON.stringify(projects, null, 2)
    );

    fs.writeFileSync(
        "./raw_rentals_correct.json",
        JSON.stringify(rentals, null, 2)
    );


    console.log("\n================================");
    console.log("FILES SAVED");
    console.log("================================");

    console.log("raw_listings_correct.json");
    console.log("raw_projects_correct.json");
    console.log("raw_rentals_correct.json");
}


main().catch(error => {
    console.error("\nFATAL ERROR:");
    console.error(error);
});