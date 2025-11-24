import { Link } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import type { Product } from "../../types";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 20px 40px -32px rgba(0,0,0,0.3)",
        display: "grid",
        gap: 10,
      }}
    >
      <Link to={`/products/${product.id}`} style={{ display: "block" }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: "100%", height: 200, objectFit: "cover" }}
        />
      </Link>
      <div style={{ padding: "0 16px 16px 16px", display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>{product.name}</h3>
          <span style={{ fontWeight: 700 }}>${(product.price / 100).toFixed(2)}</span>
        </div>
        <p style={{ margin: 0, color: "#475569" }}>{product.description}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {product.tags?.map((tag) => (
            <span key={tag} style={{ padding: "4px 10px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12 }}>
              {tag}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addItem(product, 1)}
          style={{
            padding: "10px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
