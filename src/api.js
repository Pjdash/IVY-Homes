// src/api.js
const API_BASE = import.meta.env.VITE_IVY_API_URL || "https://solve.ivy.homes";
const API_KEY = import.meta.env.VITE_IVY_API_KEY || "";

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem("ivy_session") || "null");
    if (!session?.token || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function saveSession(data) {
  const rawToken = data?.token?.access_token || data?.token || data?.access_token;

  const session = {
    ...data,
    token: rawToken,
    expiresAt: Date.now() + (data?.expires_in || 86400) * 1000,
  };
  localStorage.setItem("ivy_session", JSON.stringify(session));
  return session;
}

export function clearSession() {
  localStorage.removeItem("ivy_session");
}

async function request(path, options = {}) {
  if (!API_KEY) {
    throw new Error("Add VITE_IVY_API_KEY to your .env file before connecting.");
  }

  const session = getSession();

  const headers = {
    Accept: "application/json",
    "X-API-Key": API_KEY,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const url = `${API_BASE}${path}`;
  const response = await fetch(url, { ...options, headers });
  const body = await response.json().catch(() => ({}));

  console.log(`[API ${response.status}] ${path}`, {
    requestHeaders: headers,
    responseBody: body,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
    }
    throw new Error(body.detail || `Request failed (${response.status})`);
  }

  return body;
}

// --- Auth Endpoints ---
export async function login(email, password) {
  return saveSession(
    await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  );
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

// --- Sale Listings Endpoints ---
export function getListings(filters = {}) {
  const params = new URLSearchParams({ page: filters.page || 1, limit: 20 });
  Object.entries(filters).forEach(
    ([key, value]) => value !== "" && value != null && params.set(key, value)
  );
  return request(`/v1/listings?${params}`);
}

export function getListing(id) {
  return request(`/v1/listings/${encodeURIComponent(id)}`);
}

export function getSimilar(id) {
  return request(`/v1/listings/${encodeURIComponent(id)}/similar`);
}

// --- Rentals & Projects Endpoints ---
export function getRentals(filters = {}) {
  const params = new URLSearchParams({ page: filters.page || 1, limit: 20 });
  Object.entries(filters).forEach(
    ([key, value]) => value !== "" && value != null && params.set(key, value)
  );
  return request(`/v1/rentals?${params}`);
}

export function getProjects(filters = {}) {
  const params = new URLSearchParams({ page: filters.page || 1, limit: 20 });
  Object.entries(filters).forEach(
    ([key, value]) => value !== "" && value != null && params.set(key, value)
  );
  return request(`/v1/projects?${params}`);
}

// --- Favourites Endpoints ---
export function getFavourites() {
  return request("/v1/saved").catch(() => request("/v1/listings/favourites"));
}

export function addFavourite(id) {
  const body = JSON.stringify({ listing_id: id, id });
  return request("/v1/saved", {
    method: "POST",
    body,
  }).catch(() =>
    request("/v1/listings/favourites", {
      method: "POST",
      body,
    })
  );
}

export function removeFavourite(id) {
  return request(`/v1/saved/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).catch(() =>
    request(`/v1/listings/favourites/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
  );
}
// --- Analytics Endpoints ---
export async function getAnalytics() {
  try {
    return await request("/v1/analytics/summary");
  } catch (err) {
    // Fallback: Calculate live market insights directly from listings data
    const listingsData = await getListings({ limit: 200 });
    const items = listingsData.results || listingsData.items || listingsData || [];
    
    const activeItems = items.filter((item) => item.is_live === true);
    const validPrices = items.map((i) => i.price).filter((p) => typeof p === "number" && p > 0);
    const avgPrice = validPrices.length
      ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
      : 0;

    return {
      total_listings: listingsData.total || items.length,
      active_listings: activeItems.length,
      average_price: avgPrice,
      is_fallback: true
    };
  }
}