import {
  Gauge,
  LayoutDashboard,
  Menu,
  Receipt,
  Route,
  UsersRound,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

import AreaSwitcher from "../components/internal/AreaSwitcher";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
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
  const { user } = useSession();

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
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AdminLayout;
