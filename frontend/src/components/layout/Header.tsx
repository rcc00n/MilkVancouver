import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { brand } from "../../config/brand";
import logo from "../../assets/logo.svg";

type HeaderProps = {
  onCartClick?: () => void;
};

function Header({ onCartClick }: HeaderProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { items, subtotalCents } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = (subtotalCents / 100).toFixed(2);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/shop" },
    { label: "Pricing", to: "/pricing" },
    { label: "About", to: "/about" },
    { label: "Blog", to: "/blog" },
    { label: "Contact", to: "/contact" },
  ];

  const toggleMobileMenu = () => setIsMobileOpen((open) => !open);
  const closeMobileMenu = () => setIsMobileOpen(false);

  const handleCartClick = () => {
    onCartClick?.();
    closeMobileMenu();
  };

  return (
    <header className="site-header">
      <div className="header-ribbon">
        <div className="container header-ribbon__content">
          <div className="header-ribbon__left">
            <span className="header-ribbon__badge">Vancouver · BC dairy</span>
            <span className="header-ribbon__note">Bottled at dawn • Cold chain 0–4°C</span>
          </div>
          <div className="header-ribbon__right">
            <a href={`tel:${brand.phone.replace(/[^\d+]/g, "")}`} className="header-ribbon__link">
              Call {brand.phone}
            </a>
            <span className="header-ribbon__divider" aria-hidden="true">
              ·
            </span>
            <a href={`mailto:${brand.email}`} className="header-ribbon__link">
              {brand.email}
            </a>
            <span className="header-ribbon__pill">{brand.supportHours}</span>
          </div>
        </div>
      </div>
      <div className="container nav-shell">
        <Link to="/" className="brand">
          <img src={logo} alt={`${brand.name} logo`} className="brand__logo" />
          <div>
            <div className="brand__name">{brand.name}</div>
            <div className="brand__tagline">Fresh BC dairy bottled in Vancouver</div>
          </div>
        </Link>

        <nav className="nav__links nav__links--desktop">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav__actions">
          <button type="button" onClick={handleCartClick} className="nav__cart" aria-label="Open cart">
            <span>Cart: ${subtotal}</span>
            <span className="nav__cart-count">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
          </button>
          <button
            type="button"
            className={`nav__toggle ${isMobileOpen ? "is-active" : ""}`}
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

      <div className={`nav-drawer ${isMobileOpen ? "is-open" : ""}`}>
        <div className="nav-drawer__header">
          <div className="brand__name">Menu</div>
          <button type="button" className="nav-drawer__close" onClick={closeMobileMenu}>
            Close
          </button>
        </div>
        <div className="nav-drawer__links">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-drawer__link ${isActive ? "is-active" : ""}`}
              onClick={closeMobileMenu}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="nav-drawer__meta">
          <button type="button" className="btn btn--solid btn--full" onClick={handleCartClick}>
            Cart · ${subtotal}
          </button>
          <div className="nav-drawer__contact">
            <a href={`tel:${brand.phone.replace(/[^\d+]/g, "")}`}>{brand.phone}</a>
            <a href={`mailto:${brand.email}`}>{brand.email}</a>
          </div>
        </div>
      </div>
      <div
        className={`nav-drawer__backdrop ${isMobileOpen ? "is-active" : ""}`}
        onClick={closeMobileMenu}
        role="presentation"
      />
    </header>
  );
}

export default Header;
