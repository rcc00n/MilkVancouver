import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Camera,
  Eye,
  Loader2,
  MapPinned,
  PhoneCall,
  Truck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { fetchDriverRoute, markStopDelivered, markStopNoPickup } from "../../api/driver";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { DriverRoute, DriverStop, RouteStop, RouteStopStatus } from "../../types/delivery";
import {
  completedStopStatuses,
  countCompletedStops,
  stopStatusStyles,
} from "../../utils/stop-status-styles";
import { toast } from "sonner";

type LoadState = "loading" | "ready" | "error" | "no-access";
type MutatingAction = "deliver" | "no_pickup" | null;

const stopToneClasses: Record<RouteStopStatus, string> = {
  pending: "border-amber-100 bg-amber-50/70",
  delivered: "border-emerald-200 bg-emerald-50/70",
  no_pickup: "border-orange-200 bg-orange-50/70",
};
const postErrorToast = "Couldn't send update. Try again.";

function formatDeliveredTime(timestamp?: string | null) {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as unknown;
    if (typeof data === "string") {
      return data || fallback;
    }
    if (data && typeof data === "object") {
      const payload = data as Record<string, unknown>;
      const direct =
        (payload.detail as string | undefined) ||
        (payload.message as string | undefined) ||
        (payload.error as string | undefined);
      if (direct) {
        return direct;
      }
      const values = Object.values(payload);
      for (const value of values) {
        if (typeof value === "string" && value.trim()) {
          return value;
        }
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
          return value[0];
        }
      }
    }
  }
  return fallback;
}

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
  const [stopFilter, setStopFilter] = useState<"all" | "remaining" | "done">("all");
  const [mutatingStopId, setMutatingStopId] = useState<number | null>(null);
  const [mutatingAction, setMutatingAction] = useState<MutatingAction>(null);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [activeStop, setActiveStop] = useState<DriverStop | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [confirmStopId, setConfirmStopId] = useState<number | null>(null);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const loadRoute = useCallback(
    async (showLoading = false) => {
      if (!Number.isFinite(routeId) || routeId <= 0) {
        setError("Invalid route id.");
        setState("error");
        return;
      }
      if (showLoading) {
        setState("loading");
      }
      setError(null);
      try {
        const data = await fetchDriverRoute(routeId);
        setRoute({ ...data, stops: sortStops(data.stops) });
        setState("ready");
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            setState("no-access");
            return;
          }
          const detail = (err.response?.data as { detail?: string } | undefined)?.detail;
          if (status === 404 && detail) {
            setError(detail);
            setState("error");
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
  const filteredStops = useMemo(() => {
    if (stopFilter === "remaining") {
      return stops.filter((stop) => stop.status === "pending");
    }
    if (stopFilter === "done") {
      return stops.filter((stop) => completedStopStatuses.includes(stop.status));
    }
    return stops;
  }, [stopFilter, stops]);

  const stopTotals = useMemo(() => {
    const delivered = stops.filter((stop) => stop.status === "delivered").length;
    const pending = stops.filter((stop) => stop.status === "pending").length;
    const noPickup = stops.filter((stop) => stop.status === "no_pickup").length;
    return { delivered, pending, noPickup };
  }, [stops]);

  const completedCount = useMemo(() => countCompletedStops(stops), [stops]);
  const stopForConfirm = confirmStopId ? stops.find((stop) => stop.id === confirmStopId) : null;
  const isActionBusy = (stopId: number, action: Exclude<MutatingAction, null>) =>
    mutatingStopId === stopId && mutatingAction === action;
  const deliveringStopId = activeStop?.id;
  const isDeliveringActive = deliveringStopId ? isActionBusy(deliveringStopId, "deliver") : false;

  const updateStopState = useCallback((stopId: number, driverStop: DriverStop) => {
    setRoute((prev) => {
      if (!prev) return prev;
      const nextStops = sortStops(prev.stops.map((stop) => (stop.id === stopId ? driverStop : stop)));
      const allCompleted = nextStops.every((stop) => completedStopStatuses.includes(stop.status));
      return {
        ...prev,
        is_completed: allCompleted,
        stops: nextStops,
      };
    });
  }, []);

  const openDeliveryDialog = (stop: DriverStop) => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setActiveStop(stop);
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setDeliveryError(null);
    setDeliveryDialogOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeDeliveryDialog = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setDeliveryDialogOpen(false);
    setActiveStop(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setDeliveryError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhotoSelect = (file: File) => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setDeliveryError(null);
  };

  const handleNoPickup = async (stopId: number) => {
    setMutatingStopId(stopId);
    setMutatingAction("no_pickup");
    try {
      const updated = await markStopNoPickup(stopId);
      const driverStop = normalizeStop(updated);
      updateStopState(stopId, driverStop);
      toast.success("Marked as no pickup");
    } catch (err) {
      const message = getErrorMessage(err, postErrorToast);
      console.error("Failed to mark no pickup:", message);
      toast.error(postErrorToast);
    } finally {
      setMutatingStopId(null);
      setMutatingAction(null);
      setConfirmStopId(null);
    }
  };

  const submitDelivery = async () => {
    if (!activeStop || !selectedPhoto) {
      setDeliveryError("Please choose a photo to upload.");
      return;
    }
    setMutatingStopId(activeStop.id);
    setMutatingAction("deliver");
    setDeliveryError(null);
    try {
      const updated = await markStopDelivered(activeStop.id, selectedPhoto);
      const driverStop = normalizeStop(updated);
      updateStopState(activeStop.id, driverStop);
      toast.success("Delivery recorded");
      closeDeliveryDialog();
    } catch (err) {
      const message = getErrorMessage(err, postErrorToast);
      setDeliveryError(message);
      toast.error(postErrorToast);
    } finally {
      setMutatingStopId(null);
      setMutatingAction(null);
    }
  };

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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
        <div className="flex flex-wrap gap-2">
          <StatusSummaryChip status="pending" value={stopTotals.pending} />
          <StatusSummaryChip status="no_pickup" value={stopTotals.noPickup} />
          <StatusSummaryChip status="delivered" value={stopTotals.delivered} />
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
          {[
            { value: "all", label: "All" },
            { value: "remaining", label: "Remaining" },
            { value: "done", label: "Done" },
          ].map((option) => {
            const isActive = stopFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStopFilter(option.value as typeof stopFilter)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  isActive ? "bg-slate-900 text-white shadow" : "text-slate-700 hover:bg-slate-100",
                ].join(" ")}
                aria-pressed={isActive}
              >
                {option.label}
              </button>
            );
          })}
        </div>
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
        {filteredStops.map((stop) => {
          const status = stop.status as RouteStopStatus;
          const deliveredTime = formatDeliveredTime(stop.delivered_at);
          const isPending = status === "pending";
          const isDelivering = isActionBusy(stop.id, "deliver");
          const isMarkingNoPickup = isActionBusy(stop.id, "no_pickup");

          return (
            <div
              key={stop.id}
              className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${stopToneClasses[status]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stop #{stop.sequence}
                  </p>
                  <p className="text-base font-semibold text-slate-900">{stop.client_name}</p>
                  <p className="text-sm text-slate-600">{stop.address}</p>
                  <p className="text-sm text-slate-600">Phone: {stop.client_phone}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 sm:h-11 sm:w-11"
                      title={`Call ${stop.client_phone}`}
                      aria-label={`Call ${stop.client_phone}`}
                    >
                      <a href={`tel:${stop.client_phone}`}>
                        <PhoneCall className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 sm:h-11 sm:w-11"
                      title="Open in Google Maps"
                      aria-label="Open in Google Maps"
                    >
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(stop.address)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPinned className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </Button>
                  </div>
                  <StopStatusBadge status={status} />
                </div>
              </div>

              {stop.delivered_at ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                  {status === "no_pickup" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  ) : (
                    <BadgeCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  )}
                  {status === "no_pickup" ? "No pickup recorded" : "Delivered"}
                  {deliveredTime ? ` at ${deliveredTime}` : ""}
                </div>
              ) : null}

              {stop.proof_photo_url ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-white/70 px-3 py-2">
                  <img
                    src={stop.proof_photo_url}
                    alt={`Delivery proof for stop ${stop.sequence}`}
                    className="h-14 w-14 rounded-lg object-cover ring-1 ring-emerald-100"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                      Proof uploaded
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-fit px-2 text-sm"
                      onClick={() => setViewPhotoUrl(stop.proof_photo_url || null)}
                    >
                      <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                      View photo
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  disabled={!isPending || isDelivering}
                  onClick={() => openDeliveryDialog(stop)}
                  className="h-12 w-full text-base"
                >
                  {isDelivering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
                      Delivered (add photo)
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  disabled={!isPending || isMarkingNoPickup}
                  onClick={() => setConfirmStopId(stop.id)}
                  className="h-12 w-full text-base"
                >
                  {isMarkingNoPickup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Updating…
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" aria-hidden="true" />
                      Mark no pickup
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Use this if the client wasn&apos;t home or refused pickup.
              </p>
            </div>
          );
        })}
        {filteredStops.length === 0 && state === "ready" ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm font-semibold text-slate-700">
            {stopFilter === "remaining"
              ? "Nothing left to do. Great work!"
              : stopFilter === "done"
                ? "No stops are done yet."
                : "No stops to show."}
          </div>
        ) : null}
      </div>

      <Dialog
        open={deliveryDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDeliveryDialog();
          } else {
            setDeliveryDialogOpen(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader className="space-y-1">
            <DialogTitle>Mark delivered</DialogTitle>
            <DialogDescription>
              Add a quick photo before we mark stop {activeStop?.sequence} as delivered.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handlePhotoSelect(file);
                }
              }}
            />

            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center transition hover:border-slate-400 hover:bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Selected delivery proof"
                  className="h-40 w-full max-w-xs rounded-lg object-cover shadow-sm"
                />
              ) : (
                <>
                  <Camera className="h-8 w-8 text-slate-500" aria-hidden="true" />
                  <p className="text-sm font-semibold text-slate-800">Tap to add a delivery photo</p>
                  <p className="text-xs text-slate-600">
                    Required for proof of delivery. We keep it until you finish or cancel.
                  </p>
                </>
              )}
            </div>

            {selectedPhoto ? (
              <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                <span className="truncate">{selectedPhoto.name}</span>
                <span>{Math.round(selectedPhoto.size / 1024)} KB</span>
              </div>
            ) : null}

            {deliveryError ? (
              <p className="text-sm font-semibold text-destructive">{deliveryError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDeliveryDialog} disabled={isDeliveringActive}>
              Cancel
            </Button>
            <Button onClick={submitDelivery} disabled={!selectedPhoto || isDeliveringActive}>
              {isDeliveringActive ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Uploading…
                </>
              ) : (
                <>
                  <BadgeCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                  Save delivery
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewPhotoUrl)}
        onOpenChange={(open) => {
          if (!open) {
            setViewPhotoUrl(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Delivery proof</DialogTitle>
            <DialogDescription>Full-size photo uploaded for this stop.</DialogDescription>
          </DialogHeader>
          {viewPhotoUrl ? (
            <img
              src={viewPhotoUrl}
              alt="Delivery proof preview"
              className="w-full rounded-lg border border-slate-200 object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmStopId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmStopId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as no pickup?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              <span>Are you sure there was no pickup at this address?</span>
              {stopForConfirm ? (
                <span className="block text-sm font-semibold text-slate-800">{stopForConfirm.address}</span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={confirmStopId ? isActionBusy(confirmStopId, "no_pickup") : false}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmStopId) {
                  handleNoPickup(confirmStopId);
                }
              }}
              disabled={confirmStopId ? isActionBusy(confirmStopId, "no_pickup") : false}
            >
              {confirmStopId && isActionBusy(confirmStopId, "no_pickup") ? "Updating…" : "Confirm no pickup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
