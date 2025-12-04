import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import ProductGrid from "../components/products/ProductGrid";
import { Button } from "../components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { cn } from "../components/ui/utils";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductsContext";
import { getCategories, type Category } from "../api/products";

type SortOption = "popular" | "price-asc" | "price-desc" | "name";

type CategoryOption = {
  label: string;
  value: string | null;
};

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Popular first", value: "popular" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name A–Z", value: "name" },
];

const normalizeCategory = (value?: string | null) => value?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";

function Shop() {
  const { products, loading, error, initialized, refresh } = useProducts();
  const { items, subtotalCents } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("popular");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const cartCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
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
    const options: CategoryOption[] = [{ label: "All", value: null }];
    categories.forEach((category) => {
      const key = category.slug || category.name;
      if (seen.has(key)) return;
      seen.add(key);
      options.push({ label: category.name, value: category.slug });
    });
    return options;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const filtered = selectedCategory
      ? products.filter((product) => product.category?.slug === selectedCategory)
      : products;

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price_cents - b.price_cents;
        case "price-desc":
          return b.price_cents - a.price_cents;
        case "name":
          return a.name.localeCompare(b.name);
        case "popular":
        default:
          if (a.is_popular === b.is_popular) return a.name.localeCompare(b.name);
          return a.is_popular ? -1 : 1;
      }
    });
    return sorted;
  }, [products, selectedCategory, sort]);

  const activeCategoryLabel =
    categoryOptions.find((option) => option.value === selectedCategory)?.label || "All";
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Popular first";

  return (
    <div className="shop-page space-y-6 md:space-y-8">
      <section className="container space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Shop</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-800">Shop</p>
          <h1 className="text-4xl font-semibold text-slate-900">Shop Yummee milk</h1>
          <p className="max-w-3xl text-slate-600">
            Fresh Vancouver milk, flavored sips, and cafe staples. Browse, add to cart, and checkout in a few taps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-800 shadow-sm">
            {isLoading ? "Loading catalog..." : `${products.length} products`}
          </span>
          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">
            Category: {activeCategoryLabel}
          </span>
          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">Sort: {sortLabel}</span>
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-800 shadow-sm">
            <span>{cartCount ? `${cartCount} in cart` : "Cart empty"}</span>
            <span className="text-slate-500">· ${(subtotalCents / 100).toFixed(2)}</span>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="h-8 rounded-full px-3 text-xs font-semibold"
            >
              <Link to="/checkout">Checkout</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container space-y-4">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option.value ?? "all"}
                type="button"
                onClick={() => setSelectedCategory(option.value)}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm font-semibold transition-colors",
                  selectedCategory === option.value
                    ? "border-sky-500 bg-sky-50 text-sky-900 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:text-sm">
              Sort
            </span>
            <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Sort products" />
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(error || categoryError) && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <span>{error || categoryError}</span>
            <Button variant="outline" size="sm" onClick={() => refresh({ force: true })}>
              Retry
            </Button>
          </div>
        )}

        <ProductGrid products={filteredProducts} loading={isLoading} />
      </section>
    </div>
  );
}

export default Shop;
