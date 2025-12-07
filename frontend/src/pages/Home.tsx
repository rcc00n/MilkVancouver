import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Droplets,
  MapPin,
  Milk,
  ShieldCheck,
  Smile,
  Star,
  Truck,
} from "lucide-react";

import FlavorCard from "../components/home/FlavorCard";
import ProductCard from "../components/products/ProductCard";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { brand } from "../config/brand";
import { useSiteImages } from "../context/SiteImagesContext";
import { useProducts } from "../context/ProductsContext";
import { getImageSrc } from "../utils/imageLibrary";

const HERO_IMAGE = "/images/home/hero.jpg";

const flavors = [
  { key: "home.flavor.berry_blast", title: "Berry Blast", subtitle: "Mixed berries & Greek yogurt", tone: "berry" as const },
  { key: "home.flavor.honey_vanilla", title: "Honey Vanilla", subtitle: "Creamy vanilla with BC honey drizzle", tone: "sunrise" as const },
  { key: "home.flavor.chocolate_swirl", title: "Chocolate Swirl", subtitle: "Cocoa-rich, silky, kid-approved", tone: "citrus" as const },
  { key: "home.flavor.tropical_sunrise", title: "Tropical Sunrise", subtitle: "Mango, pineapple, kefir tang", tone: "cool" as const },
];

const storyImages = [
  { key: "home.story.image_1", alt: "Fresh bottles on a bright table", offset: "lg:translate-y-6" },
  { key: "home.story.image_2", alt: "Yogurt bowls and breakfast spread", offset: "" },
  { key: "home.story.image_3", alt: "Cafe latte and croissant pairing", offset: "lg:-translate-y-6" },
];

const testimonialQuotes = [
  { name: "Jess M.", role: "Busy mom", quote: "My fridge finally feels fun again. The kids steal the chocolate swirl first." },
  { name: "Andre P.", role: "Home barista", quote: "Steams like velvet and still tastes like real milk. Latte art finally landed." },
  { name: "Sophie L.", role: "Weekend host", quote: "The returns are easy and guests always ask where the yogurt came from." },
];

const communityShots = [
  "home.community_1",
  "home.community_2",
  "home.community_3",
  "home.community_4",
  "home.community_5",
  "home.community_6",
];

const howItWorks = [
  {
    title: "Choose your milk",
    copy: "Whole, 2%, lactose-free, chocolate, or barista.",
    icon: Milk,
  },
  {
    title: "Pick delivery or pickup",
    copy: "Neighborhood dropoffs or pickup windows in Vancouver.",
    icon: Truck,
  },
  {
    title: "Enjoy fresh Yummee",
    copy: "Bottles arrive cold with deposits handled for you.",
    icon: ShieldCheck,
  },
];

const benefits = [
  {
    title: "Local Vancouver producers",
    copy: "Fraser Valley partners, bottled before sunrise.",
    icon: MapPin,
  },
  {
    title: "Sustainably packaged",
    copy: "Reusable glass, easy returns on your next order.",
    icon: Droplets,
  },
  {
    title: "Delivered cold and on time",
    copy: "0–4°C routes with SMS updates.",
    icon: Clock3,
  },
  {
    title: "Barista-level quality",
    copy: "Velvety texture that steams and tastes sweet.",
    icon: BadgeCheck,
  },
];

const testimonials = [
  {
    quote: "Cold bottles on my doorstep by 8am. The chocolate milk disappears first.",
    name: "Maya, Kitsilano",
  },
  {
    quote: "Tastes like the farm, not the shelf. Returns are easy—I leave them out.",
    name: "Luis, Mount Pleasant",
  },
  {
    quote: "We swapped to their lactose-free milk and never went back.",
    name: "Priya, Commercial Drive",
  },
];

