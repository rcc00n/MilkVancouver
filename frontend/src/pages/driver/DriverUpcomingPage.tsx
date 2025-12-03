import axios from "axios";
import { CalendarClock, MapPin, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchDriverUpcomingRoutes } from "../../api/driver";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { DriverUpcomingRoute } from "../../types/delivery";

type LoadState = "loading" | "ready" | "error" | "no-access";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function DriverUpcomingPage() {
  const [routes, setRoutes] = useState<DriverUpcomingRoute[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    const load = async () => {
      setState("loading");
      try {
        const data = await fetchDriverUpcomingRoutes();
        setRoutes(data);
        setState("ready");
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            setState("no-access");
            return;
          }
        }
        setState("error");
      }
    };

    load();
  }, []);

  if (state === "no-access") {
    return <NoAccess role="driver" />;
  }

  if (state === "error") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Unable to load upcoming routes right now.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Upcoming routes</h1>
        <p className="text-sm text-slate-600">
          Future routes assigned to you. Confirm timing and check the stop count ahead of time.
        </p>
      </div>

      {state === "loading" ? (
        <div className="text-sm text-slate-500">Loading upcoming routes…</div>
      ) : null}

      {state === "ready" && routes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
          No upcoming routes yet.
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => (
            <Link
              to={`/driver/route/${route.id}`}
              key={route.id}
              state={{ route }}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {route.region_name} · {route.region_code}
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatDate(route.date)}</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Badge variant="secondary" className="gap-2">
                  <Truck className="h-4 w-4" aria-hidden="true" /> {route.stops_count} stops
                </Badge>
                <CalendarClock className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default DriverUpcomingPage;
