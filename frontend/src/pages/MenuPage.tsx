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
  { label: "All items", value: null, note: "Full catalog of meats & imports", tone: "pine" },
  { label: "Meat", value: "meat", note: "Beef, pork, bison, lamb", tone: "amber" },
  { label: "Poultry", value: "poultry", note: "Chicken, turkey, duck", tone: "emerald" },
  { label: "Sausages", value: "sausages", note: "House-made links and patties", tone: "rose" },
  { label: "Smoked Fish", value: "smoked fish", note: "Salmon, whitefish, spreads", tone: "blue" },
  { label: "European Products", value: "european products", note: "Kielbasa, pierogi, pantry", tone: "slate" },
  { label: "South African", value: "south african", note: "Boerewors, biltong, spices", tone: "amber" },
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

  const resultLabel = selectedCategory ? `${activeTab.label} ready to ship` : "All categories available";

  return (
    <div className="menu-page">
      <section className="menu-hero">
        <div className="container menu-hero__grid">
          <div className="menu-hero__copy">
            <div className="eyebrow">Shop</div>
            <h1>Menu of butcher-cut meats, sausages, and imports.</h1>
            <p className="muted">
              Scan prices, browse by category, and add to cart when you are ready. Everything leaves our cold room
              trimmed, packed, and labelled.
            </p>
            <div className="menu-hero__chips">
              <span className="pill pill--strong">Grass-fed & hormone-free</span>
              <span className="pill pill--accent">Add to cart ready</span>
              <span className="pill">Local delivery & nationwide shipping</span>
            </div>
          </div>

          <div className="menu-hero__panel">
            <div className="menu-hero__panel-header">
              <div>
                <div className="eyebrow eyebrow--green">Featured</div>
                <h3>Butcher specials this week</h3>
              </div>
              <span className="pill pill--small">Updated weekly</span>
            </div>
            {popularProducts.length ? (
              <ul className="menu-hero__list">
                {popularProducts.map((product) => (
                  <li key={product.id} className="menu-hero__list-item">
                    <div>
                      <div className="menu-hero__list-name">{product.name}</div>
                      {product.category && <div className="menu-hero__list-meta">{product.category}</div>}
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
                <div className="menu-hero__foot-title">Cold-packed bundles & weekly kits</div>
                <p className="menu-hero__foot-text">
                  Ready-to-cook boxes, labelled and trimmed for grill nights, prep days, and family dinners.
                </p>
              </div>
              <div className="menu-hero__foot-actions">
                <button type="button" className="btn btn--ghost" onClick={() => handleCategorySelect("sausages")}>
                  Shop sausages
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => handleCategorySelect("european products")}
                >
                  European imports
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
            <h3>Family grill kit - mix & match meats</h3>
            <p className="muted">
              Choose steaks, chops, or burgers, add sausages, and we will vacuum seal, label, and pack cold with ice
              liners.
            </p>
            <div className="menu-featured__tags">
              <span className="pill pill--strong">Pick 4+ cuts</span>
              <span className="pill">Save on delivery</span>
              <span className="pill">Cook or freeze-ready</span>
            </div>
            <div className="menu-featured__actions">
              <button type="button" className="link-button" onClick={() => handleCategorySelect("meat")}>
                Browse meats
              </button>
            </div>
          </div>
          <div className="menu-featured__card menu-featured__card--accent">
            <div className="eyebrow">Imported & smoked</div>
            <h3>European delicacies & South African classics.</h3>
            <p>
              Kielbasa, smoked fish, pierogi, boerewors, and biltong - all curated for authentic comfort food nights.
            </p>
            <div className="menu-featured__tags">
              <span className="pill pill--accent">Kielbasa</span>
              <span className="pill">Smoked fish</span>
              <span className="pill">Boerewors</span>
            </div>
            <div className="menu-featured__actions">
              <button type="button" className="btn btn--ghost" onClick={() => handleCategorySelect("smoked fish")}>
                Smoked fish
              </button>
              <button type="button" className="btn btn--primary" onClick={() => handleCategorySelect("south african")}>
                South African
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
          <ProductGrid products={products} loading={loading} />
        </div>
      </section>
    </div>
  );
}

export default MenuPage;
