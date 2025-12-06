import {
  ArrowRight,
  Check,
  MapPin,
  Milk,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

import PricingCard from "../components/pricing/PricingCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

type PlanTone = "lilac" | "citrus" | "mint";

type Plan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  ctaHref: string;
  ctaLabel?: string;
  badge?: string;
  highlight?: boolean;
  note?: string;
  tone: PlanTone;
};

const plans: Plan[] = [
  {
    name: "One-time order",
    price: "From $18",
    cadence: "per delivery, CAD",
    description: "Order when you need a top-up—no commitment required.",
    features: [
      "Choose milk, cream, yogurt, and chocolate milk",
      "Delivery from $4 or free pickup windows",
      "Glass bottle deposits auto-refunded on return",
      "SMS updates the evening before drop-off",
    ],
    ctaHref: "/shop?plan=one-time",
    note: "Best for trying us out or topping up mid-week.",
    tone: "citrus",
  },
  {
    name: "Weekly subscription",
    price: "From $32",
    cadence: "per week, CAD",
    description: "Our most popular crate for fridges that stay stocked.",
    features: [
      "Mix and match items each week—no long contracts",
      "Skip or pause deliveries in two clicks",
      "Reduced delivery fees on standing routes",
      "Leave empties at the door; we handle deposits",
    ],
    ctaHref: "/shop?plan=weekly",
    badge: "Most popular",
    highlight: true,
    note: "Pick your drop-off day and adjust items anytime.",
    tone: "lilac",
  },
  {
    name: "Business & cafe",
    price: "Custom",
    cadence: "weekly or twice-weekly",
    description: "Standing orders for cafes, offices, and micro-markets.",
    features: [
      "Early AM delivery windows available",
      "Invoice or card billing with receipts",
      "Barista milk, lactose-free, and yogurt cases",
      "Priority support for rush refills",
    ],
    ctaHref: "/shop?plan=business",
    note: "We’ll tailor cases by volume; start in the shop and we’ll confirm.",
    tone: "mint",
  },
];

const faqs = [
  {
    question: "How do delivery fees work?",
    answer:
      "Vancouver and Burnaby deliveries start around $4 depending on the route. Pickup windows are free. Weekly subscribers often see reduced delivery fees because we batch stops by neighborhood.",
  },
  {
    question: "Where do you deliver?",
    answer:
      "We cover Vancouver, Burnaby, and the North Shore. If you’re just outside these areas, message us—we can usually add a stop or suggest the nearest pickup partner.",
  },
  {
    question: "Can I pause or cancel?",
    answer:
      "Yes. You can skip a week, pause, or cancel anytime before the cutoff for your route. No cancellation fees or penalties.",
  },
  {
    question: "How are bottle deposits handled?",
    answer:
      "Deposits are added automatically to your first order and refunded once bottles come back. Leave empties at the door on delivery day.",
  },
];

const heroPerks = [
  {
    title: "Local delivery",
    copy: "Evening route texts and AM drop-offs by neighborhood.",
    icon: Truck,
  },
  {
    title: "Straightforward CAD pricing",
    copy: "All prices in CAD with deposits tracked for you.",
    icon: ShieldCheck,
  },
  {
    title: "Pickup friendly",
    copy: "Skip delivery fees with partner pickups across Vancouver.",
    icon: MapPin,
  },
];

const inclusions = [
  "Milk: whole, 2%, lactose-free, chocolate, and barista.",
  "Cream for coffee: half & half, whipping, and barista blends.",
  "Yogurt & kefir options for breakfasts and smoothies.",
];

const includedWithEveryOrder = [
  "Delivery alerts the evening before your window.",
  "Swap items without resetting your cadence.",
  "Safe handling: 0–4°C cold-chain until the hand-off.",
];

const perkGradients = [
  "from-[#ffe75e]/90 via-white/40 to-[#f472b6]/60",
  "from-[#bbf7d0]/80 via-white/40 to-[#22c1c3]/60",
  "from-[#fef08a]/80 via-white/40 to-[#a5f3fc]/60",
];

