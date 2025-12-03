import PageShell from "../components/PageShell";

function About() {
  return (
    <PageShell
      title="About Yummee"
      note="Route ready"
      description="Tell the farm-to-bottle story, sourcing, and team. This placeholder keeps the page wired while we draft content."
    >
      <div className="page-placeholder">
        <p>About page placeholder. Replace with brand story, values, and photography once approved.</p>
        <ul>
          <li>Use the heading font for section leads</li>
          <li>Neutral panels help long-form copy breathe</li>
          <li>Accent color is reserved for key stats and highlights</li>
        </ul>
      </div>
    </PageShell>
  );
}

export default About;
