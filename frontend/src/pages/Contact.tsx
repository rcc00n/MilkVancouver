import PageShell from "../components/PageShell";

function Contact() {
  return (
    <PageShell
      title="Contact"
      note="Route ready"
      description="Customer support and wholesale inquiries live here. Form and map components will slot in next."
    >
      <div className="page-placeholder">
        <p>Contact page placeholder. It confirms the `/contact` route and layout spacing.</p>
        <ul>
          <li>Solid primary buttons for form submit</li>
          <li>Accent links for phone and email</li>
          <li>Neutral panels for office hours and FAQs</li>
        </ul>
      </div>
    </PageShell>
  );
}

export default Contact;
