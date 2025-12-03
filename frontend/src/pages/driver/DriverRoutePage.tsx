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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { fetchDriverTodayRoutes, markStopDelivered, markStopNoPickup } from "../../api/driver";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { DriverRoute, DriverStop, RouteStop, RouteStopStatus } from "../../types/delivery";
import {
  completedStopStatuses,
  countCompletedStops,
  stopStatusStyles,
} from "../../utils/stop-status-styles";

type LoadState = "loading" | "ready" | "error" | "no-access";
type MutatingAction = "deliver" | "no_pickup" | null;

function DriverRoutePage() {
  const params = useParams();
  const routeId = Number(params.routeId);
  const navigate = useNavigate();
  const location = useLocation();
  const routeFromState = (location.state as { route?: DriverRoute } | undefined)?.route;

  const initialRoute = useMemo(
    () =>
      routeFromState && routeFromState.stops
        ? { ...routeFromState, stops: sortStops(routeFromState.stops) }
        : null,
    [routeFromState],
  );

  const [route, setRoute] = useState<DriverRoute | null>(initialRoute);
  const [state, setState] = useState<LoadState>(initialRoute ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);
  const [mutatingStopId, setMutatingStopId] = useState<number | null>(null);
  const [mutatingAction, setMutatingAction] = useState<MutatingAction>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const loadRoute = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setState("loading");
      }
      setError(null);
      try {
        const todayRoutes = await fetchDriverTodayRoutes();
        const found = todayRoutes.find((item) => item.id === routeId);
        if (found) {
          setRoute({ ...found, stops: sortStops(found.stops) });
          setState("ready");
        } else {
          setError("This route is not assigned to you today.");
          setState("error");
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            setState("no-access");
            return;
          }
        }
        setError("Could not load this route. Try again.");
        setState("error");
      }
    },
    [routeId],
  );

  useEffect(() => {
    loadRoute(!initialRoute);
  }, [loadRoute, initialRoute]);

  const stops = useMemo(() => sortStops(route?.stops || []), [route?.stops]);

  const stopTotals = useMemo(() => {
    const delivered = stops.filter((stop) => stop.status === "delivered").length;
    const pending = stops.filter((stop) => stop.status === "pending").length;
    const noPickup = stops.filter((stop) => stop.status === "no_pickup").length;
    return { delivered, pending, noPickup };
  }, [stops]);

  const completedCount = useMemo(() => countCompletedStops(stops), [stops]);

  const handleNoPickup = async (stopId: number) => {
    setMutatingStopId(stopId);
    setMutatingAction("no_pickup");
    setError(null);
    try {
      const updated = await markStopNoPickup(stopId);
      const driverStop = normalizeStop(updated);
      setRoute((prev) => {
        if (!prev) return prev;
        const nextStops = sortStops(
          prev.stops.map((stop) => (stop.id === stopId ? driverStop : stop)),
        );
        const allCompleted = nextStops.every((stop) => completedStopStatuses.includes(stop.status));
        return {
          ...prev,
          is_completed: allCompleted,
          stops: nextStops,
        };
      });
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
      const driverStop = normalizeStop(updated);
      setRoute((prev) => {
        if (!prev) return prev;
        const nextStops = sortStops(
          prev.stops.map((stop) => (stop.id === stopId ? driverStop : stop)),
        );
        const allCompleted = nextStops.every((stop) => completedStopStatuses.includes(stop.status));
        return {
          ...prev,
          is_completed: allCompleted,
          stops: nextStops,
        };
      });
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

  const isActionBusy = (stopId: number, action: Exclude<MutatingAction, null>) =>
    mutatingStopId === stopId && mutatingAction === action;

  if (state === "no-access") {
    return <NoAccess role="driver" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Truck className="h-4 w-4" aria-hidden="true" />
            Route #{routeId}
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            {route?.region_name || "Assigned route"}{" "}
            {route?.region_code ? `· ${route.region_code}` : ""}
          </h1>
          <p className="text-sm text-slate-600">
            {route?.date ? new Date(route.date).toLocaleDateString() : "Today"} • {stops.length} stops
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {completedCount} of {stops.length} stops completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={route?.is_completed ? "default" : "secondary"}>
            {route?.is_completed ? "Completed" : "In progress"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        <StatusSummaryChip status="pending" value={stopTotals.pending} />
        <StatusSummaryChip status="no_pickup" value={stopTotals.noPickup} />
        <StatusSummaryChip status="delivered" value={stopTotals.delivered} />
      </div>

      {state === "loading" ? <div className="text-sm text-slate-500">Loading route…</div> : null}

      {state === "error" && error ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => loadRoute(true)}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        {stops.map((stop) => {
          const status = stop.status as RouteStopStatus;

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
                  <p className="text-base font-semibold text-slate-900">{stop.client_name}</p>
                  <p className="text-sm text-slate-600">Phone: {stop.client_phone}</p>
                  <p className="text-sm text-slate-600">{stop.address}</p>
                </div>
                <StopStatusBadge status={status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
                <ActionLink href={`tel:${stop.client_phone}`} icon={<PhoneCall className="h-4 w-4" />}>
                  Call client
                </ActionLink>
                <ActionLink
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`}
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

function StopStatusBadge({ status }: { status: RouteStopStatus }) {
  const styles = stopStatusStyles[status];
  return (
    <Badge className={`flex items-center gap-1.5 border ${styles.badgeClass}`}>
      <span className={`h-2 w-2 rounded-full ${styles.dotClass}`} />
      {styles.label}
    </Badge>
  );
}

function StatusSummaryChip({ status, value }: { status: RouteStopStatus; value: number }) {
  const styles = stopStatusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${styles.badgeClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${styles.dotClass}`} />
      {styles.label}: {value}
    </span>
  );
}

function normalizeStop(stop: RouteStop): DriverStop {
  const order = stop.order;
  const addressParts = [order.address_line1, order.city, order.postal_code].filter(Boolean);
  return {
    id: stop.id,
    sequence: stop.sequence,
    status: stop.status,
    delivered_at: stop.delivered_at,
    has_proof: stop.has_proof,
    proof_photo_url: stop.proof_photo_url,
    order_id: order.id,
    client_name: order.full_name,
    client_phone: order.phone,
    address: addressParts.join(", "),
  };
}

function sortStops(stops: DriverStop[]) {
  return [...stops].sort((a, b) => {
    if (a.sequence === b.sequence) {
      return a.id - b.id;
    }
    return a.sequence - b.sequence;
  });
}

export default DriverRoutePage;
