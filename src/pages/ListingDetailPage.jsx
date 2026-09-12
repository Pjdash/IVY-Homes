import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as api from "../api";
import { ListingGrid } from "../components/PropertyCard";
import { ErrorState, Loading } from "../components/UiStates";
import { area, money, photos } from "../lib/property";

function Fact({ label, value }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState("");
useEffect(() => {
  let active = true;
  setItem(null);
  setError("");
  setSimilar([]);

  // Fetch primary listing
  api
    .getListing(id)
    .then((listing) => {
      if (active) setItem(listing);
    })
    .catch((err) => {
      if (active) setError(err.message);
    });

  // Fetch similar listings separately so a 404 here doesn't crash the page
  api
    .getSimilar(id)
    .then((matches) => {
      if (active) setSimilar(matches.results || matches.items || matches || []);
    })
    .catch(() => {
      if (active) setSimilar([]);
    });

  return () => {
    active = false;
  };
}, [id]);
  if (error) return <ErrorState message={error} />;
  if (!item) return <Loading />;
  return (
    <>
      <Link className="back-link" to="/">
        <ChevronLeft size={17} /> Back to explore
      </Link>
      <div className="detail-layout">
        <div className="detail-gallery">
          <img src={photos[0]} alt={item.apartment_name || "Listing"} />
          <div className="gallery-strip">
            {photos.slice(1).map((photo) => (
              <img key={photo} src={photo} alt="" />
            ))}
          </div>
        </div>
        <div className="detail-info">
          <div className="card-top">
            <span className="property-type">
              {item.property_type || "Property"}
            </span>
            {item.is_verified && (
              <span className="verified">Verified listing</span>
            )}
          </div>
          <h1>{item.apartment_name || item.title || "Property details"}</h1>
          <p className="detail-location">
            {item.locality || "Your city"} ·{" "}
            {item.facing_direction || "Well-positioned"} facing
          </p>
          <div className="detail-price">
            <strong>{money(item.price)}</strong>
            <span>
              ₹
              {item.carpet_area
                ? Math.round(item.price / item.carpet_area).toLocaleString(
                    "en-IN",
                  )
                : "—"}{" "}
              / sq ft
            </span>
          </div>
          <div className="detail-facts">
            <Fact label="Bedrooms" value={item.bedroom} />
            <Fact label="Bathrooms" value={item.bathroom} />
            <Fact label="Carpet area" value={area(item.carpet_area)} />
            <Fact label="Parking" value={item.covered_parking ?? 0} />
          </div>
          <p className="description">
            {item.description ||
              "A thoughtfully placed home with room for everyday rituals and future plans."}
          </p>
          <div className="seller">
            <div className="avatar">
              {item.posted_by_name?.slice(0, 1) || "S"}
            </div>
            <div>
              <small>Listed by {item.posted_by || "seller"}</small>
              <strong>{item.posted_by_name || "Verified seller"}</strong>
            </div>
            {item.posted_by_contact && (
              <a href={`tel:${item.posted_by_contact}`}>Contact</a>
            )}
          </div>
        </div>
      </div>
      {similar.length > 0 && (
        <>
          <div className="section-head compact">
            <div>
              <p className="eyebrow">Near this home</p>
              <h2>You may also like</h2>
            </div>
          </div>
          <ListingGrid listings={similar.slice(0, 4)} />
        </>
      )}
    </>
  );
}
