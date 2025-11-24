import { Link } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import CartLineItem from "../cart/CartLineItem";

function CartSidebar() {
  const { items, subtotalCents } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside
      className="cart-sidebar"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        borderLeft: "1px solid #e2e8f0",
        background: "#fff",
        position: "sticky",
        top: 80,
        maxHeight: "calc(100vh - 120px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700 }}>Cart</div>
          <div style={{ color: "#475569", fontSize: 13 }}>{itemCount} item{itemCount === 1 ? "" : "s"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, flex: 1, overflowY: "auto", paddingRight: 6 }}>
        {items.length === 0 ? (
          <p style={{ color: "#475569" }}>Cart is empty.</p>
        ) : (
          items.map((item) => <CartLineItem key={item.product.id} item={item} />)
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#475569" }}>Subtotal</span>
        <strong>${(subtotalCents / 100).toFixed(2)}</strong>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Link
          to="/cart"
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
  );
}

export default CartSidebar;
