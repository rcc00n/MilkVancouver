import { FormEvent, useState } from "react";

import { submitContactMessage } from "../api/contact";
import { brand } from "../config/brand";

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const hours = [
  { label: "Monday – Friday", time: "8:00a – 6:00p" },
  { label: "Saturday", time: "9:00a – 3:00p" },
  { label: "Sunday", time: "Closed" },
];

const address = "128 West 6th Ave, Vancouver, BC";
const mapLink = "https://www.google.com/maps?q=128+West+6th+Ave,+Vancouver,+BC";

function ContactPage() {
  const [formValues, setFormValues] = useState<ContactFormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key: keyof ContactFormState, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    if (status !== "idle") setStatus("idle");
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await submitContactMessage({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        subject: formValues.subject.trim(),
        message: formValues.message.trim(),
      });
      setStatus("success");
      setFormValues({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Failed to submit contact message", error);
      setStatus("error");
      setErrorMessage("We couldn't send your message right now. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <header className="container contact-header">
        <p className="eyebrow">Support</p>
        <h1>Contact Yummee</h1>
        <p className="contact-lead">Have a question about milk, orders, or delivery? We’re here to help.</p>
      </header>

      <section className="container contact-grid">
        <div className="contact-panel contact-panel--form">
          <div className="contact-panel__header">
            <h2>Send us a note</h2>
            <p className="muted">Tell us what you need and we’ll route it to the right person on the team.</p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form__grid">
              <label className="contact-field">
                <span>Name</span>
                <input
                  required
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                />
              </label>
              <label className="contact-field">
                <span>Email</span>
                <input
                  required
                  type="email"
                  value={formValues.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                />
              </label>
              <label className="contact-field contact-field--full">
                <span>Subject</span>
                <input
                  required
                  type="text"
                  value={formValues.subject}
                  onChange={(event) => handleChange("subject", event.target.value)}
                />
              </label>
              <label className="contact-field contact-field--full">
                <span>Message</span>
                <textarea
                  required
                  rows={5}
                  placeholder="Questions about milk, delivery windows, or special orders..."
                  value={formValues.message}
                  onChange={(event) => handleChange("message", event.target.value)}
                />
              </label>
            </div>

            {status === "success" && (
              <div className="contact-alert contact-alert--success" role="status" aria-live="polite">
                Thanks, we’ll get back to you within 1 business day.
              </div>
            )}
            {status === "error" && errorMessage && (
              <div className="contact-alert contact-alert--error" role="alert">
                {errorMessage}{" "}
                <a href={`mailto:${brand.email}`} className="contact-inline-link">
                  Email {brand.email}
                </a>
                .
              </div>
            )}

            <div className="contact-form__actions">
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? "Sending..." : "Send message"}
              </button>
              <p className="contact-response-note">We reply within one business day, often sooner.</p>
            </div>
          </form>
        </div>

        <aside className="contact-panel contact-panel--info" aria-label="Contact information">
          <div className="contact-info">
            <div className="contact-info__row">
              <div className="contact-info__label">Email</div>
              <a className="contact-info__value" href={`mailto:${brand.email}`}>
                {brand.email}
              </a>
            </div>
            <div className="contact-info__row">
              <div className="contact-info__label">Location</div>
              <div className="contact-info__value">
                <div>{address}</div>
                <a className="contact-map__link" href={mapLink} target="_blank" rel="noreferrer">
                  View on Maps
                </a>
              </div>
            </div>
            <div className="contact-info__row">
              <div className="contact-info__label">Hours</div>
              <ul className="contact-hours">
                {hours.map((entry) => (
                  <li key={entry.label}>
                    <span>{entry.label}</span>
                    <span>{entry.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="contact-map" aria-hidden="false">
            <iframe
              title={`${brand.name} location`}
              src="https://www.google.com/maps?q=128+West+6th+Ave,+Vancouver,+BC&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </aside>
      </section>
    </div>
  );
}

export default ContactPage;
