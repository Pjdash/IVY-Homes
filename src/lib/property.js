export const photos = [
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
];

export const money = (value) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);
export const shortMoney = (value) =>
  value >= 10000000
    ? `₹${(value / 10000000).toFixed(2)} Cr`
    : value >= 100000
      ? `₹${(value / 100000).toFixed(1)} L`
      : money(value);
export const area = (value) =>
  value == null ? "—" : `${Number(value).toLocaleString("en-IN")} sq ft`;
