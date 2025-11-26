import { FormEvent, useState } from "react";

import { submitContactMessage } from "../api/contact";
import { brand } from "../config/brand";

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const hours = [
  { day: "Monday", time: "9a–6p" },
  { day: "Tuesday", time: "9a–6p" },
  { day: "Wednesday", time: "9a–6p" },
  { day: "Thursday", time: "9a–6p" },
  { day: "Friday", time: "9a–6p" },
  { day: "Saturday", time: "8a–4p" },
  { day: "Sunday", time: "Closed" },
];

function ContactPage() {
  const [formValues, setFormValues] = useState<ContactFormState>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const phoneHref = `tel:${brand.phone.replace(/[^\d+]/g, "")}`;
  const emailHref = `mailto:${brand.email}`;
  const address = "128 West 6th Ave, Vancouver, BC";

  const handleChange = (key: keyof ContactFormState, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormStatus("idle");
    setFormError(null);

    try {
      await submitContactMessage({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        message: formValues.message.trim(),
      });
      setFormStatus("success");
      setFormValues({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      console.error("Failed to submit contact message", error);
      setFormError("We couldn't send your message right now. Please call if it's urgent.");
      setFormStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <section className="container contact-hero">
        <div className="contact-hero__grid">
          <div className="contact-hero__copy">
            <div className="eyebrow">Contact</div>
            <h1>Contact</h1>
            <p className="muted">
              General questions, special orders, freezer packs, or delivery updates—drop a note and we will reply the
              same day during shop hours.
            </p>
            <div className="contact-hero__pills">
              <span className="pill">General questions</span>
              <span className="pill">Special orders & cuts</span>
              <span className="pill">Pickup / delivery updates</span>
            </div>
            <div className="contact-hero__actions">
              <a className="btn btn--primary" href="#contact-form">
                Send a message
              </a>
              <a className="btn btn--ghost" href={phoneHref}>
                Call the shop
              </a>
            </div>
          </div>

          <div className="contact-hero__card">
            <div className="contact-hero__card-row">
              <div>
                <div className="eyebrow eyebrow--green">Call or text</div>
                <a className="contact-hero__link" href={phoneHref}>
                  {brand.phone}
                </a>
              </div>
              <span className="pill pill--accent">Live help</span>
            </div>
            <div className="contact-hero__card-row">
              <div>
                <div className="contact-hero__label">Email</div>
                <a className="contact-hero__link" href={emailHref}>
                  {brand.email}
                </a>
              </div>
              <span className="pill pill--small">Paperwork requests</span>
            </div>
            <div className="contact-hero__card-row contact-hero__address">
              <div className="contact-hero__label">Visit</div>
              <div>
                <div>{address}</div>
                <div className="muted">Pickup and bottle returns from the main bay door.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container contact-details" id="visit">
        <div className="contact-details__grid">
          <div className="contact-info-card">
            <div className="eyebrow eyebrow--green">Store info</div>
            <h2>Where to find us</h2>
            <p className="muted">
              Stop in for bottle returns, pick up a web order, or talk through a weekly crate. Call ahead for special
              requests and we will have them ready.
            </p>
            <div className="contact-info-card__rows">
              <div className="contact-info-card__row">
                <div className="contact-info-card__label">Address</div>
                <div>{address}</div>
              </div>
              <div className="contact-info-card__row">
                <div className="contact-info-card__label">Phone</div>
                <a href={phoneHref}>{brand.phone}</a>
              </div>
              <div className="contact-info-card__row">
                <div className="contact-info-card__label">Email</div>
                <a href={emailHref}>{brand.email}</a>
              </div>
              <div className="contact-info-card__row contact-info-card__row--hours">
                <div className="contact-info-card__label">Hours</div>
                <ul className="contact-hours">
                  {hours.map((entry) => (
                    <li key={entry.day}>
                      <span>{entry.day}</span>
                      <span>{entry.time}</span>
                    </li>
                  ))}
                </ul>
                <div className="contact-note">Closed most long weekends (please call).</div>
              </div>
            </div>
          </div>

          <div className="contact-map-card">
            <div className="contact-map-card__header">
              <div className="eyebrow">Map</div>
              <h3>Plan your visit</h3>
              <p className="muted">
                Located near Olympic Village with easy loading for returns and pickups. Call when you pull up and we will
                bring crates to your vehicle.
              </p>
            </div>
            <div className="contact-map-card__frame">
              <iframe
                title={`${brand.name} location`}
                src="https://www.google.com/maps?q=128+West+6th+Ave,+Vancouver,+BC&output=embed"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <div className="contact-map-card__footer">
              <div className="pill pill--small">Pickup friendly</div>
              <div className="pill pill--small">Near Tremont</div>
              <div className="pill pill--small">Insulated delivery vans</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container contact-form-section" id="contact-form">
        <div className="contact-form-card">
          <div className="contact-form-card__grid">
            <div className="contact-form-card__intro">
              <div className="eyebrow eyebrow--green">Contact form</div>
              <h2>Send a message to the shop</h2>
              <p className="muted">
                Use this for general questions, special orders, delivery or pickup requests, and paperwork copies. We
                log every message and reply with next steps.
              </p>
              <ul className="checklist">
                <li>Common requests: milk/cream swaps, lactose-free, cafe rotation.</li>
                <li>Special orders: extra bottles, yogurt/kefir cases, cheese and butter.</li>
                <li>Delivery: route windows, bottle returns, insulated shipping.</li>
              </ul>
            </div>
            <form className="quote-form contact-form" onSubmit={handleSubmit}>
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
                  <span>Email</span>
                  <input
                    required
                    type="email"
                    value={formValues.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                  />
                </label>
                <label className="quote-form__field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    value={formValues.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                  />
                </label>
                <label className="quote-form__field quote-form__field--full">
                  <span>Message</span>
                  <textarea
                    required
                    rows={4}
                    placeholder="Questions, special orders, or delivery notes..."
                    value={formValues.message}
                    onChange={(event) => handleChange("message", event.target.value)}
                  />
                </label>
              </div>
              {formError && <div className="alert alert--error">{formError}</div>}
              {formStatus === "success" && (
                <div className="alert alert--muted">
                  Thanks! We received your message and will respond during shop hours.
                </div>
              )}
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
