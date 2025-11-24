import { Link } from "react-router-dom";

import CartLineItem from "../components/cart/CartLineItem";
import { useCart } from "../context/CartContext";

function CartPage() {
  const { items, subtotalCents } = useCart();

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0 }}>Your cart</h2>
        <p style={{ color: "#475569" }}>Review your picks before checkout.</p>
      </div>

      {items.length === 0 ? (
        <div style={{ border: "1px dashed #e2e8f0", padding: 16, borderRadius: 12 }}>
          <p style={{ margin: 0, color: "#475569" }}>Cart is empty. Explore the catalog to add items.</p>
          <Link to="/" style={{ color: "#2563eb", fontWeight: 600 }}>
            Back to catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <CartLineItem key={item.product.id} item={item} />
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#475569" }}>Subtotal</span>
        <strong style={{ fontSize: 22 }}>${(subtotalCents / 100).toFixed(2)}</strong>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Link
          to="/checkout"
          style={{
            flex: 1,
            textAlign: "center",
            padding: "12px 0",
            borderRadius: 12,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
            fontWeight: 700,
            border: "none",
          }}
        >
          Proceed to checkout
        </Link>
        <Link
          to="/"
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontWeight: 600,
            color: "#0f172a",
          }}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export default CartPage;
