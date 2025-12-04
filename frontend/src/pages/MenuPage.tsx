import { useEffect, useMemo, useRef, useState } from "react";

import { getProducts } from "../api/products";
import ProductGrid from "../components/products/ProductGrid";
import SearchBar from "../components/products/SearchBar";
import type { Product } from "../types";

type CategoryTone = "pine" | "amber" | "emerald" | "rose" | "blue" | "slate";

type CategoryTab = {
  label: string;
  value: string | null;
  note: string;
  tone: CategoryTone;
};

const toneColors: Record<CategoryTone, string> = {
  pine: "#0f3d2c",
  amber: "#f59e0b",
  emerald: "#16a34a",
  rose: "#e11d48",
  blue: "#0ea5e9",
  slate: "#475569",
};

const CATEGORY_TABS: CategoryTab[] = [
  { label: "All items", value: null, note: "Full dairy case", tone: "pine" },
  { label: "Milk & Cream", value: "milk", note: "Whole, 2%, skim, cream", tone: "amber" },
  { label: "Yogurt & Kefir", value: "yogurt", note: "Greek, plain, cultured kefir", tone: "emerald" },
  { label: "Cheese & Butter", value: "cheese", note: "Soft cheese, cheddar, cultured butter", tone: "rose" },
  { label: "Coffee Bar", value: "coffee", note: "Barista milk, half & half, whipping cream", tone: "blue" },
  { label: "Lactose-free & Alt", value: "lactose-free", note: "Lactose-free and cafe alt options", tone: "slate" },
];

function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const catalogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getProducts(
      {
        search: debouncedSearch || undefined,
        category: selectedCategory || undefined,
      },
      controller.signal,
    )
      .then((result) => setProducts(result))
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch products", fetchError);
        setError("Unable to load products right now. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, selectedCategory]);

  const popularProducts = useMemo(() => products.filter((product) => product.is_popular).slice(0, 3), [products]);
  const activeTab = useMemo(
    () => CATEGORY_TABS.find((tab) => tab.value === selectedCategory) ?? CATEGORY_TABS[0],
    [selectedCategory],
  );

  const scrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    scrollToCatalog();
  };

  const resultLabel = selectedCategory ? `${activeTab.label} ready to deliver` : "All categories available";

  return (
    <div className="menu-page">
      <section className="menu-hero">
        <div className="container menu-hero__grid">
          <div className="menu-hero__copy">
            <div className="eyebrow">Shop</div>
            <h1>Menu of bottled milk, yogurt, cream, and cafe staples.</h1>
            <p className="muted">
              Scan prices, browse by category, and add to cart when you are ready. Everything is low-temp pasteurized,
              timestamped, and delivered with cold-chain protection.
            </p>
            <div className="menu-hero__chips">
              <span className="pill pill--strong">Grass-fed dairy</span>
              <span className="pill pill--accent">Glass bottle deposits</span>
              <span className="pill">Vancouver delivery & insulated shipping</span>
            </div>
          </div>

          <div className="menu-hero__panel">
            <div className="menu-hero__panel-header">
              <div>
                <div className="eyebrow eyebrow--green">Featured</div>
                <h3>Fresh this week</h3>
              </div>
              <span className="pill pill--small">Updated weekly</span>
            </div>
            {popularProducts.length ? (
              <ul className="menu-hero__list">
                {popularProducts.map((product) => (
                  <li key={product.id} className="menu-hero__list-item">
                    <div>
                      <div className="menu-hero__list-name">{product.name}</div>
                      {product.category && <div className="menu-hero__list-meta">{product.category.name}</div>}
                    </div>
                    <span className="menu-hero__list-price">${(product.price_cents / 100).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="menu-hero__placeholder">
                Tag products as popular in the admin to showcase them here.
              </div>
            )}
            <div className="menu-hero__foot">
              <div>
                <div className="menu-hero__foot-title">Cold-packed crates & cafe sets</div>
                <p className="menu-hero__foot-text">
                  Weekly milk, cream, yogurt, and butter with bottle returns handled on your next delivery.
                </p>
              </div>
              <div className="menu-hero__foot-actions">
                <button type="button" className="btn btn--ghost" onClick={() => handleCategorySelect("milk")}>
                  Shop milk
                </button>
                <button type="button" className="btn btn--primary" onClick={() => handleCategorySelect("coffee")}>
                  Coffee bar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="menu-featured">
        <div className="container menu-featured__grid">
          <div className="menu-featured__card">
            <div className="eyebrow">Featured bundle</div>
            <h3>Family fridge crate</h3>
            <p className="muted">
              Choose milk style, cream, yogurt, and butter; we bottle, timestamp, and pack with ice liners and bottle
              deposits already handled.
            </p>
            <div className="menu-featured__tags">
              <span className="pill pill--strong">Pick 4+ items</span>
              <span className="pill">Swap weekly</span>
              <span className="pill">Cold-chain ready</span>
            </div>
            <div className="menu-featured__actions">
              <button type="button" className="link-button" onClick={() => handleCategorySelect("milk")}>
                Browse milk
              </button>
            </div>
          </div>
          <div className="menu-featured__card menu-featured__card--accent">
            <div className="eyebrow">Cafe-ready</div>
            <h3>Barista milk, cream, and syrup add-ons.</h3>
            <p>
              Higher protein milk for silky microfoam, half & half, whipping cream, and seasonal syrups for home or cafe
              espresso bars.
            </p>
            <div className="menu-featured__tags">
              <span className="pill pill--accent">Barista milk</span>
              <span className="pill">Half & half</span>
              <span className="pill">Whipping cream</span>
            </div>
            <div className="menu-featured__actions">
              <button type="button" className="btn btn--ghost" onClick={() => handleCategorySelect("coffee")}>
                Coffee bar
              </button>
              <button type="button" className="btn btn--primary" onClick={() => handleCategorySelect("lactose-free")}>
                Lactose-free
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="menu-catalog" ref={catalogRef} id="menu">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Shop the menu</div>
              <h2>Filter by craving and add to cart.</h2>
              <p className="muted">
                Tabs jump straight into the category you want; each card shows price, description, and details.
              </p>
            </div>
            <div className="menu-meta">
              <span className="pill pill--strong">{products.length} items</span>
              <span className="pill">{resultLabel}</span>
            </div>
          </div>

          <div className="menu-tabs">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                className={`menu-tab ${selectedCategory === tab.value ? "is-active" : ""}`}
                onClick={() => setSelectedCategory(tab.value)}
              >
                <div className="menu-tab__title">
                  <span className="menu-tab__dot" style={{ backgroundColor: toneColors[tab.tone] }} />
                  <span>{tab.label}</span>
                </div>
                <span className="menu-tab__note">{tab.note}</span>
              </button>
            ))}
          </div>

          <div className="menu-controls">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
            <div className="menu-controls__meta">
              <span className="pill pill--accent">{activeTab.label}</span>
              <span className="pill">{products.length} products</span>
              {debouncedSearch && <span className="pill">Search: "{debouncedSearch}"</span>}
            </div>
          </div>

          {error && <div className="alert alert--error">{error}</div>}
          <ProductGrid
            products={products}
            loading={loading}
            emptyTitle="No products match your filters yet."
            emptyHint="Try clearing the filters or searching a simpler term."
          />
        </div>
      </section>
    </div>
  );
}

export default MenuPage;
