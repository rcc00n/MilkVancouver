import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router-dom";
import { Menu, ShoppingCart, User, X } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { brand } from "../../config/brand";
import { useSiteImage } from "../../hooks/useSiteImage";
import logoAsset from "../../assets/logo.svg";
import AuthModal from "../auth/AuthModal";
import AreaSwitcher from "../internal/AreaSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type HeaderProps = {
  onCartClick?: () => void;
};

const navLinks = [
  { label: "Products", to: "/shop" },
  { label: "School Delivery", to: "/pricing" },
  { label: "Shop", to: "/shop" },
  { label: "Our Story", to: "/about" },
];

function Header({ onCartClick }: HeaderProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialAuthTab, setInitialAuthTab] = useState<"login" | "signup">("login");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { isAuthenticated, me, logout } = useAuth();
  const { items } = useCart();
  const brandLogo = useSiteImage("brand.logo", {
    fallbackUrl: logoAsset,
    alt: brand.name,
  });

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    document.body.classList.toggle("nav-open", isMobileOpen);
    return () => document.body.classList.remove("nav-open");
  }, [isMobileOpen]);

  const toggleMobileMenu = () => setIsMobileOpen((open) => !open);
  const closeMobileMenu = () => setIsMobileOpen(false);
  const openAuth = (tab: "login" | "signup") => {
    setInitialAuthTab(tab);
    setIsAuthOpen(true);
    closeMobileMenu();
  };
  const closeAuth = () => setIsAuthOpen(false);
  const closeAccountMenu = () => setAccountMenuOpen(false);

  const accountLabel = useMemo(() => {
    const firstName = me?.user.first_name?.trim();
    if (firstName) return firstName;
    const email = me?.user.email?.trim();
    return email || "Account";
  }, [me]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      closeAccountMenu();
      closeMobileMenu();
    }
  };

  const handleCartClick = () => {
    onCartClick?.();
    closeMobileMenu();
  };

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "text-sm font-semibold tracking-wide transition-colors",
      isActive ? "text-[#5b0b99]" : "text-[#6A0DAD]/90 hover:text-[#5b0b99]",
    ].join(" ");

  const mobileNavLayer = (
    <>
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobileMenu}
        aria-hidden
      />
      <div
        className={`fixed inset-y-0 left-0 right-0 bg-[#FFE74C] text-[#1a0a2e] shadow-2xl transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#6A0DAD]/15">
          <Link
            to="/"
            className="flex items-center"
            onClick={closeMobileMenu}
          >
            <span className="sr-only">{brand.name}</span>
            <img
              src={brandLogo.url}
              alt={brandLogo.alt}
              className="h-16 w-auto shrink-0 drop-shadow-lg"
              loading="eager"
            />
          </Link>
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 text-[#6A0DAD] shadow"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 py-6 space-y-6 overflow-y-auto pb-10">
          <nav className="space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block rounded-xl bg-white/70 px-4 py-3 text-sm font-semibold tracking-wide text-[#6A0DAD] shadow-md transition hover:bg-white ${
                    isActive ? "ring-2 ring-[#6A0DAD]" : ""
                  }`
                }
                onClick={closeMobileMenu}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="grid gap-3">
            <AreaSwitcher align="start" size="sm" />

            <button
              type="button"
              onClick={handleCartClick}
              className="flex items-center justify-between rounded-full bg-[#6A0DAD] px-4 py-3 text-[#FFE74C] font-semibold shadow-lg"
            >
              <span className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                Cart
              </span>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#FFE74C] text-[#6A0DAD]">
                {cartCount}
              </span>
            </button>

            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="w-full rounded-full bg-white/80 px-4 py-3 text-sm font-semibold text-[#6A0DAD] shadow"
                  onClick={() => openAuth("login")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className="w-full rounded-full bg-[#6A0DAD] px-4 py-3 text-sm font-semibold text-[#FFE74C] shadow-lg"
                  onClick={() => openAuth("signup")}
                >
                  Create account
                </button>
              </>
            ) : (
              <div className="grid gap-3 rounded-2xl bg-white/80 p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#FFE74C] text-[#6A0DAD] font-black uppercase">
                    {accountLabel.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#6A0DAD]">{accountLabel}</span>
                    <span className="text-xs text-[#6A0DAD]/80">{me?.user.email}</span>
                  </div>
                </div>
                <Link
                  to="/account"
                  onClick={closeMobileMenu}
                  className="rounded-full bg-[#6A0DAD]/10 px-4 py-2 text-sm font-semibold text-[#6A0DAD] hover:bg-[#6A0DAD]/15"
                >
                  Account
                </Link>
                <Link
                  to="/account?tab=orders"
                  onClick={closeMobileMenu}
                  className="rounded-full bg-[#6A0DAD]/10 px-4 py-2 text-sm font-semibold text-[#6A0DAD] hover:bg-[#6A0DAD]/15"
                >
                  My orders
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full bg-[#6A0DAD] px-4 py-2 text-sm font-semibold text-[#FFE74C] shadow"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <header className="site-header sticky top-0 z-50">
      <div className="bg-[#FFE74C] border-b border-[#6A0DAD]/20 shadow-[0_18px_48px_-28px_rgba(106,13,173,0.55)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="flex items-center"
                onClick={closeMobileMenu}
              >
                <span className="sr-only">{brand.name}</span>
                <img
                  src={brandLogo.url}
                  alt={brandLogo.alt}
                  className="h-16 w-auto shrink-0 drop-shadow-md"
                  loading="eager"
                />
              </Link>

              <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
                {navLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className={navLinkClass}>
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* <div className="hidden lg:block">
                <AreaSwitcher />
              </div> */}

              {isAuthenticated ? (
                <DropdownMenu open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#6A0DAD] transition hover:text-[#5b0b99]"
                    >
                      <User className="h-5 w-5" aria-hidden="true" />
                      <span className="hidden md:inline">{accountLabel}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    <DropdownMenuLabel>
                      Signed in as
                      <br />
                      <span className="font-semibold">{me?.user.email}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/account">My profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account?tab=orders">My orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        handleLogout();
                      }}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full px-3 py-2 text-sm font-semibold text-[#6A0DAD] transition hover:text-[#5b0b99]"
                    onClick={() => openAuth("login")}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-3 py-2 text-sm font-semibold text-[#6A0DAD] transition hover:text-[#5b0b99]"
                    onClick={() => openAuth("signup")}
                  >
                    Create account
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleCartClick}
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-[#6A0DAD] transition hover:text-[#5b0b99]"
                aria-label="Open cart"
                title="Cart"
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-[#6A0DAD] px-1 text-[11px] font-semibold text-[#FFE74C] shadow">
                  {cartCount}
                </span>
              </button>

              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full text-[#6A0DAD] md:hidden"
                aria-label="Open menu"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        
      </div>

      {portalTarget ? createPortal(mobileNavLayer, portalTarget) : mobileNavLayer}
      <AuthModal open={isAuthOpen} onClose={closeAuth} initialTab={initialAuthTab} />
    </header>
  );
}

export default Header;
