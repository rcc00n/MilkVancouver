import { useState } from "react";
import { Gauge, HelpCircle, LayoutDashboard, Menu, Receipt, Route, UsersRound } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

import AreaSwitcher from "../components/internal/AreaSwitcher";
import NoAccess from "../components/internal/NoAccess";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "../components/ui/sidebar";
import { useSession } from "../context/SessionContext";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Clients", to: "/admin/clients", icon: <UsersRound className="h-4 w-4" /> },
  { label: "Routes", to: "/admin/routes", icon: <Route className="h-4 w-4" /> },
  { label: "Orders", to: "/admin/orders", icon: <Receipt className="h-4 w-4" /> },
];

function AdminLayout() {
  const { pathname } = useLocation();
  const { user, status, capabilities, checkingAccess } = useSession();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  if (status === "loading" || checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          Checking admin access…
        </div>
      </div>
    );
  }

  if (!capabilities.canAccessAdmin) {
    return <NoAccess role="admin" />;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-2 py-1.5">
            <Gauge className="h-4 w-4" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Admin panel</p>
              <p className="text-xs text-sidebar-foreground/70">Operations</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.to || (item.to !== "/admin" && pathname.startsWith(item.to));
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.to} className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <AreaSwitcher align="start" />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-white px-4">
          <SidebarTrigger className="text-slate-700" />
          <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
            <Menu className="h-4 w-4" aria-hidden="true" />
            Internal tools
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-slate-700"
              onClick={() => setIsHelpOpen(true)}
              title="What lives in this admin?"
            >
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Open admin help</span>
            </Button>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "Admin"}
              </p>
              <p className="text-xs text-slate-500">{user?.email || "Signed in"}</p>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback>{user?.email?.slice(0, 2).toUpperCase() || "AD"}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <div className="bg-slate-50">
          <div className="mx-auto w-full max-w-6xl px-4 py-5">
            <Outlet />
          </div>
        </div>
        <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Admin quick guide</DialogTitle>
              <DialogDescription>
                Short reminders for Dashboard, Routes, and Clients.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">Dashboard</p>
                <p className="text-slate-600">
                  Revenue totals plus paid/completed/cancelled counts. Top regions and products mirror the Django admin.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Routes</p>
                <p className="text-slate-600">
                  Filter by date, region, or driver. Open a route to reorder stops and review proof photos.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Clients</p>
                <p className="text-slate-600">
                  Search by email, sort by spend/orders, and open a drawer to see their recent orders before hopping to Django admin.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Tip: Use Django admin for quick status edits on orders and deliveries.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AdminLayout;
