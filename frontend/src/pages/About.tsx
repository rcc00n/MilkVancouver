import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Leaf, Shield, Users } from "lucide-react";

import { brand } from "../config/brand";

type Commitment = {
  title: string;
  description: string;
  Icon: typeof Shield;
  gradient: string;
};

type Stat = {
  value: string;
  label: string;
};

function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Reveal section when it scrolls into view unless the user prefers less motion.
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      node.classList.add("about-reveal-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("about-reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return ref;
}

function HeroSection() {
  const heroImage =
    "https://images.unsplash.com/photo-1521416043332-5ab2fcd7b1c9?auto=format&fit=crop&w=1600&q=80";

  return (
    <section className="bg-[#fffaf0] py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        <div className="about-hero-motion about-reveal relative overflow-hidden rounded-[32px] bg-slate-900 text-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.7)]">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Kids playing soccer on a sunny field"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(76,29,149,0.85)] via-[rgba(124,58,237,0.78)] to-[rgba(236,72,153,0.68)]" />
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/45 via-black/20 to-transparent" />
          </div>

          <div className="relative max-w-xl px-6 py-10 md:px-12 md:py-14 lg:px-16 lg:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200 md:text-sm">
              {brand.shortName || brand.name}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-[1.08] md:text-4xl lg:text-5xl">
              Fuel Your Active Lifestyle
            </h1>
            <p className="mt-4 text-sm text-white/90 md:text-base">
              From soccer practice to dance class, playground fun to family bike rides –{" "}
              {brand.shortName || brand.name} gives kids the energy to play, learn and grow!
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-full bg-[#ffd54f] px-8 py-3 text-sm font-semibold text-[#5a2c86] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffe082] hover:shadow-xl md:text-base"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommitmentSection() {
  const ref = useRevealOnScroll<HTMLDivElement>();

  const commitments: Commitment[] = [
    {
      title: "Premium Quality",
      description: "Only the finest ingredients make it into our products.",
      Icon: Shield,
      gradient: "from-[#7c3aed] via-[#c084fc] to-[#fcd34d]",
    },
    {
      title: "Certified Excellence",
      description: "Award-winning products recognized by health experts.",
      Icon: Award,
      gradient: "from-[#06b6d4] via-[#8b5cf6] to-[#f472b6]",
    },
    {
      title: "Eco-Friendly",
      description: "Sustainable packaging and carbon-neutral operations.",
      Icon: Leaf,
      gradient: "from-[#22c55e] via-[#a3e635] to-[#facc15]",
    },
    {
      title: "Community First",
      description: "Supporting local farms and giving back to communities.",
      Icon: Users,
      gradient: "from-[#f472b6] via-[#c084fc] to-[#60a5fa]",
    },
  ];

  return (
    <section className="bg-white py-14 md:py-16">
      <div ref={ref} className="about-reveal mx-auto w-full max-w-[1200px] px-4 md:px-8">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-800 shadow-[0_12px_40px_-30px_rgba(15,23,42,0.6)]">
            Our Commitment
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900 md:text-3xl">Quality You Can Trust</h2>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            We don&apos;t cut corners. Every bottle is a promise of excellence.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {commitments.map(({ title, description, Icon, gradient }, index) => (
            <div
              key={title}
              className="about-reveal-child group rounded-[26px] bg-white px-6 py-7 shadow-[0_18px_60px_-45px_rgba(15,23,42,0.85)] ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_26px_80px_-54px_rgba(15,23,42,0.8)]"
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white shadow-[0_10px_28px_-14px_rgba(0,0,0,0.55)] transition-transform duration-200 group-hover:scale-105`}
              >
                <Icon size={22} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GradientCTASection() {
  const ref = useRevealOnScroll<HTMLDivElement>();

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#6b21a8] via-[#7c3aed] to-[#ec4899] py-16 text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-16 top-6 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-6 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />
      </div>
      <div ref={ref} className="about-reveal relative mx-auto w-full max-w-[1200px] px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/85 md:text-sm">
            Join the movement
          </p>
          <h2 className="mt-4 text-2xl font-semibold md:text-3xl">
            Ready to Join the {brand.shortName || brand.name} Revolution?
          </h2>
          <p className="mt-4 text-base text-white/90">
            Experience dairy like never before. Bold flavors, premium nutrition, and a whole lot of fun in every sip.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-full bg-[#ffeb3b] px-8 py-3 text-sm font-semibold text-[#5b21b6] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff176] hover:shadow-xl md:text-base"
            >
              Shop All Products
              <ArrowRight size={18} className="ml-2" aria-hidden="true" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-lg md:text-base"
            >
              Find a Store
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsAndTeamSection() {
  const statsRef = useRevealOnScroll<HTMLDivElement>();
  const teamRef = useRevealOnScroll<HTMLDivElement>();

  const stats: Stat[] = [
    { value: "50K+", label: "Happy Customers" },
    { value: "100%", label: "Natural Ingredients" },
    { value: "15+", label: "Unique Flavors" },
  ];

  const teamImage =
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80";

  return (
    <section className="bg-white py-16">
      <div className="mx-auto w-full max-w-[1200px] space-y-12 px-4 md:px-8">
        <div
          ref={statsRef}
          className="about-reveal grid gap-4 rounded-[24px] bg-gradient-to-r from-[#eef2ff] via-white to-[#fff7ed] p-6 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.75)] sm:grid-cols-3"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="about-reveal-child group rounded-[18px] bg-white/70 px-4 py-5 text-center shadow-[0_14px_40px_-32px_rgba(15,23,42,0.65)] ring-1 ring-white/70 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_55px_-36px_rgba(15,23,42,0.7)]"
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div className="bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#fcd34d] bg-clip-text text-2xl font-semibold text-transparent md:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div
          ref={teamRef}
          className="about-reveal grid items-center gap-12 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
        >
          <div className="relative order-2 overflow-hidden rounded-[28px] border border-purple-100 bg-white shadow-[0_24px_70px_-44px_rgba(15,23,42,0.8)] md:order-1">
            <div
              className="absolute -left-10 -top-8 h-40 w-40 rounded-full bg-purple-200/50 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-12 -right-6 h-44 w-44 rounded-full bg-amber-100/70 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative group overflow-hidden rounded-[28px]">
              <img
                src={teamImage}
                alt="Team smiling together in an office"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
          </div>

          <div className="order-1 space-y-4 md:order-2">
            <span className="inline-flex items-center rounded-full bg-pink-50 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-700">
              Meet the Team
            </span>
            <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">
              Passionate People, Delicious Products
            </h2>
            <div className="space-y-3 text-sm text-slate-700 md:text-base">
              <p>
                Our crew blends food scientists, dairy pros, designers, and delivery leads who all care about fueling
                active families.
              </p>
              <p>
                From sourcing clean ingredients to testing bold flavors, every batch is crafted with the same excitement
                we want you to feel when you pop the lid.
              </p>
              <p>
                We champion sustainability, local partnerships, and joyful nutrition so every sip and spoonful feels
                like a win.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full bg-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-xl md:text-base"
            >
              Join Our Team
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <div className="about-yummee-page bg-white text-slate-900">
      <HeroSection />
      <CommitmentSection />
      <GradientCTASection />
      <StatsAndTeamSection />
    </div>
  );
}

export default About;
