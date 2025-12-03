import axios from "axios";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchAdminClients } from "../../api/admin";
import NoAccess from "../../components/internal/NoAccess";
import { Card } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { ClientStats } from "../../types/admin";

type LoadState = "loading" | "ready" | "error" | "no-access";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function AdminClientsPage() {
  const [clients, setClients] = useState<ClientStats[]>([]);
  const [state, setState] = useState<LoadState>("loading");

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

  if (state === "no-access") {
    return <NoAccess role="admin" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Clients</p>
          <h1 className="text-2xl font-semibold text-slate-900">Client list</h1>
          <p className="text-sm text-slate-600">Total orders, spend, and typical region.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <Users className="h-4 w-4" aria-hidden="true" />
          {clients.length} customers
        </div>
      </div>

      {state === "loading" ? <div className="text-sm text-slate-500">Loading clients…</div> : null}
      {state === "error" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Unable to load clients right now.
        </div>
      ) : null}

      {state === "ready" ? (
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
              {clients.map((client) => (
                <TableRow key={client.user_id}>
                  <TableCell className="font-semibold">{client.email}</TableCell>
                  <TableCell>{client.total_orders}</TableCell>
                  <TableCell>{currency.format(client.total_spent)}</TableCell>
                  <TableCell>
                    {client.most_frequent_region ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {client.most_frequent_region.name} · {client.most_frequent_region.code}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
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

export default AdminClientsPage;
