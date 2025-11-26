import { Link } from "react-router-dom";

const inspectionQuestions = [
  {
    question: "How fresh is the milk when it arrives?",
    answer:
      "Milking and pasteurization happen the same day. Bottles are sealed between 0–4°C and timestamped so you know the exact window.",
  },
  {
    question: "Do you pasteurize and homogenize?",
    answer:
      "We low-temp pasteurize and offer both cream-top (non-homogenized) and homogenized options. Each label lists the process so you can choose.",
  },
  {
    question: "How do bottle deposits and returns work?",
    answer:
      "Pay the deposit on your first order, rinse bottles after use, and leave them out on delivery day. Drivers scan returns and apply the credit to your next order.",
  },
  {
    question: "Where do you deliver?",
    answer:
      "Vancouver, Burnaby, and the North Shore twice weekly with insulated shipping for surrounding areas. SMS updates include cold-chain timestamps.",
  },
];

const grassHighlights = [
  "Grass-fed herds create naturally sweeter milk with balanced proteins.",
  "Seasonal beta-carotene shows up as a golden cream line in non-homogenized bottles.",
  "Low-temp pasteurization preserves flavor and keeps milk steaming-friendly for coffee.",
  "Higher omega-3s and CLA make it a great choice for families and baristas alike.",
];

const grainNotes = [
  "Non-homogenized (cream-top) bottles keep the fat intact—shake to blend or skim for coffee.",
  "Homogenized options stay uniform for kids, smoothies, and quick pours.",
  "We list the style on every label so you can pick what fits your fridge habits.",
];

const hormonePoints = [
  "BC Dairy-inspected plants with batch tracking on every bottle.",
  "Cold-chain readings logged from fill to doorstep; flagged if outside 0–4°C.",
  "Reusable glass sanitized and pressure-tested before refilling.",
  "No antibiotics in the milk supply—batches are held and discarded if a herd is treated.",
];

const microFaq = [
  {
    question: "Where do you bottle?",
    answer:
      "Fraser Valley and Vancouver partners handle milking, pasteurization, and bottling. Labels list the dairy, batch, and pasteurization window.",
    linkLabel: "Meet our partner dairies",
    linkTo: "/about-us",
  },
  {
    question: "Do you offer lactose-free or alt milks?",
    answer:
      "We focus on dairy first, with lactose-free milk and occasional oat options for cafes. Coffee bar items are listed in the shop.",
    linkLabel: "See the menu",
    linkTo: "/menu",
  },
  {
    question: "How do deposits and returns work?",
    answer:
      "Each glass bottle carries a small deposit. Leave rinsed bottles out on your next delivery; we scan and credit them automatically.",
    linkLabel: "Return policy",
    linkTo: "/contact",
  },
  {
    question: "Can I pause or skip deliveries?",
    answer:
      "Yes. Email or message us before your route day to pause, skip, or switch your crate. No fees for quick changes.",
    linkLabel: "Contact support",
    linkTo: "/contact",
  },
];

