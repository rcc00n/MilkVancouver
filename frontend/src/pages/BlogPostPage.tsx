import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getBlogPost, getLatestBlogPosts } from "../api/blog";
import BlogCard from "../components/blog/BlogCard";
import type { BlogPost, BlogPostDetail } from "../types";

function formatPublishedDate(date?: string) {
  if (!date) return "Fresh";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Fresh";
  return parsed.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setPost(null);

    getBlogPost(slug, controller.signal)
      .then((result) => setPost(result))
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch blog post", fetchError);
        setError("We could not find that post. Try another story from the blog.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();

    getLatestBlogPosts(3, controller.signal)
      .then((posts) => {
        if (slug) {
          setRelatedPosts(posts.filter((item) => item.slug !== slug).slice(0, 3));
        } else {
          setRelatedPosts(posts.slice(0, 3));
        }
      })
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load related posts", fetchError);
      });

    return () => controller.abort();
  }, [slug]);

  const authorLabel = post?.author?.trim() || "Vancouver Milk Co. Team";

  const renderContent = () => {
    if (!post?.content) return null;
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(post.content);

    if (hasHtml) {
      return <div className="blog-post__content" dangerouslySetInnerHTML={{ __html: post.content }} />;
    }

    return (
      <div className="blog-post__content">
        {post.content
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((block, index) => (
            <p key={index}>{block.trim()}</p>
          ))}
      </div>
    );
  };

  return (
    <div className="blog-post-page">
      <div className="container">
        <div className="blog-post__back">
          <Link to="/blog" className="link-button">
            ← Back to blog
          </Link>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        {loading && (
          <div className="blog-post blog-post--skeleton">
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text skeleton--short" />
            <div className="skeleton skeleton--image" />
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text skeleton--short" />
          </div>
        )}

        {post && (
          <article className="blog-post">
            <div className="blog-post__meta">
              <span>{formatPublishedDate(post.published_at)}</span>
              <span>By {authorLabel}</span>
            </div>
            <h1 className="blog-post__title">{post.title}</h1>
            {post.excerpt && <p className="blog-post__excerpt muted">{post.excerpt}</p>}
            {post.cover_image_url && (
              <div className="blog-post__cover">
                <img src={post.cover_image_url} alt={post.title} />
              </div>
            )}
            {renderContent()}
          </article>
        )}

        {relatedPosts.length > 0 && (
          <section className="related-posts">
            <div className="section-heading">
              <div>
                <div className="eyebrow">Related posts</div>
                <h3>Keep reading from the milk bar</h3>
              </div>
              <Link to="/blog" className="link-button">
                All posts →
              </Link>
            </div>
            <div className="blog-grid">
              {relatedPosts.map((related) => (
                <BlogCard key={related.id} post={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default BlogPostPage;
