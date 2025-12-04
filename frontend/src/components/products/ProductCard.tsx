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
  const isPopular = product.is_popular;

  return (
    <div className="product-card">
      <Link to={`/products/${product.slug}`} className="product-card__image-wrapper">
        {isPopular && <span className="product-card__badge">Popular pick</span>}
        <img src={imageUrl} alt={product.name} className="product-card__image" />
      </Link>
      <div className="product-card__body">
        <div className="product-card__header">
          <h3 className="product-card__title">
            <Link to={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          <span className="product-card__price">${(product.price_cents / 100).toFixed(2)}</span>
        </div>

        <div className="product-card__tags">
          {product.category && <span className="pill">{product.category.name}</span>}
          {isPopular && <span className="pill pill--accent">Trending</span>}
        </div>

        <p className="product-card__description">{product.description}</p>

        <div className="product-card__actions">
          <button type="button" onClick={() => addItem(product, 1)} className="button button--primary">
            Add to Cart
          </button>
          <Link to={`/products/${product.slug}`} className="button button--ghost">
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
