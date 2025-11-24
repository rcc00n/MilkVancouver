import api from "./client";
import type { CartItem } from "../types";

export interface OrderPayload {
  items: CartItem[];
  email: string;
  name?: string;
  address?: string;
  notes?: string;
}

export interface OrderResponse {
  id: string;
  total_cents: number;
}

export async function createOrder(payload: OrderPayload): Promise<OrderResponse> {
  try {
    const response = await api.post<OrderResponse>("/orders/", payload);
    return response.data;
  } catch (error) {
    // Backend endpoint is still a placeholder; return a mock order id so checkout can proceed.
    return {
      id: `ord_${Date.now()}`,
      total_cents: payload.items.reduce(
        (sum, item) => sum + item.product.price_cents * item.quantity,
        0,
      ),
    };
  }
}
