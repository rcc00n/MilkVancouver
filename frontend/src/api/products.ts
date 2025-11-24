import type { Product } from "../types";
import api from "./client";

export type ProductQuery = {
  search?: string;
  category?: string;
};

export async function getProducts(params?: ProductQuery, signal?: AbortSignal): Promise<Product[]> {
  const queryParams = {
    ...(params?.search ? { search: params.search } : {}),
    ...(params?.category ? { category: params.category } : {}),
  };

  const response = await api.get<Product[]>("/products/", {
    params: Object.keys(queryParams).length ? queryParams : undefined,
    signal,
  });
  return response.data;
}

export async function getProduct(slug: string): Promise<Product> {
  const response = await api.get<Product>(`/products/${slug}/`);
  return response.data;
}
