import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Droplet, Droplets, Leaf, Milk, ShieldCheck, Smile, Truck } from "lucide-react";
import { brand } from "../config/brand";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1400&q=80&sat=15";

const HERO_FEATURE_TILES = [
  {
    title: "High-Protein Yogurts",
    copy: "Protein-packed cups that keep up with school, sports, and everything in between.",
    Icon: Droplet,
    bg: "bg-[#ffe75e]",
    text: "text-[#6b21ff]",
  },
  {
    title: "Natural Ingredients Only",
    copy: "Simple recipes made with real fruit, live cultures, and milk you can pronounce.",
    Icon: Leaf,
    bg: "bg-[#a5f3fc]",
    text: "text-[#0f172a]",
  },
  {
    title: "School & Home Delivery",
    copy: "Convenient routes that keep every snack chilled from our fridge to yours.",
    Icon: Truck,
    bg: "bg-[#fed7aa]",
    text: "text-[#7c2d12]",
  },
  {
    title: "No Additives, No Fake Flavors",
    copy: "Just bright, bold taste from real ingredients. That's it.",
    Icon: ShieldCheck,
    bg: "bg-[#e9d5ff]",
    text: "text-[#4c1d95]",
  },
];

const FLAVORS = [
  {
    name: "Berry Blast",
    tag: "Mixed berries & Greek yogurt",
    image:
      "https://images.unsplash.com/photo-1511918984145-48de785d4c4d?auto=format&fit=crop&w=900&q=80",
    gradient: "from-[#7c3aed] to-[#5b21ff]",
  },
  {
    name: "Mango Magic",
    tag: "Tropical mango paradise",
    image:
      "https://images.unsplash.com/photo-1505253181491-580b10ae1535?auto=format&fit=crop&w=900&q=80",
    gradient: "from-[#f97316] to-[#facc15]",
  },
  {
    name: "Protein Power",
    tag: "Extra protein, zero guilt",
    image:
      "https://images.unsplash.com/photo-1511910849309-0dffb8785146?auto=format&fit=crop&w=900&q=80",
    gradient: "from-[#06b6d4] to-[#6366f1]",
  },
  {
    name: "Granola Crunch",
    tag: "Crunchy granola perfection",
    image:
      "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=80",
    gradient: "from-[#fb923c] to-[#facc15]",
  },
];

const STORY_IMAGES = [
  "https://images.unsplash.com/photo-1571687949920-1a810e9a4108?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516886635086-2b3c423c0943?auto=format&fit=crop&w=900&q=80",
];

const ABOUT_FEATURES = [
  {
    title: "For Active Lives",
    copy: "Designed for athletes, students, and families on the go.",
    bg: "bg-[#fff7ed]",
  },
  {
    title: "Clean & Simple",
    copy: "No artificial anything. Just pure, wholesome ingredients.",
    bg: "bg-[#fefce8]",
  },
  {
    title: "Taste The Joy",
    copy: "Every spoonful is packed with flavor and happiness.",
    bg: "bg-[#ecfeff]",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Yogurt that actually tastes fun. My kids ask for it by flavor name instead of candy.",
    name: "Jordan",
    role: "Busy Parent",
  },
  {
    quote:
      "Post-workout snack, school snack, midnight snack... we keep the fridge stocked.",
    name: "Maya",
    role: "Fitness Enthusiast",
  },
  {
    quote:
      "Bright flavors, nothing fake. It feels like dessert but fits my goals.",
    name: "Eli",
    role: "College Student",
  },
];

const COMMUNITY_PHOTOS = [
  "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1484981184820-2e84ea0af0cc?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1506086679524-493c64fdfaa6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
];

