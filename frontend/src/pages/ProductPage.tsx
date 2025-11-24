import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getProduct, getProducts } from "../api/products";
import SimilarProductsRow from "../components/products/SimilarProductsRow";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";
import { getProductImageUrl } from "../utils/products";

function ProductPage() {
  const { productId } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | undefined>();
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(productId);
    if (!productId || Number.isNaN(id)) return;
    let active = true;
    setLoading(true);
    getProduct(id)
      .then((result) => {
        if (!active) return;
        setProduct(result);
      })
      .catch(() => {
        if (!active) return;
        setProduct(undefined);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    getProducts().then((products) => {
      if (!active) return;
      setCatalog(products);
    });

    return () => {
      active = false;
    };
  }, [productId]);

  const similarProducts = useMemo(() => {
    if (!product) return [] as Product[];
    return catalog.filter(
      (candidate) =>
        candidate.id !== product.id &&
        product.category &&
        candidate.category === product.category,
    );
  }, [catalog, product]);

  if (loading) {
    return <p style={{ color: "#475569" }}>Loading product...</p>;
  }

  if (!product) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <p style={{ color: "#475569" }}>Product not found.</p>
        <Link to="/">Back to catalog</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, 1);
  };

  const imageUrl = getProductImageUrl(product);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Link to="/" style={{ color: "#2563eb", fontWeight: 600 }}>
        ← Back to catalog
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, alignItems: "start" }}>
        <img
          src={imageUrl}
          alt={product.name}
          style={{ width: "100%", borderRadius: 18, objectFit: "cover", border: "1px solid #e2e8f0" }}
        />

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>{product.name}</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {product.category && (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  >
                    {product.category}
                  </span>
                )}
                {product.is_popular && (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      fontSize: 12,
                    }}
                  >
                    Popular pick
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#475569", fontSize: 14 }}>Per unit</div>
              <strong style={{ fontSize: 22 }}>${(product.price_cents / 100).toFixed(2)}</strong>
            </div>
          </div>

          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{product.description}</p>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                Add to cart
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: "12px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600 }}
              >
                Save for later
              </button>
            </div>
            <div style={{ padding: "12px", borderRadius: 12, background: "#ecfdf3", border: "1px solid #bbf7d0", color: "#166534" }}>
              Next overnight delivery cut-off is Sunday 8pm.
            </div>
          </div>
        </div>
      </div>

      <SimilarProductsRow products={similarProducts} />
    </div>
  );
}

export default ProductPage;
