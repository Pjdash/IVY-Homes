import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "../api";
import { ListingGrid } from "../components/PropertyCard";
import { ErrorState, Loading, Pagination } from "../components/UiStates";

const initialFilters = {
  page: 1,
  locality: "",
  bhk: "",
  min_price: "",
  max_price: "",
  furnishing: "",
  sort_by: "posted_at",
  order: "desc",
};

export default function ExplorePage() {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api
      .getListings(filters)
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [filters]);
  const update = (key, value) =>
    setFilters((current) => ({ ...current, page: 1, [key]: value }));
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            <Sparkles size={14} /> Curated for your next chapter
          </p>
          <h1>
            Room for the
            <br />
            <em>life ahead.</em>
          </h1>
          <p className="hero-copy">
            Explore considered homes in your city, with the details that make a
            decision feel clear.
          </p>
        </div>
        <div className="hero-orbit">
          <div className="orbit-card">
            <span>LIVE INVENTORY</span>
            <strong>{data?.total?.toLocaleString() || "—"}</strong>
            <small>active places to explore</small>
          </div>
        </div>
      </section>
      <section className="filter-panel" aria-label="Listing filters">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Search locality"
            placeholder="Search by locality..."
            value={filters.locality}
            onChange={(event) => update("locality", event.target.value)}
          />
        </div>
        <select
          aria-label="Bedrooms"
          value={filters.bhk}
          onChange={(event) => update("bhk", event.target.value)}
        >
          <option value="">Any bedrooms</option>
          <option value="1">1 BHK</option>
          <option value="2">2 BHK</option>
          <option value="3">3 BHK</option>
          <option value="4">4+ BHK</option>
        </select>
        <input
          className="range-input"
          aria-label="Minimum price"
          type="number"
          min="0"
          placeholder="Min price"
          value={filters.min_price}
          onChange={(event) => update("min_price", event.target.value)}
        />
        <input
          className="range-input"
          aria-label="Maximum price"
          type="number"
          min="0"
          placeholder="Max price"
          value={filters.max_price}
          onChange={(event) => update("max_price", event.target.value)}
        />
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
        <select
          aria-label="Sort listings"
          value={filters.sort_by}
          onChange={(event) => update("sort_by", event.target.value)}
        >
          <option value="posted_at">Newest first</option>
          <option value="price">Price</option>
          <option value="carpet_area">Area</option>
        </select>
        <button
          className="filter-reset"
          onClick={() => setFilters(initialFilters)}
        >
          Reset
        </button>
      </section>
      <section className="section-head">
        <div>
          <p className="eyebrow">The collection</p>
          <h2>Homes worth lingering over</h2>
        </div>
        <span className="result-count">
          {data
            ? `${(data.total || 0).toLocaleString()} results`
            : "Loading collection..."}
        </span>
      </section>
    {error ? (
  <ErrorState message={error} />
) : data ? (
  <ListingGrid 
    listings={
      Array.isArray(data) 
        ? data 
        : data.items || data.results || data.data || []
    } 
  />
) : (
  <Loading />
)}
      {data && (
        <Pagination
          data={data}
          onPage={(page) => setFilters((current) => ({ ...current, page }))}
        />
      )}
    </>
  );
}
