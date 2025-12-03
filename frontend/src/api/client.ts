import axios, { AxiosHeaders } from "axios";

function resolveBaseUrl(): string {
  const envValue = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envValue && envValue !== "undefined") {
    return envValue.replace(/\/+$/, ""); // strip trailing slashes
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    // In production serve API via same-origin /api path (nginx proxies to backend).
    if (host.endsWith("milkvanq.duckdns.org")) {
      return "/api";
    }
  }

  // Local dev: rely on the reverse proxy or relative /api path.
  return "/api";
}

const resolvedBaseUrl = resolveBaseUrl();

const api = axios.create({
  baseURL: resolvedBaseUrl,
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

async function ensureCsrfCookie() {
  if (typeof document === "undefined") return;
  await api.get("/csrf/");
}

api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();

  if (!method || !unsafeMethods.has(method)) {
    return config;
  }

  let csrfToken = getCsrfToken();

  if (!csrfToken) {
    await ensureCsrfCookie();
    csrfToken = getCsrfToken();
  }

  if (csrfToken) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    headers.set("X-CSRFToken", csrfToken);
    config.headers = headers;
  }

  return config;
});

export default api;
