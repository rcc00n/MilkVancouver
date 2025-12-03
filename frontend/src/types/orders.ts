export type OrderType = "pickup" | "delivery";

export type OrderStatus =
  | "pending"
  | "paid"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
};

export type OrderDetail = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  notes: string;
  delivery_notes: string;
  pickup_location: string;
  pickup_instructions: string;
  stripe_payment_intent_id: string;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  region: string | null;
  region_name: string | null;
  items: OrderItem[];
  created_at: string;
};
