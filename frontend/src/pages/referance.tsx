import { ShoppingCart, Phone, Mail, MapPin, ArrowRight } from "lucide-react";

import logo from "../assets/logo.png";
import { CategoryCard } from "../components/CategoryCard";
import { FeatureCard } from "../components/FeatureCard";
import { ServiceCard } from "../components/ServiceCard";

export default function App() {
  const categories = [
    {
      title: 'Meat',
      image: 'https://images.unsplash.com/photo-1677607219966-22fbfa433667?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYXclMjBiZWVmJTIwbWVhdHxlbnwxfHx8fDE3NjQwMTA0MzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
      links: ['Bison', 'Beef', 'Lamb', 'Pork'],
      description: 'From Beef to Bison, from Pork to Poultry, Meat Direct inc offers amazing cuts and products sourced from farms around Alberta.'
    },
    {
      title: 'Poultry',
      image: 'https://images.unsplash.com/photo-1759493321741-883fbf9f433c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYXclMjBjaGlja2VuJTIwcG91bHRyeXxlbnwxfHx8fDE3NjQwNDU2NjB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      links: ['Chicken Breasts', 'Wings', 'Thighs', 'Drums'],
      description: 'We carry a full line of farm-fresh poultry, including ground chicken, turkey, chicken garlic sausage, breasts, and more.'
    },
    {
      title: 'Sossages',
      image: 'https://images.unsplash.com/photo-1662233726525-21a6de41c089?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXVzYWdlcyUyMG1lYXR8ZW58MXx8fHwxNzY0MDI5MjgyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      links: ['Papironi', 'Rings', 'Beef Smokies', 'Bison Cheese', 'Chicken Breakfast and More'],
      description: 'Every product is handcrafted using only the finest natural ingredients. From grass-fed selections to meticulously chosen components.'
    },
    {
      title: 'Smoked Fish',
      image: 'https://images.unsplash.com/photo-1546970361-407ddc8053fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbW9rZWQlMjBmaXNoJTIwc2FsbW9ufGVufDF8fHx8MTc2NDA0NTY2MHww&ixlib=rb-4.1.0&q=80&w=1080',
      links: ['Salmon and Trout', 'Mackerel', 'Cod', 'Herring'],
      description: 'Our store offers a wide variety of dried, smoked, and salted fish to suit every taste.'
    }
  ];

  const features = [
    { title: 'Genetics', description: 'Closed herd genetics that promote flavor' },
    { title: 'Chemical Free', description: 'No growth hormones, antibiotics, or GMOs' },
    { title: 'Humanely Harvested', description: 'Low-stress harvest in a clean plant' },
    { title: 'Farm Inspected', description: 'USDA Inspected and hand-inspected on farm' },
    { title: 'Slow Raised', description: 'Raised slow to develop rich cuts' }
  ];

  const quarterCowDiagram = "https://images.unsplash.com/photo-1601050690597-df3913d0c9b6?auto=format&fit=crop&w=900&q=80";
  const halfCowDiagram = "https://images.unsplash.com/photo-1604908178065-43e24d671aa5?auto=format&fit=crop&w=900&q=80";
  const wholeCowDiagram = "https://images.unsplash.com/photo-1549579201-19463c9b6e03?auto=format&fit=crop&w=900&q=80";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-white text-black border-b-2 border-red-600">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="MeatDirect Logo" className="h-12 w-auto" />
            <div>
              <h1 className="font-bold">MeatDirect</h1>
              <p className="text-xs text-gray-600">Quality local meat delivered</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 flex-wrap">
            <a href="#" className="hover:text-red-600 transition-colors uppercase text-sm relative group">
              Meats
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="hover:text-red-600 transition-colors uppercase text-sm relative group">
              Fish
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="hover:text-red-600 transition-colors uppercase text-sm relative group">
              Smoked
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="hover:text-red-600 transition-colors uppercase text-sm relative group">
              European
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="hover:text-red-600 transition-colors uppercase text-sm relative group">
              South Africa
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="hover:text-red-600 transition-colors uppercase text-sm relative group">
              Blog
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="hover:text-red-600 transition-colors uppercase text-sm relative group">
              Shop
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="hover:text-red-600 transition-colors uppercase text-sm relative group">
              Wholesale
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#" className="hover:text-red-600 transition-colors uppercase text-sm relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <button className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors flex items-center gap-1.5 text-sm">
              <ShoppingCart size={16} />
              Cart: $0.00
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-black via-red-950 to-black py-20 border-b-2 border-red-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-red-500 mb-4 uppercase tracking-wider">Great Tasting Meats • Hormone Free</p>
              <h2 className="text-5xl mb-6">We specialize in high quality, local meat.</h2>
              <p className="text-gray-300 mb-8">
                Beef, chicken, lamb, and pork – raised meat for the butcher, and delivered to your door. 
                NO HORMONES, and NO ANTIBIOTICS for a healthier lifestyle.
              </p>
              <div className="flex gap-4 flex-wrap">
                <button className="bg-red-600 text-white px-8 py-3 rounded hover:bg-red-700 transition-colors">
                  Shop Now
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded hover:bg-white hover:text-black transition-colors">
                  View Pricing
                </button>
              </div>
              <div className="flex gap-4 mt-6 flex-wrap">
                <span className="border border-gray-600 px-4 py-2 rounded">Beef</span>
                <span className="border border-gray-600 px-4 py-2 rounded">Chicken</span>
                <span className="bg-red-600 px-4 py-2 rounded">See more meats →</span>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-2xl">
              <p className="text-red-600 uppercase tracking-wider mb-4">Popular Right Now</p>
              <h3 className="text-black text-2xl mb-4">What locals are asking</h3>
              <p className="text-gray-700 mb-6">
                Make product on popular (well see it featured) in multiple ways. Closest match is provided here, 
                so present it just ready.
              </p>
              <button className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition-colors w-full">
                Read More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cow Packages Section */}
      <section className="py-20 bg-white text-black border-t-2 border-red-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Quarter Cow */}
            <div className="text-center">
              <div className="mb-6">
                <img src={quarterCowDiagram} alt="Quarter Cow" className="w-full max-w-xs mx-auto" />
              </div>
              <h3 className="text-2xl mb-3">Quarter Cow</h3>
              <p className="text-red-600 mb-6">$249.88 Deposit</p>
              <button className="bg-black text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors text-sm">
                Add to cart
              </button>
            </div>

            {/* Half Cow */}
            <div className="text-center">
              <div className="mb-6">
                <img src={halfCowDiagram} alt="Half Cow" className="w-full max-w-xs mx-auto" />
              </div>
              <h3 className="text-2xl mb-3">Half Cow</h3>
              <p className="text-red-600 mb-6">$499.75 Deposit</p>
              <button className="bg-black text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors text-sm">
                Add to cart
              </button>
            </div>

            {/* Whole Cow */}
            <div className="text-center">
              <div className="mb-6">
                <img src={wholeCowDiagram} alt="Whole Cow" className="w-full max-w-xs mx-auto" />
              </div>
              <h3 className="text-2xl mb-3">Whole Cow</h3>
              <p className="text-red-600 mb-6">$999.50 Deposit</p>
              <button className="bg-black text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors text-sm">
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8 flex-wrap">
            {categories.map((category, index) => (
              <CategoryCard key={index} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* European Products Section */}
      <section className="py-20 bg-black border-t-2 border-red-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-red-500 uppercase tracking-wider mb-4">From Europe to Your Table</p>
              <h2 className="text-4xl mb-6">Eastern European delicacies without hopping a flight.</h2>
              <p className="text-gray-300 mb-8">
                We collaborate with Central European butchers, curate a seasonal menu, and deliver traditional fresh 
                meats to customers near local farms and beyond for authentic comfort food.
              </p>
              <div className="flex gap-4">
                <button className="bg-red-600 text-white px-8 py-3 rounded hover:bg-red-700 transition-colors">
                  View European Products
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded hover:bg-white hover:text-black transition-colors">
                  Shop All
                </button>
              </div>
            </div>
            <div className="bg-red-600 p-8 rounded-lg">
              <p className="text-white uppercase tracking-wider mb-4">Your Order = Less Travel</p>
              <h3 className="text-3xl mb-4">Go-boxes: Breakfast-lunch- Curated boxes</h3>
              <p className="text-white/90 mb-6">
                Great place to explore new cut. With all cuts and hand-curated take-out, beef, pork and chicken 
                to bundle in with any order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white text-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-red-600 uppercase tracking-wider mb-4">About MeatDirect</p>
              <h2 className="text-4xl mb-6">Our roots are in Eastern Europe, our farms are around the corner.</h2>
              <p className="text-gray-700 mb-6">
                We give an alternative to CAFO (factory farms) meats. We hand select that are sustainable. 
                The finished beef and pork are from local regenerative farms, and our poultry from our free range 
                environment.
              </p>
              <p className="text-gray-700 mb-8">
                Every cut is expertly trimmed, aged/wrapped to preserve cuts from moisture or excess fat 
                and packaged in traditional European method without spices on/near - not needed when you get the 
                pasture raised.
              </p>
              <button className="text-red-600 border-2 border-red-600 px-8 py-3 rounded hover:bg-red-600 hover:text-white transition-colors">
                Read our story →
              </button>
            </div>
            <div className="bg-gray-900 text-white p-8 rounded-lg">
              <p className="text-red-500 uppercase tracking-wider mb-4">Customer Story</p>
              <p className="text-xl mb-6">
                "Time and price point-to-order and next day fast than brick store. The price, quality will set it to 
                THE try-their-thing. I haven't had more varied delivery."
              </p>
              <p className="text-gray-400">- Tracy L., happy meat box subscriber</p>
            </div>
          </div>
        </div>
      </section>

      {/* Standards Section */}
      <section className="py-20 bg-black border-t-2 border-red-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <p className="text-red-500 uppercase tracking-wider mb-2">Why Choose Us</p>
              <h2 className="text-4xl">Standards that stay on the label.</h2>
            </div>
            <p className="text-gray-400">Farm-direct sourcing, small-batch cutting, and transparent partners.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section className="py-20 bg-white text-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <p className="text-red-600 uppercase tracking-wider mb-2">Shop • Menu</p>
              <h2 className="text-4xl">Explore the full case.</h2>
              <p className="text-gray-600 mt-2">
                Find the cut you've been craving. Or pick an origin country then view product available 7-10 cuts.
              </p>
            </div>
            <a href="#" className="text-red-600 hover:underline flex items-center gap-2">
              Visit Shop <ArrowRight size={18} />
            </a>
          </div>
          
          <div className="flex gap-4 mb-8 flex-wrap">
            <button className="bg-red-600 text-white px-6 py-2 rounded">All categories</button>
            <button className="border-2 border-black px-6 py-2 rounded hover:bg-black hover:text-white transition-colors">Beef</button>
            <button className="border-2 border-black px-6 py-2 rounded hover:bg-black hover:text-white transition-colors">Pork/Ham</button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <ServiceCard 
              title="Steakage"
              price="$19.00"
              description="Very tasty."
            />
            <ServiceCard 
              title="Prosciutto"
              price="$35.00"
              description="Italian prosciutto"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t-2 border-red-600 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="font-bold text-xl">MeatDirect</span>
              </div>
              <p className="text-gray-400 text-sm">Quality local meat delivered to your door.</p>
            </div>
            <div>
              <h4 className="text-red-500 mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p className="flex items-center gap-2">
                  <Phone size={16} /> (555) 123-4567
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={16} /> hello@meatdirect.com
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={16} /> Contact page
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-red-500 mb-4">Hours</h4>
              <p className="text-sm text-gray-400">Open 24/7 online</p>
              <p className="text-sm text-gray-400">Shop anytime</p>
            </div>
            <div>
              <h4 className="text-red-500 mb-4">Follow</h4>
              <p className="text-sm text-gray-400">Stay connected with us</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