function HomePage() {
  const flavorsRef = useRef<HTMLDivElement | null>(null);

  const scrollToFlavors = () => {
    flavorsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="yummee-home text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#5b21ff] via-[#a855f7] to-[#22c1c3] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-[#facc15]/20 blur-3xl" />
          <div className="absolute left-10 bottom-0 h-64 w-64 rounded-full bg-[#22c1c3]/30 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-12 px-4 py-20 md:flex-row md:items-center md:py-24 lg:px-8">
          {/* Left copy */}
          <div className="flex-1 space-y-7">
            <p className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
              {brand.name} - Active families, young lifestyles
            </p>

            <h1 className="text-[2.7rem] leading-[1.05] font-semibold sm:text-[3.2rem] lg:text-[3.6rem]">
              <span className="block">feels</span>
              <span className="block">
                <span className="text-[#ffe75e]">fun</span>,{" "}
                <span className="text-[#bbf7d0]">fresh</span> and{" "}
                <span className="text-[#fed7ff]">real</span>.
              </span>
            </h1>

            <p className="max-w-xl text-base md:text-lg text-slate-50/90">
              Healthy dairy that's bright, bold, and never boring. Think
              high-protein yogurts, smoothie bowls, and snackable cups that fit
              busy days.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-full bg-[#ffe75e] px-8 py-3 text-sm font-semibold text-[#5b21ff] shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5"
              >
                Shop Now
              </Link>
              <button
                type="button"
                onClick={scrollToFlavors}
                className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Explore Flavors
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 text-xs md:text-sm sm:grid-cols-3">
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="font-semibold uppercase tracking-[0.25em] text-yellow-200">
                  Protein
                </p>
                <p className="mt-1 text-lg font-semibold text-white">10-15g</p>
                <p className="text-white/80">per cup, depending on flavor.</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="font-semibold uppercase tracking-[0.25em] text-yellow-200">
                  Real Fruit
                </p>
                <p className="mt-1 text-lg font-semibold text-white">No dyes</p>
                <p className="text-white/80">Colors come from nature.</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="font-semibold uppercase tracking-[0.25em] text-yellow-200">
                  Convenient
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  School & home
                </p>
                <p className="text-white/80">Delivery that fits your week.</p>
              </div>
            </div>
          </div>

          {/* Right image card */}
          <div className="flex-1">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#f97316]/50 blur-3xl" />
              <div className="absolute -left-10 bottom-10 h-28 w-28 rounded-full bg-[#22c1c3]/40 blur-3xl" />

              <div className="overflow-hidden rounded-[32px] bg-white/95 p-4 shadow-2xl">
                <div className="overflow-hidden rounded-3xl">
                  <img
                    src={HERO_IMAGE}
                    alt="Colorful yogurt bowl full of fruit"
                    className="h-[260px] w-full object-cover sm:h-[300px]"
                    loading="lazy"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-700">
                  <div className="inline-flex items-center gap-2">
                    <Milk className="h-4 w-4 text-[#5b21ff]" />
                    <span>Made with real {brand.shortName || brand.name} dairy</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-[#22c1c3]" />
                    <span>Live &amp; active cultures</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HERO FEATURE TILES */}
      <section className="bg-gradient-to-r from-[#4c1d95] via-[#7c3aed] to-[#db2777] py-12">
        <div className="mx-auto grid max-w-[1180px] gap-6 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {HERO_FEATURE_TILES.map(({ title, copy, Icon, bg, text }) => (
            <div
              key={title}
              className={`flex h-full flex-col rounded-3xl ${bg} ${text} p-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)]`}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/5">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm opacity-90">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DISCOVER YOUR FLAVOR */}
      <section
        ref={flavorsRef}
        className="bg-gradient-to-b from-[#fff7cc] via-[#fffaf0] to-[#fffbeb] py-16 md:py-20"
      >
        <div className="mx-auto max-w-[1180px] space-y-10 px-4 lg:px-8">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Discover Your{" "}
              <span className="text-[#a855f7] drop-shadow-sm">Flavor</span>
            </h2>
            <p className="mx-auto max-w-2xl text-slate-600">
              Every flavor is a fun adventure for your taste buds. Mix, match,
              and find your new everyday favorite.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FLAVORS.map((flavor) => (
              <article
                key={flavor.name}
                className={`flex flex-col items-center rounded-[32px] bg-gradient-to-br ${flavor.gradient} px-6 pb-7 pt-9 text-white shadow-[0_18px_50px_-18px_rgba(0,0,0,0.6)]`}
              >
                <div className="mb-6 h-28 w-28 overflow-hidden rounded-full border-4 border-white/70 shadow-lg">
                  <img
                    src={flavor.image}
                    alt={flavor.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-lg font-semibold">{flavor.name}</h3>
                <p className="mt-2 text-sm text-white/90">{flavor.tag}</p>
                <button
                  type="button"
                  className="mt-6 inline-flex rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#7c3aed] shadow-md transition hover:bg-slate-50"
                >
                  Try Now
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHY SHOULD DAIRY BE BORING? */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-[1180px] space-y-10 px-4 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Why should dairy be boring?{" "}
              <span className="text-[#facc15]">We</span>{" "}
              <span className="text-[#fb7185]">made it fun again.</span>
            </h2>
            <p className="text-slate-600">
              {brand.name} was born from a simple belief: healthy food should
              make you smile. We create dairy snacks that fuel active
              lifestyles, without compromising on taste or fun.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STORY_IMAGES.map((src, index) => (
              <div
                key={src}
                className="overflow-hidden rounded-[30px] border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.15)]"
              >
                <img
                  src={src}
                  alt={`Yogurt snack ${index + 1}`}
                  className="h-[260px] w-full object-cover sm:h-[320px]"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT FEATURES */}
      <section className="bg-white pb-6 md:pb-10">
        <div className="mx-auto grid max-w-[1180px] gap-6 px-4 md:grid-cols-3 lg:px-8">
          {ABOUT_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-[28px] ${feature.bg} px-6 py-8 shadow-sm`}
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-700">{feature.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT PEOPLE ARE SAYING */}
      <section className="bg-gradient-to-r from-[#5b21ff] via-[#7c3aed] to-[#ec4899] py-16 text-white md:py-20">
        <div className="mx-auto max-w-[1180px] space-y-10 px-4 lg:px-8">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              What People Are <span className="text-[#ffe75e]">Saying</span>
            </h2>
            <p className="text-sm text-white/85">
              Real stories from real {brand.name} lovers.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <article
                key={t.name}
                className="flex h-full flex-col rounded-[28px] bg-white/10 p-6 text-left shadow-[0_18px_50px_-18px_rgba(0,0,0,0.7)] backdrop-blur"
              >
                <div className="mb-3 flex items-center gap-1 text-yellow-300">
                  <span>*</span>
                  <span>*</span>
                  <span>*</span>
                  <span>*</span>
                  <span>*</span>
                </div>
                <p className="text-sm leading-relaxed text-white/95">
                  {t.quote}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                    <Smile className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-white/80">{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN THE COMMUNITY */}
      <section className="bg-gradient-to-b from-[#ede9ff] via-[#e0f2fe] to-[#f5d0fe] py-16 md:py-20">
        <div className="mx-auto max-w-[1180px] space-y-10 px-4 lg:px-8">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Join The{" "}
              <span className="text-[#7c3aed] drop-shadow-sm">
                {brand.name}
              </span>{" "}
              Community
            </h2>
            <p className="mx-auto max-w-2xl text-slate-700">
              Share your moments with{" "}
              <span className="font-semibold text-[#7c3aed]">
                #{brand.shortName || "Yummee"}Life
              </span>{" "}
              and tag us for a chance to be featured.
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {COMMUNITY_PHOTOS.map((src, index) => (
              <div
                key={src}
                className="relative h-40 w-40 min-w-[10rem] overflow-hidden rounded-3xl bg-slate-200 shadow-md md:h-48 md:w-48"
              >
                <img
                  src={src}
                  alt={`Community photo ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#ffe75e] px-8 py-3 text-sm font-semibold text-[#5b21ff] shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5"
            >
              Follow Us on Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
