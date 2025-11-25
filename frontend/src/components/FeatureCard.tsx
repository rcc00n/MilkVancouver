import { Check, Award, Heart, Leaf, Shield } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  index: number;
}

const icons = [Check, Award, Heart, Leaf, Shield];
const colors = ['bg-red-600', 'bg-white', 'bg-red-600', 'bg-white', 'bg-red-600'];
const textColors = ['text-white', 'text-black', 'text-white', 'text-black', 'text-white'];

export function FeatureCard({ title, description, index }: FeatureCardProps) {
  const Icon = icons[index % icons.length];
  const bgColor = colors[index % colors.length];
  const textColor = textColors[index % textColors.length];

  return (
    <div className={`${bgColor} ${textColor} p-6 rounded-lg border-2 ${bgColor === 'bg-white' ? 'border-red-600' : 'border-white'}`}>
      <div className={`${bgColor === 'bg-white' ? 'bg-red-600 text-white' : 'bg-white text-red-600'} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <h4 className="mb-2">{title}</h4>
      <p className={`text-sm ${bgColor === 'bg-white' ? 'text-gray-700' : 'text-white/80'}`}>{description}</p>
    </div>
  );
}
