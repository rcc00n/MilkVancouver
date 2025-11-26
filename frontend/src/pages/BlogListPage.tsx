import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getBlogPosts } from "../api/blog";
import BlogCard from "../components/blog/BlogCard";
import type { BlogPost } from "../types";

const PAGE_SIZE = 6;

function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

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

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    const params = new URLSearchParams();
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }
    setSearchParams(params);
  };

  return (
    <div className="blog-page">
      <section className="page-hero page-hero--blog">
        <div className="container page-hero__grid">
          <div className="page-hero__intro">
            <div className="eyebrow">Blog</div>
            <h1>Stories, dairy tips, and coffee bar notes from Vancouver Milk Co.</h1>
            <p className="muted">
              Learn how we bottle grass-fed milk, steam silky lattes, and use cultured butter and yogurt in weeknight
              cooking—plus updates from our Vancouver delivery routes.
            </p>
            <div className="page-hero__chips">
              <span className="pill pill--accent">Grass-fed dairy</span>
              <span className="pill">Barista guides</span>
              <span className="pill">Recipes</span>
              <span className="pill">Fridge hacks</span>
            </div>
          </div>
          <div className="page-hero__card">
            <h3>What you will learn</h3>
            <ul className="checklist">
              <li>How to steam and pour barista milk for glossy microfoam.</li>
              <li>When to pick whole milk vs. low-fat for baking and sauces.</li>
              <li>Why pasteurization windows and cold-chain matter for flavor.</li>
            </ul>
            <Link to="/menu" className="link-button">
              Shop the dairy case →
            </Link>
          </div>
        </div>
      </section>

      <section className="container blog-list">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Latest posts</div>
            <h2>Browse every story</h2>
            <p className="muted">Cooking methods, sourcing explainers, and seasonal menu ideas.</p>
          </div>
          <span className="pill pill--strong">{totalCount || posts.length} articles</span>
        </div>
        {error && <div className="alert alert--error">{error}</div>}
        <div className="blog-grid blog-grid--spacious">
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
          {!loading && posts.map((post) => <BlogCard key={post.id} post={post} />)}
        </div>
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
      </section>
    </div>
  );
}

export default BlogListPage;
