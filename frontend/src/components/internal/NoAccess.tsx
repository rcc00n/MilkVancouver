import { AlertTriangle, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

type NoAccessProps = {
  role?: "admin" | "driver" | "generic";
  message?: string;
};

function NoAccess({ role = "generic", message }: NoAccessProps) {
  const presets: Record<
    NonNullable<NoAccessProps["role"]>,
    { title: string; description: string }
  > = {
    admin: {
      title: "No admin access",
      description:
        "You need an admin account to view this panel. Try signing in with an admin user.",
    },
    driver: {
      title: "No driver access",
      description:
        "You need a Driver profile to view delivery routes. If you’re a driver, sign in with your driver account.",
    },
    generic: {
      title: "No access",
      description: "You do not have permission to view this screen.",
    },
  };

  const preset = presets[role];

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-2xl border border-dashed border-border bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        {role === "admin" || role === "driver" ? (
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold">{preset.title}</p>
        <p className="text-sm text-muted-foreground">{message || preset.description}</p>
      </div>
      <div className="flex items-center justify-center gap-3 text-sm">
        <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
          Go to customer area
        </Link>
        <span aria-hidden="true" className="text-muted-foreground">
          •
        </span>
        <Link to="/contact" className="text-muted-foreground underline-offset-4 hover:underline">
          Contact support
        </Link>
      </div>
    </div>
  );
}

export default NoAccess;
