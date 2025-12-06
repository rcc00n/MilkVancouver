import { useEffect, useMemo, useState } from "react";
import { Filter, ShoppingCart } from "lucide-react";

import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Button } from "../components/ui/button";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductsContext";
import { getCategories, type Category } from "../api/products";
import type { Product } from "../types";

type CategoryOption = {
  label: string;
  value: string | null;
  color: string;
};

const CATEGORY_COLORS = ["#6A0DAD", "#A57CFF", "#FFE74C", "#FF9770", "#9CF6F6", "#A57CFF"];

function getColorForCategory(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

function normalizeCategory(value?: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function Shop() {
  const { products, loading, error, initialized, refresh } = useProducts();
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const isLoading = loading || !initialized;

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const data = await getCategories();
        if (!cancelled) {
          setCategories(data);
          setCategoryError(null);
        }
      } catch (catErr) {
        console.error("Failed to load categories", catErr);
        if (!cancelled) {
          setCategoryError("We couldn't load categories. Please refresh.");
        }
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: CategoryOption[] = [
      { label: "All Products", value: null, color: CATEGORY_COLORS[0] },
    ];
    categories.forEach((category, index) => {
      const key = normalizeCategory(category.slug || category.name);
      if (seen.has(key)) return;
      seen.add(key);
      options.push({
        label: category.name,
        value: category.slug,
        color: getColorForCategory(index + 1),
      });
    });
    return options;
  }, [categories]);

  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    categoryOptions.forEach((option) => {
      if (option.value) {
        map.set(option.value, option.color);
      }
    });
    return map;
  }, [categoryOptions]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    const normalized = normalizeCategory(selectedCategory);
    return products.filter((product) => normalizeCategory(product.category?.slug) === normalized);
  }, [products, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };

  const renderCategoryButton = (option: CategoryOption, isActive: boolean) => (
    <button
      key={option.value ?? "all"}
      onClick={() => {
        setSelectedCategory(option.value);
        setMobileFiltersOpen(false);
      }}
      className={`w-full text-left px-4 py-3 rounded-full transition-all text-sm font-semibold ${
        isActive ? "text-white shadow-lg" : "bg-white text-[#1a0a2e] hover:bg-white/90"
      }`}
      style={{ backgroundColor: isActive ? option.color : "#F3F0FB" }}
    >
      {option.label}
    </button>
  );

  return (
    <section
      className="pt-20 pb-16 min-h-screen"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-medium text-[#6A0DAD]">Our Products</h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Discover our delicious range of healthy dairy products for the whole family!
          </p>
        </div>

        <div className="lg:hidden mb-6">
          <button
            onClick={() => setMobileFiltersOpen((open) => !open)}
            className="flex items-center gap-2 px-6 py-3 bg-[#6A0DAD] text-white rounded-full hover:bg-[#5b0b99] transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-3xl p-6 shadow-lg sticky top-24 space-y-6">
              <div className="space-y-4">
                <h3 className="text-[#6A0DAD] text-xl font-semibold">Categories</h3>
                <div className="space-y-3">
                  {categoryOptions.map((option) =>
                    renderCategoryButton(option, selectedCategory === option.value),
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#A57CFF]/10 to-[#FFE74C]/10 border border-[#6A0DAD]/10">
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="text-[#6A0DAD] font-semibold">
                    {isLoading ? "..." : filteredProducts.length}
                  </span>{" "}
                  products
                </p>
                {(error || categoryError) && (
                  <p className="mt-2 text-sm text-red-500">
                    {error || categoryError}
                  </p>
                )}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {(isLoading ? Array.from({ length: 6 }) : filteredProducts).map((product, index) => {
                const key = isLoading ? `placeholder-${index}` : product.id;
                const categorySlug = isLoading ? null : product.category?.slug ?? null;
                const color =
                  categorySlug && categoryColorMap.get(categorySlug)
                    ? categoryColorMap.get(categorySlug)!
                    : getColorForCategory(index);

                if (isLoading) {
                  return (
                    <div
                      key={key}
                      className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse h-[360px]"
                    >
                      <div className="h-48 bg-gray-100" />
                      <div className="p-6 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={key}
                    className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 group h-[400px]"
                  >
                    <div
                      className="relative h-48 overflow-hidden"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <ImageWithFallback
                        src={product.main_image_url || product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6A0DAD]">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                        <span>{product.category?.name ?? "Featured"}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#6A0DAD]">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-2xl font-semibold text-[#6A0DAD]">
                          ${(product.price_cents / 100).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold hover:shadow-xl transition-all hover:scale-105"
                          style={{ backgroundColor: color }}
                        >
                          <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-xl text-gray-500">No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Shop;