function Pricing() {
  return (
    <div className="pricing-modern space-y-10 pb-6 text-slate-900">
      <section className="relative overflow-hidden rounded-[32px] border border-white/30 bg-gradient-to-br from-[#5b21ff] via-[#a855f7] to-[#22c1c3] text-white shadow-[0_40px_120px_-60px_rgba(91,33,182,0.65)]">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute right-6 -top-12 h-72 w-72 rounded-full bg-[#ffe75e]/30 blur-3xl" />
          <div className="absolute left-24 bottom-0 h-52 w-52 rounded-full bg-[#22c1c3]/40 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center lg:px-10">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white">
                School delivery · CAD pricing
              </Badge>
              <Badge className="rounded-full border-[#ffe75e]/70 bg-[#ffe75e] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b21ff] shadow-[0_10px_32px_-18px_rgba(0,0,0,0.45)]">
                Deposits handled
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-[2.35rem] font-semibold leading-[1.05] sm:text-[2.6rem] lg:text-[2.9rem]">
                Simple pricing for fresh milk.
              </h1>
              <p className="max-w-2xl text-lg text-white/90">
                All pricing shown in CAD with local Vancouver and North Shore delivery options. Pick delivery or pickup—switch anytime.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/shop?plan=weekly"
                className="inline-flex items-center justify-center rounded-full bg-[#ffe75e] px-6 py-3 text-sm font-semibold text-[#4c1d95] shadow-[0_22px_48px_-18px_rgba(0,0,0,0.45)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_26px_52px_-18px_rgba(0,0,0,0.5)]"
              >
                Start weekly subscription
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link
                to="#plans"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition duration-150 hover:-translate-y-0.5 hover:bg-white/20"
              >
                Compare plans
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur transition duration-150 hover:-translate-y-0.5 hover:bg-white/15"
              >
                Talk with us
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {heroPerks.map((perk, index) => (
                <div
                  key={perk.title}
                  className={`relative overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br ${perkGradients[index % perkGradients.length]} p-4 text-slate-900 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.55)] backdrop-blur`}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 text-[#5b21ff] shadow-inner">
                      <perk.icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{perk.title}</p>
                      <p className="text-sm text-slate-700">{perk.copy}</p>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -right-4 -top-6 h-16 w-16 rounded-full bg-white/30 blur-2xl" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex-1">
            <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/25 blur-3xl" />
            <div className="absolute -left-10 bottom-4 h-24 w-24 rounded-full bg-[#ffe75e]/30 blur-3xl" />

            <div className="relative rounded-[28px] border border-white/40 bg-white/10 p-[1px] shadow-[0_30px_80px_-48px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <div className="rounded-[26px] bg-white/90 p-6 text-slate-900 shadow-[0_20px_54px_-46px_rgba(15,23,42,0.55)] backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5b21ff]">
                      Weekly crate
                    </p>
                    <p className="text-3xl font-semibold text-slate-900">{plans[1].price}</p>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {plans[1].cadence}
                    </p>
                  </div>
                  <div className="rounded-full bg-[#ffe75e] px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-[#4c1d95] shadow-[0_18px_40px_-22px_rgba(0,0,0,0.5)]">
                    CAD
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {plans[1].description} Pause or swap items every week without losing your route spot.
                </p>

                <div className="mt-5 space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-inner">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5b21ff]">
                    <Milk className="size-4" />
                    <span>What you get</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-800">
                    {inclusions.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 rounded-xl border border-[#5b21ff]/15 bg-[#5b21ff]/8 p-3 text-xs font-semibold text-[#4c1d95]">
                    <ShieldCheck className="size-4" />
                    <span>Cold-chain delivery and glass bottle deposits handled automatically.</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                    <Sparkles className="size-4 text-[#5b21ff]" />
                    No long contracts
                  </div>
                  <Link
                    to="#plans"
                    className="text-sm font-semibold text-[#5b21ff] transition hover:text-[#4c1d95]"
                  >
                    See plan details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-6" id="plans">
        <div className="relative mx-auto max-w-[1180px] space-y-6 rounded-[30px] border border-slate-200/80 bg-white/90 px-4 py-8 shadow-[0_34px_90px_-60px_rgba(15,23,42,0.55)] backdrop-blur-sm lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5b21ff]">Compare plans</p>
              <h2 className="text-2xl font-semibold text-slate-900">Choose a plan and adjust anytime.</h2>
              <p className="max-w-3xl text-slate-600">
                Switch between delivery and pickup. We timestamp every bottle and manage returns automatically.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              Pause, skip, or edit items weekly.
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:gap-8 xl:grid-cols-3">
            {plans.map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-gradient-to-br from-[#f6f0ff] via-white to-[#ddfbff] px-4 py-10 shadow-[0_34px_90px_-68px_rgba(15,23,42,0.55)] lg:px-10"
        id="faq"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-6 h-52 w-52 rounded-full bg-[#ffe75e]/40 blur-3xl" />
          <div className="absolute right-10 top-0 h-64 w-64 rounded-full bg-[#a855f7]/30 blur-3xl" />
          <div className="absolute left-10 bottom-0 h-56 w-56 rounded-full bg-[#22c1c3]/30 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5b21ff]">Questions</p>
            <h3 className="text-xl font-semibold text-slate-900">FAQ about delivery & billing</h3>
            <p className="text-slate-600">Short answers to the things people ask most.</p>

            <Accordion
              type="single"
              collapsible
              className="rounded-2xl border border-white/80 bg-white/80 px-2 shadow-[0_18px_50px_-46px_rgba(91,33,182,0.45)] backdrop-blur"
            >
              {faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger className="text-base font-semibold text-slate-900">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="space-y-5 rounded-2xl border border-white/80 bg-white/85 p-6 shadow-[0_26px_64px_-54px_rgba(91,33,182,0.45)] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Included with every order</p>
              <Badge className="rounded-full border-[#22c1c3]/40 bg-[#22c1c3]/15 text-[#0f172a]">Fresh daily</Badge>
            </div>
            <ul className="grid gap-2 text-sm text-slate-800">
              {includedWithEveryOrder.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-3 rounded-xl border border-[#5b21ff]/15 bg-[#5b21ff]/8 p-3 text-sm text-[#3b1a75]">
              <ShieldCheck className="mt-0.5 size-5" />
              <div>
                <p className="font-semibold text-[#2f0d5e]">Glass bottle deposits, handled</p>
                <p className="text-slate-700">
                  Leave rinsed bottles out on delivery day—credits apply automatically with your next invoice.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                className="h-11 w-full rounded-full bg-[#5b21ff] px-6 text-white shadow-[0_20px_44px_-24px_rgba(91,33,182,0.6)] transition hover:-translate-y-0.5 hover:bg-[#4c1d95] sm:w-auto"
                asChild
              >
                <Link to="/contact">Need a custom cadence?</Link>
              </Button>
              <Button
                variant="ghost"
                className="h-11 w-full rounded-full border border-slate-200 bg-white px-6 text-[#5b21ff] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f6f0ff] sm:w-auto"
                asChild
              >
                <Link to="/shop">Browse the shop first</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[26px] border border-[#5b21ff]/15 bg-gradient-to-r from-[#5b21ff] via-[#a855f7] to-[#22c1c3] px-4 py-8 text-white shadow-[0_30px_80px_-58px_rgba(91,33,182,0.55)]">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -left-12 top-0 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute right-0 -bottom-12 h-56 w-56 rounded-full bg-[#ffe75e]/25 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Have questions? Contact us</h3>
            <p className="text-white/85">We’ll help you pick the right plan and delivery window.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#5b21ff] shadow-[0_20px_44px_-18px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_54px_-18px_rgba(0,0,0,0.5)]"
            >
              Contact us
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-full border border-white/50 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              Browse the shop first
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Pricing;
