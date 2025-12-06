import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getProduct, getProducts } from "../api/products";
import SimilarProductsRow from "../components/products/SimilarProductsRow";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";
import { getProductImageUrl } from "../utils/products";
import { ArrowLeft, CheckCircle, ShoppingBag, Sparkles } from "lucide-react";

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

  const priceLabel = product ? (product.price_cents / 100).toFixed(2) : "";

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-[#f7f2ff] via-[#f9fbff] to-[#e7f7ff] pt-16 pb-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-[#facc15]/25 blur-3xl" />
        <div className="absolute right-[-6%] top-14 h-72 w-72 rounded-full bg-[#a855f7]/16 blur-3xl" />
        <div className="absolute left-[8%] bottom-10 h-64 w-64 rounded-full bg-[#22c55e]/12 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-[#6A0DAD] font-semibold hover:underline">
          <ArrowLeft size={18} />
          Back to catalog
        </Link>

        <div className="grid gap-10 rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-xl shadow-[#6A0DAD]/10 backdrop-blur lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-lg shadow-[#6A0DAD]/10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/30" />
              <img
                src={activeImageSrc}
                alt={product.name}
                className="h-[440px] w-full object-cover md:h-[520px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {galleryImages.map((image) => {
                const isActive = image.url === activeImageSrc;
                return (
                  <button
                    type="button"
                    key={image.url}
                    onClick={() => setActiveImage(image.url)}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 ${
                      isActive ? "border-[#6A0DAD] shadow-[#6A0DAD]/20 ring-2 ring-[#6A0DAD]/30" : "border-white/80"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="h-20 w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  {product.category && (
                    <span className="inline-flex items-center rounded-full border border-[#6A0DAD]/20 bg-[#F3F0FB] px-3 py-1 text-sm font-semibold text-[#6A0DAD]">
                      {product.category.name}
                    </span>
                  )}
                  {product.is_popular && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      <Sparkles size={14} />
                      Popular pick
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Per unit</p>
                  <p className="text-3xl font-semibold text-[#4c1d95]">${priceLabel}</p>
                </div>
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">{product.name}</h1>
              <p className="text-slate-600 leading-relaxed">{product.description}</p>
            </div>

            <div className="grid gap-4 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-md shadow-[#6A0DAD]/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Quantity</p>
                  <p className="text-xs text-slate-500">Adjust before adding to cart</p>
                </div>
                <div className="inline-flex items-center rounded-full border border-[#6A0DAD]/30 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-3 py-2 text-lg font-semibold text-[#6A0DAD] hover:bg-[#6A0DAD]/5"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => handleQuantityChange(Number(event.target.value))}
                    className="w-16 border-x border-[#6A0DAD]/20 bg-transparent text-center text-lg font-semibold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-2 text-lg font-semibold text-[#6A0DAD] hover:bg-[#6A0DAD]/5"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6A0DAD] via-[#7c3aed] to-[#c084fc] px-4 py-3 text-white shadow-lg shadow-[#6A0DAD]/20 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]/40"
                >
                  <ShoppingBag size={18} />
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={handlePayNow}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-white shadow-lg shadow-emerald-200/40 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                >
                  Pay right now
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
                  <CheckCircle size={18} />
                  Next overnight delivery cut-off is Sunday 8pm.
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#6A0DAD]/15 bg-[#F3F0FB] px-3 py-2 text-[#4c1d95]">
                  <Sparkles size={18} />
                  Chilled chain delivery & easy returns.
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/50 bg-white/70 p-5 shadow-sm shadow-[#6A0DAD]/10">
              <p className="text-sm font-semibold text-slate-800">Why you’ll love it</p>
              <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#6A0DAD]" />
                  Small-batch quality with clean ingredients.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#6A0DAD]" />
                  Cold-delivered to your doorstep on time.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#6A0DAD]" />
                  Sustainable packaging with easy returns.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#6A0DAD]" />
                  Perfect for weekly fridge restocks.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <SimilarProductsRow products={similarProducts} />
        </div>
      </div>
    </section>
  );
}

export default ProductPage;
