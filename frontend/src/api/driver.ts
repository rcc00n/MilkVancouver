import api from "./client";
import { DriverRoute, DriverUpcomingRoute, RouteStop } from "../types/delivery";

export async function fetchDriverTodayRoutes() {
  const response = await api.get<DriverRoute[]>("/delivery/driver/routes/today/");
  return response.data;
}

export async function fetchDriverUpcomingRoutes() {
  const response = await api.get<DriverUpcomingRoute[]>("/delivery/driver/routes/upcoming/");
  return response.data;
}

export async function fetchDriverRoute(routeId: number) {
  const response = await api.get<DriverRoute>(`/delivery/driver/routes/${routeId}/`);
  return response.data;
}

export async function fetchRouteStops(routeId: number) {
  const response = await api.get<RouteStop[]>(`/delivery/routes/${routeId}/stops/`);
  return response.data;
}

export async function markStopDelivered(stopId: number, photo: File) {
  const formData = new FormData();
  formData.append("photo", photo);
  const response = await api.post<RouteStop>(
    `/delivery/driver/stops/${stopId}/mark-delivered/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
}

export async function markStopNoPickup(stopId: number) {
  const response = await api.post<RouteStop>(`/delivery/driver/stops/${stopId}/mark-no-pickup/`);
  return response.data;
}
