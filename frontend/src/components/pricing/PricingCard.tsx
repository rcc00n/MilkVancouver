import { Check } from "lucide-react";
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
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative h-full overflow-hidden border-slate-200/80 bg-white/90 shadow-[0_24px_64px_-46px_rgba(15,47,77,0.6)] backdrop-blur-sm",
        highlight
          ? "border-primary/80 ring-1 ring-primary/15"
          : "border-slate-200/70",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100",
          highlight && "from-amber-300 via-primary to-sky-400",
        )}
      />
      {badge ? (
        <Badge className="absolute right-4 top-4 border-amber-200 bg-amber-100 text-amber-900 shadow-sm">
          {badge}
        </Badge>
      ) : null}

      <CardHeader className="space-y-3 pb-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {name}
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              {description}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold leading-none text-slate-900">
              {price}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {cadence}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
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

      <CardFooter className="pt-0">
        <Button className="w-full" asChild>
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PricingCard;
