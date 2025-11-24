import { Link } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import CartLineItem from "../cart/CartLineItem";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { items, total } = useCart();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: open ? "grid" : "none",
        gridTemplateColumns: "1fr minmax(320px, 420px)",
        background: "rgba(15, 23, 42, 0.35)",
        backdropFilter: "blur(6px)",
        zIndex: 20,
      }}
    >
      <div onClick={onClose} role="presentation" />
      <aside
        style={{
          background: "#fff",
          padding: "20px",
          borderLeft: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "-16px 0 40px -30px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Cart</div>
            <div style={{ color: "#475569", fontSize: 13 }}>{items.length} selections</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: 14, color: "#64748b" }}
          >
            Close
          </button>
        </div>

        <div style={{ display: "grid", gap: 10, flex: 1, overflowY: "auto", paddingRight: 6 }}>
          {items.length === 0 ? <p style={{ color: "#475569" }}>Cart is empty.</p> : items.map((item) => <CartLineItem key={item.product.id} item={item} />)}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#475569" }}>Subtotal</span>
          <strong>${(total / 100).toFixed(2)}</strong>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link
            to="/cart"
            onClick={onClose}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "10px 0",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontWeight: 600,
            }}
          >
            View Cart
          </Link>
          <Link
            to="/checkout"
            onClick={onClose}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "10px 0",
              borderRadius: 12,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              fontWeight: 700,
              boxShadow: "0 12px 30px -16px rgba(22, 163, 74, 0.75)",
            }}
          >
            Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}

export default CartSidebar;
