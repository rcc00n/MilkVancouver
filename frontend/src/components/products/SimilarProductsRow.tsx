import { Link } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import type { Product } from "../../types";

interface SimilarProductsRowProps {
  products: Product[];
}

function SimilarProductsRow({ products }: SimilarProductsRowProps) {
  const { addItem } = useCart();

  if (!products.length) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>Similar picks</h4>
        <span style={{ color: "#475569", fontSize: 13 }}>Based on tags</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, display: "grid", gap: 8 }}
          >
            <Link to={`/products/${product.id}`} style={{ fontWeight: 700 }}>
              {product.name}
            </Link>
            <div style={{ color: "#475569", fontSize: 14 }}>{product.description}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>${(product.price / 100).toFixed(2)}</strong>
              <button
                type="button"
                onClick={() => addItem(product, 1)}
                style={{
                  border: "1px solid #22c55e",
                  background: "#ecfdf3",
                  color: "#166534",
                  borderRadius: 10,
                  padding: "6px 10px",
                  fontWeight: 700,
                }}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SimilarProductsRow;
