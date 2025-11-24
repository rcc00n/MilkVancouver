import { useCart } from "../../context/CartContext";
import type { CartItem } from "../../types";
import { getProductImageUrl } from "../../utils/products";

interface CartLineItemProps {
  item: CartItem;
}

function CartLineItem({ item }: CartLineItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const imageUrl = getProductImageUrl(item.product);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "64px 1fr auto",
        gap: 10,
        alignItems: "center",
        padding: "10px",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <img src={imageUrl} alt={item.product.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10 }} />
      <div style={{ display: "grid", gap: 4 }}>
        <strong>{item.product.name}</strong>
        <div style={{ color: "#475569", fontSize: 13 }}>{item.product.description}</div>
        <div style={{ fontWeight: 700 }}>${(item.product.price_cents / 100).toFixed(2)}</div>
      </div>
      <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc" }}
          >
            -
          </button>
          <span style={{ minWidth: 24, textAlign: "center" }}>{item.quantity}</span>
          <button
            type="button"
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc" }}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => removeItem(item.product.id)}
          style={{ border: "none", background: "transparent", color: "#ef4444", fontWeight: 600 }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default CartLineItem;
