import api from "./client";

export type OrderType = "pickup" | "delivery";

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface AddressPayload {
  line1?: string;
  line2?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
}

export interface OrderPayload {
  full_name: string;
  email: string;
  phone: string;
  order_type: OrderType;
  address?: AddressPayload;
  notes?: string;
  pickup_location?: string;
  pickup_instructions?: string;
  items: OrderItemPayload[];
}

export interface OrderResponse {
  id: number;
  status: string;
  total_cents: number;
}

export async function createOrder(payload: OrderPayload): Promise<OrderResponse> {
  const response = await api.post<OrderResponse>("/orders/", payload);
  return response.data;
}
