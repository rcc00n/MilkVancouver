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
  const categoryLabel = post.category?.trim() || `${brand.shortName} Dispatch`;

  return (
    <Link to={`/blog/${post.slug}`} className="blog-card">
      {post.cover_image_url ? (
        <img src={post.cover_image_url} alt={post.title} className="blog-card__image" />
      ) : (
        <div className="blog-card__placeholder">Story</div>
      )}
      <div className="blog-card__body">
        <div className="blog-card__meta">
          <span className="pill pill--outline blog-card__pill">{categoryLabel}</span>
          <span className="blog-card__date">{formatPublishedDate(post.published_at)}</span>
        </div>
        <h3 className="blog-card__title">{post.title}</h3>
        {post.excerpt && <p className="blog-card__excerpt">{post.excerpt}</p>}
        <div className="blog-card__footer">
          <span className="blog-card__author">{authorLabel}</span>
          <span className="blog-card__cta">Read more →</span>
        </div>
      </div>
    </Link>
  );
}

export default BlogCard;
