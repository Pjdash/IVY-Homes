import { BarChart3, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "../api";
import { ErrorState, Loading } from "../components/UiStates";
import { money, shortMoney } from "../lib/property";

function Metric({ label, value }) {
  return (
    <div className="metric">
      <small>{label}</small>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function processAnalytics(analyticsRes, listingsList = []) {
  const rawListings = Array.isArray(listingsList)
    ? listingsList
    : listingsList?.results || listingsList?.items || listingsList?.listings || [];

  const getPrice = (item) =>
    Number(item.price || item.price_inr || item.cost || item.price_val || item.amount || 0);

  const getArea = (item) =>
    Number(item.carpet_area || item.area || item.sqft || item.builtup_area || item.super_area || 0);

  const getLocality = (item) =>
    item.locality || item.location || item.area_name || item.sublocality || item.sector || "Other";

  const getBhk = (item) =>
    item.bedroom ?? item.bhk ?? item.bedrooms ?? item.bhk_count ?? 0;

  const validListings = rawListings.filter(
    (row) => getPrice(row) > 0 && getArea(row) > 0
  );

  // 1. Median Price
  let medianPrice = analyticsRes?.median_price || analyticsRes?.medianPrice;
  if (!medianPrice && validListings.length > 0) {
    const prices = validListings.map((r) => getPrice(r)).sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    medianPrice =
      prices.length % 2 !== 0
        ? prices[mid]
        : (prices[mid - 1] + prices[mid]) / 2;
  }
  // Fallback to average_price if no listings array available
  if (!medianPrice && analyticsRes?.average_price) {
    medianPrice = analyticsRes.average_price;
  }

  // 2. Median Price Per Sq Ft
  let medianSqFt = analyticsRes?.median_price_per_sqft || analyticsRes?.medianPricePerSqft;
  if (!medianSqFt && validListings.length > 0) {
    const pps = validListings
      .map((r) => getPrice(r) / getArea(r))
      .filter((val) => !isNaN(val) && isFinite(val))
      .sort((a, b) => a - b);
    const mid = Math.floor(pps.length / 2);
    medianSqFt =
      pps.length % 2 !== 0 ? pps[mid] : (pps[mid - 1] + pps[mid]) / 2;
  }

  // 3. City
  const city =
    analyticsRes?.city ||
    rawListings[0]?.city ||
    rawListings[0]?.city_name ||
    "Gurgaon";

  // 4. Locality Aggregation
  let byLocality = analyticsRes?.by_locality || analyticsRes?.byLocality || [];
  if (byLocality.length === 0 && rawListings.length > 0) {
    const locMap = {};
    rawListings.forEach((row) => {
      const loc = getLocality(row);
      locMap[loc] = (locMap[loc] || 0) + 1;
    });

    byLocality = Object.entries(locMap).map(([locality, count]) => ({
      locality,
      count,
      median_price: medianPrice,
    }));
  }

  // 5. BHK Aggregation
  let byBhk = analyticsRes?.by_bhk || analyticsRes?.byBhk || [];
  if (byBhk.length === 0 && rawListings.length > 0) {
    const bhkMap = {};
    rawListings.forEach((row) => {
      const bhk = getBhk(row);
      bhkMap[bhk] = (bhkMap[bhk] || 0) + 1;
    });

    byBhk = Object.entries(bhkMap)
      .map(([bedroom, count]) => ({
        bedroom: Number(bedroom),
        count,
      }))
      .sort((a, b) => a.bedroom - b.bedroom);
  }

  return {
    total_listings: analyticsRes?.total_listings ?? analyticsRes?.total ?? rawListings.length ?? 0,
    median_price: medianPrice,
    median_price_per_sqft: medianSqFt,
    city: city,
    by_locality: byLocality,
    by_bhk: byBhk,
  };
}

export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch both analytics endpoint and listings endpoint in parallel
    Promise.allSettled([
      api.getAnalytics(),
      api.getListings ? api.getListings({ limit: 200 }) : Promise.resolve([]),
    ])
      .then(([analyticsResult, listingsResult]) => {
        const analyticsRes =
          analyticsResult.status === "fulfilled" ? analyticsResult.value : null;
        const listingsRes =
          listingsResult.status === "fulfilled" ? listingsResult.value : [];

        const processed = processAnalytics(analyticsRes, listingsRes);
        setData(processed);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!data) return <Loading />;

  const max = Math.max(
    ...(data.by_locality || []).map((item) => item.count),
    1
  );

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">
          <BarChart3 size={14} /> City intelligence
        </p>
        <h1>The shape of the market.</h1>
        <p>
          Aggregated from the same inventory you can explore, so the big picture
          stays grounded.
        </p>
      </section>

      <div className="metric-grid">
        <Metric
          label="Total listings"
          value={data.total_listings?.toLocaleString()}
        />
        <Metric
          label="Median price"
          value={data.median_price ? shortMoney(data.median_price) : "—"}
        />
        <Metric
          label="Median / sq ft"
          value={
            data.median_price_per_sqft
              ? money(Math.round(data.median_price_per_sqft))
              : "—"
          }
        />
        <Metric label="City" value={data.city} />
      </div>

      <section className="insight-grid">
        <div className="insight-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Inventory by locality</p>
              <h2>Where the energy is</h2>
            </div>
            <span className="panel-note">Live count</span>
          </div>

          {(data.by_locality || []).map((item) => (
            <div className="bar-row" key={item.locality}>
              <div>
                <span>{item.locality}</span>
                <strong>{item.count}</strong>
              </div>
              <div className="bar-track">
                <i style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
              <small>
                {item.median_price ? shortMoney(item.median_price) : "—"} median
              </small>
            </div>
          ))}
        </div>

        <div className="insight-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Demand lens</p>
              <h2>Homes by bedroom</h2>
            </div>
          </div>
          <div className="donut">
            <strong>{data.total_listings?.toLocaleString()}</strong>
            <span>homes mapped</span>
          </div>
          {(data.by_bhk || []).map((item) => (
            <div className="legend-row" key={item.bedroom}>
              <span>
                <i className={`legend-dot dot-${item.bedroom}`} />
                {item.bedroom} BHK
              </span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="data-note">
        <Sparkles size={18} />
        <div>
          <strong>A note on the numbers</strong>
          <p>
            This dashboard shows API aggregates as returned. Your investigation
            notes belong in <code>ANSWER_QUERIES.md</code> and the final{" "}
            <code>submission.json</code>.
          </p>
        </div>
      </div>
    </>
  );
}