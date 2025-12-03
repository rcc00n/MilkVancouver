import axios from "axios";
import { Clock, Leaf, MapPin, RefreshCw, Truck } from "lucide-react";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchDriverTodayRoutes, fetchDriverUpcomingRoutes } from "../../api/driver";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { DriverRoute, DriverUpcomingRoute, RouteStopStatus } from "../../types/delivery";
import { countCompletedStops, stopStatusStyles } from "../../utils/stop-status-styles";

type LoadState = "idle" | "loading" | "error" | "ready" | "no-access";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function DriverHomePage() {
  const [todayRoutes, setTodayRoutes] = useState<DriverRoute[]>([]);
  const [upcomingRoutes, setUpcomingRoutes] = useState<DriverUpcomingRoute[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const [today, upcoming] = await Promise.all([
        fetchDriverTodayRoutes(),
        fetchDriverUpcomingRoutes(),
      ]);
      setTodayRoutes(today);
      setUpcomingRoutes(upcoming);
      setState("ready");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          setState("no-access");
          return;
        }
      }
      setError("Couldn't load routes. Try again.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const upcomingSorted = useMemo(
    () =>
      [...upcomingRoutes].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [upcomingRoutes],
  );

  const summary = useMemo(() => {
    const totalStops = todayRoutes.reduce((sum, route) => sum + route.stops.length, 0);
    const delivered = todayRoutes.reduce(
      (sum, route) => sum + route.stops.filter((stop) => stop.status === "delivered").length,
      0,
    );
    const pending = todayRoutes.reduce(
      (sum, route) => sum + route.stops.filter((stop) => stop.status === "pending").length,
      0,
    );
    return { totalStops, delivered, pending };
  }, [todayRoutes]);

  if (state === "no-access") {
    return <NoAccess role="driver" />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Today&apos;s routes</h1>
        <p className="text-sm text-slate-600">
          Check in, call clients, and update stops. Built for quick thumb-friendly actions.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <Stat title="Total stops" value={summary.totalStops} icon={<Truck className="h-4 w-4" />} />
        <Stat
          title="Delivered"
          value={summary.delivered}
          tone="success"
          icon={<Leaf className="h-4 w-4" />}
        />
        <Stat
          title="Pending"
          value={summary.pending}
          tone="muted"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Assigned today</h2>
          <Button variant="ghost" size="sm" onClick={loadRoutes} disabled={state === "loading"}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </header>

        {state === "loading" ? <RouteSkeletons /> : null}

        {state === "error" && error ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={loadRoutes}>
              Retry
            </Button>
          </div>
        ) : null}

        {state === "ready" && todayRoutes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
            You have no routes for today.
          </div>
        ) : null}

        {state === "ready" && todayRoutes.length > 0 ? (
          <div className="space-y-3">
            {todayRoutes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming</h2>
          <Link to="/driver/upcoming" className="text-sm font-semibold text-primary">
            View all
          </Link>
        </div>
        {state === "ready" && upcomingSorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
            No upcoming routes yet.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSorted.slice(0, 3).map((route) => (
              <div
                key={route.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {route.region_name} · {route.region_code}
                  </p>
                  <p className="text-xs text-slate-600">{formatDate(route.date)}</p>
                </div>
                <div className="text-xs font-semibold text-slate-600">{route.stops_count} stops</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const statusOrder: RouteStopStatus[] = ["delivered", "pending", "no_pickup"];

function RouteCard({ route }: { route: DriverRoute }) {
  const statusCounts: Record<RouteStopStatus, number> = {
    delivered: 0,
    pending: 0,
    no_pickup: 0,
  };

  route.stops.forEach((stop) => {
    statusCounts[stop.status] += 1;
  });

  const completed = countCompletedStops(route.stops);

  return (
    <Link
      to={`/driver/route/${route.id}`}
      state={{ route }}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {route.region_name} · {route.region_code}
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{formatDate(route.date)}</h3>
          <p className="text-sm text-slate-600">{route.stops.length} stops assigned</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <Badge variant={route.is_completed ? "default" : "secondary"}>
            {route.is_completed ? "Completed" : "In progress"}
          </Badge>
          <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {completed} of {route.stops.length} stops completed
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        {statusOrder.map((status) => (
          <StatusPill key={status} status={status} value={statusCounts[status]} />
        ))}
      </div>
    </Link>
  );
}

function StatusPill({ status, value }: { status: RouteStopStatus; value: number }) {
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

function RouteSkeletons() {
  return (
    <div className="space-y-3">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded-full bg-slate-200/70" />
              <Skeleton className="h-5 w-40 rounded-full bg-slate-200/70" />
              <Skeleton className="h-3 w-24 rounded-full bg-slate-200/70" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full bg-slate-200/70" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-full bg-slate-200/70" />
            <Skeleton className="h-7 w-20 rounded-full bg-slate-200/70" />
            <Skeleton className="h-7 w-28 rounded-full bg-slate-200/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({
  title,
  value,
  tone = "default",
  icon,
}: {
  title: string;
  value: number;
  tone?: "default" | "success" | "muted";
  icon?: ReactNode;
}) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "muted"
        ? "bg-slate-50 text-slate-600"
        : "bg-slate-100 text-slate-800";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className={`text-xl font-bold ${toneClasses}`}>{value}</p>
      </div>
    </div>
  );
}

export default DriverHomePage;
