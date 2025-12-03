import { CalendarClock, Route } from "lucide-react";
import { Toaster } from "sonner";
import { Outlet, NavLink } from "react-router-dom";

import AreaSwitcher from "../components/internal/AreaSwitcher";

const tabs = [
  { label: "Today", to: "/driver" },
  { label: "Upcoming", to: "/driver/upcoming" },
];

function DriverLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-slate-50 shadow-sm">
              <Route className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Driver console</p>
              <p className="text-xs text-slate-500">MilkVanQ delivery</p>
            </div>
          </div>
          <AreaSwitcher size="sm" />
        </div>
        <div className="border-t border-slate-200">
          <nav className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700">
            <CalendarClock className="mr-1 h-4 w-4 text-slate-500" aria-hidden="true" />
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === "/driver"}
                className={({ isActive }) =>
                  [
                    "rounded-full px-3 py-1 transition",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "hover:bg-slate-100 text-slate-700",
                  ].join(" ")
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-5">
        <Outlet />
      </main>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default DriverLayout;
