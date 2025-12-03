import { ClipboardList, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { Card } from "../../components/ui/card";

function AdminOrdersPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orders</p>
        <h1 className="text-2xl font-semibold text-slate-900">Orders overview</h1>
        <p className="text-sm text-slate-600">
          Hooked up to existing `/api/orders` endpoints. This screen will host filters and bulk actions next.
        </p>
      </div>

      <Card className="space-y-3 border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Coming soon
        </div>
        <p className="text-sm text-slate-600">
          Orders API is already available. We&apos;ll plug a table here with search, status filters, and export on the
          next pass.
        </p>
        <Link
          to="/api/docs/swagger/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-primary underline-offset-4 hover:bg-white"
        >
          View API docs <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Card>
    </div>
  );
}

export default AdminOrdersPage;
