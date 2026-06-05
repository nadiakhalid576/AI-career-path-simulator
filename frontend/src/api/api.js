// API Configuration
import axios from "axios";

// Use Vite environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — pick the right token based on current role
api.interceptors.request.use((config) => {
  // Skip if caller already set an Authorization header explicitly
  if (config.headers.Authorization) return config;

  const isAdminContext =
    localStorage.getItem("isAdmin") === "true" ||
    (typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin"));

  const token = isAdminContext
    ? localStorage.getItem("adminToken")
    : localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Response interceptor — route-aware session cleanup
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const onAdminRoute =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/admin");
      if (onAdminRoute) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("isAdmin");
        window.location.href = "/admin/login";
      } else {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;