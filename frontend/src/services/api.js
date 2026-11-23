
import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login/") ||
      originalRequest.url?.includes("/auth/refresh/") ||
      originalRequest.url?.includes("/auth/register/") ||
      originalRequest.url?.includes("/auth/confirm-login/");

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem("refresh");

      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })
          .then((response) => response.data)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const data = await refreshPromise;

      if (!data.access) {
        throw new Error("Refresh failed");
      }

      localStorage.setItem("access", data.access);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${data.access}`;

      return api(originalRequest);

    } catch (refreshError) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  }
);

export default api;