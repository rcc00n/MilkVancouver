import api from "./client";
import type { OrderDetail, OrderStatus, OrderType, Region } from "../types/orders";

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
  region_code?: string;
  address?: AddressPayload;
  notes?: string;
  pickup_location?: string;
  pickup_instructions?: string;
  items: OrderItemPayload[];
  subtotal_cents?: number;
  tax_cents?: number;
  total_cents?: number;
}

export interface OrderResponse {
  id: number;
  status: OrderStatus;
  total_cents: number;
}

export async function createOrder(payload: OrderPayload): Promise<OrderResponse> {
  const response = await api.post<OrderResponse>("/orders/", payload);
  return response.data;
}

export async function fetchOrders(): Promise<OrderDetail[]> {
  const response = await api.get<OrderDetail[]>("/orders/", { withCredentials: true });
  return response.data;
}

export async function fetchRegions(): Promise<Region[]> {
  const response = await api.get<Region[]>("/regions/");
  return response.data;
}
