import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: { "Content-Type": "application/json" }
});

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  res => res,
  err => {
    // Only redirect if NOT during an auth request and NOT already on auth pages
    if (err.response?.status === 401) {
      const url = err.config?.url || "";
      const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");
      const isAuthPage = window.location.pathname === "/login" || window.location.pathname === "/register";
      if (!isAuthEndpoint && !isAuthPage) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    // Standardize error messaging for callers
    if (err.response?.data) {
      const data = err.response.data;
      if (!data.errors) {
        if (typeof data.detail === "string") {
          data.errors = [data.detail];
        } else if (data.detail && typeof data.detail === "object") {
          data.errors = data.detail.errors || [JSON.stringify(data.detail)];
        } else if (Array.isArray(data.detail)) {
          data.errors = data.detail.map(d => (typeof d === "string" ? d : d.msg || JSON.stringify(d)));
        } else {
          data.errors = [err.message || "An unexpected error occurred."];
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
