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
export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .getAnalytics()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);
  if (error) return <ErrorState message={error} />;
  if (!data) return <Loading />;
  const max = Math.max(
    ...(data.by_locality || []).map((item) => item.count),
    1,
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
        <Metric label="Median price" value={shortMoney(data.median_price)} />
        <Metric
          label="Median / sq ft"
          value={money(data.median_price_per_sqft)}
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
              <small>{shortMoney(item.median_price)} median</small>
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
