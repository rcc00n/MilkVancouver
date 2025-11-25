import { ImageWithFallback } from './figma/ImageWithFallback';

interface CategoryCardProps {
  title: string;
  image: string;
  links: string[];
  description: string;
}

export function CategoryCard({ title, image, links, description }: CategoryCardProps) {
  return (
    <div className="flex-1 min-w-[250px]">
      <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 h-48">
        <ImageWithFallback 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-2xl mb-3 text-white">{title}</h3>
      <div className="mb-3">
        {links.map((link, index) => (
          <span key={index}>
            <a href="#" className="text-white underline hover:no-underline transition-all">
              {link}
            </a>
            {index < links.length - 1 && <span className="text-white">, </span>}
          </span>
        ))}
      </div>
      <p className="text-white/90 text-sm leading-relaxed">{description}</p>
    </div>
  );
}