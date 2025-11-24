import type { OrderDetails, Product } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const mockProducts: Product[] = [
  {
    id: "dry-aged-ribeye",
    name: "Dry-Aged Ribeye",
    description: "45-day dry-aged ribeye with deep marbling and buttery finish.",
    price: 5800,
    image: "https://images.unsplash.com/photo-1604908177453-74629501eeb6?auto=format&fit=crop&w=800&q=80",
    tags: ["beef", "steak", "premium"],
  },
  {
    id: "wagyu-striploin",
    name: "Wagyu Striploin",
    description: "A5 wagyu striploin with velvet texture and gentle sweetness.",
    price: 7200,
    image: "https://images.unsplash.com/photo-1559050019-27b5f8bc9085?auto=format&fit=crop&w=800&q=80",
    tags: ["wagyu", "beef"],
  },
  {
    id: "heritage-pork-chop",
    name: "Heritage Pork Chop",
    description: "Thick-cut heritage pork with clean, sweet fat and juicy bite.",
    price: 2600,
    image: "https://images.unsplash.com/photo-1612874472278-5c1f9e4b1f45?auto=format&fit=crop&w=800&q=80",
    tags: ["pork", "weekday"],
  },
];

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchHealth(): Promise<{ status: string }> {
  try {
    return await fetchJson<{ status: string }>("/health/");
  } catch (error) {
    console.warn("Health check failed", error);
    return { status: "unavailable" };
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    return await fetchJson<Product[]>("/api/products/");
  } catch (error) {
    console.warn("Product fetch failed, using mock data", error);
    return mockProducts;
  }
}

export async function fetchProduct(productId: string): Promise<Product | undefined> {
  const products = await fetchProducts();
  return products.find((product) => product.id === productId);
}

export async function createOrder(order: OrderDetails): Promise<{ id: string; total: number }> {
  try {
    return await fetchJson<{ id: string; total: number }>("/api/orders/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
  } catch (error) {
    console.warn("Order creation failed, returning mock id", error);
    return { id: `ord_${Date.now()}`, total: order.total };
  }
}
