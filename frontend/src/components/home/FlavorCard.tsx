import { ReactNode, type CSSProperties } from "react";

import { useSiteImage } from "../../hooks/useSiteImage";

type FlavorCardProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  imageKey: string;
  tone?: "berry" | "cool" | "citrus" | "sunrise";
  onCta?: () => void;
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const toneClasses: Record<NonNullable<FlavorCardProps["tone"]>, string> = {
  berry: "bg-flavor-card-1",
  cool: "bg-flavor-card-2",
  citrus: "bg-flavor-card-3",
  sunrise: "bg-flavor-card-4",
};

function FlavorCard({
  title,
  subtitle,
  ctaLabel,
  imageKey,
  tone = "berry",
  onCta,
  footer,
  className,
  style,
}: FlavorCardProps) {
  const toneClass = toneClasses[tone] || toneClasses.berry;
  const { url: imageUrl, alt } = useSiteImage(imageKey, { alt: title });

  return (
    <article
      className={`flavor-card group relative h-full overflow-hidden rounded-[28px] p-[1px] shadow-[0_24px_64px_-34px_rgba(15,23,42,0.6)] transition-transform duration-200 hover:-translate-y-1.5 focus-within:-translate-y-1.5 ${toneClass} ${className || ""}`}
      tabIndex={-1}
      style={style}
    >
      <div className="relative flex h-full flex-col rounded-[26px] bg-white/92 px-4 pb-5 pt-14 text-slate-900 shadow-[0_22px_48px_-34px_rgba(15,23,42,0.6)] backdrop-blur">
        <div className="absolute -top-10 left-1/2 h-20 w-20 -translate-x-1/2 overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_16px_40px_-26px_rgba(15,23,42,0.65)] transition-transform duration-200 group-hover:scale-[1.05]">
          <img
            src={imageUrl}
            alt={alt}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <header className="text-center space-y-1">
            <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </header>
          <div className="mt-auto grid gap-3">
            <button type="button" className="pill-button w-full justify-center" onClick={onCta}>
              {ctaLabel}
            </button>
            {footer}
          </div>
        </div>
      </div>
    </article>
  );
}

export default FlavorCard;
