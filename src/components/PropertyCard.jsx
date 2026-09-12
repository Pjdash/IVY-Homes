import { Heart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api";
import { area, photos, shortMoney } from "../lib/property";
import { EmptyState } from "./UiStates";

export function ListingGrid({ listings }) {
  return listings.length ? (
    <div className="listing-grid">
      {listings.map((item, index) => (
        <ListingCard key={item.listing_id} item={item} index={index} />
      ))}
    </div>
  ) : (
    <EmptyState text="No homes match those filters yet." />
  );
}

export function ListingCard({ item, index = 0 }) {
  const [saved, setSaved] = useState(false);
  async function toggle(event) {
    event.preventDefault();
    try {
      if (saved) await api.removeFavourite(item.listing_id);
      else await api.addFavourite(item.listing_id);
      setSaved((value) => !value);
    } catch {
      setSaved(false);
    }
  }
  return (
    <Link
      className="listing-card"
      to={`/listing/${item.listing_id}`}
      style={{ "--delay": `${index * 70}ms` }}
    >
      <div className="card-image">
        <img
          src={photos[index % photos.length]}
          alt={item.apartment_name || "Property"}
        />
        <div className="image-label">{item.website || "Ivy verified"}</div>
        <button
          className={saved ? "save-button saved" : "save-button"}
          onClick={toggle}
          aria-label={saved ? "Remove saved listing" : "Save listing"}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-content">
        <div className="card-top">
          <span className="property-type">{item.property_type || "Home"}</span>
          {item.is_verified && <span className="verified">Verified</span>}
        </div>
        <h3>{item.apartment_name || item.title || "Untitled home"}</h3>
        <p className="locality">{item.locality || "Your city"}</p>
        <div className="facts">
          <span>{item.bedroom ?? "—"} bed</span>
          <span>{item.bathroom ?? "—"} bath</span>
          <span>{area(item.carpet_area)}</span>
        </div>
        <div className="price-row">
          <strong>{shortMoney(item.price)}</strong>
          <span>{item.price ? "asking price" : "Contact for price"}</span>
        </div>
      </div>
    </Link>
  );
}
