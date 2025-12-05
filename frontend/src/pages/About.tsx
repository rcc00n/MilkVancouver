import { ReactNode } from "react";
import { Link } from "react-router-dom";

import heroImage from "../assets/Whole-cow.webp";
import storyImage from "../assets/half-cow.webp";
import { brand } from "../config/brand";
import { useSiteImage } from "../hooks/useSiteImage";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: "plain" | "muted";
  children: ReactNode;
};

type TwoColumnProps = {
  left: ReactNode;
  right: ReactNode;
  reverse?: boolean;
};

type ValueCardProps = {
  icon: string;
  title: string;
  copy: string;
};

const values: ValueCardProps[] = [
  {
    icon: "🥛",
    title: "Local & fresh",
    copy: "Grass-fed BC herds with batches bottled in Vancouver within 24 hours.",
  },
  {
    icon: "♻️",
    title: "Sustainable packaging",
    copy: "Reusable glass with easy deposit returns and sanitized bottles every run.",
  },
  {
    icon: "🚚",
    title: "Customer-first delivery",
    copy: "Route texts, cooler-friendly drop-offs, and quick replies seven days a week.",
  },
  {
    icon: "🔍",
    title: "Transparent labels",
    copy: "Clear batch codes, dairy partner, and pasteurization window on every bottle.",
  },
];

