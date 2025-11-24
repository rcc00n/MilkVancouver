import { Link, NavLink } from "react-router-dom";

import { useCart } from "../../context/CartContext";

type HeaderProps = {
  onCartClick?: () => void;
};

function Header({ onCartClick }: HeaderProps) {
  const { items, subtotalCents } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = (subtotalCents / 100).toFixed(2);
  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Menu", to: "/menu" },
    { label: "About Us", to: "/about-us" },
    { label: "Pricing", to: "/pricing" },
    { label: "Gallery", to: "/gallery" },
    { label: "Blog", to: "/blog" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container topbar__content">
          <div className="topbar__contact">
            <a href="mailto:hello@meatdirect.com">hello@meatdirect.com</a>
            <span className="divider">•</span>
            <a href="tel:555-123-4567">(555) 123-4567</a>
          </div>
          <div className="topbar__note">Local delivery · Grass-fed & hormone-free · Federally inspected</div>
        </div>
      </div>

      <div className="nav-shell">
        <div className="container nav">
          <Link to="/" className="brand">
            <span className="brand__mark">MD</span>
            <div>
              <div className="brand__name">MeatDirect</div>
              <div className="brand__tagline">From farms to your doorstep</div>
            </div>
          </Link>

          <nav className="nav__links">
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
            <NavLink to="/cart" className="nav__link nav__link--compact">
              Cart ({itemCount})
            </NavLink>
            <button
              type="button"
              onClick={onCartClick}
              className="header-cart-button"
              aria-label="Open cart"
            >
              <span>Cart</span>
              <span className="header-cart-button__meta">
                {itemCount} item{itemCount === 1 ? "" : "s"} · ${subtotal}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
