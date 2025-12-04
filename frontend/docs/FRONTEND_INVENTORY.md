# Frontend Inventory (Day 1)

## Routes and primary surfaces
- Storefront: `/` (Home), `/shop`, `/pricing`, `/pricing/legacy`, `/about`, `/about/legacy`, `/home/legacy`, `/good-to-know`, `/menu`, `/products/:slug`, `/gallery`, `/blog`, `/blog/list`, `/blog/:slug`, `/contact`, `/contact/form`, `/cart`, `/checkout`, `/success`, `/reset-password`, `/account`.
- Ops: `/driver` (+ `/upcoming`, `/route/:routeId`) and `/admin` (dashboard, clients, routes, orders) share the store shell but use their own layouts; no marketing imagery.
- Primary marketing homepage to extend: `/` via `pages/Home.tsx` (router entry). Legacy marketing-heavy variant lives at `/home/legacy` (`HomePage.tsx`).

## Page structure at a glance
- Home (`Home.tsx`): hero with stat pills + featured image, “Discover your flavor” gradient card row, “How it works” 3-up, featured products grid (shop anchor), benefits grid, sunrise story band with imagery, testimonials, lilac 5-star band + community strip, dark CTA banner.
- Legacy Home (`HomePage.tsx`): hero with popular list, milk box trio, category cards (Fresh Milk, Yogurt & Kefir, Cheese & Butter, Coffee Bar), farm-to-glass two-column, about/testimonial band, standards grid, shop highlight cards + service cards driven by products.
- Shop: intro/meta chips, category filter pills, sort dropdown, product grid (ProductCard).
- Menu: hero with featured popular list, featured bundle cards, category tabs, search + filters, product grid.
- Product details: gallery, price/badge block, add-to-cart controls, similar products row.
- Pricing (new): gradient hero with badges, plan cards grid (PricingCard), inclusions checklist, FAQ accordion.
- Pricing legacy: copy-heavy overview, category pricing highlights, quote form.
- About (new): hero with stats + local image, story two-column with image, values grid, delivery map module, CTA band.
- About legacy: hero card, story + mission grid, founders cards, inspection highlights, standards cards, metrics grid.
- Good to Know: hero, production Q&A grid, grass-fed vs homogenized compare cards, quality highlight cards, micro-FAQ list.
- Gallery: hero with preview thumbs, filter chips, masonry grid + lightbox.
- Blog list: hero with CTA card, category filter pills, blog cards grid, pagination.
- Blog post: article page with cover image when provided, related posts row.
- Contact: header, form card, contact info list, embedded Google Map.
- Cart/Checkout/Success: minimal stacked layouts; checkout uses Stripe Elements.
- Account: tabbed personal info, orders, security flows.

## Reusable patterns spotted
- Product display components: `ProductCard`, `ProductGrid`, `ServiceCard`, `SimilarProductsRow`.
- Call-to-action chips/pills and CTA buttons (`btn`, `nav-cta`, `pill`, `Badge`, `Button`).
- Cards with header/body stacks (Blog cards, pricing cards, about/story cards).
- Checklist/eyebrow patterns for small proof points.

## Image inventory (keys → source)
- `home.hero.main`: https://images.unsplash.com/photo-1550583724-b2692b85b150 (Home hero photo).
- `legacyHome.category.freshMilk`: https://images.unsplash.com/photo-1514996937319-344454492b37.
- `legacyHome.category.yogurt`: https://images.unsplash.com/photo-1505250469679-203ad9ced0cb.
- `legacyHome.category.cheeseButter`: https://images.unsplash.com/photo-1504674900247-0877df9cc836.
- `legacyHome.category.coffeeBar`: https://images.unsplash.com/photo-1509042239860-f550ce710b93.
- `legacyHome.milkBox.barista`: https://images.unsplash.com/photo-1509042239860-f550ce710b93.
- `legacyHome.milkBox.family`: https://images.unsplash.com/photo-1510626176961-4b37d0ae5b2b.
- `legacyHome.milkBox.cheese`: https://images.unsplash.com/photo-1504674900247-0877df9cc836.
- `gallery.01.frontCounter`: https://images.unsplash.com/photo-1495474472287-4d71bcdd2085.
- `gallery.02.bottling`: https://images.unsplash.com/photo-1510626176961-4b37d0ae5b2b.
- `gallery.03.lattemilk`: https://images.unsplash.com/photo-1509042239860-f550ce710b93.
- `gallery.04.yogurtBar`: https://images.unsplash.com/photo-1505250469679-203ad9ced0cb.
- `gallery.05.cheeseBoard`: https://images.unsplash.com/photo-1504674900247-0877df9cc836.
- `gallery.06.deliveryCrates`: https://images.unsplash.com/photo-1486427944299-d1955d23e34d.
- `gallery.07.pasture`: https://images.unsplash.com/photo-1500530855697-b586d89ba3ee.
- `gallery.08.morningHerd`: https://images.unsplash.com/photo-1500534314209-a25ddb2bd429.
- `gallery.09.hayfield`: https://images.unsplash.com/photo-1501004318641-b39e6451bec6.
- `gallery.10.routeWall`: https://images.unsplash.com/photo-1517245386807-bb43f82c33c4.
- `home.flavor.berry_blast`: https://images.unsplash.com/photo-1501004318641-b39e6451bec6.
- `home.flavor.honey_vanilla`: https://images.unsplash.com/photo-1467003909585-2f8a72700288.
- `home.flavor.chocolate_swirl`: https://images.unsplash.com/photo-1504674900247-0877df9cc836.
- `home.flavor.tropical_sunrise`: https://images.unsplash.com/photo-1505250469679-203ad9ced0cb.
- `home.story.image_1`: https://images.unsplash.com/photo-1514996937319-344454492b37.
- `home.story.image_2`: https://images.unsplash.com/photo-1505250469679-203ad9ced0cb.
- `home.story.image_3`: https://images.unsplash.com/photo-1509042239860-f550ce710b93.
- `home.community_1`: https://images.unsplash.com/photo-1510626176961-4b37d0ae5b2b.
- `home.community_2`: https://images.unsplash.com/photo-1504674900247-0877df9cc836.
- `home.community_3`: https://images.unsplash.com/photo-1509042239860-f550ce710b93.
- `home.community_4`: https://images.unsplash.com/photo-1505250469679-203ad9ced0cb.
- `home.community_5`: https://images.unsplash.com/photo-1495474472287-4d71bcdd2085.
- `home.community_6`: https://images.unsplash.com/photo-1486427944299-d1955d23e34d.
- `about.hero.local`: src/assets/Whole-cow.webp (used in About hero card).
- `about.story.bottling`: src/assets/half-cow.webp (story visual).
- `assets.logo.svg/png`: available in src/assets but unused in UI.
- `assets.quarter-cow.webp`: available spare visual, unused currently.
- `image.fallback.generic`: default Unsplash in `components/figma/ImageWithFallback.tsx`.
- `product.fallback`: generated placeholder from `utils/products.ts` (`https://placehold.co/600x400?text=Yummee` when product images missing).
- `contact.map`: Google Maps iframe for address (no stored image).
- Dynamic product/blog images: pulled from API responses for cards, ProductPage gallery, and blog covers.