function Section({ id, eyebrow, title, description, tone = "plain", children }: SectionProps) {
  return (
    <section id={id} className={`about-section-v2 about-section-v2--${tone}`}>
      <div className="container about-section-v2__inner">
        <div className="about-section-v2__header">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <h2>{title}</h2> : null}
          {description ? <p className="muted">{description}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function TwoColumn({ left, right, reverse }: TwoColumnProps) {
  return (
    <div className={`two-column ${reverse ? "two-column--reverse" : ""}`}>
      <div className="two-column__col">{left}</div>
      <div className="two-column__col">{right}</div>
    </div>
  );
}

function ValueCard({ icon, title, copy }: ValueCardProps) {
  return (
    <div className="value-card">
      <div className="value-card__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="value-card__body">
        <div className="value-card__title">{title}</div>
        <p className="value-card__copy">{copy}</p>
      </div>
    </div>
  );
}

function About() {
  const heroVisual = useSiteImage("about.hero.local", {
    fallbackUrl: heroImage,
    alt: "Yummee bottles ready for delivery",
  });
  const storyVisual = useSiteImage("about.story.bottling", {
    fallbackUrl: storyImage,
    alt: "Yummee team preparing bottles for delivery",
  });

  return (
    <div className="about-page-v2">
      <section className="about-hero-v2">
        <div className="container about-hero-v2__inner">
          <div className="about-hero-v2__copy">
            <p className="eyebrow">About {brand.shortName}</p>
            <h1>Gentle, grass-fed milk bottled for Vancouver mornings.</h1>
            <p className="about-hero-v2__lead">
              We keep batches small, bottle within 24 hours, and run quiet delivery loops so your fridge always has
              clean, honest dairy.
            </p>
            <div className="about-hero-v3__list">
              <div className="about-hero-v3__item">
                <span className="about-hero-v3__dot" aria-hidden="true" />
                <div>
                  <div className="about-hero-v3__label">24 hours from farm to bottle</div>
                  <p>Batch codes, pasteurization window, and dairy partner on every label.</p>
                </div>
              </div>
              <div className="about-hero-v3__item">
                <span className="about-hero-v3__dot" aria-hidden="true" />
                <div>
                  <div className="about-hero-v3__label">Reusable glass without the fuss</div>
                  <p>Leave bottles out, get deposits back automatically—no extra steps.</p>
                </div>
              </div>
              <div className="about-hero-v3__item">
                <span className="about-hero-v3__dot" aria-hidden="true" />
                <div>
                  <div className="about-hero-v3__label">Calm, chilled routes</div>
                  <p>0–4°C delivery with quick SMS updates if you need to tweak a drop-off.</p>
                </div>
              </div>
            </div>
            <div className="about-hero-v2__actions">
              <Link className="btn btn--primary" to="/shop">
                Shop milk
              </Link>
              <Link className="btn btn--ghost" to="/good-to-know">
                Delivery details
              </Link>
            </div>
            <p className="about-hero-v2__note">
              Friendly team, simple ingredients, and labels that tell you everything at a glance.
            </p>
          </div>
          <div className="about-hero-v3__card">
            <div className="about-hero-v3__stamp">Vancouver bottled · {brand.name}</div>
            <div className="about-hero-v3__image">
              <img src={heroVisual.url} alt={heroVisual.alt} loading="lazy" />
            </div>
            <div className="about-hero-v3__stats">
              <div className="about-hero-v3__metric">
                <div className="about-hero-v3__value">24 hrs</div>
                <div className="about-hero-v3__metric-label">Farm → bottle</div>
              </div>
              <div className="about-hero-v3__metric">
                <div className="about-hero-v3__value">0–4°C</div>
                <div className="about-hero-v3__metric-label">Chilled routes</div>
              </div>
              <div className="about-hero-v3__metric">
                <div className="about-hero-v3__value">Glass</div>
                <div className="about-hero-v3__metric-label">Simple returns</div>
              </div>
            </div>
            <p className="about-hero-v3__caption">
              Calm deliveries with clean ingredients, reusable bottles, and friendly support if you need us.
            </p>
            <div className="about-hero-v3__chips">
              <span className="pill pill--small">BC Dairy inspected</span>
              <span className="pill pill--small pill--ghost">Family & cafe friendly</span>
            </div>
          </div>
        </div>
      </section>

      <Section
        id="story"
        eyebrow="Our start"
        title="A friendly milk run that turned into Vancouver’s favorite fridge staple."
        description="We began with weekend drops to friends who wanted milk that tasted like home. Today, Yummee keeps the same small-batch care—just with better routes and labels."
      >
        <TwoColumn
          left={
            <div className="about-story-v2">
              <p>
                We partner with nearby grass-fed herds, bottle within a day, and keep batch sizes small so every glass
                tastes clean. Reusable glass and simple ingredients stay at the center.
              </p>
              <p>
                Our team knows the farms, drivers, and customers by name. If a route shifts or you need extra bottles, we
                solve it the same day with a quick text back.
              </p>
              <div className="about-story-v2__highlights">
                <span className="pill pill--accent">Pasture-first partners</span>
                <span className="pill">Low-temp pasteurized</span>
                <span className="pill">Family-friendly staples</span>
              </div>
            </div>
          }
          right={
            <div className="story-visual">
              <div className="story-visual__image">
                <img src={storyVisual.url} alt={storyVisual.alt} loading="lazy" />
              </div>
              <div className="story-visual__caption">
                Small batches, clear labels, and a quick rinse-and-return loop to keep glass in use.
              </div>
            </div>
          }
        />
      </Section>

      <Section
        id="values"
        eyebrow="What matters"
        title="Values that show up in every bottle."
        description="Three promises: stay local, stay honest, and make deliveries feel effortless."
      >
        <div className="value-grid">
          {values.map((value) => (
            <ValueCard key={value.title} icon={value.icon} title={value.title} copy={value.copy} />
          ))}
        </div>
      </Section>

      <Section
        id="map"
        eyebrow="Yummee in Vancouver"
        title="Rooted here, with routes that reach the neighborhoods you live in."
        description="We bottle in Vancouver and deliver across the city and North Shore with simple SMS updates."
      >
        <TwoColumn
          reverse
          left={
            <div className="map-copy">
              <div className="map-copy__list">
                <div className="map-copy__item">
                  <div className="map-copy__label">Delivery radius</div>
                  <p className="map-copy__detail">Vancouver core, Burnaby, North Shore, and nearby partners.</p>
                </div>
                <div className="map-copy__item">
                  <div className="map-copy__label">Schedule</div>
                  <p className="map-copy__detail">3x weekly routes with cooler-friendly drop windows.</p>
                </div>
                <div className="map-copy__item">
                  <div className="map-copy__label">Returns</div>
                  <p className="map-copy__detail">Leave bottles out, get deposits back automatically.</p>
                </div>
              </div>
              <div className="map-copy__chips">
                <span className="pill pill--ghost">Kits → Downtown</span>
                <span className="pill pill--ghost">East Van → Burnaby</span>
                <span className="pill pill--ghost">North Shore loop</span>
              </div>
            </div>
          }
          right={
            <div className="about-map">
              <div className="about-map__header">
                <div>
                  <div className="about-map__eyebrow">Yummee in Vancouver</div>
                  <div className="about-map__title">Bottle room → your fridge</div>
                </div>
                <span className="pill pill--small">Live routes</span>
              </div>
              <div className="about-map__body">
                <div className="about-map__grid">
                  <span className="about-map__pin about-map__pin--kits">Kits</span>
                  <span className="about-map__pin about-map__pin--downtown">Downtown</span>
                  <span className="about-map__pin about-map__pin--east">East Van</span>
                  <span className="about-map__pin about-map__pin--north">North Shore</span>
                </div>
                <p className="about-map__note">
                  Short hops keep milk cold, crisp, and close to the farms it comes from.
                </p>
              </div>
            </div>
          }
        />
      </Section>

      <Section
        id="cta"
        tone="muted"
        eyebrow="Ready to try Yummee?"
        title="A friendly milk run, without the errands."
        description="Pick your bottles, set your drop-off window, and we’ll handle the cold chain and returns."
      >
        <div className="about-cta">
          <div className="about-cta__actions">
            <Link className="btn btn--primary" to="/shop">
              Shop Now
            </Link>
            <Link className="btn btn--ghost" to="/good-to-know">
              See delivery details
            </Link>
          </div>
          <p className="about-cta__meta">Transparent pricing, simple labels, and quick replies from our Vancouver team.</p>
        </div>
      </Section>
    </div>
  );
}

export default About;
