import { Search, X } from "lucide-react";

export function Loading() {
  return (
    <div className="loading">
      <span /> Loading your view...
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="state error-state" role="alert">
      <X size={22} />
      <h3>We couldn't load this view</h3>
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="state">
      <Search size={22} />
      <h3>{text}</h3>
      <p>Try widening your filters or check back shortly.</p>
    </div>
  );
}

export function Pagination({ data, onPage }) {
  const total = Number(data?.total || 0);
  const size = Number(data?.page_size || 20);
  const last = Math.ceil(total / size);
  if (last <= 1) return null;
  return (
    <div className="pagination">
      <button
        className="icon-button"
        disabled={data.page <= 1}
        onClick={() => onPage(data.page - 1)}
        aria-label="Previous page"
      >
        ‹
      </button>
      <span>
        Page <strong>{data.page}</strong> of {last}
      </span>
      <button
        className="icon-button"
        disabled={data.page >= last}
        onClick={() => onPage(data.page + 1)}
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
}
