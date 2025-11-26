import { ImageWithFallback } from "./figma/ImageWithFallback";

interface CategoryCardProps {
  title: string;
  image: string;
  links: string[];
  description: string;
}

export function CategoryCard({ title, image, links, description }: CategoryCardProps) {
  return (
    <div className="flex-1 min-w-[250px]">
      <div className="bg-white rounded-lg overflow-hidden mb-4 h-48 border border-sky-100 shadow-sm">
        <ImageWithFallback 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-2xl mb-3 text-slate-900">{title}</h3>
      <div className="mb-3 flex flex-wrap gap-2">
        {links.map((link, index) => (
          <a key={index} href="#" className="text-sky-800 underline hover:no-underline transition-all">
            {link}
          </a>
        ))}
      </div>
      <p className="text-slate-700 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
