import PageShell from "../components/PageShell";

function Home() {
  return (
    <PageShell
      title="Yummee home"
      note="Day 1 scaffolding"
      description="Routing, layout, and design tokens are in place. Next we’ll drop in the hero, featured products, and testimonials."
    >
      <div className="page-placeholder">
        <p>This is the Home page placeholder. Use it to verify the nav, styling tokens, and spacing scale.</p>
        <ul>
          <li>CTA-ready hero and product highlights coming next</li>
          <li>Keep max width at the shared container for consistency</li>
          <li>Buttons use the solid primary and subtle secondary styles</li>
        </ul>
      </div>
    </PageShell>
  );
}

export default Home;
