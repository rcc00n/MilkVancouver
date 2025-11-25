import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import logo from "../../assets/logo.png";

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
    { label: "Shop", to: "/menu" },
    { label: "Pricing", to: "/pricing" },
    { label: "About", to: "/about-us" },
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
      <div className="container nav-shell">
        <Link to="/" className="brand">
          <img src={logo} alt="MeatDirect logo" className="brand__logo" />
          <div>
            <div className="brand__name">MeatDirect</div>
            <div className="brand__tagline">Quality local meat delivered</div>
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
            <a href="tel:555-123-4567">(555) 123-4567</a>
            <a href="mailto:hello@meatdirect.com">hello@meatdirect.com</a>
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
