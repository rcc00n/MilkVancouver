import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getLatestBlogPosts } from "../api/blog";
import { getProducts } from "../api/products";
import BlogCard from "../components/blog/BlogCard";
import FiltersBar from "../components/products/FiltersBar";
import ProductGrid from "../components/products/ProductGrid";
import SearchBar from "../components/products/SearchBar";
import type { BlogPost, Product } from "../types";

const highlightCategories = [
  {
    title: "Grass-Fed Beef",
    description: "Ribeyes, strips, and roasts with deep, grassy flavor.",
    badge: "Local favorite",
    category: "Beef",
    tone: "amber",
  },
  {
    title: "Heritage Pork",
    description: "Thick-cut chops, belly, and sausage from small farms.",
    badge: "Butcher picks",
    category: "Pork",
    tone: "rose",
  },
  {
    title: "Bison & Game",
    description: "Lean power cuts for training seasons and meal prep.",
    badge: "Lean fuel",
    category: "Bison",
    tone: "emerald",
  },
  {
    title: "Smoked & Cured",
    description: "Kielbasa, bacon, and Eastern European charcuterie.",
    badge: "Low & slow",
    category: "Charcuterie",
    query: "smoked",
    tone: "slate",
  },
];

const whyChooseUs = [
  { label: "Grass Fed", detail: "Grazed on pasture-first diets.", tone: "emerald" },
  { label: "Hormone Free", detail: "No growth hormones—ever.", tone: "amber" },
  { label: "Federally Inspected", detail: "USDA oversight on every batch.", tone: "slate" },
  { label: "Farm Product", detail: "Direct from partner ranchers.", tone: "rose" },
  { label: "Home Made", detail: "House spice blends and cures.", tone: "blue" },
];

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shopSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = debouncedSearch ? { search: debouncedSearch } : undefined;

    getProducts(params, controller.signal)
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
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    setBlogLoading(true);
    setBlogError(null);

    getLatestBlogPosts(3, controller.signal)
      .then((result) => setBlogPosts(result))
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch blog posts", fetchError);
        setBlogError("Unable to load the latest from our blog right now.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBlogLoading(false);
      });

    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.category).filter((category): category is string => Boolean(category))),
      ),
    [products],
  );

  useEffect(() => {
    if (selectedCategory && !categories.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [categories, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const matchesCategory = selectedCategory
      ? products.filter((product) => product.category === selectedCategory)
      : products;

    return [...matchesCategory].sort((a, b) => Number(b.is_popular) - Number(a.is_popular));
  }, [products, selectedCategory]);

  const popularProducts = useMemo(() => products.filter((product) => product.is_popular).slice(0, 4), [products]);
  const categoryBadges = categories.slice(0, 4);

  const scrollToShop = () => {
    if (shopSectionRef.current) {
      shopSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCategoryTile = (category: string | null, query?: string) => {
    setSelectedCategory(category);
    setSearchTerm(query ?? "");
    scrollToShop();
  };

  const handleEuropeanClick = () => {
    setSelectedCategory(null);
    setSearchTerm("European");
    scrollToShop();
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <div className="eyebrow">Grass-fed · Local · Hormone-free</div>
            <h1 className="hero__title">We specialize in high quality, local meat.</h1>
            <p className="hero__subtitle">
              Beef to bison, kielbasa to cured bacon—raised close to home, cut by butchers, and packed cold for the trip
              to your kitchen.
            </p>
            <div className="hero__ctas">
              <Link to="/menu" className="btn btn--primary" onClick={scrollToShop}>
                Shop Now
              </Link>
              <Link to="/pricing" className="btn btn--ghost">
                View Pricing
              </Link>
            </div>
            <div className="hero__pills">
              {categoryBadges.length ? (
                categoryBadges.map((category) => (
                  <span key={category} className="pill pill--strong">
                    {category}
                  </span>
                ))
              ) : (
                <span className="pill pill--strong">Hand-cut weekly</span>
              )}
              <span className="pill pill--accent">Over {products.length || 0} cuts ready</span>
            </div>
          </div>

          <div className="hero__panel">
            <div className="hero__panel-header">
              <div className="hero__panel-title">
                <span className="eyebrow eyebrow--green">Popular right now</span>
                <h3>What locals are adding</h3>
              </div>
              <span className="pill pill--small">Fresh drop</span>
            </div>
            {popularProducts.length ? (
              <div className="hero__popular-list">
                {popularProducts.map((product) => (
                  <div key={product.id} className="hero__popular-item">
                    <div>
                      <div className="hero__popular-name">{product.name}</div>
                      {product.category && <div className="hero__popular-meta">{product.category}</div>}
                    </div>
                    <div className="hero__popular-price">${(product.price_cents / 100).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Mark a product as popular in admin to feature it here.</p>
            )}
            <div className="hero__note">
              Crafted weekly, packed cold, and delivered in insulated liners so everything arrives fridge-ready.
            </div>
          </div>
        </div>
      </section>

      <section className="category-section">
        <div className="container section-heading">
          <div>
            <div className="eyebrow">Shop by craving</div>
            <h2>Pick a lane and we will prep the rest.</h2>
            <p className="muted">
              Each tile opens a filtered view of our shop so you can head straight to the cuts you need.
            </p>
          </div>
          <button type="button" className="link-button" onClick={scrollToShop}>
            Go to shop
          </button>
        </div>
        <div className="container category-grid">
          {highlightCategories.map((item) => (
            <button
              key={item.title}
              type="button"
              className={`category-card category-card--${item.tone}`}
              onClick={() => handleCategoryTile(item.category, item.query)}
            >
              <div className="category-card__badge">{item.badge}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="category-card__cta">Browse {item.category || "everything"} →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="europe-section">
        <div className="container europe-grid">
          <div>
            <div className="eyebrow">From Europe to your table</div>
            <h2>Eastern European delicacies without hopping a flight.</h2>
            <p className="muted">
              We import smoked, cured, and specialty cuts inspired by butchers across Poland, Hungary, and the Balkans.
              Perfect for holiday spreads or weeknight comfort food.
            </p>
            <div className="hero__ctas">
              <button type="button" className="btn btn--primary" onClick={handleEuropeanClick}>
                View European Products
              </button>
              <Link to="/menu" className="btn btn--ghost" onClick={scrollToShop}>
                Shop All
              </Link>
            </div>
          </div>
          <div className="europe-card">
            <div className="europe-card__tag">Butcher-curated</div>
            <div className="europe-card__title">Kielbasa · Smoked ham · Cured bacon</div>
            <p>
              Small-batch recipes smoked over beechwood and hand-trussed. We slice, seal, and chill before it heads your
              way.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container about-grid">
          <div>
            <div className="eyebrow">About MeatDirect</div>
            <h2>Our roots are in Eastern Europe, our farms are around the corner.</h2>
            <p>
              We grew up around busy butcher counters where quality mattered more than convenience. That shaped how we
              work with nearby farms today—hands-on sourcing, respectful processing, and honest pricing.
            </p>
            <p>
              Every cut is inspected, trimmed, and packaged by people who cook these recipes at home. We keep batches
              small, use minimal additives, and move quickly so flavor—not logistics—leads.
            </p>
            <p>
              From grill-ready steaks to cured specialties, the goal is the same: food you trust, made by people you
              know.
            </p>
            <Link to="/about-us" className="link-button">
              Read Our Story →
            </Link>
          </div>
          <div className="testimonial">
            <div className="testimonial__eyebrow">Customer story</div>
            <blockquote>
              “I’m a competitive bodybuilder and need lean fuel that actually tastes good. The bison steaks and chicken
              sausages here changed my prep—I get clean protein without drying out my meals. Orders land cold, vacuum
              sealed, and I’ve never had a missed delivery.”
            </blockquote>
            <div className="testimonial__meta">
              <strong>Marcus L.</strong> · Trains 2x daily, Meal-preps Sundays
            </div>
          </div>
        </div>
      </section>

      <section className="why-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Why choose us</div>
              <h2>Standards that stay on the label.</h2>
            </div>
            <div className="muted">Farm-direct sourcing, small-batch curing, and transparent partners.</div>
          </div>
          <div className="why-grid">
            {whyChooseUs.map((item) => (
              <div key={item.label} className={`why-card why-card--${item.tone}`}>
                <div className="why-card__icon">{item.label[0]}</div>
                <div>
                  <div className="why-card__title">{item.label}</div>
                  <div className="why-card__detail">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="blog-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">News & Blog</div>
              <h2>Fresh stories from the butcher block.</h2>
            </div>
            <Link to="/blog" className="link-button">
              Visit Blog →
            </Link>
          </div>
          {blogError && <div className="alert alert--error">{blogError}</div>}
          <div className="blog-grid">
            {blogLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="blog-card blog-card--skeleton">
                  <div className="skeleton skeleton--image" />
                  <div className="skeleton skeleton--text" />
                  <div className="skeleton skeleton--text skeleton--short" />
                </div>
              ))}
            {!blogLoading && blogPosts.length === 0 && (
              <div className="alert alert--muted">No blog posts yet—check back soon.</div>
            )}
            {blogPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="shop-section" ref={shopSectionRef} id="shop">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Shop / Menu</div>
              <h2>Explore the full case.</h2>
              <p className="muted">
                Filter by category, search by cut, or jump into what’s trending. Everything ships cold and ready to cook.
              </p>
            </div>
            <div className="shop-meta">
              <span className="pill pill--strong">{products.length} products</span>
              <span className="pill">Popular filters include {categoryBadges.join(", ") || "local picks"}.</span>
            </div>
          </div>
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
          <FiltersBar categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
          {error && <div className="alert alert--error">{error}</div>}
          <ProductGrid products={filteredProducts} loading={loading} />
        </div>
      </section>
    </div>
  );
}

export default HomePage;