function Home() {
  const { images } = useSiteImages();
  const { products, loading, error, initialized, refresh } = useProducts();
  const isLoadingProducts = loading || !initialized;
  const navigate = useNavigate();
  const shopSectionRef = useRef<HTMLDivElement | null>(null);

  const resolveImage = useCallback(
    (key: string, fallbackUrl?: string) => images[key]?.url || fallbackUrl || getImageSrc(key),
    [images],
  );

  const resolveAlt = useCallback(
    (key: string, fallbackAlt?: string) =>
      images[key]?.alt || fallbackAlt || key.replace(/[._]/g, " "),
    [images],
  );

  useEffect(() => {
    if (!initialized) {
      refresh();
    }
  }, [initialized, refresh]);

  const featuredProducts = useMemo(() => products.slice(0, 3), [products]);
  const popularProducts = useMemo(() => products.filter((product) => product.is_popular).slice(0, 3), [products]);
  const scrollToShop = () => {
    if (shopSectionRef.current) {
      shopSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/shop");
    }
  };

  const heroImageUrl = resolveImage("home.hero.main", HERO_IMAGE);
  const heroImageAlt = resolveAlt("home.hero.main", "Milk bottles and glasses on a bright table");

  const resolvedStoryImages = useMemo(
    () =>
      storyImages.map((image) => ({
        ...image,
        url: resolveImage(image.key),
        alt: resolveAlt(image.key, image.alt),
      })),
    [resolveAlt, resolveImage],
  );

  const resolvedCommunityShots = useMemo(
    () =>
      communityShots.map((key) => ({
        key,
        url: resolveImage(key),
        alt: resolveAlt(key, "Community photo"),
      })),
    [resolveAlt, resolveImage],
  );

  return (
    <div className="home-page space-y-16 lg:space-y-20">
      <section className="container">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[#eaf5ff] via-white to-[#fff4e6] p-8 md:p-10 lg:p-12 shadow-[0_32px_80px_-48px_rgba(15,47,77,0.6)]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-12 -top-20 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="absolute right-6 top-8 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />
            <div className="absolute left-10 bottom-0 h-60 w-60 rounded-full bg-blue-200/30 blur-3xl" />
          </div>

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6 text-slate-900 animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-sky-900 shadow-sm backdrop-blur">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                Delivering fresh across Vancouver
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  Fresh local milk, delivered in Vancouver.
                </h1>
                <p className="max-w-2xl text-lg text-slate-700">
                  {brand.shortName} bottles Fraser Valley milk, yogurt, and cream before sunrise, then drops it cold at
                  your door or pickup spot.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" className="px-6 py-3 text-base font-semibold shadow-lg" asChild>
                  <Link to="/shop">Shop Milk</Link>
                </Button>
                <Button size="lg" variant="outline" className="px-6 py-3 text-base" asChild>
                  <Link to="/pricing">See Pricing</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur stat-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">From farm</p>
                  <p className="text-2xl font-semibold text-slate-900">24 hrs</p>
                  <p className="text-sm text-slate-600">Milked, bottled, and sealed fast.</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur stat-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Delivery</p>
                  <p className="text-2xl font-semibold text-slate-900">2–3x weekly</p>
                  <p className="text-sm text-slate-600">Routes across Vancouver & the North Shore.</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur stat-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Bottles</p>
                  <p className="text-2xl font-semibold text-slate-900">Returns easy</p>
                  <p className="text-sm text-slate-600">Leave glass out; deposits are tracked.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white/80 shadow-xl backdrop-blur animate-float-soft">
                <img
                  src={heroImageUrl}
                  alt={heroImageAlt}
                  className="h-full w-full min-h-[280px] object-cover"
                  loading="lazy"
                />
              </div>

              <Card className="border-slate-200/70 bg-white/90 shadow-lg backdrop-blur">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-800">
                    Popular right now
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    Live picks from the shop. Add to cart or tap for details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {popularProducts.length ? (
                    popularProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{product.name}</div>
                          {product.category ? (
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {product.category.name}
                            </div>
                          ) : null}
                        </div>
                        <span className="text-sm font-semibold text-sky-800">
                          ${(product.price_cents / 100).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">
                      {isLoadingProducts ? "Loading the top picks..." : "Tag products as popular to feature them here."}
                    </p>
                  )}
                  {error && <p className="text-sm text-amber-700">{error}</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container space-y-6 lg:space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">New</p>
          <h2 className="text-3xl font-semibold text-slate-900">Discover your flavor.</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Four playful bottles that feel like dessert, still made with our grass-fed dairy.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {flavors.map((flavor, index) => {
            const isShopFlavor = index % 2 !== 0;
            return (
              <FlavorCard
                key={flavor.key}
                title={flavor.title}
                subtitle={flavor.subtitle}
                ctaLabel={isShopFlavor ? "Shop flavor" : "Try now"}
                imageKey={flavor.key}
                tone={flavor.tone}
                onCta={isShopFlavor ? () => navigate("/shop") : scrollToShop}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 80}ms` }}
              />
            );
          })}
        </div>
      </section>

      <section className="container space-y-6 lg:space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-800">How {brand.shortName} works</p>
            <h2 className="text-3xl font-semibold text-slate-900">Three steps and you&apos;re stocked.</h2>
            <p className="text-slate-600">Short, simple, and always cold-packed.</p>
          </div>
          <Button variant="ghost" className="px-4 text-sm font-semibold" asChild>
            <Link to="/menu" className="inline-flex items-center gap-2">
              Browse the menu <ArrowRight size={16} />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {howItWorks.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="h-full border-slate-200/80 shadow-sm">
                <CardHeader className="flex flex-col gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                    <Icon size={22} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900">{step.title}</CardTitle>
                  <CardDescription className="text-slate-600">{step.copy}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container space-y-6 lg:space-y-8" ref={shopSectionRef}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-800">Featured products</p>
            <h2 className="text-3xl font-semibold text-slate-900">A quick taste of the shop.</h2>
            <p className="text-slate-600">Add bottles now or peek at pricing first.</p>
          </div>
          <Button variant="ghost" className="px-4 text-sm font-semibold" asChild>
            <Link to="/shop" className="inline-flex items-center gap-2">
              Shop all milk <ArrowRight size={16} />
            </Link>
          </Button>
        </div>

        {error && <p className="text-sm text-amber-700">{error}</p>}

        <div className="grid gap-4 md:grid-cols-3">
          {isLoadingProducts && !featuredProducts.length
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="product-card product-card--skeleton">
                  <div className="product-card__image-wrapper">
                    <div className="skeleton skeleton--image" />
                  </div>
                  <div className="product-card__body">
                    <div className="skeleton skeleton--text" />
                    <div className="skeleton skeleton--text skeleton--short" />
                    <div className="skeleton skeleton--pill" />
                  </div>
                </div>
              ))
            : null}

          {!isLoadingProducts && !featuredProducts.length ? (
            <Card className="md:col-span-3 border-dashed border-slate-200 bg-slate-50">
              <CardContent className="flex flex-col gap-2 py-8">
                <p className="text-base font-semibold text-slate-900">Products will appear here once added.</p>
                <p className="text-sm text-slate-600">Create items in the admin to showcase them on the homepage.</p>
              </CardContent>
            </Card>
          ) : null}

          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container space-y-6 lg:space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-800">Why {brand.shortName}</p>
          <h2 className="text-3xl font-semibold text-slate-900">Reasons customers stick with us.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card key={benefit.title} className="h-full border-slate-200/80 shadow-sm">
                <CardHeader className="flex flex-col gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                    <Icon size={22} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900">{benefit.title}</CardTitle>
                  <CardDescription className="text-slate-600">{benefit.copy}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="landing-section">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-14">
          <div className="overflow-hidden rounded-[28px] border border-amber-100 bg-sunrise-band p-8 shadow-[0_28px_72px_-40px_rgba(15,23,42,0.4)] md:p-10 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-start">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">
                  About us
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">
                  Yummee creates simple, honest, and nourishing food designed for modern families.
                </h2>
                <p className="text-slate-700">
                  Our products are soft, creamy dairy-based desserts with a smooth, comforting texture — an easy everyday snack that fits naturally into any lifestyle.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="pill-button !px-6 !py-3" asChild>
                    <Link to="/shop">Shop the fridge</Link>
                  </Button>
                  <Button size="lg" variant="ghost" className="px-6 py-3 rounded-full border-slate-200" asChild>
                    <Link to="/about">See how we bottle</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-6 py-3 rounded-full border-amber-200 bg-white/90 text-amber-900 shadow-sm hover:bg-white"
                    asChild
                  >
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLSdyIcVx1K3-W5910394_uW3Lb1U9vpwQT01fgHlubqQ6VX2qw/viewform?usp=sharing&ouid=116307381524447680775"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Sign up for Yummee news
                    </a>
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {resolvedStoryImages.map((image, index) => (
                  <div
                    key={image.key}
                    className={`overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_48px_-34px_rgba(15,23,42,0.45)] animate-fade-up ${image.offset}`}
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container space-y-6 lg:space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-800">Neighbors</p>
            <h2 className="text-3xl font-semibold text-slate-900">Short, punchy proof.</h2>
            <p className="text-slate-600">Real notes from Vancouver blocks.</p>
          </div>
          <Button variant="ghost" className="px-4 text-sm font-semibold" asChild>
            <Link to="/about" className="inline-flex items-center gap-2">
              Read our story <ArrowRight size={16} />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="h-full border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Smile size={18} />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-900">{testimonial.name}</CardTitle>
                </div>
                <CardDescription className="text-slate-700">“{testimonial.quote}”</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-14">
          <div className="rounded-[28px] border border-purple-100 bg-lilac-band p-8 shadow-[0_28px_72px_-40px_rgba(15,23,42,0.45)] md:p-10 lg:p-12 space-y-8">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-800">Loved locally</p>
              <h2 className="text-3xl font-semibold text-slate-900">“It tastes like the milk we grew up with.”</h2>
              <p className="text-slate-700 max-w-3xl mx-auto">
                Proof points from Vancouver fridges, coffee bars, and busy households.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {testimonialQuotes.map((entry) => (
                <div
                  key={entry.name}
                  className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_52px_-38px_rgba(15,23,42,0.55)] backdrop-blur"
                >
                  <div className="flex items-center gap-2 text-amber-500" aria-hidden>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={16} fill="#f59e0b" stroke="#f59e0b" />
                    ))}
                  </div>
                  <p className="mt-3 text-slate-800 leading-relaxed">“{entry.quote}”</p>
                  <div className="mt-4 font-semibold text-slate-900">{entry.name}</div>
                  <div className="text-sm text-slate-600">{entry.role}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {resolvedCommunityShots.map((image, index) => (
                <div
                  key={image.key}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_16px_36px_-28px_rgba(15,23,42,0.45)] animate-fade-up"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `Community moment ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.04]"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 px-6 py-10 text-white shadow-[0_24px_64px_-32px_rgba(0,0,0,0.55)] md:px-10 lg:px-12 animate-fade-up">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(248,250,252,0.16),transparent_28%)]" />
          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-100">Ready?</p>
              <h2 className="text-3xl font-semibold text-white">Ready for fresher milk?</h2>
              <p className="max-w-2xl text-slate-200">
                Pick your bottles, choose delivery or pickup, and let us handle the cold chain and returns.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                variant="secondary"
                className="!bg-white !text-slate-900 !hover:bg-slate-100 px-6 py-3 text-base font-semibold shadow-lg"
                asChild
              >
                <Link to="/shop">Shop Now</Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="border border-white/60 bg-transparent px-6 py-3 text-base font-semibold !text-white !hover:bg-white/10 !hover:text-white"
                asChild
              >
                <Link to="/pricing">Compare pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
