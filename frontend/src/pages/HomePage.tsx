import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Droplet, Leaf, Package } from "lucide-react";

import { getProducts } from "../api/products";
import { CategoryCard } from "../components/CategoryCard";
import { FeatureCard } from "../components/FeatureCard";
import { ProductCard } from "../components/ProductCard";
import { ServiceCard } from "../components/ServiceCard";
import { useCart } from "../context/CartContext";
import { brand } from "../config/brand";
import type { Product } from "../types";
import { getProductImageUrl } from "../utils/products";

const formatPrice = (priceCents: number) => `$${(priceCents / 100).toFixed(2)}`;

const categoryShowcase = [
  {
    title: "Fresh Milk",
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80",
    links: ["Whole", "2%", "Chocolate", "Non-homogenized"],
    description: "Grass-fed BC herds bottled within 24 hours and delivered cold across Vancouver.",
  },
  {
    title: "Yogurt & Kefir",
    image:
      "https://images.unsplash.com/photo-1505250469679-203ad9ced0cb?auto=format&fit=crop&w=1200&q=80",
    links: ["Greek", "Plain", "Drinkable", "Kefir"],
    description: "Slow-cultured dairy with live probiotics for breakfasts, smoothies, and baking.",
  },
  {
    title: "Cheese & Butter",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    links: ["Soft cheese", "Cheddar", "Paneer", "Cultured butter"],
    description: "Coastal creamery favorites, ready for snacking boards or weeknight cooking.",
  },
  {
    title: "Coffee Bar",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
    links: ["Barista milk", "Half & half", "Whipping cream", "Chocolate milk"],
    description: "Latte-ready proteins that steam glossy and taste sweet without extra syrups.",
  },
];

const featureHighlights = [
  { title: "Fraser Valley milked at dawn", description: "Grass-fed herds, bottled and sealed before sunrise." },
  { title: "Pasteurized & cold-held", description: "Cold-chain readings ride with every delivery route." },
  { title: "Reusable glass bottles", description: "Deposit system with doorstep pickups on your next order." },
  { title: "Barista texture", description: "Higher protein milk that stretches and pours like velvet." },
  { title: "Local delivery windows", description: "Vancouver & North Shore routes with SMS updates." },
];

const milkBoxes = [
  {
    title: "Barista Essentials",
    price: "$28 / week",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Family Fridge Crate",
    price: "$42 / week",
    image: "https://images.unsplash.com/photo-1510626176961-4b37d0ae5b2b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Cheese + Butter Selects",
    price: "$36 / week",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  },
];

const productHighlights = [
  {
    name: "Milk & Cream",
    description: "Whole, 2%, skim, chocolate, barista milk, half & half, and whipping cream.",
    icon: Droplet,
  },
  {
    name: "Yogurt & Kefir",
    description: "Greek, plain, drinkable, and cultured kefir with live probiotics.",
    icon: Leaf,
  },
  {
    name: "Cheese & Pantry",
    description: "Cultured butter, soft cheese, paneer, and pantry staples for quick hosting.",
    icon: Package,
  },
];

const heroStats = [
  { label: "Milking → bottle", value: "24 hrs" },
  { label: "Delivery windows", value: "3x weekly" },
  { label: "Bottle returns", value: "Included" },
];

