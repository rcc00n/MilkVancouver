export type RouteStopStatus = "pending" | "delivered" | "no_pickup";

export type DriverStop = {
  id: number;
  sequence: number;
  status: RouteStopStatus;
  delivered_at?: string | null;
  has_proof: boolean;
  proof_photo_url?: string;
  order_id: number;
  client_name: string;
  client_phone: string;
  address: string;
};

export type DriverRoute = {
  id: number;
  date: string;
  region: number;
  region_code: string;
  region_name: string;
  driver_name: string;
  is_completed: boolean;
  stops: DriverStop[];
};

export type DriverUpcomingRoute = {
  id: number;
  date: string;
  region: number;
  region_code: string;
  region_name: string;
  stops_count: number;
};

export type RouteStopOrder = {
  id: number;
  full_name: string;
  address_line1: string;
  city: string;
  postal_code: string;
  phone: string;
};

export type RouteStop = {
  id: number;
  sequence: number;
  status: RouteStopStatus;
  delivered_at?: string | null;
  has_proof: boolean;
  proof_photo_url?: string;
  order: RouteStopOrder;
};
