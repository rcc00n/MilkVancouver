import api from "./client";
import { DriverRoute, DriverUpcomingRoute, RouteStop } from "../types/delivery";
import { sortDriverStops, toDriverStop } from "../utils/driver-route";

type DriverRouteFromMyRoutes = Omit<DriverRoute, "stops"> & {
  stops: RouteStop[];
  stops_count?: number;
};

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

export async function fetchDriverRoutesByDate(date: string) {
  const response = await api.get<DriverRouteFromMyRoutes[]>("/delivery/my-routes/", {
    params: { date },
  });

  return response.data.map((route) => ({
    ...route,
    stops: sortDriverStops(route.stops.map(toDriverStop)),
  }));
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

export async function markStopNoPickup(stopId: number, reason?: string) {
  const payload = reason ? { reason } : {};
  const response = await api.post<RouteStop>(
    `/delivery/driver/stops/${stopId}/mark-no-pickup/`,
    payload,
  );
  return response.data;
}
