import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { getProducts } from "../api/products";
import type { Product } from "../types";

type ProductsContextValue = {
  products: Product[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  refresh: (options?: { force?: boolean }) => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
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
      const result = await getProducts(undefined, controller.signal);
      if (controller.signal.aborted) return;
      setProducts(result);
      hasFetchedRef.current = true;
    } catch (fetchError) {
      if (controller.signal.aborted) return;
      console.error("Failed to load products", fetchError);
      setError("Unable to load products right now. Please try again.");
    } finally {
      loadingRef.current = false;
      if (!controller.signal.aborted) {
        setInitialized(true);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => controllerRef.current?.abort();
  }, [refresh]);

  const value: ProductsContextValue = {
    products,
    loading,
    error,
    initialized,
    refresh,
  };

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProducts must be used within ProductsProvider");
  }
  return context;
}
