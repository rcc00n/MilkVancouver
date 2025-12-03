# Admin & driver flows (Day 1)

Shared principles:
- Use existing session auth; hit `/api/auth/me/` for user context and show “No access” screen on 403s.
- Keep customer area untouched; new SPAs live under `/admin/*` and `/driver/*` with `index.html` fallback already in place.
- Area switcher: `Customer area` (always), `Driver area` (when driver profile detected), `Admin panel` (when `is_staff`).

## Admin (SPA under /admin)
1) Dashboard  
   - Surface revenue + order status counts + top regions/products.  
   - API: `GET /api/admin/dashboard/` (AdminPermission).
2) Routes list + filters  
   - Filter by date, region code, driver id; show summary chips (region/date/driver, stops count, completion).  
   - API: `GET /api/admin/routes/?date=YYYY-MM-DD&region=CODE&driver_id=ID`.
3) Route detail  
   - Ordered stops with statuses, proof thumbnails/links, driver/region header.  
   - APIs: `GET /api/admin/routes/:routeId/`, reorder stops via `POST /api/admin/routes/:routeId/reorder/` with `{ "stop_ids": [int] }`.
4) Clients  
   - Table: email, total orders, total spent, most frequent region.  
   - API: `GET /api/admin/clients/`.
5) Orders (read-only passthrough of existing data)  
   - Use existing orders endpoints under `/api/orders*` when needed later; for now placeholder route exists in SPA.

## Driver (SPA under /driver)
1) Today’s routes (landing)  
   - List of today’s assigned routes with region/date badge; tap to open stops.  
   - API: `GET /api/delivery/driver/routes/today/` (403 → not a driver).
2) Route detail  
   - Ordered stops with address/status, quick links: call client (tel:), open maps (front-end only deep link).  
   - CTA buttons: `Mark delivered (photo required)` → `POST /api/delivery/driver/stops/:stopId/mark-delivered/` (multipart with `photo`).  
   - `Mark no pickup` → `POST /api/delivery/driver/stops/:stopId/mark-no-pickup/`.
   - View proofs when present (uses `proof_photo_url` from stop serializer).
3) Upcoming routes  
   - API: `GET /api/delivery/driver/routes/upcoming/` (list with date/region/stops_count).  
   - Acts as a secondary tab/section for future days.

## Access handling
- 401 → prompt to log in; 403 → role-specific “No access” with hints to switch account.
- Admin endpoints require `is_staff`; driver endpoints require Driver profile; keep calls isolated per SPA to avoid leaking data into the public site.
