import axios from "axios";
import {
  CalendarClock,
  Filter,
  RefreshCw,
  Route as RouteIcon,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchAdminRoutes } from "../../api/admin";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { AdminRoute } from "../../types/admin";

type LoadState = "loading" | "ready" | "error" | "no-access";
type Filters = { date: string; region: string; driverId: string };
type FilterOptions = {
  regions: { code: string; name: string }[];
  drivers: { id: number; name: string }[];
};

const ALL_REGIONS_VALUE = "all";
const ALL_DRIVERS_VALUE = "all";

function getTodayInputValue() {
  return new Date().toISOString().split("T")[0];
}

function formatDateLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function stopsCount(route: AdminRoute) {
  return typeof route.stops_count === "number" ? route.stops_count : route.stops.length;
}

function mergeFilterOptions(prev: FilterOptions, routes: AdminRoute[]): FilterOptions {
  const regionMap = new Map(prev.regions.map((region) => [region.code.toLowerCase(), region]));
  const driverMap = new Map(prev.drivers.map((driver) => [driver.id, driver]));

  routes.forEach((route) => {
    const code = (route.region_code || String(route.region || "")).trim();
    if (code) {
      const normalizedCode = code.toLowerCase();
      if (!regionMap.has(normalizedCode)) {
        regionMap.set(normalizedCode, { code, name: route.region_name || code });
      }
    }
    if (typeof route.driver_id === "number") {
      driverMap.set(route.driver_id, {
        id: route.driver_id,
        name: route.driver_name || `Driver ${route.driver_id}`,
      });
    }
  });

  const regions = Array.from(regionMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  const drivers = Array.from(driverMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return { regions, drivers };
}

function AdminRoutesPage() {
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(() => ({
    date: getTodayInputValue(),
    region: ALL_REGIONS_VALUE,
    driverId: ALL_DRIVERS_VALUE,
  }));
  const [options, setOptions] = useState<FilterOptions>({ regions: [], drivers: [] });

  const loadRoutes = async (params: Filters) => {
    setState("loading");
    setErrorMessage(null);
    try {
      const data = await fetchAdminRoutes({
        date: params.date || undefined,
        region: params.region === ALL_REGIONS_VALUE ? undefined : params.region,
        driverId:
          params.driverId && params.driverId !== ALL_DRIVERS_VALUE
            ? Number(params.driverId)
            : undefined,
      });
      setRoutes(data);
      setOptions((prev) => mergeFilterOptions(prev, data));
      setState("ready");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          setState("no-access");
          return;
        }
      }
      setErrorMessage("Unable to load routes right now.");
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

  const resetFilters = () => {
    const reset: Filters = {
      date: getTodayInputValue(),
      region: ALL_REGIONS_VALUE,
      driverId: ALL_DRIVERS_VALUE,
    };
    setFilters(reset);
    loadRoutes(reset);
  };

  const totalStops = useMemo(
    () => routes.reduce((sum, route) => sum + stopsCount(route), 0),
    [routes],
  );
  const completedRoutes = useMemo(
    () => routes.filter((route) => route.is_completed).length,
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
          <p className="text-sm text-slate-600">Browse by date, region, or driver.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadRoutes(filters)} disabled={state === "loading"}>
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
            <p className="text-xs text-slate-500">Defaults to today; clear to see all dates.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="region">Region</Label>
              <Select
                value={filters.region}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, region: value }))}
              >
              <SelectTrigger id="region">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_REGIONS_VALUE}>All regions</SelectItem>
                {options.regions.map((region) => (
                  <SelectItem key={region.code} value={region.code}>
                    {region.code.toUpperCase()} · {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="driverId">Driver</Label>
              <Select
                value={filters.driverId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, driverId: value }))}
              >
              <SelectTrigger id="driverId">
                <SelectValue placeholder="All drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DRIVERS_VALUE}>All drivers</SelectItem>
                {options.drivers.map((driver) => (
                  <SelectItem key={driver.id} value={String(driver.id)}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1" disabled={state === "loading"}>
              <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
              Apply
            </Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {state === "loading" ? <div className="text-sm text-slate-500">Loading routes…</div> : null}
      {state === "error" && errorMessage ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {errorMessage}
        </div>
      ) : null}

      {state === "ready" && routes.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          No routes match these filters yet.
        </Card>
      ) : null}

      {state === "ready" && routes.length > 0 ? (
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
              <Badge variant="secondary">{routes.length} routes</Badge>
              <Badge variant="outline">{totalStops} stops</Badge>
              <Badge variant="default">{completedRoutes} completed</Badge>
            </div>
            <div className="text-xs text-slate-500">
              Showing {filters.date ? formatDateLabel(filters.date) : "all dates"}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.id}>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      <span>{formatDateLabel(route.date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-900">{route.region_name}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {route.region_code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      <div className="leading-tight">
                        <p className="text-sm font-semibold text-slate-900">{route.driver_name}</p>
                        <p className="text-xs text-slate-500">
                          {route.driver_id ? `ID ${route.driver_id}` : "Unassigned"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                      <RouteIcon className="h-4 w-4" aria-hidden="true" />
                      {stopsCount(route)} stops
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={route.is_completed ? "default" : "secondary"}>
                      {route.is_completed ? "Completed" : "In progress"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/routes/${route.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}
    </div>
  );
}

export default AdminRoutesPage;
