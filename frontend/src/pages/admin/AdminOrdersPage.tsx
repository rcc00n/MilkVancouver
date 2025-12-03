import axios from "axios";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchOrders } from "../../api/orders";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import type { OrderDetail } from "../../types/orders";
import { orderStatusStyles, orderTypeStyles } from "../../utils/stop-status-styles";

type LoadState = "loading" | "ready" | "error" | "no-access";

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = async () => {
    setState("loading");
    setErrorMessage(null);
    try {
      const data = await fetchOrders();
      setOrders(data);
      setState("ready");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          setState("no-access");
          return;
        }
      }
      setErrorMessage("Unable to load orders right now.");
      setState("error");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (state === "no-access") {
    return <NoAccess role="admin" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orders</p>
          <h1 className="text-2xl font-semibold text-slate-900">Orders overview</h1>
          <p className="text-sm text-slate-600">
            Latest 20 orders for authenticated users. Edit statuses in Django admin; this view stays read-only.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1"
            title="Open Django admin orders"
          >
            <a href="/admin/orders/order/" target="_blank" rel="noreferrer">
              Django admin <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
          <Button variant="secondary" size="sm" onClick={loadOrders} disabled={state === "loading"}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {state === "error" && errorMessage ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={loadOrders}>
            Retry
          </Button>
        </div>
      ) : null}

      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Recent orders</p>
            <p className="text-xs text-slate-500">
              Inline status badges mirror Django admin colors; edit statuses there.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Showing {orders.length || 0} of 20
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === "loading" ? <OrderTableSkeleton /> : null}
            {state === "ready" && orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-slate-600">
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : null}
            {state === "ready"
              ? orders.map((order) => {
                  const statusStyle = orderStatusStyles[order.status];
                  const typeStyle = orderTypeStyles[order.order_type];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-semibold text-slate-900">#{order.id}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-900">
                            {order.full_name || "—"}
                          </p>
                          <p className="text-xs text-slate-500">{order.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {order.region_name ? `${order.region_name} · ${order.region || ""}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`border ${typeStyle.badgeClass}`}>
                          <span className={`h-2 w-2 rounded-full ${typeStyle.dotClass}`} />
                          {typeStyle.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`border ${statusStyle.badgeClass}`}>
                          <span className={`h-2 w-2 rounded-full ${statusStyle.dotClass}`} />
                          {statusStyle.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">
                        {money.format(order.total_cents / 100)}
                      </TableCell>
                    </TableRow>
                  );
                })
              : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function OrderTableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((item) => (
        <TableRow key={item}>
          <TableCell>
            <Skeleton className="h-4 w-10 rounded-full bg-slate-200/70" />
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-full bg-slate-200/70" />
              <Skeleton className="h-3 w-28 rounded-full bg-slate-200/70" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28 rounded-full bg-slate-200/70" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20 rounded-full bg-slate-200/70" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24 rounded-full bg-slate-200/70" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-20 rounded-full bg-slate-200/70" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default AdminOrdersPage;
