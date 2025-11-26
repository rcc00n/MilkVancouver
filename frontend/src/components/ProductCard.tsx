import { ArrowRight, LucideIcon } from 'lucide-react';

interface ProductCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  ctaLabel?: string;
  onClick?: () => void;
}

export function ProductCard({ name, description, icon: Icon, ctaLabel, onClick }: ProductCardProps) {
  return (
    <div className="border-4 border-slate-900 p-6 rounded-lg hover:border-sky-800 transition-colors bg-white group">
      <div className="bg-slate-900 text-white w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon size={32} />
      </div>
      <h3 className="text-2xl mb-3">{name}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="text-slate-900 group-hover:text-sky-800 flex items-center gap-2 transition-colors"
      >
        {ctaLabel ?? `Browse ${name}`} <ArrowRight size={18} />
      </button>
    </div>
  );
}
