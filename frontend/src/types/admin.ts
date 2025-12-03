import { RouteStop } from "./delivery";

export type AdminDashboard = {
  total_sales_cents: number;
  total_sales: number;
  orders_by_status: Record<string, number>;
  top_regions: { code: string; name: string; order_count: number }[];
  top_products: {
    product_id: number;
    product_name: string;
    quantity_sold: number;
    total_revenue_cents: number;
  }[];
};

export type AdminRoute = {
  id: number;
  date: string;
  region: number;
  region_name: string;
  driver_name: string;
  is_completed: boolean;
  stops: RouteStop[];
};

export type ClientStats = {
  user_id: number;
  email: string;
  total_orders: number;
  total_spent_cents: number;
  total_spent: number;
  most_frequent_region: { code: string; name: string } | null;
};
