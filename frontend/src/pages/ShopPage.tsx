import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Product } from "../types";
import { getProducts } from "../api/products";
import { useCart } from "../context/CartContext";
import { getProductImageUrl } from "../utils/products";

const formatPrice = (priceCents: number) => `$${(priceCents / 100).toFixed(2)}`;

type CategoryFilter = {
  id: string;
  label: string;
  match: (product: Product) => boolean;
};

const productCategoryText = (product: Product) =>
  (
    product.category?.slug ||
    product.category?.name ||
    product.category_name ||
    ""
  ).toLowerCase();

const productCategoryLabel = (product: Product) =>
  product.category?.name || product.category_name || "Dairy";

const CATEGORY_FILTERS: CategoryFilter[] = [
  {
    id: "all",
    label: "Все продукты",
    match: () => true,
  },
  {
    id: "milk",
    label: "Молоко",
    match: (p) => productCategoryText(p).includes("milk"),
  },
  {
    id: "yogurt",
    label: "Йогурт",
    match: (p) => {
      const category = productCategoryText(p);
      return category.includes("yogurt") || category.includes("kefir");
    },
  },
  {
    id: "cheese",
    label: "Сыр",
    match: (p) => productCategoryText(p).includes("cheese"),
  },
];

function ProductTile({
  product,
  onAdd,
  onOpen,
}: {
  product: Product;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const imageUrl = getProductImageUrl(product);
  const category = productCategoryLabel(product);

  return (
    <article
      className="group relative flex flex-col overflow-hidden brand-card cursor-pointer"
      onClick={onOpen}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#fff7c2] via-[#ffe6ff] to-[#f3e4ff] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : null}

        <div className="absolute left-3 top-3 flex gap-2">
          <span className="brand-pill text-[11px] uppercase tracking-[0.14em]">
            {category}
          </span>
          {product.is_popular ? (
            <span className="brand-pill--solid text-[11px] uppercase tracking-[0.14em]">
              Хит недели
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pt-4 pb-3">
        <h3 className="text-[1.05rem] font-semibold text-[#2b153f] line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-[#6b5b95] line-clamp-2">
          {product.description || "Нежный вкус, свежая поставка и удобная упаковка."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-2">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-[0.18em] text-[#9270e0] font-semibold">
            Цена
          </span>
          <span className="text-lg font-semibold text-[#3b0764]">
            {formatPrice(product.price_cents)}
          </span>
        </div>

        <button
          type="button"
          className="brand-button-primary text-sm px-4 py-2"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
        >
          Добавить
        </button>
      </div>
    </article>
  );
}

function ShopPage() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getProducts(undefined, controller.signal)
      .then((result) => setProducts(result))
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch products", err);
        setError("Не удалось загрузить продукты. Попробуйте обновить страницу.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const activeFilter =
    CATEGORY_FILTERS.find((c) => c.id === activeCategoryId) || CATEGORY_FILTERS[0];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((p) => activeFilter.match(p))
      .filter((p) => {
        if (!term) return true;
        const haystack = `${p.name} ${productCategoryLabel(p)} ${p.description || ""}`.toLowerCase();
        return haystack.includes(term);
      });
  }, [products, activeFilter, search]);

  const handleAdd = (product: Product) => addItem(product, 1);

  return (
    <div className="brand-page-shell">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        {/* Хедер раздела */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-[#7c3aed] shadow-sm">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              FRESH + READY TO SHIP
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-[#2b153f] md:text-[2.35rem]">
              Shop the fridge
            </h1>
            <p className="max-w-xl text-sm text-[#6b5b95] md:text-base">
              Выберите молоко, йогурты и сыры. Нажмите на карточку, чтобы увидеть
              состав, доставку и фото, или сразу добавляйте в корзину.
            </p>
            {error ? (
              <p className="text-sm font-medium text-[#b42318]">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm text-[#4b2a7b] shadow-[0_10px_25px_rgba(124,58,237,0.18)] border border-[rgba(124,58,237,0.12)]">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7c3aed]">
              Следующая доставка
            </span>
            <span>Заказы до 20:00 — доставка уже завтра вечером.</span>
          </div>
        </header>

        {/* Основной layout: фильтры + товары */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[260px,minmax(0,1fr)]">
          {/* Сайдбар категорий */}
          <aside className="brand-card p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#2b153f]">Категории</h2>
                <p className="text-xs text-[#8b75c7]">
                  Фильтруйте витрину по типу продукта.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#f5ecff] px-2.5 py-1 text-[11px] font-medium text-[#7c3aed]">
                {filtered.length} позиций
              </span>
            </div>

            <div className="space-y-1">
              {CATEGORY_FILTERS.map((cat) => {
                const isActive = cat.id === activeCategoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={[
                      "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition",
                      isActive
                        ? "bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white shadow-md"
                        : "bg-white/70 text-[#3b0764] hover:bg-[#f6f0ff]",
                    ].join(" ")}
                  >
                    <span>{cat.label}</span>
                    {isActive ? (
                      <span className="rounded-full bg-white/20 px-2 text-[11px]">
                        выбрано
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Список продуктов */}
          <section className="space-y-5">
            {/* Крошечный тулбар */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="brand-pill">
                  ● Свежие партии максимум пару дней
                </span>
                <span className="brand-pill">
                  🧊 Держим холодную цепочку при доставке
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm border border-[rgba(124,58,237,0.14)]">
                <input
                  className="w-40 bg-transparent text-xs text-[#3b0764] placeholder:text-[#b1a0e5] focus:outline-none md:w-56"
                  placeholder="Поиск по названию или типу..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Грид карточек */}
            {loading && !products.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="brand-card h-72 animate-pulse bg-gradient-to-br from-[#f8f4ff] via-white to-[#fff8d8]"
                  />
                ))}
              </div>
            ) : filtered.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product) => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    onAdd={() => handleAdd(product)}
                    onOpen={() => navigate(`/products/${product.slug}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="brand-card flex items-center justify-between px-5 py-4 text-sm text-[#6b5b95]">
                <div>
                  <p className="font-semibold text-[#2b153f]">
                    Ничего не нашлось под этот фильтр.
                  </p>
                  <p className="text-xs">
                    Попробуйте другую категорию или уберите поиск.
                  </p>
                </div>
                <button
                  type="button"
                  className="brand-button-accent px-4 py-2 text-xs"
                  onClick={() => {
                    setSearch("");
                    setActiveCategoryId("all");
                  }}
                >
                  Показать всё
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default ShopPage;
