import type { Product } from "../../types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
}

function ProductGrid({ products, loading = false, emptyTitle, emptyHint }: ProductGridProps) {
  if (loading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="product-card product-card--skeleton">
            <div className="product-card__image-wrapper">
              <div className="skeleton skeleton--image" />
            </div>
            <div className="product-card__body">
              <div className="skeleton skeleton--text" />
              <div className="skeleton skeleton--text skeleton--short" />
              <div className="skeleton skeleton--pill" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="product-empty">
        <div className="product-empty__title">{emptyTitle || "No products yet."}</div>
        <p className="product-empty__hint">{emptyHint || "Check back soon or adjust filters."}</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;
