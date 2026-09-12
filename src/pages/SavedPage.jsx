import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "../api";
import { ListingGrid } from "../components/PropertyCard";
import { ErrorState, Loading } from "../components/UiStates";

export default function SavedPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getFavourites()
      .then((res) => {
        // Handle both object schema { results: [...] } and flat array [...]
        const list = Array.isArray(res)
          ? res
          : res?.results || res?.items || res?.data || [];
        setItems(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <section className="page-heading saved-heading">
        <div>
          <p className="eyebrow">
            <Bookmark size={14} /> Your shortlist
          </p>
          <h1>Places you kept.</h1>
          <p>A quiet corner for the homes that made you pause.</p>
        </div>
        <div className="saved-count">
          {items.length}
          <small>saved homes</small>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No saved homes yet.</p>
        </div>
      ) : (
        <ListingGrid listings={items} />
      )}
    </>
  );
}