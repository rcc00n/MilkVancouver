import { Car, LogIn, Store } from "lucide-react";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

import { useSession } from "../../context/SessionContext";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";

type AreaLink = {
  label: string;
  to: string;
  icon: ReactNode;
  visible: boolean;
  description?: string;
};

type AreaSwitcherProps = {
  align?: "start" | "center" | "end";
  size?: "default" | "sm";
};

function AreaSwitcher({ align = "end", size = "default" }: AreaSwitcherProps) {
  const { status, user, capabilities, checkingAccess } = useSession();

  const areas: AreaLink[] = [
    {
      label: "Customer area",
      to: "/",
      icon: <Store className="h-4 w-4" aria-hidden="true" />,
      visible: true,
      description: "Public storefront",
    },
    {
      label: "Driver area",
      to: "/driver",
      icon: <Car className="h-4 w-4" aria-hidden="true" />,
      visible: capabilities.isDriver || checkingAccess,
      description: "Routes assigned to you",
    },
  ];

  if (status === "anonymous" && !checkingAccess) {
    return null;
  }

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Workspace";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className="border border-border bg-white/70 text-sm font-semibold shadow-sm hover:bg-white"
        >
          {name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Switch area
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {areas
          .filter((area) => area.visible)
          .map((area) => (
            <DropdownMenuItem key={area.to} asChild className="gap-2 p-2">
              <Link to={area.to} className="flex items-start gap-3">
                <span className="mt-0.5">{area.icon}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold leading-tight">{area.label}</span>
                  {area.description ? (
                    <span className="text-xs text-muted-foreground">{area.description}</span>
                  ) : null}
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        {status === "anonymous" ? (
          <>
            <Separator className="my-1" />
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>Sign in to see driver or admin areas.</span>
            </div>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AreaSwitcher;