function GoodToKnowPage() {
  return (
    <div className="education-page">
      <section className="container education-hero">
        <div className="education-hero__grid">
          <div className="education-hero__copy">
            <div className="eyebrow">Good to Know</div>
            <h1>Pasteurization, cold-chain, and bottle returns—condensed in one page.</h1>
            <p className="muted">
              Start here for the essentials: how we bottle grass-fed milk, what pasteurization and homogenization mean
              for taste, how deposits work, and quick answers for Vancouver delivery.
            </p>
            <div className="education-hero__tags">
              <span className="pill pill--strong">BC Dairy inspected</span>
              <span className="pill">Grass-fed milk</span>
              <span className="pill">Glass bottle returns</span>
            </div>
            <div className="education-hero__actions">
              <a className="btn btn--primary" href="#faq">
                Jump to micro-FAQ
              </a>
              <Link className="btn btn--ghost" to="/blog">
                Read blog posts
              </Link>
            </div>
          </div>

          <div className="education-hero__card">
            <div className="education-hero__card-head">
              <div className="education-hero__badge">Education hub</div>
              <span className="pill pill--small">Updated weekly</span>
            </div>
            <h3>Everything you want to know before filling the cart.</h3>
            <ul className="education-hero__list">
              <li>How fresh each bottle is and why we low-temp pasteurize.</li>
              <li>When to pick cream-top vs. homogenized for coffee and cooking.</li>
              <li>How deposits and reusable glass keep things sustainable.</li>
              <li>Quick answers on routes, pauses, and cold-chain safeguards.</li>
            </ul>
            <div className="education-hero__foot">
              <span className="pill">Transparent labels</span>
              <span className="pill pill--accent">Cold-chain first</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container education-section" id="inspection">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Production & delivery</div>
            <h2>Pasteurization, bottling, and cold-chain at a glance.</h2>
            <p className="muted">Q&A style so you can skim how freshness and safety show up on your label.</p>
          </div>
          <span className="pill pill--accent">Traceability & timestamps</span>
        </div>

        <div className="education-qa-grid">
          <div className="education-qa__list">
            {inspectionQuestions.map((item) => (
              <div key={item.question} className="education-qa__item">
                <div className="education-qa__question">{item.question}</div>
                <p className="education-qa__answer">{item.answer}</p>
              </div>
            ))}
          </div>

          <div className="education-qa__card">
            <div className="education-qa__card-head">
              <div className="education-qa__badge">Daily oversight</div>
              <div className="education-qa__status">BC Dairy</div>
            </div>
            <h3>Labels follow the milk, not the other way around.</h3>
            <p>
              Batch codes, pasteurization windows, sanitation checks, and cold-chain temps are logged alongside each
              production run. Homes, cafes, and shops all get the same data.
            </p>
            <ul className="education-qa__card-list">
              <li>Labels include batch code, dairy, pasteurization window, and style (cream-top or homogenized).</li>
              <li>Temperature checks at fill, storage, route loading, and drop-off.</li>
              <li>Documentation is shareable if you need it for your own records or cafe logs.</li>
            </ul>
            <Link className="link-button" to="/about-us">
              See how we bottle →
            </Link>
          </div>
        </div>
      </section>

      <section className="container education-section" id="grass-fed">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Grass-fed milk + style</div>
            <h2>Choosing between cream-top and homogenized.</h2>
            <p className="muted">
              We champion grass-fed herds and give you the choice between non-homogenized (cream-top) and homogenized
              bottles for different uses.
            </p>
          </div>
          <span className="pill pill--accent">Flavor & nutrition</span>
        </div>

        <div className="education-compare">
          <div className="education-compare__card education-compare__card--grass">
            <div className="education-compare__eyebrow">Grass-fed focus</div>
            <h3>Why it matters for taste.</h3>
            <ul className="education-compare__list">
              {grassHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="education-compare__tags">
              <span className="pill pill--small">Omega-3s</span>
              <span className="pill pill--small">Beta-carotene</span>
              <span className="pill pill--small">Low-temp pasteurized</span>
            </div>
          </div>

          <div className="education-compare__card education-compare__card--grain">
            <div className="education-compare__eyebrow">Style choices</div>
            <h3>Cream-top vs. homogenized.</h3>
            <ul className="education-compare__list">
              {grainNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="education-compare__note">
              <p className="muted">
                Both styles stay on the same cold-chain and inspection standards. Labels clearly mark which one you are
                getting.
              </p>
              <Link className="link-button" to="/blog">
                Read the cream-top vs. homogenized guide →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container education-section" id="hormone-free">
        <div className="education-highlight">
          <div>
            <div className="eyebrow">Quality & safety</div>
            <h2>How we keep every bottle safe and consistent.</h2>
            <p className="muted">
              Pasteurization logs, batch tracking, and glass sanitation keep flavor and safety aligned for families and
              cafes alike.
            </p>
          </div>
          <div className="education-highlight__grid">
            <div className="education-highlight__card">
              <div className="education-highlight__label">Taste & texture</div>
              <p>
                Low-temp pasteurization keeps proteins intact for creamy texture, better steaming, and naturally sweet
                flavor without heavy additives.
              </p>
            </div>
            <div className="education-highlight__card">
              <div className="education-highlight__label">Health-forward</div>
              <p>
                Grass-fed milk with clear batch codes supports weekly breakfasts, coffee bars, and kids who need clean,
                familiar staples.
              </p>
            </div>
            <div className="education-highlight__card">
              <div className="education-highlight__label">Proof, not promises</div>
              <ul className="education-highlight__list">
                {hormonePoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container education-section" id="faq">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Micro-FAQ</div>
            <h2>Fast answers to the questions we hear most.</h2>
            <p className="muted">More details live in our blog posts and on each product page.</p>
          </div>
          <Link className="link-button" to="/blog">
            Open the blog →
          </Link>
        </div>

        <div className="education-faq">
          {microFaq.map((item) => (
            <div key={item.question} className="education-faq__item">
              <div className="education-faq__question">{item.question}</div>
              <p className="education-faq__answer">{item.answer}</p>
              <Link className="education-faq__link" to={item.linkTo}>
                {item.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default GoodToKnowPage;
