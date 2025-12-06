import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

type PricingCardProps = {
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
  tone?: "lilac" | "citrus" | "mint";
};

const toneStyles: Record<
  NonNullable<PricingCardProps["tone"]>,
  { frame: string; glow: string; chip: string; accent: string; button: string }
> = {
  lilac: {
    frame: "from-[#ffe75e]/80 via-white to-[#c4b5fd]/70",
    glow: "bg-[#a855f7]/30",
    chip: "bg-[#f3e8ff] text-[#4c1d95]",
    accent: "text-[#5b21ff]",
    button:
      "bg-[#5b21ff] text-white shadow-[0_20px_44px_-24px_rgba(91,33,182,0.6)] hover:bg-[#4c1d95]",
  },
  citrus: {
    frame: "from-[#ffe75e]/90 via-white to-[#fdba74]/70",
    glow: "bg-[#f59e0b]/35",
    chip: "bg-[#fff7ed] text-[#b45309]",
    accent: "text-[#b45309]",
    button:
      "bg-[#f59e0b] text-[#0f172a] shadow-[0_20px_44px_-24px_rgba(245,158,11,0.45)] hover:bg-[#d97706]",
  },
  mint: {
    frame: "from-[#bbf7d0]/80 via-white to-[#a5f3fc]/70",
    glow: "bg-[#22c1c3]/30",
    chip: "bg-[#ecfeff] text-[#0f766e]",
    accent: "text-[#0f766e]",
    button:
      "bg-[#22c1c3] text-slate-900 shadow-[0_20px_44px_-24px_rgba(34,193,195,0.45)] hover:bg-[#14b8a6]",
  },
};

function PricingCard({
  name,
  price,
  cadence,
  description,
  features,
  ctaHref,
  ctaLabel = "Choose this plan",
  badge,
  highlight,
  note,
  tone = "lilac",
}: PricingCardProps) {
  const toneTheme = toneStyles[tone] ?? toneStyles.lilac;

  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-[24px] bg-gradient-to-br p-[1px] transition-all duration-200",
        toneTheme.frame,
        highlight
          ? "shadow-[0_32px_90px_-60px_rgba(91,33,182,0.65)] ring-1 ring-[#5b21ff]/20"
          : "shadow-[0_26px_72px_-60px_rgba(15,23,42,0.55)]",
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 opacity-50 blur-3xl", toneTheme.glow)} />

      <Card className="relative flex h-full flex-col gap-5 overflow-hidden rounded-[22px] border border-white/80 bg-white/90 px-5 py-6 text-slate-900 shadow-[0_22px_58px_-50px_rgba(15,23,42,0.55)] backdrop-blur transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_30px_80px_-54px_rgba(91,33,182,0.5)]">
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-1",
            highlight
              ? "bg-gradient-to-r from-[#ffe75e] via-[#5b21ff] to-[#22c1c3]"
              : "bg-gradient-to-r from-slate-100 via-white to-slate-100",
          )}
        />

        <CardHeader className="flex items-start justify-between gap-3 space-y-0 px-0 pt-0">
          <div className="space-y-2">
            {badge ? (
              <Badge className="w-fit rounded-full border-[#ffe75e]/60 bg-[#ffe75e]/80 text-[#4c1d95] shadow-sm">
                {badge}
              </Badge>
            ) : null}
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-slate-900">{name}</CardTitle>
              <CardDescription className="text-base text-slate-600">{description}</CardDescription>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 px-3 py-2 text-right shadow-inner">
            <div className={cn("text-[28px] font-semibold leading-none", toneTheme.accent)}>{price}</div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{cadence}</p>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-3 px-0">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
              toneTheme.chip,
            )}
          >
            <Sparkles className="size-4" />
            Flexible routes
          </div>
          <ul className="space-y-2 text-sm text-slate-800">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-emerald-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {note ? <p className="text-xs text-slate-500">{note}</p> : null}
        </CardContent>

        <CardFooter className="px-0 pb-0 pt-0">
          <Button
            className={cn(
              "h-11 w-full rounded-xl px-5 text-sm font-semibold transition duration-150 hover:-translate-y-0.5",
              toneTheme.button,
            )}
            asChild
          >
            <Link to={ctaHref}>
              {ctaLabel}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default PricingCard;
