import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

const unsafeMethods = new Set(["post", "put", "patch", "delete"]);

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfRequest: Promise<void> | null = null;

async function ensureCsrfCookie() {
  if (typeof document === "undefined") return;
  if (getCsrfToken()) return;
  if (!api.defaults.baseURL) return;
  if (csrfRequest) return csrfRequest;

  const csrfUrl = `${api.defaults.baseURL.replace(/\/$/, "")}/products/`;
  csrfRequest = axios
    .get(csrfUrl, { withCredentials: true })
    .then(() => {})
    .catch((error) => {
      console.error("Failed to fetch CSRF cookie", error);
    })
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
}

api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();
  if (!method || !unsafeMethods.has(method)) {
    return config;
  }

  if (!getCsrfToken()) {
    await ensureCsrfCookie();
  }

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers = { ...config.headers, "X-CSRFToken": csrfToken };
  }

  return config;
});

export default api;
