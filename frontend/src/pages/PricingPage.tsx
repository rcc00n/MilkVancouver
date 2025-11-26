import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { submitQuoteRequest } from "../api/contact";
import { getProducts } from "../api/products";
import type { Product } from "../types";

const summaryItems = [
  "Milk: whole, 2%, skim, chocolate, and barista protein-rich milk.",
  "Cream: half & half, whipping cream, and non-homogenized cream-top options.",
  "Yogurt & kefir: Greek, plain, drinkable, and cultured kefir.",
  "Cheese & butter: cultured butter, soft cheese, cheddar, and paneer.",
  "Optional: lactose-free rotations and seasonal cafe specials.",
];
const milkOptions = ["Whole milk", "2% milk", "Skim milk", "Chocolate milk", "Barista milk (extra protein)"];
const creamOptions = ["Half & half", "Heavy whipping cream", "Table cream", "Non-homogenized cream-top"];
const yogurtOptions = ["Greek yogurt", "Plain yogurt", "Drinkable yogurt", "Kefir"];
const butterCheese = ["Cultured butter", "Salted butter", "Soft cheese (cream/feta style)", "Aged cheddar or gouda"];
const optionalItems = ["Lactose-free milk rotations", "Cafe oat option (limited)", "Seasonal ice cream mix"];

const weightBreakdown = [
  { label: "Milk & Cream", amount: "6–10 bottles", note: "Mix of whole, 2%, barista, cream" },
  { label: "Yogurt & Kefir", amount: "3–5 tubs/bottles", note: "Plain, Greek, drinkable" },
  { label: "Cheese & Butter", amount: "2–4 items", note: "Soft cheese + cultured butter" },
  { label: "Add-ons", amount: "Optional", note: "Chocolate milk, lactose-free, seasonal" },
];

type HighlightItem = {
  name: string;
  fallback: string;
  unit?: string;
};

type HighlightGroup = {
  title: string;
  tone: "amber" | "emerald" | "slate";
  description: string;
  items: HighlightItem[];
};

const highlightGroups: HighlightGroup[] = [
  {
    title: "Barista Bar",
    tone: "amber",
    description: "Milk and cream that steam glossy for home espresso and cafes.",
    items: [
      { name: "Barista Milk", fallback: "$7.50 /2L", unit: "2L" },
      { name: "Half & Half", fallback: "$5.50 /1L", unit: "1L" },
      { name: "Whipping Cream", fallback: "$6.50 /500ml", unit: "500ml" },
    ],
  },
  {
    title: "Yogurt & Kefir",
    tone: "emerald",
    description: "Live cultures for breakfasts, smoothies, and gut health.",
    items: [
      { name: "Greek Yogurt", fallback: "$6.00 /950g", unit: "950g" },
      { name: "Plain Yogurt", fallback: "$4.50 /650g", unit: "650g" },
      { name: "Kefir", fallback: "$5.75 /1L", unit: "1L" },
    ],
  },
  {
    title: "Cheese & Butter",
    tone: "slate",
    description: "Cultured butter and cheese for boards and weeknight cooking.",
    items: [
      { name: "Cultured Butter", fallback: "$7.50 /250g", unit: "250g" },
      { name: "Soft Cheese", fallback: "$6.25 /250g", unit: "250g" },
      { name: "Aged Cheddar", fallback: "$9.50 /300g", unit: "300g" },
    ],
  },
];

type QuoteFormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  fulfillment: string;
  message: string;
};

function PricingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productError, setProductError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<QuoteFormState>({
    name: "",
    phone: "",
    email: "",
    address: "",
    fulfillment: "Local pickup",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getProducts(undefined, controller.signal)
      .then((result) => setProducts(result))
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch products", error);
        setProductError("Live product pricing is temporarily unavailable.");
      });

    return () => controller.abort();
  }, []);

  const productPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => map.set(product.name.toLowerCase(), product.price_cents));
    return map;
  }, [products]);

  const highlightPrice = (item: HighlightItem) => {
    const cents = productPriceMap.get(item.name.toLowerCase());
    if (!cents) return item.fallback;
    const unit = item.unit ?? "lb";
    return `$${(cents / 100).toFixed(2)} /${unit}`;
  };

  const handleChange = (key: keyof QuoteFormState, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormStatus("idle");
    setFormError(null);

    try {
      await submitQuoteRequest({
        name: formValues.name.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim(),
        address: formValues.address.trim(),
        fulfillment: formValues.fulfillment,
        message: formValues.message.trim(),
      });
      setFormStatus("success");
      setFormValues({
        name: "",
        phone: "",
        email: "",
        address: "",
        fulfillment: "Local pickup",
        message: "",
      });
    } catch (error) {
      console.error("Failed to submit quote request", error);
      setFormStatus("error");
      setFormError("We couldn't send your request right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pricing-page">
      <section className="container pricing-hero">
        <div className="pricing-hero__grid">
          <div className="pricing-hero__copy">
            <div className="eyebrow">Pricing</div>
            <h1>Weekly dairy subscriptions for Vancouver fridges and cafes.</h1>
            <p className="muted">
              Choose a crate and swap items anytime: grass-fed milk, barista-ready cream, yogurt, kefir, and cheese. We
              timestamp every bottle and handle deposits automatically.
            </p>
            <div className="pricing-hero__tags">
              <span className="pill pill--strong">From $28 / week</span>
              <span className="pill">Glass bottle deposit loop</span>
              <span className="pill">0–4°C cold-chain</span>
            </div>
            <div className="pricing-hero__actions">
              <a className="btn btn--primary" href="#quote">
                Request a fridge plan
              </a>
              <Link to="/menu" className="btn btn--ghost">
                Shop the dairy case
              </Link>
            </div>
          </div>

          <div className="pricing-main-card">
            <div className="pricing-main-card__header">
              <div>
                <div className="eyebrow eyebrow--green">Subscription</div>
                <h3>Dairy crate – from $28 / week</h3>
                <p className="muted">Mix and match milk, cream, yogurt, kefir, and cheese with doorstep delivery.</p>
              </div>
              <div className="pricing-main-card__price">
                <div className="pricing-main-card__price-value">$28</div>
                <div className="pricing-main-card__price-note">starting weekly</div>
              </div>
            </div>
            <div className="pricing-main-card__body">
              <div className="pricing-main-card__summary">
                <div className="pricing-chip">Milk</div>
                <div className="pricing-chip">Cream</div>
                <div className="pricing-chip">Yogurt & kefir</div>
                <div className="pricing-chip">Cheese & butter</div>
                <div className="pricing-chip pricing-chip--muted">Add-ons</div>
              </div>
              <ul className="pricing-main-card__list">
                {summaryItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="pricing-main-card__footer">
                <div>
                  <div className="pill pill--small">Grass-fed · Glass bottles</div>
                  <div className="pricing-main-card__note">
                    Bottles include deposit; returns are credited automatically. Swap items weekly and pause anytime.
                  </div>
                </div>
                <a className="link-button" href="#quote">
                  Save a route spot →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pricing-breakdown">
        <div className="pricing-section-header">
          <div>
            <div className="eyebrow">What&apos;s inside</div>
            <h2>Detailed breakdown—no surprises when you open the fridge.</h2>
          </div>
          <span className="pill pill--accent">Swap items anytime</span>
        </div>
        <div className="pricing-breakdown__grid">
          <div className="pricing-breakdown__card">
            <div className="pricing-breakdown__label">Milk</div>
            <ul>
              {milkOptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="pricing-breakdown__card">
            <div className="pricing-breakdown__label">Cream</div>
            <ul>
              {creamOptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="pricing-breakdown__card">
            <div className="pricing-breakdown__label">Yogurt & Kefir</div>
            <ul>
              {yogurtOptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="pricing-breakdown__card">
            <div className="pricing-breakdown__label">Cheese & Butter</div>
            <ul>
              {butterCheese.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="pricing-breakdown__card pricing-breakdown__card--accent">
            <div className="pricing-breakdown__label">Optional Items</div>
            <ul>
              {optionalItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="muted">Let us know at booking—otherwise we send a balanced weekly fridge lineup.</p>
          </div>
        </div>
      </section>

      <section className="container pricing-weights">
        <div className="pricing-section-header">
          <div>
            <div className="eyebrow">Weight breakdown</div>
            <h2>What a typical weekly crate looks like.</h2>
            <p className="muted">
              Swap items anytime. Quantities adjust if you pause or add-on barista items, lactose-free, or seasonal
              specials.
            </p>
          </div>
        </div>
        <div className="pricing-weights__grid">
          {weightBreakdown.map((item) => (
            <div key={item.label} className="weight-card">
              <div className="weight-card__label">{item.label}</div>
              <div className="weight-card__amount">{item.amount}</div>
              <div className="weight-card__note">{item.note}</div>
            </div>
          ))}
        </div>
        <div className="vacuum-card">
          <div>
            <div className="eyebrow eyebrow--green">Bottle program</div>
            <h3>Glass bottle deposit & returns</h3>
            <p>
              Bottles carry a small deposit. Leave rinsed bottles out on delivery day and we credit deposits
              automatically—no forms, no hassle.
            </p>
          </div>
          <div className="vacuum-card__meta">
            <span className="pill pill--accent">Less waste</span>
            <span className="pill">Deposit credited fast</span>
          </div>
        </div>
      </section>

      <section className="container pricing-highlights">
        <div className="pricing-section-header">
          <div>
            <div className="eyebrow">Highlighted products</div>
            <h2>Favorites alongside your weekly crate.</h2>
          </div>
          {productError ? (
            <span className="pill pill--small">{productError}</span>
          ) : (
            <span className="pill">Live shop pricing when available</span>
          )}
        </div>
        <div className="pricing-highlight__grid">
          {highlightGroups.map((group) => (
            <div key={group.title} className={`highlight-card highlight-card--${group.tone}`}>
              <div className="highlight-card__header">
                <div className="eyebrow">[{group.tone}] add-on</div>
                <h3>{group.title}</h3>
                <p className="muted">{group.description}</p>
              </div>
              <ul className="highlight-card__list">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <span className="highlight-card__price">{highlightPrice(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pricing-specialties">
          <div className="pricing-specialties__label">Other specialties</div>
          <div className="pricing-specialties__items">
            <span className="pill pill--small">Chocolate milk</span>
            <span className="pill pill--small">Lactose-free</span>
            <span className="pill pill--small">Seasonal ice cream base</span>
            <span className="pill pill--small">Coffee syrups</span>
            <span className="pill pill--small">Extra bottle returns</span>
          </div>
          <Link to="/menu" className="link-button">
            See the shop →
          </Link>
        </div>
      </section>

      <section className="container pricing-quote" id="quote">
        <div className="quote-card">
          <div className="quote-card__intro">
            <div className="eyebrow eyebrow--green">Quote / Inquiry</div>
            <h2>Tell us what your fridge needs.</h2>
            <p className="muted">
              We confirm routes, crate size, and bottle deposit details, then send a simple email confirmation. No online
              payment is collected here.
            </p>
            <ul className="checklist">
              <li>We reply with crate options and total, including deposits.</li>
              <li>Local delivery windows available; insulated shipping by request.</li>
              <li>Ask about lactose-free, cafe rotations, or pauses anytime.</li>
            </ul>
          </div>

          <form className="quote-form" onSubmit={handleSubmit}>
            <div className="quote-form__grid">
              <label className="quote-form__field">
                <span>Name</span>
                <input
                  required
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                />
              </label>
              <label className="quote-form__field">
                <span>Phone</span>
                <input
                  required
                  type="tel"
                  value={formValues.phone}
                  onChange={(event) => handleChange("phone", event.target.value)}
                />
              </label>
              <label className="quote-form__field">
                <span>Email</span>
                <input
                  required
                  type="email"
                  value={formValues.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                />
              </label>
              <label className="quote-form__field">
                <span>Address</span>
                <input
                  required
                  type="text"
                  value={formValues.address}
                  onChange={(event) => handleChange("address", event.target.value)}
                />
              </label>
              <label className="quote-form__field">
                <span>Preferred pickup / delivery</span>
                <select
                  value={formValues.fulfillment}
                  onChange={(event) => handleChange("fulfillment", event.target.value)}
                >
                  <option>Local pickup</option>
                  <option>Delivery on route</option>
                  <option>Ship to province</option>
                  <option>Undecided</option>
                </select>
              </label>
              <label className="quote-form__field quote-form__field--full">
                <span>Message</span>
                <textarea
                  rows={4}
                  placeholder="Cut preferences, pack size, desired timeline..."
                  value={formValues.message}
                  onChange={(event) => handleChange("message", event.target.value)}
                />
              </label>
            </div>
            {formError && <div className="alert alert--error">{formError}</div>}
            {formStatus === "success" && (
              <div className="alert alert--muted">Thanks! We received your request and will email you back.</div>
            )}
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? "Sending..." : "Send quote request"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default PricingPage;
