import { useMemo } from "react";

import { useSiteImages } from "../context/SiteImagesContext";
import { getImageSrc } from "../utils/imageLibrary";

type UseSiteImageOptions = {
  fallbackUrl?: string;
  fallbackKey?: string;
  alt?: string;
};

export function useSiteImage(key: string, options?: UseSiteImageOptions) {
  const { images } = useSiteImages();
  const fallbackKey = options?.fallbackKey ?? key;
  const fallbackUrl = options?.fallbackUrl;
  const altOverride = options?.alt;

  return useMemo(() => {
    const primary = images[key];
    const secondary = fallbackKey !== key ? images[fallbackKey] : undefined;
    const chosen = primary || secondary;
    const url = chosen?.url || fallbackUrl || getImageSrc(fallbackKey);
    const alt =
      altOverride ||
      chosen?.alt ||
      fallbackKey?.replace(/[._]/g, " ").trim() ||
      "Site image";

    return {
      url,
      alt,
      description: chosen?.description,
      isFallback: !chosen?.url,
    };
  }, [altOverride, fallbackKey, fallbackUrl, images, key]);
}
