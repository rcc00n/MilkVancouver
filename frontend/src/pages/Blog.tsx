import PageShell from "../components/PageShell";

function Blog() {
  return (
    <PageShell
      title="Blog"
      note="Route ready"
      description="Hub for recipes, product education, and news. Wire up the list view here once posts are available."
    >
      <div className="page-placeholder">
        <p>Blog list placeholder. Link cards, categories, and pagination will replace this block.</p>
        <ul>
          <li>Use muted text for meta, primary for headlines</li>
          <li>Keep cards within the 1180px container</li>
          <li>Background stays white for maximum readability</li>
        </ul>
      </div>
    </PageShell>
  );
}

export default Blog;
