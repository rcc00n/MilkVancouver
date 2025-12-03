import api from "./client";
import { AdminDashboard, AdminRoute, ClientStats } from "../types/admin";

type RouteFilters = {
  date?: string;
  region?: string;
  driverId?: number;
};

export async function fetchAdminDashboard() {
  const response = await api.get<AdminDashboard>("/admin/dashboard/");
  return response.data;
}

export async function fetchAdminRoutes(filters: RouteFilters = {}) {
  const params: Record<string, string> = {};
  if (filters.date) params.date = filters.date;
  if (filters.region) params.region = filters.region;
  if (typeof filters.driverId === "number") params.driver_id = String(filters.driverId);

  const response = await api.get<AdminRoute[]>("/admin/routes/", { params });
  return response.data;
}

export async function fetchAdminRoute(routeId: number) {
  const response = await api.get<AdminRoute>(`/admin/routes/${routeId}/`);
  return response.data;
}

export async function reorderAdminRoute(routeId: number, stopIds: number[]) {
  const response = await api.post<AdminRoute>(`/admin/routes/${routeId}/reorder/`, {
    stop_ids: stopIds,
  });
  return response.data;
}

export async function fetchAdminClients() {
  const response = await api.get<ClientStats[]>("/admin/clients/");
  return response.data;
}
