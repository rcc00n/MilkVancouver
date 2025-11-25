import { useState } from "react";

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1604908178065-43e24d671aa5?auto=format&fit=crop&w=1200&q=80";

export function ImageWithFallback({
  fallbackSrc = DEFAULT_FALLBACK,
  src,
  alt,
  ...rest
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt ?? "MeatDirect image"}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
