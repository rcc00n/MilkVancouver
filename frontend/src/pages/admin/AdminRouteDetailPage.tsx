import axios from "axios";
import { Eye, GripVertical, Image as ImageIcon, Loader2, MapPin, Phone, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { fetchAdminRoute, reorderAdminRoute } from "../../api/admin";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { AdminRoute } from "../../types/admin";
import { RouteStop } from "../../types/delivery";
import { stopStatusStyles } from "../../utils/stop-status-styles";

type LoadState = "loading" | "ready" | "error" | "no-access";

function AdminRouteDetailPage() {
  const params = useParams();
  const routeId = Number(params.routeId);
  const [route, setRoute] = useState<AdminRoute | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftStops, setDraftStops] = useState<RouteStop[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const loadRoute = useCallback(
    async (showLoading = true) => {
      if (!Number.isFinite(routeId) || routeId <= 0) {
        setErrorMessage("Invalid route id.");
        setState("error");
        return;
      }
      if (showLoading) {
        setState("loading");
      }
      setErrorMessage(null);
      try {
        const data = await fetchAdminRoute(routeId);
        setRoute({ ...data, stops: sortStops(data.stops) });
        setState("ready");
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            setState("no-access");
            return;
          }
        }
        setErrorMessage("Unable to load this route right now.");
        setState("error");
      }
    },
    [routeId],
  );

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  const stops = useMemo(() => sortStops(route?.stops || []), [route?.stops]);

  useEffect(() => {
    if (isReorderMode) {
      setDraftStops(stops);
    }
  }, [isReorderMode, stops]);

  const displayStops = isReorderMode ? draftStops : stops;

  const totals = useMemo(() => {
    const delivered = stops.filter((stop) => stop.status === "delivered").length;
    const noPickup = stops.filter((stop) => stop.status === "no_pickup").length;
    const pending = stops.filter((stop) => stop.status === "pending").length;
    return { delivered, noPickup, pending };
  }, [stops]);

  const canReorder = Boolean(route && !route.is_completed && stops.length > 0);

  const startReorder = () => {
    if (!canReorder) return;
    setReorderError(null);
    setDraftStops(stops);
    setIsReorderMode(true);
  };

  const cancelReorder = () => {
    setIsReorderMode(false);
    setDraftStops([]);
    setDraggingId(null);
    setReorderError(null);
  };

  const handleSaveOrder = async () => {
    if (!route) return;
    if (draftStops.length === 0) {
      setIsReorderMode(false);
      return;
    }
    setSavingOrder(true);
    setReorderError(null);
    try {
      const stopIds = draftStops.map((stop) => stop.id);
      const updated = await reorderAdminRoute(route.id, stopIds);
      setRoute({ ...updated, stops: sortStops(updated.stops) });
      setIsReorderMode(false);
    } catch (err) {
      const message = extractErrorMessage(err, "Unable to save new order.");
      if (message.includes("stop_ids must match exactly")) {
        setReorderError("Route changed in background, refreshing…");
        await loadRoute();
        setIsReorderMode(false);
      } else {
        setReorderError(message);
      }
    } finally {
      setSavingOrder(false);
      setDraggingId(null);
    }
  };

  const handleDragStart = (stopId: number) => {
    if (!isReorderMode || route?.is_completed) return;
    setDraggingId(stopId);
  };

  const handleDragOver = (event: React.DragEvent<HTMLTableRowElement>, overId: number) => {
    event.preventDefault();
    if (!isReorderMode || draggingId === null || draggingId === overId) return;
    setDraftStops((prev) => reorderStops(prev, draggingId, overId));
  };

  const handleDrop = () => {
    setDraggingId(null);
  };

  if (state === "no-access") {
    return <NoAccess role="admin" />;
  }

  const stopsCount = route?.stops_count ?? route?.stops.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Route</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {route?.region_name || "Route"}{" "}
            {route?.region_code ? `· ${route.region_code.toUpperCase()}` : ""}
          </h1>
          <p className="text-sm text-slate-600">
            {route?.date ? new Date(route.date).toLocaleDateString() : "—"} · Driver:{" "}
            {route?.driver_name || "Unassigned"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={route?.is_completed ? "default" : "secondary"}>
            {route?.is_completed ? "Completed" : "In progress"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReorderError(null);
              loadRoute();
            }}
            disabled={state === "loading"}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        <Badge variant="secondary">Stops: {stopsCount}</Badge>
        <Badge variant="default">Delivered: {totals.delivered}</Badge>
        <Badge variant="outline">No pickup: {totals.noPickup}</Badge>
        <Badge variant="secondary">Pending: {totals.pending}</Badge>
      </div>

      {state === "loading" ? <div className="text-sm text-slate-500">Loading route…</div> : null}
      {state === "error" && errorMessage ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {errorMessage}
        </div>
      ) : null}

      {route ? (
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Stops</h2>
              <p className="text-sm text-slate-600">Sequence is always shown to keep dispatch clear.</p>
            </div>
            <div className="flex items-center gap-2">
              {isReorderMode ? (
                <>
                  <Button variant="ghost" size="sm" onClick={cancelReorder} disabled={savingOrder}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveOrder}
                    size="sm"
                    disabled={savingOrder || draftStops.length === 0}
                    className="min-w-[110px]"
                  >
                    {savingOrder ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Saving…
                      </>
                    ) : (
                      "Save order"
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={startReorder}
                  disabled={!canReorder}
                  title={
                    route.is_completed
                      ? "Completed routes are locked"
                      : stops.length === 0
                        ? "No stops to reorder"
                        : undefined
                  }
                >
                  Edit order
                </Button>
              )}
          </div>
        </div>

          {isReorderMode ? (
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
              Drag stops to change driver route order, then click Save.
            </div>
          ) : null}

          {route.is_completed ? (
            <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              Route is completed; reordering is disabled.
            </div>
          ) : null}

          {reorderError ? (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              {reorderError}
            </div>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sequence</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivered at</TableHead>
                <TableHead className="text-right">Proof</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayStops.map((stop) => {
                const statusStyle = stopStatusStyles[stop.status];
                return (
                  <TableRow
                    key={stop.id}
                    draggable={isReorderMode && !route.is_completed}
                    onDragStart={() => handleDragStart(stop.id)}
                    onDragOver={(event) => handleDragOver(event, stop.id)}
                    onDrop={handleDrop}
                    onDragEnd={handleDrop}
                    className={isReorderMode ? "cursor-move" : undefined}
                  >
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        {isReorderMode ? (
                          <GripVertical className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        ) : null}
                        <span>#{stop.sequence}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-900">{stop.order.full_name}</p>
                        <p className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          {stop.order.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span className="leading-tight">{formatAddress(stop)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`flex items-center gap-2 border ${statusStyle.badgeClass}`}>
                        <span className={`h-2 w-2 rounded-full ${statusStyle.dotClass}`} />
                        {statusStyle.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {formatDeliveredAt(stop.delivered_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {stop.has_proof && stop.proof_photo_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="inline-flex items-center gap-1"
                          onClick={() => setProofUrl(stop.proof_photo_url || "")}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          View
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <ImageIcon className="h-4 w-4" aria-hidden="true" />
                          None
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {displayStops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-sm text-slate-600">
                    No stops on this route yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      ) : null}

      <Dialog open={Boolean(proofUrl)} onOpenChange={(open) => !open && setProofUrl(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Proof of delivery</DialogTitle>
            <DialogDescription>Photo attached by driver.</DialogDescription>
          </DialogHeader>
          {proofUrl ? (
            <img src={proofUrl} alt="Delivery proof" className="w-full rounded-lg border border-slate-200" />
          ) : null}
          {proofUrl ? (
            <a
              href={proofUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Open in new tab
            </a>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function sortStops(stops: RouteStop[]) {
  return [...stops].sort((a, b) => a.sequence - b.sequence || a.id - b.id);
}

function reorderStops(stops: RouteStop[], sourceId: number, targetId: number) {
  const next = [...stops];
  const fromIndex = next.findIndex((stop) => stop.id === sourceId);
  const toIndex = next.findIndex((stop) => stop.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return stops;
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((stop, index) => ({ ...stop, sequence: index + 1 }));
}

function formatAddress(stop: RouteStop) {
  const order = stop.order;
  return [order.address_line1, order.city, order.postal_code].filter(Boolean).join(", ");
}

function formatDeliveredAt(timestamp?: string | null) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as unknown;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    if (data && typeof data === "object") {
      const detail = (data as Record<string, unknown>).detail;
      if (typeof detail === "string" && detail.trim()) {
        return detail;
      }
    }
  }
  return fallback;
}

export default AdminRouteDetailPage;
