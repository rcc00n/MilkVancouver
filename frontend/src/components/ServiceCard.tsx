import { brand } from "../config/brand";

interface ServiceCardProps {
  title: string;
  price: string;
  description: string;
  image?: string;
  addLabel?: string;
  detailsLabel?: string;
  onAddToCart?: () => void;
  onDetails?: () => void;
}

export function ServiceCard({
  title,
  price,
  description,
  image,
  addLabel = "Add to Cart",
  detailsLabel = "Details",
  onAddToCart,
  onDetails,
}: ServiceCardProps) {
  return (
    <div className="border-2 border-slate-900 rounded-lg overflow-hidden hover:border-sky-700 transition-colors bg-white">
      <div className="bg-slate-100 h-48 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl text-gray-400">{brand.shortName}</span>
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl">{title}</h3>
          <span className="text-2xl text-slate-900">{price}</span>
        </div>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex gap-4">
          <button
            className="bg-slate-900 text-white px-6 py-3 rounded flex-1 hover:bg-sky-800 transition-colors"
            type="button"
            onClick={onAddToCart}
          >
            {addLabel}
          </button>
          <button
            className="border border-slate-900 px-6 py-3 rounded hover:bg-slate-900 hover:text-white transition-colors"
            type="button"
            onClick={onDetails}
          >
            {detailsLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
