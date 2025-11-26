import { Link } from "react-router-dom";

import type { BlogPost } from "../../types";
import { brand } from "../../config/brand";

type BlogCardProps = {
  post: BlogPost;
};

function formatPublishedDate(date?: string) {
  if (!date) return "Fresh";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Fresh";
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function BlogCard({ post }: BlogCardProps) {
  const authorLabel = post.author?.trim() || `${brand.shortName} Team`;

  return (
    <Link to={`/blog/${post.slug}`} className="blog-card">
      {post.cover_image_url ? (
        <img src={post.cover_image_url} alt={post.title} className="blog-card__image" />
      ) : (
        <div className="blog-card__placeholder">Story</div>
      )}
      <div className="blog-card__body">
        <div className="blog-card__meta">
          <span>{formatPublishedDate(post.published_at)}</span>
          <span>{authorLabel}</span>
        </div>
        <h3>{post.title}</h3>
        {post.excerpt && <p className="muted">{post.excerpt}</p>}
        <div className="blog-card__footer">
          <span className="blog-card__cta">Read more →</span>
        </div>
      </div>
    </Link>
  );
}

export default BlogCard;
