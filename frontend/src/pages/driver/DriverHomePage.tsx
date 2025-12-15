import axios from "axios";
import { CalendarClock, Clock, RefreshCw, Route as RouteIcon, Truck } from "lucide-react";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchDriverRoutesByDate,
  fetchDriverTodayRoutes,
  fetchDriverUpcomingRoutes,
} from "../../api/driver";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { DriverRouteDetail } from "./DriverRoutePage";
import { DriverRoute, DriverUpcomingRoute } from "../../types/delivery";
import { countCompletedStops } from "../../utils/stop-status-styles";

type LoadState = "loading" | "ready" | "error" | "no-access";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function getInitialPastDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function DriverHomePage() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [todayRoutes, setTodayRoutes] = useState<DriverRoute[]>([]);
  const [upcomingRoutes, setUpcomingRoutes] = useState<DriverUpcomingRoute[]>([]);
  const [pastRoutes, setPastRoutes] = useState<DriverRoute[]>([]);
  const [pastDate, setPastDate] = useState<string>(getInitialPastDate);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<DriverRoute | null>(null);
  const hasLoaded = useRef(false);

  const findRouteWithStops = useCallback(
    (id: number | null) => {
      if (!id) return null;
      return todayRoutes.find((route) => route.id === id) || pastRoutes.find((route) => route.id === id) || null;
    },
    [todayRoutes, pastRoutes],
  );

  const loadRoutes = useCallback(
    async (targetPastDate: string = pastDate) => {
      setState("loading");
      setError(null);
      try {
        const [today, upcoming, past] = await Promise.all([
          fetchDriverTodayRoutes(),
          fetchDriverUpcomingRoutes(),
          fetchDriverRoutesByDate(targetPastDate),
        ]);

        setTodayRoutes(today);
        setUpcomingRoutes(upcoming);
        setPastRoutes(past);
        setPastDate(targetPastDate);
        setState("ready");

        setSelectedRouteId((current) => {
          const exists =
            (current && today.some((route) => route.id === current)) ||
            (current && upcoming.some((route) => route.id === current)) ||
            (current && past.some((route) => route.id === current));
          if (exists) return current;
          return today[0]?.id ?? upcoming[0]?.id ?? past[0]?.id ?? null;
        });
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            setState("no-access");
            return;
          }
        }
        setError("Couldn't load your routes. Try again.");
        setState("error");
      }
    },
    [pastDate],
  );

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadRoutes();
  }, [loadRoutes]);

  useEffect(() => {
    if (!selectedRouteId) {
      setSelectedRoute(null);
      return;
    }
    const found = findRouteWithStops(selectedRouteId);
    setSelectedRoute(found);
  }, [selectedRouteId, findRouteWithStops]);

  const handleRouteUpdated = useCallback((updatedRoute: DriverRoute) => {
    setTodayRoutes((prev) =>
      prev.map((route) => (route.id === updatedRoute.id ? updatedRoute : route)),
    );
    setPastRoutes((prev) =>
      prev.map((route) => (route.id === updatedRoute.id ? updatedRoute : route)),
    );
    setSelectedRoute(updatedRoute);
  }, []);

  const todayTotals = useMemo(() => {
    const stops = todayRoutes.reduce((sum, route) => sum + route.stops.length, 0);
    const completed = todayRoutes.reduce((sum, route) => sum + countCompletedStops(route.stops), 0);
    const pending = stops - completed;
    return { stops, completed, pending };
  }, [todayRoutes]);

  const upcomingStops = useMemo(
    () => upcomingRoutes.reduce((sum, route) => sum + (route.stops_count || 0), 0),
    [upcomingRoutes],
  );

  const pastRouteCount = pastRoutes.length;

  if (state === "no-access") {
    return <NoAccess role="driver" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">My routes</h1>
          <p className="text-sm text-slate-600">
            Quick list of every route assigned to you. Pick a route to see stops and update deliveries.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadRoutes()}
          disabled={state === "loading"}
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <Stat
          title="Stops today"
          value={todayTotals.stops}
          tone="default"
          icon={<Truck className="h-4 w-4" />}
          helper={`${todayTotals.completed} done, ${todayTotals.pending} left`}
        />
        <Stat
          title="Upcoming routes"
          value={upcomingRoutes.length}
          tone="muted"
          icon={<CalendarClock className="h-4 w-4" />}
          helper={`${upcomingStops} stops scheduled`}
        />
        <Stat
          title="Past (selected day)"
          value={pastRouteCount}
          tone="default"
          icon={<Clock className="h-4 w-4" />}
          helper={`Date: ${pastDate}`}
        />
      </div>

      {state === "error" && error ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => loadRoutes()}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
        <div className="space-y-3">
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Today
                </p>
                <p className="text-sm text-slate-600">Routes assigned for today.</p>
              </div>
            </div>
            {state === "loading" ? (
              <RoutesSkeleton />
            ) : todayRoutes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No routes for today.
              </div>
            ) : (
              <div className="space-y-2">
                {todayRoutes.map((route) => (
                  <RouteListCard
                    key={route.id}
                    route={route}
                    label="Today"
                    selected={selectedRouteId === route.id}
                    onSelect={() => setSelectedRouteId(route.id)}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Upcoming
                </p>
                <p className="text-sm text-slate-600">Plan ahead for future days.</p>
              </div>
            </div>
            {state === "loading" ? (
              <RoutesSkeleton />
            ) : upcomingRoutes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No upcoming routes yet.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingRoutes.map((route) => (
                  <UpcomingRouteCard
                    key={route.id}
                    route={route}
                    selected={selectedRouteId === route.id}
                    onSelect={() => setSelectedRouteId(route.id)}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Past routes
                </p>
                <p className="text-sm text-slate-600">Pick a date to review completed routes.</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={pastDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value) {
                      loadRoutes(value);
                    }
                  }}
                  className="h-10 w-36"
                />
                <Button size="sm" variant="outline" onClick={() => loadRoutes(pastDate)}>
                  Go
                </Button>
              </div>
            </div>
            {state === "loading" ? (
              <RoutesSkeleton />
            ) : pastRoutes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No routes found for this date.
              </div>
            ) : (
              <div className="space-y-2">
                {pastRoutes.map((route) => (
                  <RouteListCard
                    key={route.id}
                    route={route}
                    label="Past"
                    selected={selectedRouteId === route.id}
                    onSelect={() => setSelectedRouteId(route.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {state === "loading" && !selectedRouteId ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-48 rounded-full bg-slate-200/70" />
              <Skeleton className="h-24 w-full rounded-2xl bg-slate-200/60" />
            </div>
          ) : (
            <DriverRouteDetail
              routeId={selectedRouteId}
              initialRoute={selectedRoute || undefined}
              embedded
              onRouteUpdated={handleRouteUpdated}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function RouteListCard({
  route,
  label,
  selected,
  onSelect,
}: {
  route: DriverRoute;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const completed = countCompletedStops(route.stops);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-sm font-semibold text-slate-900">
            {route.region_name} · {route.region_code}
          </p>
          <p className="text-xs text-slate-600">{formatDate(route.date)}</p>
        </div>
        <Badge variant={route.is_completed ? "default" : "secondary"}>
          {route.is_completed ? "Completed" : "In progress"}
        </Badge>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-700">
        <span>{route.stops.length} stops</span>
        <span>
          {completed} done · {route.stops.length - completed} left
        </span>
      </div>
    </button>
  );
}

function UpcomingRouteCard({
  route,
  selected,
  onSelect,
}: {
  route: DriverUpcomingRoute;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming</p>
          <p className="text-sm font-semibold text-slate-900">
            {route.region_name} · {route.region_code}
          </p>
          <p className="text-xs text-slate-600">{formatDate(route.date)}</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <RouteIcon className="h-4 w-4 text-slate-500" aria-hidden="true" /> {route.stops_count} stops
        </Badge>
      </div>
    </button>
  );
}

function RoutesSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24 rounded-full bg-slate-200/70" />
            <Skeleton className="h-6 w-20 rounded-full bg-slate-200/70" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-full bg-slate-200/70" />
            <Skeleton className="h-4 w-24 rounded-full bg-slate-200/70" />
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
  helper,
}: {
  title: string;
  value: number;
  tone?: "default" | "muted";
  icon?: ReactNode;
  helper?: string;
}) {
  const toneClasses =
    tone === "muted"
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
        {helper ? <p className="text-xs font-semibold text-slate-500">{helper}</p> : null}
      </div>
    </div>
  );
}

export default DriverHomePage;
