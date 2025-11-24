import api from "./client";
import type { OrderPayload } from "./orders";

export interface CheckoutResponse {
  client_secret: string;
  order_id: number;
  amount: number;
}

export async function createCheckout(payload: OrderPayload): Promise<CheckoutResponse> {
  const response = await api.post<CheckoutResponse>("/checkout/", payload);
  return response.data;
}
