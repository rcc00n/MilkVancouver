import type { CSSProperties } from "react";
import { Link, NavLink } from "react-router-dom";

import { useCart } from "../../context/CartContext";

const navLinkStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  fontWeight: 600,
};

function Header() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(10px)",
        background: "rgba(255, 255, 255, 0.8)",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          width: "min(1100px, 95vw)",
          margin: "0 auto",
          padding: "18px 0",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              color: "#fff",
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          >
            MD
          </span>
          <div>
            <div style={{ fontWeight: 700 }}>MeatDirect</div>
            <div style={{ fontSize: 12, color: "#475569" }}>Direct-to-door craft meat</div>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <NavLink to="/" style={navLinkStyle}>
            Home
          </NavLink>
          <NavLink to="/cart" style={navLinkStyle}>
            Cart ({itemCount})
          </NavLink>
          <NavLink to="/checkout" style={navLinkStyle}>
            Checkout
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;
