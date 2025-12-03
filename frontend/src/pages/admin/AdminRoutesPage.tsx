import axios from "axios";
import { Filter, RefreshCw, Route } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchAdminRoutes } from "../../api/admin";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { AdminRoute } from "../../types/admin";

type LoadState = "loading" | "ready" | "error" | "no-access";

function AdminRoutesPage() {
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [filters, setFilters] = useState<{ date?: string; region?: string; driverId?: string }>({
    date: "",
    region: "",
    driverId: "",
  });

  const loadRoutes = async (params?: { date?: string; region?: string; driverId?: string }) => {
    setState("loading");
    try {
      const data = await fetchAdminRoutes({
        date: params?.date || undefined,
        region: params?.region || undefined,
        driverId: params?.driverId ? Number(params.driverId) : undefined,
      });
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

  useEffect(() => {
    loadRoutes(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    loadRoutes(filters);
  };

  const totalStops = useMemo(
    () => routes.reduce((sum, route) => sum + route.stops.length, 0),
    [routes],
  );

  if (state === "no-access") {
    return <NoAccess role="admin" />;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Routes</p>
          <h1 className="text-2xl font-semibold text-slate-900">Delivery routes</h1>
          <p className="text-sm text-slate-600">Filter by date, region, or driver.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadRoutes(filters)}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </header>

      <Card className="border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="region">Region code</Label>
            <Input
              id="region"
              placeholder="e.g. VAN"
              value={filters.region}
              onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="driverId">Driver ID</Label>
            <Input
              id="driverId"
              inputMode="numeric"
              placeholder="e.g. 3"
              value={filters.driverId}
              onChange={(e) => setFilters((prev) => ({ ...prev, driverId: e.target.value }))}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1">
              <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFilters({ date: "", region: "", driverId: "" });
                loadRoutes({});
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {state === "loading" ? <div className="text-sm text-slate-500">Loading routes…</div> : null}
      {state === "error" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Unable to load routes right now.
        </div>
      ) : null}

      {state === "ready" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Badge variant="secondary">{routes.length} routes</Badge>
            <Badge variant="outline">{totalStops} stops</Badge>
          </div>
          {routes.map((route) => (
            <Link
              to={`/admin/routes/${route.id}`}
              key={route.id}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {route.region_name}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {new Date(route.date).toLocaleDateString()}
                  </h2>
                  <p className="text-sm text-slate-600">Driver: {route.driver_name || "Unassigned"}</p>
                </div>
                <Badge variant={route.is_completed ? "default" : "secondary"}>
                  {route.is_completed ? "Completed" : "In progress"}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold">
                  <Route className="h-4 w-4" aria-hidden="true" />
                  {route.stops.length} stops
                </span>
                <span className="rounded-full bg-slate-50 px-2.5 py-1 font-semibold">
                  Delivered: {route.stops.filter((s) => s.status === "delivered").length}
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                  No pickup: {route.stops.filter((s) => s.status === "no_pickup").length}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default AdminRoutesPage;
