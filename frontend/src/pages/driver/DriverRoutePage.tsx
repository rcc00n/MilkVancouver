import axios from "axios";
import {
  ArrowLeft,
  BadgeCheck,
  ImageDown,
  Loader2,
  MapPinned,
  PhoneCall,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  fetchDriverTodayRoutes,
  fetchDriverUpcomingRoutes,
  fetchRouteStops,
  markStopDelivered,
  markStopNoPickup,
} from "../../api/driver";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { DriverRoute, DriverUpcomingRoute, RouteStop, RouteStopStatus } from "../../types/delivery";

type LoadState = "loading" | "ready" | "error" | "no-access";

type RouteSummary =
  | (Pick<DriverRoute, "id" | "date" | "region_code" | "region_name" | "driver_name"> & {
      stops_count?: number;
    })
  | (Pick<DriverUpcomingRoute, "id" | "date" | "region_code" | "region_name"> & {
      driver_name?: string;
      stops_count?: number;
    });

function DriverRoutePage() {
  const params = useParams();
  const routeId = Number(params.routeId);
  const navigate = useNavigate();
  const location = useLocation();
  const routeFromState = (location.state as { route?: RouteSummary } | undefined)?.route;

  const [summary, setSummary] = useState<RouteSummary | null>(routeFromState || null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [mutatingStopId, setMutatingStopId] = useState<number | null>(null);
  const [mutatingAction, setMutatingAction] = useState<"deliver" | "no_pickup" | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    const load = async () => {
      setState("loading");
      setError(null);
      try {
        const data = await fetchRouteStops(routeId);
        setStops(data);
        setState("ready");
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            setState("no-access");
            return;
          }
        }
        setError("Unable to load stops for this route.");
        setState("error");
      }
    };

    load();
  }, [routeId]);

  useEffect(() => {
    if (summary) return;

    const loadSummary = async () => {
      try {
        const [today, upcoming] = await Promise.all([
          fetchDriverTodayRoutes(),
          fetchDriverUpcomingRoutes(),
        ]);
        const fromToday = today.find((route) => route.id === routeId);
        const fromUpcoming = upcoming.find((route) => route.id === routeId);
        const found = fromToday || fromUpcoming;
        if (found) {
          if ("stops" in found) {
            const routeWithStops = found as DriverRoute;
            setSummary({
              id: routeWithStops.id,
              date: routeWithStops.date,
              region_code: routeWithStops.region_code,
              region_name: routeWithStops.region_name,
              driver_name: routeWithStops.driver_name,
              stops_count: routeWithStops.stops.length,
            });
          } else {
            setSummary({
              id: found.id,
              date: found.date,
              region_code: found.region_code,
              region_name: found.region_name,
              stops_count: found.stops_count,
            });
          }
        }
      } catch (err) {
        // Non-blocking; we already show stop data and route id.
        console.warn("Unable to hydrate route summary", err);
      }
    };

    loadSummary();
  }, [routeId, summary]);

  const stopTotals = useMemo(() => {
    const delivered = stops.filter((stop) => stop.status === "delivered").length;
    const pending = stops.filter((stop) => stop.status === "pending").length;
    const noPickup = stops.filter((stop) => stop.status === "no_pickup").length;
    return { delivered, pending, noPickup };
  }, [stops]);

  const handleNoPickup = async (stopId: number) => {
    setMutatingStopId(stopId);
    setMutatingAction("no_pickup");
    setError(null);
    try {
      const updated = await markStopNoPickup(stopId);
      setStops((prev) => prev.map((stop) => (stop.id === stopId ? updated : stop)));
    } catch (err) {
      setError("Could not mark as no pickup.");
    } finally {
      setMutatingStopId(null);
      setMutatingAction(null);
    }
  };

  const handleDeliver = async (stopId: number, file: File) => {
    setMutatingStopId(stopId);
    setMutatingAction("deliver");
    setError(null);
    try {
      const updated = await markStopDelivered(stopId, file);
      setStops((prev) => prev.map((stop) => (stop.id === stopId ? updated : stop)));
    } catch (err) {
      setError("Could not upload delivery proof. Try again.");
    } finally {
      setMutatingStopId(null);
      setMutatingAction(null);
      const input = fileInputs.current[stopId];
      if (input) {
        input.value = "";
      }
    }
  };

  const isActionBusy = (stopId: number, action: "deliver" | "no_pickup") =>
    mutatingStopId === stopId && mutatingAction === action;

  if (state === "no-access") {
    return <NoAccess role="driver" />;
  }

  const addressForStop = (stop: RouteStop) => {
    const order = stop.order;
    const parts = [order.address_line1, order.city, order.postal_code].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Truck className="h-4 w-4" aria-hidden="true" />
            Route #{routeId}
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            {summary?.region_name || "Assigned route"} {summary?.region_code ? `· ${summary.region_code}` : ""}
          </h1>
          <p className="text-sm text-slate-600">
            {summary?.date ? `${new Date(summary.date).toLocaleDateString()} • ` : ""}
            {stops.length} stops
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        <Badge variant="secondary">Pending: {stopTotals.pending}</Badge>
        <Badge variant="outline">No pickup: {stopTotals.noPickup}</Badge>
        <Badge variant="default">Delivered: {stopTotals.delivered}</Badge>
      </div>

      {state === "loading" ? (
        <div className="text-sm text-slate-500">Loading stops…</div>
      ) : null}

      {state === "error" && error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {stops.map((stop) => {
          const status = stop.status as RouteStopStatus;
          const statusTone =
            status === "delivered"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : status === "no_pickup"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-50 text-slate-700 border-slate-200";

          return (
            <div
              key={stop.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stop #{stop.sequence}
                  </p>
                  <p className="text-base font-semibold text-slate-900">{stop.order.full_name}</p>
                  <p className="text-sm text-slate-600">{addressForStop(stop)}</p>
                  <p className="text-sm text-slate-600">Phone: {stop.order.phone}</p>
                </div>
                <Badge className={statusTone}>
                  {status.replace("_", " ")}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
                <ActionLink href={`tel:${stop.order.phone}`} icon={<PhoneCall className="h-4 w-4" />}>
                  Call client
                </ActionLink>
                <ActionLink
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressForStop(stop))}`}
                  icon={<MapPinned className="h-4 w-4" />}
                >
                  Open in Maps
                </ActionLink>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(node) => {
                    fileInputs.current[stop.id] = node;
                  }}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleDeliver(stop.id, file);
                    }
                  }}
                />
                <Button
                  disabled={status !== "pending" || isActionBusy(stop.id, "deliver")}
                  onClick={() => fileInputs.current[stop.id]?.click()}
                  className="w-full"
                >
                  {isActionBusy(stop.id, "deliver") ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <ImageDown className="mr-2 h-4 w-4" aria-hidden="true" />
                      Mark delivered (photo)
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  disabled={status !== "pending" || isActionBusy(stop.id, "no_pickup")}
                  onClick={() => handleNoPickup(stop.id)}
                  className="w-full"
                >
                  {isActionBusy(stop.id, "no_pickup") ? "Updating…" : "Mark no pickup"}
                </Button>
              </div>

              {stop.proof_photo_url ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Proof uploaded
                  <Link
                    to={stop.proof_photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    View photo
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
    >
      {icon}
      {children}
    </a>
  );
}

export default DriverRoutePage;
