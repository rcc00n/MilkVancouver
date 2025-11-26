import { Link } from "react-router-dom";

import { brand } from "../config/brand";

const inspectionHighlights = [
  "BC Dairy-inspected partners with pasteurization logs on every batch.",
  "Reusable glass is sanitized, pressure-tested, and inspected before filling.",
  "Labels show dairy, batch code, pasteurization window, and style (cream-top or homogenized).",
  "Cold chain stays between 0–4°C from fill to doorstep with timestamped readings.",
];

const founders = [
  {
    name: "Mike",
    role: "Co-founder · Sourcing & bottling",
    bio: "Raised on a mixed farm and trained in small-batch dairies, Mike handpicks partner herds and specs every batch that leaves our plant.",
    points: [
      "Walks pastures with farmers before we sign on.",
      "Works shoulder-to-shoulder with inspectors to keep paperwork clean.",
      "Obsessed with consistent pasteurization windows and protein levels.",
    ],
  },
  {
    name: "Natalia",
    role: "Co-founder · Ops & community",
    bio: "Natalia grew up on a dairy farm and studied supply chain. She runs the cold room, bottle returns, delivery routes, and customer programs that keep orders dependable.",
    points: [
      "Builds routes that keep everything within safe temps.",
      "Translates inspection rules into simple labels and guides.",
      "Champions family-friendly staples and barista-ready milk.",
    ],
  },
];

const standards = [
  {
    title: "Grass-fed Milk",
    summary:
      "Pasture-first herds deliver naturally sweet milk with a golden cream line. We bottle within 24 hours of milking.",
    bullets: [
      "Low-temp pasteurized to keep proteins friendly for steaming.",
      "Higher in omega-3s with seasonal beta-carotene.",
      "Clearly labelled batch and pasteurization window.",
    ],
    linkLabel: "Read the grass-fed dairy notes",
    linkTo: "/blog",
  },
  {
    title: "Cold-chain & Glass",
    summary: "Reusable bottles, temperature logs, and deposit returns keep quality high and waste low.",
    bullets: [
      "0–4°C logs at fill, storage, and delivery.",
      "Sanitized glass, pressure-tested between runs.",
      "Deposits auto-credited when you leave bottles out.",
    ],
    linkLabel: "See how bottle returns work",
    linkTo: "/blog",
  },
];

const metrics = [
  { value: "24 hrs", label: "Milking → bottle", note: "Timestamped on label" },
  { value: "3x", label: "Weekly routes", note: "Vancouver + North Shore" },
  { value: "85%", label: "Bottle return rate", note: "Deposit loop participation" },
  { value: "0–4°C", label: "Cold-chain target", note: "Logged every stop" },
];

