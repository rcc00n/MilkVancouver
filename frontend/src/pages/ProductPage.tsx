import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getProduct, getProducts } from "../api/products";
import SimilarProductsRow from "../components/products/SimilarProductsRow";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";
import { getProductImageUrl } from "../utils/products";

type GalleryImage = {
  url: string;
  alt: string;
};

function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, clear } = useCart();
  const [product, setProduct] = useState<Product | undefined>();
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setProduct(undefined);
      return;
    }

    let active = true;
    setLoading(true);
    setProduct(undefined);
    setActiveImage(null);
    setQuantity(1);

    getProduct(slug)
      .then((result) => {
        if (!active) return;
        setProduct(result);
        setActiveImage(getProductImageUrl(result));
      })
      .catch(() => {
        if (!active) return;
        setProduct(undefined);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    getProducts()
      .then((products) => {
        if (!active) return;
        setCatalog(products);
      })
      .catch(() => {
        if (!active) return;
        setCatalog([]);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const galleryImages = useMemo<GalleryImage[]>(() => {
    if (!product) return [];
    const images: GalleryImage[] = product.images.map((image) => ({
      url: image.image_url,
      alt: image.alt_text || product.name,
    }));

    if (product.main_image_url && !images.some((image) => image.url === product.main_image_url)) {
      images.unshift({ url: product.main_image_url, alt: product.name });
    }

    if (product.image_url && !images.some((image) => image.url === product.image_url)) {
      images.unshift({ url: product.image_url, alt: product.name });
    }

    if (!images.length) {
      images.push({ url: getProductImageUrl(product), alt: product.name });
    }

    return images;
  }, [product]);

  const similarProducts = useMemo(() => {
    if (!product) return [] as Product[];
    return catalog.filter(
      (candidate) =>
        candidate.id !== product.id &&
        product.category?.slug &&
        candidate.category?.slug === product.category.slug,
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

  const activeImageSrc = activeImage || getProductImageUrl(product);

  const handleQuantityChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setQuantity(Math.max(1, Math.floor(value)));
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
  };

  const handlePayNow = () => {
    if (!product) return;
    clear();
    addItem(product, quantity);
    navigate("/checkout");
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Link to="/" style={{ color: "#2563eb", fontWeight: 600 }}>
        ← Back to catalog
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              width: "100%",
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <img
              src={activeImageSrc}
              alt={product.name}
              style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 8 }}>
            {galleryImages.map((image) => (
              <button
                type="button"
                key={image.url}
                onClick={() => setActiveImage(image.url)}
                style={{
                  border: image.url === activeImageSrc ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 4,
                  background: "#fff",
                  transition: "border-color 0.16s ease",
                }}
              >
                <img
                  src={image.url}
                  alt={image.alt || product.name}
                  style={{
                    width: "100%",
                    height: 70,
                    objectFit: "cover",
                    borderRadius: 10,
                  }}
                />
              </button>
            ))}
          </div>
        </div>

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
                    {product.category.name}
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
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 700 }}>Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => handleQuantityChange(Number(event.target.value))}
                style={{
                  width: "120px",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  fontWeight: 700,
                }}
              />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <button
                type="button"
                onClick={handleAddToCart}
                style={{
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
                onClick={handlePayNow}
                style={{
                  padding: "12px",
                  borderRadius: 14,
                  border: "1px solid #22c55e",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                Pay right now
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
