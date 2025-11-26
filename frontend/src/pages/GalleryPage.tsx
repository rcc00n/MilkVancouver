import { useEffect, useMemo, useState } from "react";

type GalleryTag = "Store interior" | "Products" | "Events" | "Farm";

type GalleryItem = {
  id: number;
  title: string;
  caption: string;
  imageUrl: string;
  tag: GalleryTag;
  sortOrder: number;
  imageHeight?: number;
};

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: "Front counter at golden hour",
    caption: "Neighbors sampling chocolate milk and kefir while we pack deliveries.",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    tag: "Store interior",
    sortOrder: 1,
    imageHeight: 320,
  },
  {
    id: 2,
    title: "Bottling line",
    caption: "Glass bottles getting rinsed, sanitized, and filled within 24 hours of milking.",
    imageUrl: "https://images.unsplash.com/photo-1510626176961-4b37d0ae5b2b?auto=format&fit=crop&w=1200&q=80",
    tag: "Products",
    sortOrder: 2,
  },
  {
    id: 3,
    title: "Latte art station",
    caption: "Barista milk steaming glossy for a weekend pop-up with local roasters.",
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
    tag: "Events",
    sortOrder: 3,
    imageHeight: 300,
  },
  {
    id: 4,
    title: "Yogurt & berry bar",
    caption: "Greek yogurt and kefir laid out for a community breakfast tasting.",
    imageUrl: "https://images.unsplash.com/photo-1505250469679-203ad9ced0cb?auto=format&fit=crop&w=1200&q=80",
    tag: "Events",
    sortOrder: 4,
  },
  {
    id: 5,
    title: "Cheese & butter board",
    caption: "Cultured butter, soft cheese, and cheddar ready for pickup and hosting nights.",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    tag: "Products",
    sortOrder: 5,
  },
  {
    id: 6,
    title: "Delivery crates",
    caption: "Cold-packed bottles queued for Vancouver and North Shore routes with ice liners.",
    imageUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1200&q=80",
    tag: "Store interior",
    sortOrder: 6,
  },
  {
    id: 7,
    title: "Pasture partners",
    caption: "Dairy cows on grass rotations—why the flavor stays clean and naturally sweet.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    tag: "Farm",
    sortOrder: 7,
  },
  {
    id: 8,
    title: "Morning herd check",
    caption: "Walking the herd before milking—calm animals make better milk.",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    tag: "Farm",
    sortOrder: 8,
    imageHeight: 320,
  },
  {
    id: 9,
    title: "Sunrise over the hayfield",
    caption: "Hay cut ready for winter feed—keeps the grass-fed program consistent year round.",
    imageUrl: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
    tag: "Farm",
    sortOrder: 9,
  },
  {
    id: 10,
    title: "Route planning wall",
    caption: "Delivery windows mapped for Vancouver, Burnaby, and North Shore customers.",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    tag: "Store interior",
    sortOrder: 10,
  },
];

const galleryTags: GalleryTag[] = ["Store interior", "Products", "Events", "Farm"];

function GalleryPage() {
  const [activeTag, setActiveTag] = useState<GalleryTag | "All">("All");
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const sortedItems = useMemo(
    () => [...galleryItems].sort((a, b) => a.sortOrder - b.sortOrder),
    [],
  );

  const filteredItems = useMemo(() => {
    if (activeTag === "All") return sortedItems;
    return sortedItems.filter((item) => item.tag === activeTag);
  }, [activeTag, sortedItems]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="gallery-page">
      <section className="gallery-hero">
        <div className="container gallery-hero__grid">
          <div className="gallery-hero__copy">
            <div className="eyebrow">Our Gallery</div>
            <h1>Scenes from the shop, farms, and weekend events.</h1>
            <p>
              Social-proof snapshots of the bottle room, the dairy staples that sell out first, and the pastures our
              partners care for. Tap any tile to open a lightbox and see the detail.
            </p>
            <div className="gallery-hero__chips">
              <span className="pill pill--strong">BC Dairy inspected</span>
              <span className="pill">Bottle returns & delivery ready</span>
              <span className="pill pill--accent">Farm-direct partners</span>
            </div>
            <div className="gallery-hero__legend">
              <span className="pill pill--small">{galleryItems.length} photos</span>
              <span className="muted">Sorted by shop → product → events → farm order.</span>
            </div>
          </div>

          <div className="gallery-hero__panel">
            <div className="gallery-hero__panel-head">
              <div>
                <div className="eyebrow eyebrow--green">Quick peek</div>
                <h3>Fresh pulls from the week.</h3>
              </div>
              <span className="pill">Store · Events · Farm</span>
            </div>
            <div className="gallery-hero__panel-grid">
              {sortedItems.slice(0, 3).map((item) => (
                <div key={item.id} className="gallery-hero__thumb">
                  <img src={item.imageUrl} alt={item.title} />
                  <div className="gallery-hero__thumb-label">{item.tag}</div>
                </div>
              ))}
            </div>
            <p className="muted">
              Re-using the same visuals you&apos;ll spot across our home and about sections so everything feels familiar.
            </p>
          </div>
        </div>
      </section>

      <section className="container gallery-controls">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Filter the view</div>
            <h2>Pick a tag or browse everything.</h2>
            <p className="muted">
              Swap between store interior, products, events, and farm partners. Lightbox opens on click for every image.
            </p>
          </div>
          <span className="pill pill--accent">Tap to zoom</span>
        </div>
        <div className="gallery-filters">
          {["All", ...galleryTags].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag as GalleryTag | "All")}
              className={`gallery-filter ${activeTag === tag ? "is-active" : ""}`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="gallery-legend">
          <span>{filteredItems.length} items</span>
          <span>Click any tile to open the lightbox.</span>
          <span className="pill pill--small">Sorted by story</span>
        </div>
      </section>

      <section className="container">
        <div className="gallery-masonry">
          {filteredItems.map((item) => (
            <article key={item.id} className="gallery-card">
              <button
                type="button"
                onClick={() => setLightboxItem(item)}
                className="gallery-card__media"
                aria-label={`Open ${item.title} in lightbox`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="gallery-card__image"
                  style={{ height: item.imageHeight || 260 }}
                />
              </button>
              <div className="gallery-card__body">
                <div className="gallery-card__meta">
                  <span className="pill pill--small">{item.tag}</span>
                  <span className="gallery-card__order">#{item.sortOrder.toString().padStart(2, "0")}</span>
                </div>
                <h3 className="gallery-card__title">{item.title}</h3>
                <p className="gallery-card__caption">{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {lightboxItem ? (
        <div className="gallery-lightbox" role="dialog" aria-modal="true">
          <div className="gallery-lightbox__backdrop" onClick={() => setLightboxItem(null)} />
          <div className="gallery-lightbox__dialog" aria-label={lightboxItem.title}>
            <div className="gallery-lightbox__header">
              <div className="gallery-lightbox__meta">
                <span className="pill pill--small">{lightboxItem.tag}</span>
                <span className="gallery-card__order">#{lightboxItem.sortOrder.toString().padStart(2, "0")}</span>
              </div>
              <button
                type="button"
                className="gallery-lightbox__close"
                onClick={() => setLightboxItem(null)}
                aria-label="Close lightbox"
              >
                Close ✕
              </button>
            </div>
            <img src={lightboxItem.imageUrl} alt={lightboxItem.title} className="gallery-lightbox__image" />
            <div className="gallery-lightbox__body">
              <h3>{lightboxItem.title}</h3>
              <p className="muted">{lightboxItem.caption}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default GalleryPage;
