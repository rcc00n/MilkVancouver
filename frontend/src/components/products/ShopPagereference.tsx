import { useState } from 'react';
import { ShoppingCart, Filter } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type Category = 'all' | 'yogurt' | 'milk' | 'protein' | 'smoothie' | 'kids';

interface Product {
  id: number;
  name: string;
  category: Category;
  price: number;
  description: string;
  image: string;
  color: string;
}

export function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = [
    { id: 'all' as Category, name: 'All Products', color: '#6A0DAD' },
    { id: 'yogurt' as Category, name: 'Yogurt', color: '#A57CFF' },
    { id: 'milk' as Category, name: 'Milk', color: '#FFE74C' },
    { id: 'protein' as Category, name: 'Protein Drinks', color: '#FF9770' },
    { id: 'smoothie' as Category, name: 'Smoothies', color: '#9CF6F6' },
    { id: 'kids' as Category, name: 'Kids Pack', color: '#A57CFF' }
  ];

  const products: Product[] = [
    {
      id: 1,
      name: 'Berry Blast Yogurt',
      category: 'yogurt',
      price: 4.99,
      description: 'High-protein yogurt with real berry pieces',
      image: 'https://images.unsplash.com/photo-1755752916226-5ccb712e6596?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2d1cnQlMjBib3R0bGUlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NjQ1NjYyMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#A57CFF'
    },
    {
      id: 2,
      name: 'Mango Magic Yogurt',
      category: 'yogurt',
      price: 4.99,
      description: 'Tropical mango flavor with probiotics',
      image: 'https://images.unsplash.com/photo-1755752916226-5ccb712e6596?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2d1cnQlMjBib3R0bGUlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NjQ1NjYyMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#FFE74C'
    },
    {
      id: 3,
      name: 'Chocolate Dream Yogurt',
      category: 'yogurt',
      price: 4.99,
      description: 'Rich chocolate with 15g protein',
      image: 'https://images.unsplash.com/photo-1755752916226-5ccb712e6596?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2d1cnQlMjBib3R0bGUlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NjQ1NjYyMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#FF9770'
    },
    {
      id: 4,
      name: 'Vanilla Cloud Yogurt',
      category: 'yogurt',
      price: 4.99,
      description: 'Creamy vanilla with zero added sugar',
      image: 'https://images.unsplash.com/photo-1755752916226-5ccb712e6596?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2d1cnQlMjBib3R0bGUlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NjQ1NjYyMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#9CF6F6'
    },
    {
      id: 5,
      name: 'Fresh Whole Milk',
      category: 'milk',
      price: 5.49,
      description: 'Farm-fresh whole milk, rich in calcium',
      image: 'https://images.unsplash.com/photo-1569696074196-402ff5882e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWxrJTIwYm90dGxlJTIwZnJlc2h8ZW58MXx8fHwxNzY0NTY2MjI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#FFE74C'
    },
    {
      id: 6,
      name: 'Low-Fat Milk',
      category: 'milk',
      price: 4.99,
      description: 'Healthy choice with all the nutrients',
      image: 'https://images.unsplash.com/photo-1569696074196-402ff5882e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWxrJTIwYm90dGxlJTIwZnJlc2h8ZW58MXx8fHwxNzY0NTY2MjI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#9CF6F6'
    },
    {
      id: 7,
      name: 'Chocolate Milk',
      category: 'milk',
      price: 5.49,
      description: 'Kids favorite with real cocoa',
      image: 'https://images.unsplash.com/photo-1569696074196-402ff5882e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWxrJTIwYm90dGxlJTIwZnJlc2h8ZW58MXx8fHwxNzY0NTY2MjI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#FF9770'
    },
    {
      id: 8,
      name: 'Power Protein Vanilla',
      category: 'protein',
      price: 6.99,
      description: '25g protein, post-workout formula',
      image: 'https://images.unsplash.com/photo-1611211301828-be4b317d0707?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm90ZWluJTIwZHJpbmslMjBib3R0bGV8ZW58MXx8fHwxNzY0NTY2MjI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#A57CFF'
    },
    {
      id: 9,
      name: 'Power Protein Chocolate',
      category: 'protein',
      price: 6.99,
      description: '25g protein with rich chocolate taste',
      image: 'https://images.unsplash.com/photo-1611211301828-be4b317d0707?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm90ZWluJTIwZHJpbmslMjBib3R0bGV8ZW58MXx8fHwxNzY0NTY2MjI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#FF9770'
    },
    {
      id: 10,
      name: 'Power Protein Strawberry',
      category: 'protein',
      price: 6.99,
      description: 'Refreshing strawberry with 25g protein',
      image: 'https://images.unsplash.com/photo-1611211301828-be4b317d0707?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm90ZWluJTIwZHJpbmslMjBib3R0bGV8ZW58MXx8fHwxNzY0NTY2MjI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#A57CFF'
    },
    {
      id: 11,
      name: 'Green Energy Smoothie',
      category: 'smoothie',
      price: 5.99,
      description: 'Spinach, banana & mango blend',
      image: 'https://images.unsplash.com/photo-1759006249055-8c4030a2d56a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbW9vdGhpZSUyMGJvdHRsZSUyMHZpYnJhbnR8ZW58MXx8fHwxNzY0NTY2MjI4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#9CF6F6'
    },
    {
      id: 12,
      name: 'Berry Fusion Smoothie',
      category: 'smoothie',
      price: 5.99,
      description: 'Mixed berries with Greek yogurt',
      image: 'https://images.unsplash.com/photo-1759006249055-8c4030a2d56a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbW9vdGhpZSUyMGJvdHRsZSUyMHZpYnJhbnR8ZW58MXx8fHwxNzY0NTY2MjI4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#A57CFF'
    },
    {
      id: 13,
      name: 'Tropical Paradise Smoothie',
      category: 'smoothie',
      price: 5.99,
      description: 'Pineapple, coconut & passion fruit',
      image: 'https://images.unsplash.com/photo-1759006249055-8c4030a2d56a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbW9vdGhpZSUyMGJvdHRsZSUyMHZpYnJhbnR8ZW58MXx8fHwxNzY0NTY2MjI4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#FFE74C'
    },
    {
      id: 14,
      name: 'Kids Strawberry Pack',
      category: 'kids',
      price: 12.99,
      description: '6-pack fun-sized strawberry yogurt',
      image: 'https://images.unsplash.com/photo-1755752916226-5ccb712e6596?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2d1cnQlMjBib3R0bGUlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NjQ1NjYyMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#FF9770'
    },
    {
      id: 15,
      name: 'Kids Rainbow Pack',
      category: 'kids',
      price: 14.99,
      description: '8-pack mixed flavors for kids',
      image: 'https://images.unsplash.com/photo-1755752916226-5ccb712e6596?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2d1cnQlMjBib3R0bGUlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NjQ1NjYyMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#A57CFF'
    },
    {
      id: 16,
      name: 'Kids Choco Milk Pack',
      category: 'kids',
      price: 11.99,
      description: '6-pack chocolate milk for lunch',
      image: 'https://images.unsplash.com/photo-1569696074196-402ff5882e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWxrJTIwYm90dGxlJTIwZnJlc2h8ZW58MXx8fHwxNzY0NTY2MjI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: '#FFE74C'
    }
  ];

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <section className="pt-32 pb-20 bg-[#FDFDFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[#6A0DAD] mb-4">Our Products</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our delicious range of healthy dairy products for the whole family!
          </p>
        </div>

        {/* Mobile filter button */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2 px-6 py-3 bg-[#6A0DAD] text-white rounded-full hover:bg-[#A57CFF] transition-colors"
          >
            <Filter className="w-5 h-5" />
            FILTERS
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-3xl p-6 shadow-lg sticky top-24">
              <h3 className="text-[#6A0DAD] mb-6">Categories</h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setMobileFiltersOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-full transition-all ${
                      selectedCategory === category.id
                        ? 'text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.id ? category.color : undefined
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Filter Info */}
              <div className="mt-8 p-4 bg-gradient-to-br from-[#A57CFF]/10 to-[#FFE74C]/10 rounded-2xl">
                <p className="text-sm text-gray-600">
                  Showing <span className="text-[#6A0DAD]">{filteredProducts.length}</span> products
                </p>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 group"
                >
                  {/* Product Image */}
                  <div className="relative h-64 overflow-hidden" style={{ backgroundColor: `${product.color}20` }}>
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-[#6A0DAD] mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl text-[#6A0DAD]">${product.price}</span>
                      <button
                        className="flex items-center gap-2 px-6 py-3 rounded-full text-white hover:shadow-xl transition-all hover:scale-105"
                        style={{ backgroundColor: product.color }}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        ADD
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-gray-500">No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
