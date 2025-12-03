import { RouteStopStatus } from "../types/delivery";

type StopStatusStyle = {
  label: string;
  badgeClass: string;
  dotClass: string;
};

export const stopStatusStyles: Record<RouteStopStatus, StopStatusStyle> = {
  delivered: {
    label: "Delivered",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
    dotClass: "bg-slate-500",
  },
  no_pickup: {
    label: "No pickup",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500",
  },
};

export const completedStopStatuses: RouteStopStatus[] = ["delivered", "no_pickup"];

export function countCompletedStops(stops: { status: RouteStopStatus }[]) {
  return stops.filter((stop) => completedStopStatuses.includes(stop.status)).length;
}
