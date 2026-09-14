import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "../api";
import {
  EmptyState,
  ErrorState,
  Loading,
  Pagination,
} from "../components/UiStates";
import { area, money, photos, shortMoney } from "../lib/property";

const defaults = (rentals) => ({
  page: 1,
  locality: "",
  bhk: "",
  furnishing: "",
  project_status: "",
  sort_by: rentals ? "posted_at" : "launch_date",
  order: "desc",
});

function RentalCard({ item, index }) {
  return (
    <article className="wide-card">
      <img
        src={photos[index % photos.length]}
        alt={item.title || item.apartment_name || "Rental"}
      />
      <div className="wide-content">
        <div className="card-top">
          <span className="property-type">For rent</span>
          <span className="property-type">
            {item.furnishing || "Furnishing unknown"}
          </span>
        </div>
        <h2>{item.title || item.apartment_name || "Rental home"}</h2>
        <p className="locality">
          {item.locality} · {item.bedroom} BHK · {area(item.carpet_area)}
        </p>
        <p>
          {item.description ||
            "A rental home with practical details for your next move."}
        </p>
        <div className="price-row">
          <strong>
            {money(item.price)}
            <small>/ month</small>
          </strong>
          <span>Deposit {shortMoney(item.deposit)}</span>
        </div>
      </div>
    </article>
  );
}

function ProjectCard({ item, index }) {
  return (
    <article className="wide-card project-card">
      <img
        src={photos[(index + 1) % photos.length]}
        alt={item.apartment_name || "Project"}
      />
      <div className="wide-content">
        <div className="card-top">
          <span className="property-type">
            {item.project_status || "Project"}
          </span>
          <span className="verified">{item.developer_name}</span>
        </div>
        <h2>{item.apartment_name || "Unnamed project"}</h2>
        <p className="locality">
          {item.locality} · {item.total_units?.toLocaleString() || "—"} homes ·{" "}
          {item.total_towers || "—"} towers
        </p>
        <div className="facts">
          <span>
            {area(item.min_area_sqft)} — {area(item.max_area_sqft)}
          </span>
          <span>{item.total_listings ?? "—"} available listings</span>
        </div>
        <div className="price-row">
          <strong>
            {shortMoney(item.price_min)} — {shortMoney(item.price_max)}
          </strong>
          <span>Possession {item.possession_date || "TBA"}</span>
        </div>
      </div>
    </article>
  );
}

export default function CollectionPage({ kind }) {
  const rentals = kind === "rentals";
  const [filters, setFilters] = useState(() => defaults(rentals));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Re-sync filters instantly on tab/route changes (Rentals <-> Projects)
  useEffect(() => {
    setFilters(defaults(rentals));
  }, [kind, rentals]);

  useEffect(() => {
    setData(null);
    setError("");

    // Strip unaccepted/stale parameters based on target entity
    const payload = { ...filters };
    if (rentals) {
      delete payload.project_status;
      // Safeguard: fall back to posted_at if launch_date is left over
      if (payload.sort_by === "launch_date") payload.sort_by = "posted_at";
    } else {
      delete payload.bhk;
      delete payload.furnishing;
      // Safeguard: fall back to launch_date if posted_at is left over
      if (payload.sort_by === "posted_at") payload.sort_by = "launch_date";
    }

    (rentals ? api.getRentals(payload) : api.getProjects(payload))
      .then(setData)
      .catch((err) => setError(err.message));
  }, [rentals, filters]);

  const update = (key, value) =>
    setFilters((current) => ({ ...current, page: 1, [key]: value }));

  const records = data?.results || [];

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">
          {rentals ? "Flexible living" : "Places with a future"}
        </p>
        <h1>
          {rentals ? "Rent without the guesswork." : "Projects taking shape."}
        </h1>
        <p>
          {rentals
            ? "Monthly numbers, deposits and honest details in one calm view."
            : "Follow the communities and builders shaping your city."}
        </p>
      </section>
      <section className="filter-panel collection-filters">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Search locality"
            placeholder="Search by locality..."
            value={filters.locality}
            onChange={(event) => update("locality", event.target.value)}
          />
        </div>
        {rentals ? (
          <>
            <select
              aria-label="Bedrooms"
              value={filters.bhk}
              onChange={(event) => update("bhk", event.target.value)}
            >
              <option value="">Any bedrooms</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
            </select>
            <select
              aria-label="Furnishing"
              value={filters.furnishing}
              onChange={(event) => update("furnishing", event.target.value)}
            >
              <option value="">Any furnishing</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi-furnished">Semi-furnished</option>
              <option value="fully-furnished">Fully furnished</option>
            </select>
          </>
        ) : (
          <select
            aria-label="Project status"
            value={filters.project_status}
            onChange={(event) => update("project_status", event.target.value)}
          >
            <option value="">Any status</option>
            <option value="new launch">New launch</option>
            <option value="under construction">Under construction</option>
            <option value="ready to move">Ready to move</option>
          </select>
        )}
        <select
          aria-label="Sort collection"
          value={filters.sort_by}
          onChange={(event) => update("sort_by", event.target.value)}
        >
          <option value={rentals ? "posted_at" : "launch_date"}>
            Newest first
          </option>
          <option value={rentals ? "price" : "price_min"}>Price</option>
        </select>
        <button
          className="filter-reset"
          onClick={() => setFilters(defaults(rentals))}
        >
          Reset
        </button>
      </section>
      {error ? (
        <ErrorState message={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          {records.length ? (
            <div className="collection-list">
              {records.map((item, index) =>
                rentals ? (
                  <RentalCard key={item.listing_id} item={item} index={index} />
                ) : (
                  <ProjectCard
                    key={item.project_id}
                    item={item}
                    index={index}
                  />
                ),
              )}
            </div>
          ) : (
            <EmptyState text="Nothing here matches those filters." />
          )}
          <Pagination
            data={data}
            onPage={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </>
      )}
    </>
  );
}