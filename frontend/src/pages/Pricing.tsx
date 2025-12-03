import { Check, MapPin, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";

import PricingCard from "../components/pricing/PricingCard";
import PageShell from "../components/PageShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

const plans = [
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

function Pricing() {
  return (
    <PageShell
      title="Simple pricing for fresh milk."
      description="All pricing shown in CAD with local Vancouver and North Shore delivery options. Pick delivery or pickup—switch anytime."
    >
      <div className="space-y-12">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-[#eaf5ff] via-white to-[#fff4e6] p-6 shadow-[0_32px_80px_-60px_rgba(15,47,77,0.6)] sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="absolute right-4 top-0 h-56 w-56 rounded-full bg-amber-100/60 blur-3xl" />
            <div className="absolute left-12 bottom-0 h-52 w-52 rounded-full bg-blue-200/40 blur-3xl" />
          </div>

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge className="border-slate-200 bg-white/80 text-sky-900 shadow-sm">
                  CAD pricing, deposits handled
                </Badge>
                <Badge variant="outline" className="border-sky-200 bg-white/70 text-slate-700">
                  Local delivery & pickup
                </Badge>
              </div>
              <p className="max-w-2xl text-lg text-slate-700">
                Pick the cadence that fits your fridge. Delivery windows are set by neighborhood, and you can pause or
                switch in seconds.
              </p>
              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <Button
                  className="w-full px-6 py-3 text-base font-semibold shadow-lg sm:w-auto"
                  asChild
                >
                  <Link to="/shop?plan=weekly">Start weekly subscription</Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full px-6 py-3 text-base sm:w-auto"
                  asChild
                >
                  <Link to="/shop?plan=one-time">Make a one-time order</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {heroPerks.map((perk) => (
                  <div
                    key={perk.title}
                    className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm"
                  >
                    <div className="rounded-full bg-sky-50 p-2 text-sky-800">
                      <perk.icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{perk.title}</p>
                      <p className="text-sm text-slate-600">{perk.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_48px_-36px_rgba(15,47,77,0.4)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-800">What you get</p>
                  <p className="text-slate-700">Every plan carries the same fresh staples.</p>
                </div>
                <Badge className="border-emerald-200 bg-emerald-100 text-emerald-900">Fresh daily</Badge>
              </div>
              <ul className="space-y-2 text-sm text-slate-800">
                {inclusions.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Cold-chain delivery (0–4°C) and bottle deposits are tracked for you.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4" id="plans">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-800">Compare plans</p>
              <h2 className="text-2xl font-semibold text-slate-900">Choose a plan and adjust anytime.</h2>
              <p className="text-slate-600">
                Switch between delivery and pickup. We timestamp every bottle and manage returns automatically.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm">
              <span className="font-semibold text-slate-900">No long contracts.</span> Pause, skip, or edit items weekly.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]" id="faq">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-800">Questions</p>
            <h3 className="text-xl font-semibold text-slate-900">FAQ about delivery & billing</h3>
            <p className="text-slate-600">Short answers to the things people ask most.</p>

            <Accordion type="single" collapsible className="rounded-xl border border-slate-200 bg-white/80 px-2">
              {faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger className="text-base text-slate-900">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-[0_18px_48px_-36px_rgba(15,47,77,0.4)]">
            <p className="text-sm font-semibold text-slate-900">Included with every order</p>
            <ul className="grid gap-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-emerald-600" />
                <span>Delivery alerts the evening before your window.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-emerald-600" />
                <span>Swap items without resetting your cadence.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-emerald-600" />
                <span>Safe handling: 0–4°C cold-chain until the hand-off.</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/contact">Need a custom cadence? Contact us</Link>
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-[0_18px_48px_-38px_rgba(15,47,77,0.42)]">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-slate-900">Have questions? Contact us</h3>
            <p className="text-slate-600">We’ll help you pick the right plan and delivery window.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <Button className="w-full sm:w-auto" asChild>
              <Link to="/contact">Contact us</Link>
            </Button>
            <Button variant="ghost" className="w-full text-primary sm:w-auto" asChild>
              <Link to="/shop">Browse the shop first</Link>
            </Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

export default Pricing;
