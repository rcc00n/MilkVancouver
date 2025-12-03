import axios from "axios";
import { ExternalLink, MapPin, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchAdminClients } from "../../api/admin";
import { fetchOrders } from "../../api/orders";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "../../components/ui/drawer";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { ClientStats } from "../../types/admin";
import { OrderDetail } from "../../types/orders";
import { orderStatusStyles, orderTypeStyles } from "../../utils/stop-status-styles";

type LoadState = "loading" | "ready" | "error" | "no-access";
type SortBy = "spent" | "orders" | "email";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function AdminClientsPage() {
  const [clients, setClients] = useState<ClientStats[]>([]);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [ordersState, setOrdersState] = useState<LoadState>("loading");
  const [selectedClient, setSelectedClient] = useState<ClientStats | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("spent");

  useEffect(() => {
    const load = async () => {
      setState("loading");
      try {
        const data = await fetchAdminClients();
        setClients(data);
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

  useEffect(() => {
    const loadOrders = async () => {
      setOrdersState("loading");
      try {
        const data = await fetchOrders();
        setOrders(data);
        setOrdersState("ready");
      } catch (err) {
        setOrdersState("error");
      }
    };

    // Load once so drawers can show recent orders.
    loadOrders();
  }, []);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? clients.filter((client) => client.email.toLowerCase().includes(term))
      : clients;

    return [...filtered].sort((a, b) => {
      if (sortBy === "orders") {
        return b.total_orders - a.total_orders;
      }
      if (sortBy === "email") {
        return a.email.localeCompare(b.email);
      }
      return b.total_spent_cents - a.total_spent_cents;
    });
  }, [clients, search, sortBy]);

  const selectedOrders = useMemo(() => {
    if (!selectedClient) return [];
    return orders.filter(
      (order) => order.email && order.email.toLowerCase() === selectedClient.email.toLowerCase(),
    );
  }, [orders, selectedClient]);

  if (state === "no-access") {
    return <NoAccess role="admin" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Clients</p>
          <h1 className="text-2xl font-semibold text-slate-900">Client list</h1>
          <p className="text-sm text-slate-600">
            Search by email, sort by value, and peek at their latest orders.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <Users className="h-4 w-4" aria-hidden="true" />
          {clients.length} customers
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search email…"
            className="pl-9"
            aria-label="Search clients by email"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span>Sort by:</span>
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {([
              { value: "spent", label: "Total spent" },
              { value: "orders", label: "Total orders" },
              { value: "email", label: "Email" },
            ] as { value: SortBy; label: string }[]).map((option) => {
              const isActive = sortBy === option.value;
              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant={isActive ? "default" : "ghost"}
                  className="rounded-full px-3"
                  onClick={() => setSortBy(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {state === "error" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Unable to load clients right now.
        </div>
      ) : null}

      <Card className="overflow-hidden border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Total orders</TableHead>
              <TableHead>Total spent</TableHead>
              <TableHead>Top region</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === "loading" ? <ClientTableSkeleton /> : null}
            {state === "ready" && filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-slate-600">
                  No clients match that search.
                </TableCell>
              </TableRow>
            ) : null}
            {state === "ready"
              ? filteredClients.map((client) => (
                  <TableRow
                    key={client.user_id}
                    className="cursor-pointer transition hover:bg-slate-50/80"
                    onClick={() => setSelectedClient(client)}
                  >
                    <TableCell className="font-semibold">{client.email}</TableCell>
                    <TableCell>{client.total_orders}</TableCell>
                    <TableCell>{currency.format(client.total_spent)}</TableCell>
                    <TableCell>
                      {client.most_frequent_region ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                          {client.most_frequent_region.name} · {client.most_frequent_region.code}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </Card>

      <Drawer open={Boolean(selectedClient)} onOpenChange={(open) => !open && setSelectedClient(null)} direction="right">
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader className="space-y-1 pb-2">
            <DrawerTitle className="text-lg font-semibold text-slate-900">Client details</DrawerTitle>
            <DrawerDescription className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {selectedClient?.email}
            </DrawerDescription>
            {selectedClient ? (
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
                <Badge variant="secondary">Orders: {selectedClient.total_orders}</Badge>
                <Badge variant="outline">Total spent: {money.format(selectedClient.total_spent)}</Badge>
                {selectedClient.most_frequent_region ? (
                  <Badge variant="outline">
                    Region {selectedClient.most_frequent_region.code} · {selectedClient.most_frequent_region.name}
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </DrawerHeader>

          {selectedClient ? (
            <div className="space-y-3 border-t px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Latest orders</p>
                    <p className="text-xs text-slate-500">Filtered by email; pulls the recent 20 orders.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
                    <Link
                      to={`/admin/orders`}
                      className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                      View orders
                    </Link>
                    <a
                      href={`/admin/orders/order/?q=${encodeURIComponent(selectedClient.email)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                    >
                      Orders in Django admin{" "}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    <a
                      href={`/admin/auth/user/?q=${encodeURIComponent(selectedClient.email)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                    >
                      User in Django admin <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>

              {ordersState === "loading" ? <OrderSkeleton /> : null}
              {ordersState === "error" ? (
                <p className="text-sm text-amber-700">Could not load recent orders.</p>
              ) : null}
              {ordersState === "ready" && selectedOrders.length === 0 ? (
                <p className="text-sm text-slate-600">No recent orders for this email.</p>
              ) : null}
              {ordersState === "ready" && selectedOrders.length > 0 ? (
                <div className="space-y-2">
                  {selectedOrders.map((order) => {
                    const statusStyle = orderStatusStyles[order.status];
                    const typeStyle = orderTypeStyles[order.order_type];
                    return (
                      <div
                        key={order.id}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-slate-900">
                              Order #{order.id}
                            </p>
                            <p className="text-xs text-slate-600">
                              {new Date(order.created_at).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-xs text-slate-500">
                              {order.region_name ? `${order.region_name} · ${order.region || ""}` : "Region pending"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex justify-end gap-1">
                              <Badge className={`border ${typeStyle.badgeClass}`}>
                                <span className={`h-2 w-2 rounded-full ${typeStyle.dotClass}`} />
                                {typeStyle.label}
                              </Badge>
                              <Badge className={`border ${statusStyle.badgeClass}`}>
                                <span className={`h-2 w-2 rounded-full ${statusStyle.dotClass}`} />
                                {statusStyle.label}
                              </Badge>
                            </div>
                            <p className="text-sm font-bold text-slate-900">
                              {money.format(order.total_cents / 100)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function ClientTableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <TableRow key={item}>
          <TableCell>
            <Skeleton className="h-4 w-44 rounded-full bg-slate-200/70" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16 rounded-full bg-slate-200/70" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 rounded-full bg-slate-200/70" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-32 rounded-full bg-slate-200/70" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function OrderSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((item) => (
        <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-full bg-slate-200/70" />
              <Skeleton className="h-3 w-32 rounded-full bg-slate-200/70" />
              <Skeleton className="h-3 w-28 rounded-full bg-slate-200/70" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-24 rounded-full bg-slate-200/70" />
              <Skeleton className="h-6 w-28 rounded-full bg-slate-200/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminClientsPage;
