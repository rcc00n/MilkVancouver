import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { brand } from "../../config/brand";

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
  const { items, subtotalCents } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = (subtotalCents / 100).toFixed(2);

  useEffect(() => {
    document.body.classList.toggle("nav-open", isMobileOpen);
    return () => document.body.classList.remove("nav-open");
  }, [isMobileOpen]);

  const toggleMobileMenu = () => setIsMobileOpen((open) => !open);
  const closeMobileMenu = () => setIsMobileOpen(false);

  const handleCartClick = () => {
    onCartClick?.();
    closeMobileMenu();
  };

  return (
    <header className="site-header">
      <div className="nav-surface">
        <div className="container nav-bar">
          <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
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

          <div className="nav-actions">
            <button type="button" onClick={handleCartClick} className="nav-cart" aria-label="Open cart">
              <span className="nav-cart__count">{itemCount}</span>
              <span className="nav-cart__label">Cart · ${subtotal}</span>
            </button>
            <Link to="/shop" className="nav-cta">
              Shop Now
            </Link>
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

        <div className="mobile-nav__cta">
          <Link to="/shop" className="nav-cta nav-cta--full" onClick={closeMobileMenu}>
            Shop Now
          </Link>
          <button type="button" className="mobile-nav__cart" onClick={handleCartClick}>
            Cart · {itemCount} item{itemCount === 1 ? "" : "s"} (${subtotal})
          </button>
        </div>
      </div>
      <div
        className={`mobile-nav__backdrop ${isMobileOpen ? "is-visible" : ""}`}
        onClick={closeMobileMenu}
        role="presentation"
      />
    </header>
  );
}

export default Header;
