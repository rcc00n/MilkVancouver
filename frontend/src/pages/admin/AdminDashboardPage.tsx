import axios from "axios";
import { ArrowUpRight, Globe2, PackageCheck, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { fetchAdminDashboard } from "../../api/admin";
import NoAccess from "../../components/internal/NoAccess";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { AdminDashboard } from "../../types/admin";

type LoadState = "loading" | "ready" | "error" | "no-access";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    const load = async () => {
      setState("loading");
      try {
        const payload = await fetchAdminDashboard();
        setData(payload);
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

  const statusCounts = useMemo(() => {
    if (!data?.orders_by_status) return {};
    return data.orders_by_status;
  }, [data]);

  if (state === "no-access") {
    return <NoAccess role="admin" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Admin · Ops
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Revenue, order health, top regions and products at a glance.
          </p>
        </div>
      </div>

      {state === "loading" ? (
        <div className="text-sm text-slate-500">Loading admin metrics…</div>
      ) : null}

      {state === "error" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Unable to load dashboard right now.
        </div>
      ) : null}

      {state === "ready" && data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Total revenue"
              value={currency.format(data.total_sales)}
              helper="Paid orders"
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
            />
            <StatCard
              title="Paid"
              value={statusCounts["paid"] || 0}
              helper="orders"
              icon={<PackageCheck className="h-4 w-4 text-slate-600" aria-hidden="true" />}
            />
            <StatCard
              title="Completed"
              value={statusCounts["completed"] || 0}
              helper="orders"
              icon={<ArrowUpRight className="h-4 w-4 text-slate-600" aria-hidden="true" />}
            />
            <StatCard
              title="Cancelled"
              value={statusCounts["cancelled"] || 0}
              helper="orders"
              icon={<ArrowUpRight className="h-4 w-4 text-slate-600" aria-hidden="true" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <header className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Top regions
                  </p>
                  <p className="text-sm text-slate-600">Orders by region (top 5)</p>
                </div>
                <Globe2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </header>
              <div className="space-y-2">
                {data.top_regions.map((region) => (
                  <div
                    key={region.code}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-900">
                        {region.name} · {region.code}
                      </p>
                      <p className="text-xs text-slate-600">Orders: {region.order_count}</p>
                    </div>
                    <Badge variant="secondary">{region.order_count}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <header className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Top products
                  </p>
                  <p className="text-sm text-slate-600">Quantity sold (top 5)</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </header>
              <div className="space-y-2">
                {data.top_products.map((product) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-900">{product.product_name}</p>
                      <p className="text-xs text-slate-600">
                        Revenue: {currency.format(product.total_revenue_cents / 100)}
                      </p>
                    </div>
                    <Badge variant="secondary">{product.quantity_sold} sold</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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
}: {
  title: string;
  value: string | number;
  helper: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {icon}
      </div>
      <p className="text-xs text-slate-500">{helper}</p>
    </Card>
  );
}

export default AdminDashboardPage;
