import { RouteStopStatus } from "../types/delivery";
import type { OrderStatus, OrderType } from "../types/orders";

type StatusStyle = {
  label: string;
  badgeClass: string;
  dotClass: string;
};

const tones = {
  green: {
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  amber: {
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500",
  },
  orange: {
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700",
    dotClass: "bg-orange-500",
  },
  blue: {
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    dotClass: "bg-blue-500",
  },
  purple: {
    badgeClass: "border-purple-200 bg-purple-50 text-purple-700",
    dotClass: "bg-purple-500",
  },
  rose: {
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    dotClass: "bg-rose-500",
  },
  sky: {
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
    dotClass: "bg-sky-500",
  },
};

const withTone = (label: string, tone: keyof typeof tones): StatusStyle => ({
  label,
  badgeClass: tones[tone].badgeClass,
  dotClass: tones[tone].dotClass,
});

export const stopStatusStyles: Record<RouteStopStatus, StatusStyle> = {
  delivered: withTone("Delivered", "green"),
  pending: withTone("Pending", "amber"),
  no_pickup: withTone("No pickup", "orange"),
};

export const completedStopStatuses: RouteStopStatus[] = ["delivered", "no_pickup"];

export function countCompletedStops(stops: { status: RouteStopStatus }[]) {
  return stops.filter((stop) => completedStopStatuses.includes(stop.status)).length;
}

export const orderStatusStyles: Record<OrderStatus, StatusStyle> = {
  pending: withTone("Pending", "amber"),
  paid: withTone("Paid", "blue"),
  in_progress: withTone("In progress", "purple"),
  ready: withTone("Ready", "orange"),
  completed: withTone("Completed", "green"),
  cancelled: withTone("Cancelled", "rose"),
};

export const orderTypeStyles: Record<OrderType, StatusStyle> = {
  pickup: withTone("Pickup", "sky"),
  delivery: withTone("Delivery", "green"),
};

export type { StatusStyle };
