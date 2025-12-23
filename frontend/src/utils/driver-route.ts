import { DriverStop, RouteStop } from "../types/delivery";

export function toDriverStop(stop: RouteStop): DriverStop {
  const order = stop.order;
  const addressParts = [order.address_line1, order.city, order.postal_code].filter(Boolean);
  const items = Array.isArray(order.items) ? order.items : [];

  return {
    id: stop.id,
    sequence: stop.sequence,
    status: stop.status,
    no_pickup_reason: stop.no_pickup_reason,
    delivered_at: stop.delivered_at,
    has_proof: stop.has_proof,
    proof_photo_url: stop.proof_photo_url,
    order_id: order.id,
    client_name: order.full_name,
    client_phone: order.phone,
    address: addressParts.join(", "),
    address_line2: order.address_line2,
    buzz_code: order.buzz_code,
    items,
  };
}

export function sortDriverStops(stops: DriverStop[]) {
  return [...stops].sort((a, b) => {
    if (a.sequence === b.sequence) {
      return a.id - b.id;
    }
    return a.sequence - b.sequence;
  });
}
