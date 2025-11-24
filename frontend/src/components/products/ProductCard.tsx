import { Link } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import type { Product } from "../../types";
import { getProductImageUrl } from "../../utils/products";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const imageUrl = getProductImageUrl(product);

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
      <Link to={`/products/${product.id}`} style={{ display: "block", position: "relative" }}>
        {product.is_popular && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(248, 113, 113, 0.9)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            Popular
          </span>
        )}
        <img src={imageUrl} alt={product.name} style={{ width: "100%", height: 200, objectFit: "cover" }} />
      </Link>
      <div style={{ padding: "0 16px 16px 16px", display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>{product.name}</h3>
          <span style={{ fontWeight: 700 }}>${(product.price_cents / 100).toFixed(2)}</span>
        </div>
        {product.category && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: 12,
              width: "fit-content",
            }}
          >
            {product.category}
          </span>
        )}
        <p style={{ margin: 0, color: "#475569" }}>{product.description}</p>
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
