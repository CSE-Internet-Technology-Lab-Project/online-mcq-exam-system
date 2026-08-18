import axios from "axios";
import { handleDemoRequest, initDemoStore, resetDemoStore } from "./demoApi";

export const isDemoMode = import.meta.env.VITE_DEMO_MODE !== "false";

if (isDemoMode) {
  initDemoStore();
}

const realApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

realApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

realApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const demoApi = {
  get: (url, config) => handleDemoRequest("GET", url, config?.data),
  post: (url, data) => handleDemoRequest("POST", url, data),
  put: (url, data) => handleDemoRequest("PUT", url, data),
  patch: (url, data) => handleDemoRequest("PATCH", url, data),
  delete: (url) => handleDemoRequest("DELETE", url)
};

const api = isDemoMode ? demoApi : realApi;

export { resetDemoStore };
export default api;
