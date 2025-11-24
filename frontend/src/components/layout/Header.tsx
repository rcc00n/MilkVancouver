import type { CSSProperties } from "react";
import { Link, NavLink } from "react-router-dom";

import { useCart } from "../../context/CartContext";

interface HeaderProps {
  onCartClick: () => void;
}

const navLinkStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  fontWeight: 600,
};

function Header({ onCartClick }: HeaderProps) {
  const { itemCount } = useCart();

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
            Cart
          </NavLink>
          <NavLink to="/checkout" style={navLinkStyle}>
            Checkout
          </NavLink>
          <button
            type="button"
            onClick={onCartClick}
            style={{
              border: "1px solid #fb923c",
              background: "linear-gradient(135deg, #fdba74, #fb923c)",
              color: "#7c2d12",
              padding: "8px 14px",
              borderRadius: 12,
              fontWeight: 700,
              boxShadow: "0 10px 30px -12px rgba(249, 115, 22, 0.7)",
            }}
          >
            Cart ({itemCount})
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
