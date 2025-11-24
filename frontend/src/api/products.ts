import api from "./client";
import type { Product } from "../types";

export async function getProducts(): Promise<Product[]> {
  const response = await api.get<Product[]>("/products/");
  return response.data;
}

export async function getProduct(id: number): Promise<Product> {
  const response = await api.get<Product>(`/products/${id}/`);
  return response.data;
}