function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container about-hero__grid">
          <div className="about-hero__copy">
            <div className="eyebrow">About Us</div>
            <h1>{brand.name} bottles grass-fed dairy for Vancouver homes and cafes.</h1>
            <p>
              We built {brand.shortName} to be the honest dairy program we wanted nearby: transparent labels, low-temp
              pasteurization, and a bottle return loop that keeps glass in use instead of recycling.
            </p>
            <div className="about-hero__pills">
              <span className="pill pill--strong">BC Dairy inspected</span>
              <span className="pill">Vancouver delivery routes</span>
              <span className="pill">Grass-fed · Glass bottles</span>
            </div>
            <div className="about-hero__actions">
              <a className="btn btn--primary" href="#founders">
                Meet the founders
              </a>
              <a className="btn btn--ghost" href="#standards">
                Our standards
              </a>
            </div>
          </div>

          <div className="about-hero__card">
            <div className="about-hero__card-header">
              <div className="eyebrow eyebrow--green">Vancouver base</div>
              <h3>Pasteurized, bottled, and routed from our Vancouver facility.</h3>
              <p className="muted">
                We bottle within 24 hours of milking and ship to homes, cafes, and grocers with the same cold-chain
                standard.
              </p>
            </div>
            <dl className="about-hero__facts">
              <div>
                <dt>Location</dt>
                <dd>Vancouver-based bottle room with local routes and insulated shipping.</dd>
              </div>
              <div>
                <dt>Credentials</dt>
                <dd>BC Dairy-inspected partners with documented batch tracking.</dd>
              </div>
              <div>
                <dt>Focus</dt>
                <dd>Grass-fed milk, yogurt, kefir, cream, and cultured butter.</dd>
              </div>
            </dl>
            <ul className="about-hero__checks">
              <li>Pasteurization logs and batch codes on every bottle</li>
              <li>Temperature-controlled storage and delivery</li>
              <li>Transparent labels with dairy partner and style</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container about-story" id="story">
        <div className="about-section-header">
          <div>
            <div className="eyebrow">Intro story</div>
            <h2>We started with family recipes and a promise to keep things honest.</h2>
          </div>
          <span className="pill pill--accent">Built on trust & inspection</span>
        </div>
        <div className="about-story__grid">
          <div className="about-story__text">
            <p>
              Mike grew up watching his family bottle milk and make cheese by hand. Natalia spent her childhood on a
              dairy farm and later worked in logistics. Together we saw a gap between big-box milk and the flavor—and
              accountability—of grass-fed farms. {brand.shortName} closes that gap.
            </p>
            <p>
              We keep relationships personal: walking pastures, confirming feed plans, and keeping batch sizes small so
              every bottle gets attention. That respect extends to inspection—we welcome oversight because it keeps our
              promises real and your coffee tasting better.
            </p>
          </div>
          <div className="about-story__values">
            <h3>Mission & values</h3>
            <ul className="checklist">
              <li>Pay farmers fairly and put their names on the label.</li>
              <li>Make inspection logs and cold-chain data easy to understand.</li>
              <li>Offer staples for families, athletes, cafes, and hosts alike.</li>
              <li>Reuse glass and keep additives low—just clean, honest flavor.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container founders" id="founders">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Founders story</div>
            <h2>Meet Mike & Natalia</h2>
            <p className="muted">
              A dairy farmer and a supply-chain pro running one inspected, transparent bottle room.
            </p>
          </div>
          <span className="pill">Farm partners · Family-run</span>
        </div>
        <div className="founder-grid">
          {founders.map((founder) => (
            <div key={founder.name} className="founder-card">
              <div className="founder-card__header">
                <div className="founder-card__avatar">{founder.name[0]}</div>
                <div>
                  <div className="founder-card__name">{founder.name}</div>
                  <div className="founder-card__role">{founder.role}</div>
                </div>
              </div>
              <p>{founder.bio}</p>
              <ul className="founder-card__list">
                {founder.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container good-to-know" id="good-to-know">
        <div className="good-to-know__card">
          <div>
            <div className="eyebrow eyebrow--green">Good to know</div>
            <h3>Yes—{brand.name} bottles under BC Dairy inspection.</h3>
            <p>
              That means daily oversight, full traceability, and the ability to serve local pickup customers and
              ship-to-door orders without changing our standards.
            </p>
            <div className="good-to-know__links">
              <Link to="/good-to-know" className="link-button">
                Read the full FAQ & education page →
              </Link>
              <span className="pill pill--small">Transparency first</span>
            </div>
          </div>
          <div className="good-to-know__badge">
            <div className="good-to-know__seal">Inspected</div>
            <div className="muted">BC Dairy inspection · Traceable batches</div>
          </div>
        </div>
      </section>

      <section className="container inspection" id="inspection-summary">
        <div className="section-heading">
          <div>
            <div className="eyebrow">What it means</div>
            <h2>BC Dairy inspection and cold chain, condensed.</h2>
          </div>
          <span className="pill">3–5 point summary</span>
        </div>
        <div className="inspection__grid">
          <ul className="inspection__list">
            {inspectionHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="inspection__card">
            <div className="inspection__tag">Documentation</div>
            <h3>Paperwork that travels with every bottle.</h3>
            <p>
              Batch tracking, sanitation logs, and temperature charts live with each run. Homes, cafes, and grocers get
              the same level of clarity.
            </p>
            <div className="inspection__meta">
              <span className="pill pill--small">HACCP-minded</span>
              <span className="pill pill--accent">Cold-chain protected</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container standards" id="standards">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Standards</div>
            <h2>Grass-fed dairy & cold-chain standards, at a glance.</h2>
          </div>
          <Link to="/blog" className="link-button">
            Extended articles →
          </Link>
        </div>
        <div className="standards__grid">
          {standards.map((standard) => (
            <div key={standard.title} className="standard-card">
              <div className="standard-card__eyebrow">{standard.title}</div>
              <h3>{standard.summary}</h3>
              <ul className="standard-card__list">
                {standard.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <Link to={standard.linkTo} className="link-button">
                {standard.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container metrics" id="metrics">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Metrics</div>
            <h2>Proof points in the open.</h2>
          </div>
          <p className="muted">Configurable fields you can swap as new milestones land.</p>
        </div>
        <div className="metrics__grid">
          {metrics.map((metric) => (
            <div key={metric.label} className="metric">
              <div className="metric__value">{metric.value}</div>
              <div className="metric__label">{metric.label}</div>
              <div className="metric__note">{metric.note}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
