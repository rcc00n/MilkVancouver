import { useEffect, useMemo, useState } from "react";

import { getProducts } from "../api/products";
import FiltersBar from "../components/products/FiltersBar";
import ProductGrid from "../components/products/ProductGrid";
import SearchBar from "../components/products/SearchBar";
import type { Product } from "../types";

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    getProducts().then(setProducts).catch((error) => {
      console.error("Failed to fetch products", error);
    });
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.category).filter((category): category is string => Boolean(category))),
      ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => Number(b.is_popular) - Number(a.is_popular));
  }, [products, searchTerm, selectedCategory]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section
        style={{
          padding: "18px 20px",
          borderRadius: 18,
          background: "linear-gradient(135deg, #ffedd5, #f8fafc)",
          border: "1px solid #fed7aa",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#c2410c", fontWeight: 700, letterSpacing: 0.4 }}>WEEKLY DROP</span>
            <h1 style={{ margin: 0, fontSize: 32 }}>Chef-grade meat, shipped fresh to you</h1>
            <p style={{ margin: 0, color: "#475569" }}>
              Curated cuts from small farms, hand-trimmed and delivered cold. Build your own box or pick our ready bundles.
            </p>
          </div>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              background: "#fff",
              border: "1px solid #fecdd3",
              color: "#be123c",
              fontWeight: 700,
              boxShadow: "0 16px 40px -28px rgba(190, 18, 60, 0.6)",
            }}
          >
            Next dispatch: Sunday 8pm
          </div>
        </div>
      </section>

      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <FiltersBar categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
      <ProductGrid products={filteredProducts} />
    </div>
  );
}

export default HomePage;
