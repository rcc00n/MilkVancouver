export type RouteStopStatus = "pending" | "delivered" | "no_pickup";

export type DriverStop = {
  id: number;
  sequence: number;
  status: RouteStopStatus;
  no_pickup_reason?: string | null;
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
  merged_into_id?: number | null;
  merged_at?: string | null;
  driver_preferences?: DriverPreferences | null;
  stops: DriverStop[];
};

export type DriverUpcomingRoute = {
  id: number;
  date: string;
  region: number;
  region_code: string;
  region_name: string;
  stops_count: number;
  merged_into_id?: number | null;
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
  no_pickup_reason?: string | null;
  delivered_at?: string | null;
  has_proof: boolean;
  proof_photo_url?: string;
  order: RouteStopOrder;
};

export type DriverPreferences = {
  operating_weekdays: number[];
  preferred_region_id: number | null;
  preferred_region_code: string;
  preferred_region_name: string;
  min_stops_for_dedicated_route: number;
};
