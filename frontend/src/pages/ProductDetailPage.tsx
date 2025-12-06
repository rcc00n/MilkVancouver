import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import type { Product } from "../types";
import { getProduct } from "../api/products";
import { getProductImageUrl } from "../utils/products";
import { useCart } from "../context/CartContext";

const formatPrice = (priceCents: number) => `$${(priceCents / 100).toFixed(2)}`;

function QuantityInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const clamp = (n: number) => (n < 1 ? 1 : n);

  return (
    <div className="inline-flex items-center rounded-full bg-white/80 px-2 py-1.5 border border-[rgba(124,58,237,0.25)] shadow-sm">
      <button
        type="button"
        className="h-8 w-8 rounded-full bg-[#f6f0ff] text-[#7c3aed] text-lg flex items-center justify-center"
        onClick={() => onChange(clamp(value - 1))}
      >
        −
      </button>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 1))}
        className="w-10 border-0 bg-transparent text-center text-sm text-[#3b0764] focus:outline-none"
      />
      <button
        type="button"
        className="h-8 w-8 rounded-full bg-[#ffd948] text-[#3b0764] text-lg flex items-center justify-center"
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </button>
    </div>
  );
}

function ProductDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    if (!slug) {
      setProduct(null);
      setLoading(false);
      setError("Продукт не найден.");
      return;
    }

    setLoading(true);
    setError(null);

    getProduct(slug)
      .then((result) => {
        setProduct(result);
        setQuantity(1);
      })
      .catch((err) => {
        console.error("Failed to fetch product", err);
        setProduct(null);
        setError("Не удалось загрузить продукт. Попробуйте обновить страницу.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="brand-page-shell">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="h-6 w-32 rounded-full bg-white/60 mb-6" />
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="h-[360px] rounded-3xl bg-gradient-to-br from-[#fff7c2] via-[#ffe6ff] to-[#f3e4ff] animate-pulse" />
            <div className="space-y-4">
              <div className="h-6 w-2/3 rounded-lg bg-white/70" />
              <div className="h-4 w-1/2 rounded-lg bg-white/60" />
              <div className="h-24 w-full rounded-2xl bg-white/70" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="brand-page-shell">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="brand-card flex flex-col gap-3 p-6 text-[#3b0764]">
            <h2 className="text-xl font-semibold">Мы не нашли этот продукт</h2>
            <p className="text-sm text-[#6b5b95]">
              {error || "Похоже, карточка недоступна. Попробуйте позже или выберите другой товар."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="brand-button-primary px-4 py-2 text-sm"
              >
                Вернуться в каталог
              </Link>
              <Link
                to="/"
                className="brand-button-accent px-4 py-2 text-sm"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const imageUrl = getProductImageUrl(product);
  const price = formatPrice(product.price_cents);
  const category = product.category?.name || product.category_name || "Dairy";
  const description =
    product.description ||
    "Свежий продукт из нашего холодильника. Идеален для завтрака, кофе или вечерних рецептов.";

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handlePayNow = () => {
    addItem(product, quantity);
    navigate("/checkout");
  };

  return (
    <div className="brand-page-shell">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-6">
        <Link
          to="/shop"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#7c3aed] hover:text-[#4c1d95]"
        >
          ← Назад к каталогу
        </Link>

        <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-start">
          {/* Картинка/галерея */}
          <div className="space-y-3">
            <div className="brand-card relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#fff7c2] via-[#ffe6ff] to-[#f3e4ff]" />
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="relative z-[1] max-h-[360px] w-full object-contain"
                />
              ) : null}
            </div>

            {/* маленький превью-бар при желании можно расширить до карусели */}
            <div className="flex gap-3 overflow-x-auto">
              <div className="h-20 w-28 shrink-0 rounded-2xl border-2 border-[#7c3aed] bg-white/80 flex items-center justify-center text-xs text-[#7c3aed]">
                Основное фото
              </div>
              <div className="h-20 w-28 shrink-0 rounded-2xl bg-white/40 border border-dashed border-[#e4ddff] flex items-center justify-center text-[11px] text-[#a08ae7]">
                Можно добавить ещё
              </div>
            </div>
          </div>

          {/* Информация / actions */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#7c3aed] border border-[rgba(124,58,237,0.24)]">
                {category}
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#2b153f]">
                {product.name}
              </h1>
              <p className="text-sm text-[#6b5b95]">
                {description}
              </p>
            </div>

            <div className="grid gap-4 rounded-3xl bg-white/85 p-4 border border-[rgba(124,58,237,0.16)] shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.18em] text-[#a08ae7] font-semibold">
                    Цена за штуку
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-[#3b0764]">
                      {price}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-xs text-[#a08ae7]">Количество</span>
                  <QuantityInput value={quantity} onChange={setQuantity} />
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row">
                <button
                  type="button"
                  className="brand-button-primary w-full justify-center"
                  onClick={handleAddToCart}
                >
                  Добавить в корзину
                </button>
                <button
                  type="button"
                  className="brand-button-accent w-full justify-center"
                  onClick={handlePayNow}
                >
                  Оплатить сейчас
                </button>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-[#6b5b95]">
                <span className="brand-pill">🥛 Свежая партия</span>
                <span className="brand-pill">🧊 Хранить в холодильнике 0–4°C</span>
                <span className="brand-pill">🚚 Доставка по районам Ванкувера</span>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-r from-[#fdf1c4] to-[#fbe5ff] p-4 text-xs md:text-sm text-[#3b0764] border border-[rgba(251,213,75,0.5)]">
              <div className="font-semibold mb-1">О доставке</div>
              <p>
                Заказы, сделанные до 20:00, попадают в ближайшее окно доставки. Мы
                следим за холодной цепочкой — продукты приезжают такими же холодными,
                как и уходят из холодильника.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
