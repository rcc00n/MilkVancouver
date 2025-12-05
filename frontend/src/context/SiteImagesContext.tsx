import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { getSiteImages } from "../api/content";
import type { SiteImageMap } from "../types/content";

type SiteImagesContextValue = {
  images: SiteImageMap;
  loading: boolean;
  error: string | null;
  refresh: (options?: { force?: boolean }) => Promise<void>;
  getUrl: (key: string) => string | null;
};

const SiteImagesContext = createContext<SiteImagesContextValue | undefined>(undefined);

export function SiteImagesProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<SiteImageMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFetchedRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    if (loadingRef.current) return;
    if (hasFetchedRef.current && !force) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await getSiteImages(controller.signal);
      if (controller.signal.aborted) return;
      setImages(result || {});
      hasFetchedRef.current = true;
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("Failed to load site images", err);
      setError("Unable to load site images right now.");
    } finally {
      loadingRef.current = false;
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => controllerRef.current?.abort();
  }, [refresh]);

  const getUrl = useCallback((key: string) => images[key]?.url || null, [images]);

  const value: SiteImagesContextValue = {
    images,
    loading,
    error,
    refresh,
    getUrl,
  };

  return <SiteImagesContext.Provider value={value}>{children}</SiteImagesContext.Provider>;
}

export function useSiteImages() {
  const context = useContext(SiteImagesContext);
  if (!context) {
    throw new Error("useSiteImages must be used within a SiteImagesProvider");
  }
  return context;
}
