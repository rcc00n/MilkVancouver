import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getBlogPosts } from "../api/blog";
import BlogCard from "../components/blog/BlogCard";
import { brand } from "../config/brand";
import type { BlogPost } from "../types";

const PAGE_SIZE = 6;

function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const pageParam = Number(searchParams.get("page") || 1);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getBlogPosts({ page, page_size: PAGE_SIZE }, controller.signal)
      .then((response) => {
        setPosts(response.results);
        setTotalCount(response.count);
      })
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch blog posts", fetchError);
        setError("We could not load the blog right now. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    posts.forEach((post) => {
      if (post.category) {
        unique.add(post.category);
      }
    });
    return Array.from(unique);
  }, [posts]);

  useEffect(() => {
    if (activeCategory === "all") return;
    const hasCategory = posts.some((post) => post.category === activeCategory);
    if (!hasCategory) {
      setActiveCategory("all");
    }
  }, [activeCategory, posts]);

  const filteredPosts = activeCategory === "all" ? posts : posts.filter((post) => post.category === activeCategory);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    const params = new URLSearchParams();
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }
    setSearchParams(params);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    handlePageChange(1);
  };

  const articleCount = totalCount || posts.length;

  return (
    <div className="blog-page">
      <section className="page-hero page-hero--blog">
        <div className="container page-hero__grid blog-hero">
          <div className="page-hero__intro blog-hero__intro">
            <div className="eyebrow">Yummee Blog</div>
            <h1>Tips, recipes, and updates from your local milk crew.</h1>
            <p className="muted">
              Pour a glass, learn how we bottle grass-fed milk, and browse easy ways to fold yogurt, cultured butter,
              and barista blends into breakfast and late-night snacks around {brand.location}.
            </p>
            <div className="blog-hero__meta">
              <span className="pill pill--strong">{articleCount || "New"} posts</span>
              <span className="pill">Recipes · Delivery notes · Cafe tips</span>
            </div>
          </div>
          <div className="page-hero__card blog-hero__card">
            <h3>On the menu this week</h3>
            <ul className="checklist">
              <li>15-minute breakfasts powered by our yogurt and oat pairings.</li>
              <li>Milk-steaming techniques for silky foam at home.</li>
              <li>Behind-the-scenes from the Yummee delivery route.</li>
            </ul>
            <div className="blog-hero__actions">
              <Link to="/shop" className="btn btn--primary">
                Shop the fridge
              </Link>
              <Link to="/contact" className="link-button">
                Ask us anything →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container blog-list">
        <div className="section-heading blog-list__heading">
          <div>
            <div className="eyebrow">Latest posts</div>
            <h2>Browse every story</h2>
            <p className="muted">Fresh dairy know-how, seasonal menu ideas, and updates from the delivery van.</p>
          </div>
          {categories.length > 0 && (
            <div className="blog-filters" role="tablist" aria-label="Filter by category">
              <button
                type="button"
                className={`blog-filter ${activeCategory === "all" ? "is-active" : ""}`}
                onClick={() => handleCategoryChange("all")}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`blog-filter ${activeCategory === category ? "is-active" : ""}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <div className="alert alert--error">{error}</div>}
        <div className="blog-grid blog-grid--columns">
          {loading &&
            Array.from({ length: Math.min(PAGE_SIZE, 6) }).map((_, index) => (
              <div key={index} className="blog-card blog-card--skeleton">
                <div className="skeleton skeleton--image" />
                <div className="blog-card__body">
                  <div className="skeleton skeleton--text" />
                  <div className="skeleton skeleton--text skeleton--short" />
                </div>
              </div>
            ))}
          {!loading && posts.length === 0 && (
            <div className="alert alert--muted">No posts yet—our team is writing the first story now.</div>
          )}
          {!loading && filteredPosts.map((post) => <BlogCard key={post.id} post={post} />)}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button type="button" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
              ← Newer
            </button>
            <div className="pagination__meta">
              Page {Math.min(page, totalPages)} of {totalPages}
            </div>
            <button type="button" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
              Older →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default BlogListPage;
