import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { brand } from "../../config/brand";
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
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

function Header({ onCartClick }: HeaderProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialAuthTab, setInitialAuthTab] = useState<"login" | "signup">("login");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { isAuthenticated, me, logout } = useAuth();

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

  const mobileNavLayer = (
    <>
      <div className={`mobile-nav ${isMobileOpen ? "is-open" : ""}`} aria-hidden={!isMobileOpen}>
        <div className="mobile-nav__header">
          <Link to="/" className="nav-brand nav-brand--mobile" onClick={closeMobileMenu}>
            <span className="nav-brand__word">{brand.name}</span>
          </Link>
          <button type="button" className="mobile-nav__close" aria-label="Close menu" onClick={closeMobileMenu}>
            ✕
          </button>
        </div>

        <div className="mobile-nav__links">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `mobile-nav__link ${isActive ? "is-active" : ""}`}
              onClick={closeMobileMenu}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="mobile-nav__links">
          <AreaSwitcher align="start" size="sm" />
        </div>

        <div className="mobile-nav__cta">
          <Link to="/shop" className="nav-cta nav-cta--full" onClick={closeMobileMenu}>
            Shop Now
          </Link>
          <button
            type="button"
            className="mobile-nav__cart"
            onClick={handleCartClick}
            aria-label="Open cart"
            title="Cart"
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
          </button>
          {!isAuthenticated ? (
            <>
              <button
                type="button"
                className="nav-cta nav-cta--full"
                onClick={() => openAuth("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                className="nav-cta nav-cta--full"
                onClick={() => openAuth("signup")}
              >
                Create account
              </button>
            </>
          ) : (
            <div className="mobile-nav__links">
              <div className="mobile-nav__link">
                <div className="font-semibold">{accountLabel}</div>
                <div className="text-sm text-slate-600">{me?.user.email}</div>
              </div>
              <Link to="/account" className="mobile-nav__link" onClick={closeMobileMenu}>
                My profile
              </Link>
              <Link to="/account?tab=orders" className="mobile-nav__link" onClick={closeMobileMenu}>
                My orders
              </Link>
              <button type="button" className="nav-cta nav-cta--full" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className={`mobile-nav__backdrop ${isMobileOpen ? "is-visible" : ""}`}
        onClick={closeMobileMenu}
        role="presentation"
      />
    </>
  );

  return (
    <header className="site-header">
      <div className="nav-surface">
        <div className="container nav-bar nav-bar--full flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <Link to="/" className="nav-brand shrink-0" onClick={closeMobileMenu}>
              <span className="nav-brand__word">{brand.name}</span>
              <span className="nav-brand__dot" aria-hidden="true">
                ●
              </span>
              <span className="nav-brand__tagline">{brand.tagline}</span>
            </Link>

            <nav className="nav-links" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              onClick={handleCartClick}
              className="nav-cart nav-cart--icon"
              aria-label="Open cart"
              title="Cart"
            >
              <ShoppingCart className="size-5" aria-hidden="true" />
            </button>
            <Link to="/shop" className="nav-cta">
              Shop Now
            </Link>
            {!isAuthenticated ? (
              <>
                <button type="button" className="nav-link" onClick={() => openAuth("login")}>
                  Sign in
                </button>
                <button type="button" className="nav-link" onClick={() => openAuth("signup")}>
                  Create account
                </button>
              </>
            ) : (
              <DropdownMenu open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="nav-link">
                    {accountLabel}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
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
                    variant="destructive"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button
              type="button"
              className={`nav-toggle ${isMobileOpen ? "is-active" : ""}`}
              aria-expanded={isMobileOpen}
              aria-label="Toggle navigation menu"
              onClick={toggleMobileMenu}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>

      {portalTarget ? createPortal(mobileNavLayer, portalTarget) : mobileNavLayer}
      <AuthModal open={isAuthOpen} onClose={closeAuth} initialTab={initialAuthTab} />
    </header>
  );
}

export default Header;
