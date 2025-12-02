import logging
from typing import List
from urllib.parse import quote_plus

import requests
from django.conf import settings

from delivery.models import RouteStop

logger = logging.getLogger(__name__)


def _order_to_address(stop: RouteStop) -> str:
    order = stop.order
    parts = [
        order.address_line1,
        order.address_line2,
        order.city,
        order.postal_code,
    ]
    return ", ".join(part for part in parts if part)


def optimize_route_with_google(stops: List[RouteStop]) -> List[RouteStop]:
    if len(stops) <= 2:
        return stops

    api_key = getattr(settings, "GOOGLE_MAPS_API_KEY", "")
    if not api_key:
        logger.warning("Google Maps API key missing; skipping route optimization")
        return stops

    if len(stops) > 25:
        logger.warning(
            "Cannot optimize %s stops; Google Directions supports up to 25 points",
            len(stops),
        )
        return stops

    origin_stop = stops[0]
    waypoint_stops = stops[1:]

    origin_address = _order_to_address(origin_stop)
    waypoint_addresses = [_order_to_address(stop) for stop in waypoint_stops]

    origin = quote_plus(origin_address)
    destination = origin
    waypoints_param = "optimize:true|" + "|".join(
        quote_plus(address) for address in waypoint_addresses
    )

    querystring = (
        f"origin={origin}"
        f"&destination={destination}"
        f"&waypoints={waypoints_param}"
        f"&key={api_key}"
    )
    url = f"https://maps.googleapis.com/maps/api/directions/json?{querystring}"

    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
    except Exception:
        logger.exception("Google Directions API request failed; skipping optimization")
        return stops

    data = response.json()
    if data.get("status") != "OK":
        logger.warning(
            "Google Directions API returned status %s: %s",
            data.get("status"),
            data.get("error_message"),
        )
        return stops

    routes = data.get("routes") or []
    first_route = routes[0] if routes else {}
    waypoint_order = first_route.get("waypoint_order")

    if not isinstance(waypoint_order, list) or len(waypoint_order) != len(
        waypoint_stops
    ):
        logger.warning(
            "Unexpected waypoint order from Google Directions: %s", waypoint_order
        )
        return stops

    ordered_waypoints = [waypoint_stops[index] for index in waypoint_order]
    return [origin_stop] + ordered_waypoints