function HomePage() {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const shopSectionRef = useRef<HTMLDivElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getProducts(undefined, controller.signal)
      .then((result) => setProducts(result))
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch products", fetchError);
        setError("Unable to load products right now. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const popularProducts = useMemo(
    () => products.filter((product) => product.is_popular).slice(0, 4),
    [products],
  );

  const shopHighlights = useMemo(() => (products.length ? products.slice(0, 4) : []), [products]);

  const scrollToShop = () => {
    shopSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAddToCart = (product: Product) => addItem(product, 1);

  return (
    <div className="landing-page space-y-0 text-slate-900">
      <section className="landing-section relative overflow-hidden py-16 text-slate-900 bg-gradient-to-br from-[#eaf5ff] via-[#f6fbff] to-white border-b border-sky-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-10 -top-16 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute right-4 top-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="absolute left-12 bottom-0 h-60 w-60 rounded-full bg-amber-100/50 blur-3xl" />
        </div>
        <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-14 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-sky-100 shadow-sm">
              <span className="text-sky-800 text-xs font-semibold tracking-[0.2em] uppercase">
                Grass-fed BC dairy
              </span>
              <span className="text-slate-500 text-sm">Bottled in Vancouver · Cold chain 0–4°C</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-slate-900">
              Vancouver&apos;s milk, yogurt, and cream bottled at dawn.
            </h1>
            <p className="text-slate-700 max-w-2xl">
              {brand.name} partners with Fraser Valley dairies, fills reusable glass bottles, and delivers across
              Vancouver and the North Shore with cold-chain tracking.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={scrollToShop}
                className="bg-[#0b4f88] text-white px-6 py-3 rounded-lg shadow-md hover:bg-sky-800 transition-colors font-semibold"
              >
                Shop dairy
              </button>
              <Link
                to="/contact"
                className="border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-lg bg-white/70 hover:bg-white transition-colors"
              >
                See delivery map
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryShowcase.slice(0, 3).map((item) => (
                <span
                  key={item.title}
                  className="border border-sky-100 bg-white/80 px-4 py-2 rounded-full text-sm text-slate-800 shadow-sm"
                >
                  {item.title}
                </span>
              ))}
              <button
                type="button"
                onClick={scrollToShop}
                className="bg-white/80 border border-sky-100 px-4 py-2 rounded-full text-sm hover:bg-white transition-colors text-slate-800 shadow-sm"
              >
                How it works →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/80 border border-sky-100 rounded-xl px-4 py-3 shadow-sm backdrop-blur"
                >
                  <div className="text-xs uppercase tracking-[0.15em] text-sky-800 font-semibold">{stat.label}</div>
                  <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur text-slate-900 p-8 rounded-2xl shadow-2xl border border-sky-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sky-700 uppercase tracking-wider text-sm">Popular right now</p>
              <span className="rounded-full bg-sky-50 text-sky-700 text-xs font-semibold px-3 py-1 border border-sky-100">
                Updated live
              </span>
            </div>
            <h3 className="text-2xl font-semibold mb-4">What neighbors are adding</h3>
            <div className="space-y-3">
              {popularProducts.length ? (
                popularProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border-b last:border-b-0 border-gray-200 pb-3"
                  >
                    <div>
                      <div className="font-semibold text-black">{product.name}</div>
                      {product.category && <div className="text-xs text-gray-500">{product.category.name}</div>}
                    </div>
                    <div className="text-sky-700 font-semibold">{formatPrice(product.price_cents)}</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">
                  {loading ? "Loading top picks..." : "Mark products as popular in admin to feature them here."}
                </p>
              )}
            </div>
            {error && <p className="text-amber-600 text-sm mt-3">{error}</p>}
            <button
              type="button"
              className="bg-sky-900 text-white px-6 py-3 rounded-lg hover:bg-sky-800 transition-colors w-full mt-6 shadow-md"
              onClick={scrollToShop}
            >
              Shop the lineup
            </button>
          </div>
        </div>
      </section>

      <section className="landing-section py-16 bg-white text-slate-900 border-t border-sky-100">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-14">
          <div className="grid md:grid-cols-3 gap-8">
            {milkBoxes.map((pkg) => (
              <div key={pkg.title} className="text-center bg-sky-50 rounded-2xl p-6 shadow-sm border border-sky-100">
                <div className="mb-6 h-48 overflow-hidden rounded-xl border border-sky-100">
                  <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">{pkg.title}</h3>
                <p className="text-sky-800 font-semibold mb-4">{pkg.price}</p>
                <button
                  type="button"
                  onClick={scrollToShop}
                  className="bg-slate-900 text-white px-6 py-2 rounded-full hover:bg-sky-800 transition-colors text-sm"
                >
                  See what&apos;s inside
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section py-16 bg-[#eaf5ff]">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-14 space-y-8">
          <div className="flex flex-col gap-3">
            <p className="text-sky-800 uppercase tracking-[0.2em] text-xs">Categories</p>
            <h2 className="text-3xl font-semibold text-slate-900">Everyday dairy plus cafe-ready staples.</h2>
            <p className="text-slate-700 max-w-2xl">
              Build your cart by craving: creamy milks, cultured yogurt and kefir, spreadable butter, and cheese boards
              made for quick hosting.
            </p>
          </div>
          <div className="flex gap-8 flex-wrap">
            {categoryShowcase.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section py-16 bg-white">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-14">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <p className="text-sky-700 uppercase tracking-wider text-sm">From farm to glass</p>
              <h2 className="text-4xl font-semibold">Less than 24 hours from milking to your fridge.</h2>
              <p className="text-slate-700">
                We bottle in small batches, keep everything between 0–4°C, and timestamp every crate so you can taste
                the difference in sweetness and texture.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link
                  to="/pricing"
                  className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-sky-800 transition-colors"
                >
                  See subscriptions
                </Link>
                <Link
                  to="/menu"
                  className="border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-lg hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Shop all dairy
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#0b3b5c] to-[#0e7490] p-8 rounded-2xl shadow-lg space-y-4 text-white">
              <p className="uppercase tracking-wider text-sm text-sky-100">Delivery promise</p>
              <h3 className="text-3xl font-semibold">Routes that respect the cold chain.</h3>
              <p className="text-white/90">
                Vancouver, Burnaby, and North Shore runs twice weekly. Bottles ride with gel packs and ice blankets; your
                SMS includes a cold-chain timestamp.
              </p>
              <p className="text-sky-100 text-sm">Bottle returns accepted on every delivery.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section py-16 bg-white text-slate-900">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-14 grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <p className="text-sky-700 uppercase tracking-wider text-sm">About {brand.shortName}</p>
            <h2 className="text-4xl font-semibold">
              Vancouver-made dairy with reusable bottles and transparent sourcing.
            </h2>
            <p className="text-gray-700">
              Our team grew up between local farms and Vancouver cafes. We pair grass-fed milk with barista-level
              standards so your fridge staples stay premium without the markup.
            </p>
            <p className="text-gray-700">
              Every bottle lists the dairy, batch, and pasteurization window. Returns ride back on your next delivery so
              glass can be reused instead of recycled.
            </p>
            <Link
              to="/about-us"
              className="text-slate-900 border-2 border-slate-900 px-6 py-3 inline-flex rounded-lg hover:bg-slate-900 hover:text-white transition-colors w-fit"
            >
              Read our story →
            </Link>
          </div>
          <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg space-y-4">
            <p className="text-sky-200 uppercase tracking-wider text-sm">Customer note</p>
            <p className="text-xl leading-relaxed">
              “It tastes like the milk we grew up with. The bottles show the milking date, and returns are easy—I just
              leave them out for the driver.”
            </p>
            <p className="text-slate-200">- Rhea M., Kitsilano</p>
          </div>
        </div>
      </section>

      <section className="landing-section py-16 bg-slate-900 text-white border-t border-sky-200/20">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-14">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10">
            <div>
              <p className="text-sky-200 uppercase tracking-wider text-sm mb-2">Why choose us</p>
              <h2 className="text-4xl font-semibold">Standards you can taste.</h2>
            </div>
            <p className="text-sky-100/80 max-w-md">
              Grass-fed milk, pasteurization logs, and bottle-return routes that keep the planet and your coffee happy.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {featureHighlights.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section py-16 bg-white text-slate-900" ref={shopSectionRef} id="shop">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-14 space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <p className="text-sky-700 uppercase tracking-wider text-sm">Shop • Menu</p>
              <h2 className="text-4xl font-semibold">Explore the dairy case.</h2>
              <p className="text-gray-600 mt-2">
                Pick your staples, add weekend treats, and leave bottle returns at the door for your next delivery.
              </p>
            </div>
            <Link to="/menu" className="text-slate-900 font-semibold hover:underline flex items-center gap-2">
              Visit shop <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {productHighlights.map((item) => (
              <ProductCard key={item.name} {...item} ctaLabel="Open category" onClick={() => navigate("/menu")} />
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {loading && !shopHighlights.length ? (
              <div className="md:col-span-2 text-gray-600">Loading products...</div>
            ) : shopHighlights.length ? (
              shopHighlights.map((product) => (
                <ServiceCard
                  key={product.id}
                  title={product.name}
                  price={formatPrice(product.price_cents)}
                  description={product.description || product.category?.name || "Popular pick from our shop."}
                  image={getProductImageUrl(product)}
                  onAddToCart={() => handleAddToCart(product)}
                  onDetails={() => navigate(`/products/${product.slug}`)}
                />
              ))
            ) : (
              <div className="md:col-span-2 text-gray-700 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6">
                <p className="font-semibold text-black">No products yet.</p>
                <p className="text-sm mt-2">Add items in the admin to see them featured here.</p>
              </div>
            )}
          </div>

          {error && <p className="text-amber-700 text-sm">{error}</p>}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
