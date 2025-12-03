import axios from "axios";
import {
  AlertOctagon,
  ArrowUpRight,
  Globe2,
  LockKeyhole,
  PackageCheck,
  Route,
  ShoppingBag,
  TrendingUp,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchAdminDashboard } from "../../api/admin";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { cn } from "../../components/ui/utils";
import { AdminDashboard } from "../../types/admin";

type LoadState = "loading" | "ready" | "error" | "no-access";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setState("loading");
    setErrorMessage(null);
    try {
      const payload = await fetchAdminDashboard();
      setData(payload);
      setState("ready");
    } catch (err) {
      setData(null);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          setState("no-access");
          return;
        }
        if (status && status >= 500) {
          setErrorMessage("Something went wrong. Try again or contact support.");
        } else {
          setErrorMessage("Unable to load dashboard right now.");
        }
      } else {
        setErrorMessage("Something went wrong. Try again or contact support.");
      }
      setState("error");
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statusCounts = useMemo(() => {
    const defaults = { paid: 0, completed: 0, cancelled: 0 };
    if (!data?.orders_by_status) return defaults;

    return Object.entries(data.orders_by_status).reduce((acc, [status, count]) => {
      const key = status.toLowerCase() as keyof typeof defaults;
      if (key in acc) {
        acc[key] = count || 0;
      }
      return acc;
    }, { ...defaults });
  }, [data]);

  if (state === "no-access") {
    return <AdminOnlyPanel />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Admin · Ops
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Revenue, order health, top regions and products at a glance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/routes">
              <Route className="h-4 w-4" aria-hidden="true" />
              View routes
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/admin/clients">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              View clients
            </Link>
          </Button>
        </div>
      </div>

      {state === "loading" ? (
        <Card className="border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading admin metrics…
        </Card>
      ) : null}

      {state === "error" && errorMessage ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadDashboard}>
            Retry
          </Button>
        </Card>
      ) : null}

      {state === "ready" && data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Total sales"
              value={currency.format((data.total_sales_cents || 0) / 100)}
              helper="All paid order revenue"
              icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
              highlight
              className="lg:col-span-2"
            />
            <StatCard
              title="Paid"
              value={statusCounts["paid"] || 0}
              helper="Orders marked paid"
              icon={<PackageCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
            />
            <StatCard
              title="Completed"
              value={statusCounts["completed"] || 0}
              helper="Orders delivered"
              icon={<ArrowUpRight className="h-4 w-4 text-blue-600" aria-hidden="true" />}
            />
            <StatCard
              title="Cancelled"
              value={statusCounts["cancelled"] || 0}
              helper="Orders not fulfilled"
              icon={<XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />}
            />
          </div>

          <Card className="border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Top regions
                </p>
                <p className="text-sm text-slate-600">Orders by region (top 5)</p>
              </div>
              <Globe2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </header>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_regions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500">
                      No regions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.top_regions.map((region) => (
                    <TableRow key={region.code}>
                      <TableCell className="font-semibold text-slate-900">
                        {region.name} · {region.code}
                      </TableCell>
                      <TableCell>{region.order_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <Card className="border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Top products
                </p>
                <p className="text-sm text-slate-600">Quantity sold and revenue (top 5)</p>
              </div>
              <ShoppingBag className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </header>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty sold</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500">
                      No products yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.top_products.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-semibold text-slate-900">
                        {product.product_name}
                      </TableCell>
                      <TableCell>{product.quantity_sold}</TableCell>
                      <TableCell>{currency.format(product.total_revenue_cents / 100)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  helper,
  icon,
  highlight,
  className,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-slate-200 bg-white p-4 shadow-sm",
        highlight && "bg-slate-900 text-white",
        className,
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wide text-slate-500",
          highlight && "text-slate-100",
        )}
      >
        {title}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <p className={cn("text-2xl font-bold text-slate-900", highlight && "text-white")}>{value}</p>
        {icon}
      </div>
      <p className={cn("text-xs text-slate-500", highlight && "text-slate-200")}>{helper}</p>
    </Card>
  );
}

function AdminOnlyPanel() {
  return (
    <Card className="mx-auto flex max-w-xl flex-col items-center gap-3 border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-800">
        <LockKeyhole className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-900">Admin only</p>
        <p className="text-sm text-slate-600">
          Sign in with an admin account to view the dashboard.
        </p>
      </div>
      <div className="text-sm text-slate-600">
        Need help? <Link to="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">Contact support</Link>.
      </div>
    </Card>
  );
}

export default AdminDashboardPage;
