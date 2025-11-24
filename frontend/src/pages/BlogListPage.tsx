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
            <h1>Stories, sourcing notes, and cooking guides from MeatDirect.</h1>
            <p className="muted">
              Educate customers about grass-fed benefits, hormone-free sourcing, and cooking methods that make the most
              of every cut—while boosting SEO with helpful, evergreen guides.
            </p>
            <div className="page-hero__chips">
              <span className="pill pill--accent">Grass-fed 101</span>
              <span className="pill">Butcher tips</span>
              <span className="pill">Cook temps</span>
              <span className="pill">Meal prep</span>
            </div>
          </div>
          <div className="page-hero__card">
            <h3>What you will learn</h3>
            <ul className="checklist">
              <li>How to cook grass-fed beef, bison, and heritage pork without drying them out.</li>
              <li>Which cuts to choose for grilling, low-and-slow smoking, or weeknight sears.</li>
              <li>Why hormone-free sourcing matters for families and restaurants alike.</li>
            </ul>
            <Link to="/menu" className="link-button">
              Shop the cuts →
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
