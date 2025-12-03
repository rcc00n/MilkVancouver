import axios from "axios";
import { Camera, CheckCircle2, MapPin, Package, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { fetchAdminRoute } from "../../api/admin";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { AdminRoute } from "../../types/admin";
import { RouteStop } from "../../types/delivery";

type LoadState = "loading" | "ready" | "error" | "no-access";

function AdminRouteDetailPage() {
  const params = useParams();
  const routeId = Number(params.routeId);
  const [route, setRoute] = useState<AdminRoute | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    const load = async () => {
      setState("loading");
      try {
        const data = await fetchAdminRoute(routeId);
        setRoute(data);
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
  }, [routeId]);

  const totals = useMemo(() => {
    const delivered = route?.stops.filter((stop) => stop.status === "delivered").length || 0;
    const noPickup = route?.stops.filter((stop) => stop.status === "no_pickup").length || 0;
    const pending = route?.stops.filter((stop) => stop.status === "pending").length || 0;
    return { delivered, noPickup, pending };
  }, [route]);

  if (state === "no-access") {
    return <NoAccess role="admin" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Route</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {route?.region_name || "Route"} {route?.date ? `· ${new Date(route.date).toLocaleDateString()}` : ""}
          </h1>
          <p className="text-sm text-slate-600">Driver: {route?.driver_name || "Unassigned"}</p>
        </div>
        <Badge variant={route?.is_completed ? "default" : "secondary"}>
          {route?.is_completed ? "Completed" : "In progress"}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        <Badge variant="secondary">Stops: {route?.stops.length || 0}</Badge>
        <Badge variant="default">Delivered: {totals.delivered}</Badge>
        <Badge variant="outline">No pickup: {totals.noPickup}</Badge>
        <Badge variant="secondary">Pending: {totals.pending}</Badge>
      </div>

      {state === "loading" ? <div className="text-sm text-slate-500">Loading route…</div> : null}
      {state === "error" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Unable to load this route right now.
        </div>
      ) : null}

      <div className="space-y-3">
        {route?.stops.map((stop) => (
          <Card key={stop.id} className="border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stop #{stop.sequence}
                </p>
                <p className="text-base font-semibold text-slate-900">{stop.order.full_name}</p>
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {formatAddress(stop)}
                </p>
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {stop.order.phone}
                </p>
              </div>
              <StatusBadge status={stop.status} />
            </div>
            {stop.proof_photo_url ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Proof attached:
                <a
                  href={stop.proof_photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  View photo
                </a>
              </div>
            ) : (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                <Camera className="h-4 w-4" aria-hidden="true" />
                No proof yet
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatAddress(stop: RouteStop) {
  const order = stop.order;
  return [order.address_line1, order.city, order.postal_code].filter(Boolean).join(", ");
}

function StatusBadge({ status }: { status: RouteStop["status"] }) {
  const map: Record<RouteStop["status"], { label: string; className: string; icon: React.ReactNode }> = {
    delivered: {
      label: "Delivered",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
    },
    pending: {
      label: "Pending",
      className: "bg-slate-50 text-slate-700 border-slate-200",
      icon: <Package className="h-4 w-4" aria-hidden="true" />,
    },
    no_pickup: {
      label: "No pickup",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Camera className="h-4 w-4" aria-hidden="true" />,
    },
  };

  const config = map[status];
  return (
    <Badge className={`flex items-center gap-1.5 border ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

export default AdminRouteDetailPage;
