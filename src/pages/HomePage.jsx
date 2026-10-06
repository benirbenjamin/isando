import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Sparkles, MessageCircle, HeartHandshake,
  Briefcase, ArrowRight, Utensils, Shirt, Flame, Camera, Car
} from 'lucide-react';
import { api, getWhatsAppLink, getImageUrl, getImageBackupUrl } from '../services/api';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';

function getCategoryEmoji(name = '') {
  const n = (name || '').toLowerCase();
  if (n.includes('juice') || n.includes('beverage')) return '🧃';
  if (n.includes('drink')) return '🥤';
  if (n.includes('food') || n.includes('rice')) return '🍚';
  if (n.includes('shoe')) return '👟';
  if (n.includes('dress') || n.includes('women')) return '👗';
  if (n.includes('shirt') || n.includes('men')) return '👕';
  if (n.includes('access')) return '🕶️';
  if (n.includes('photo')) return '📸';
  if (n.includes('video')) return '🎥';
  if (n.includes('decor')) return '💐';
  if (n.includes('cater')) return '🍽️';
  if (n.includes('car') || n.includes('mc')) return '🚗';
  if (n.includes('business')) return '📈';
  if (n.includes('event')) return '🎯';
  return '✨';
}

// Permanent high-impact default featured slides for Romantic T Solutions Ltd
const DEFAULT_FEATURED_SLIDES = [
  {
    id: 'feat-slide-1',
    _type: 'service',
    targetUrl: '/services',
    name: 'Cinematic 4K Photography & Videography',
    badge: 'Signature Media Production',
    divisionName: 'Photography & Videography',
    description: 'Breathtaking 4K multi-camera wedding films, aerial drone coverage, portraiture & premium heirloom photo albums.',
    image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Explore Media Packages',
  },
  {
    id: 'feat-slide-2',
    _type: 'service',
    targetUrl: '/services',
    name: 'Luxury Chauffeured Bridal Convoy & Car Rentals',
    badge: 'Executive Transport',
    divisionName: 'Wedding Car Rentals',
    description: 'Prestige Mercedes-Benz, V8 Land Cruisers and VIP Range Rovers with professional uniformed chauffeurs for your memorable day.',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Book Bridal Fleet',
  },
  {
    id: 'feat-slide-3',
    _type: 'product',
    targetUrl: '/products?division=Food%20%26%20Beverages',
    name: 'Wholesale & Retail Food and Beverages',
    badge: 'Fresh & Fast Supply',
    divisionName: 'Food & Beverages',
    description: 'Fresh 100% natural Inyange fruit juices, sparkling soft drinks, catering provisions and premium Tanzanian super rice.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Order Food & Drinks',
  },
  {
    id: 'feat-slide-4',
    _type: 'product',
    targetUrl: '/products?division=Clothes%20%26%20Shoes',
    name: 'Designer Clothes, Shoes & Traditional Attire',
    badge: 'Elegance & Fashion',
    divisionName: 'Clothes & Shoes',
    description: 'Authentic royal Rwandan Mushanana, bespoke tailored tuxedos, wedding dresses and handcrafted Italian leather footwear.',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Shop Fashion Collection',
  },
  {
    id: 'feat-slide-5',
    _type: 'service',
    targetUrl: '/services?division=Consultancy%20Services',
    name: 'Strategic Event Planning & Business Advisory',
    badge: 'Expert Consultancy',
    divisionName: 'Consultancy Services',
    description: 'Executive corporate protocol advisory, end-to-end event production, budget optimization and SME business development.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Consult Our Experts',
  }
];

const DEFAULT_FOOD_PRODUCTS = [
  {
    id: 'demo-food-1',
    name: 'Inyange Fresh Juice Pack (12x 500ml Assorted)',
    description: '100% Natural Rwandan fruit juice - Apple, Mango, Passion and Orange flavors.',
    regularPrice: 18000,
    salePrice: 15000,
    stockQuantity: 45,
    images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=70'],
    category: { name: 'Natural Juices' },
    businessDivision: { name: 'Food & Beverages' },
  },
  {
    id: 'demo-food-2',
    name: 'Premium Tanzanian Super Rice (25kg Bag)',
    description: 'Grade-A aromatic long grain rice, wholesale delivery across Kigali and Rwanda.',
    regularPrice: 42000,
    salePrice: 38500,
    stockQuantity: 20,
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=70'],
    category: { name: 'Rice & Grains' },
    businessDivision: { name: 'Food & Beverages' },
  },
  {
    id: 'demo-food-3',
    name: 'Crate Soft Drinks & Sparkling Water (24 Bottles)',
    description: 'Assorted Coca-Cola, Fanta, Sprite and mineral water for weddings & celebrations.',
    regularPrice: 16000,
    salePrice: 14000,
    stockQuantity: 80,
    images: ['https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=70'],
    category: { name: 'Beverages' },
    businessDivision: { name: 'Food & Beverages' },
  },
  {
    id: 'demo-food-4',
    name: 'Gourmet Event Catering Grocery Supply Pack',
    description: 'Bulk cooking oils, seasonings, pasta and fresh spices for celebrations.',
    regularPrice: 65000,
    salePrice: 58000,
    stockQuantity: 15,
    images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=70'],
    category: { name: 'Catering Supplies' },
    businessDivision: { name: 'Food & Beverages' },
  }
];

const DEFAULT_CLOTHES_PRODUCTS = [
  {
    id: 'demo-cloth-1',
    name: 'Royal Rwandan Silk Mushanana Attire',
    description: 'Traditional Rwandan bridal & ceremonial attire with delicate golden lace embroidery.',
    regularPrice: 140000,
    salePrice: 120000,
    stockQuantity: 12,
    images: ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=70'],
    category: { name: 'Traditional Wear' },
    businessDivision: { name: 'Clothes & Shoes' },
  },
  {
    id: 'demo-cloth-2',
    name: 'Italian Handcrafted Men Leather Oxford Shoes',
    description: 'Premium genuine leather dress shoes for grooms, business executives & galas.',
    regularPrice: 75000,
    salePrice: 65000,
    stockQuantity: 18,
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=70'],
    category: { name: 'Men Shoes' },
    businessDivision: { name: 'Clothes & Shoes' },
  },
  {
    id: 'demo-cloth-3',
    name: 'Tailored 3-Piece Executive Wedding Tuxedo',
    description: 'Modern slim-fit navy blue suit with satin lapels and tailored vest.',
    regularPrice: 180000,
    salePrice: 150000,
    stockQuantity: 8,
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=70'],
    category: { name: 'Suits & Blazers' },
    businessDivision: { name: 'Clothes & Shoes' },
  },
  {
    id: 'demo-cloth-4',
    name: 'Crystal Bridal Stiletto Heels & Evening Shoes',
    description: 'Sparkling wedding heels with cushioned soles for all-day ceremony comfort.',
    regularPrice: 55000,
    salePrice: 48000,
    stockQuantity: 14,
    images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=70'],
    category: { name: 'Women Shoes' },
    businessDivision: { name: 'Clothes & Shoes' },
  }
];

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredItems, setFeaturedItems] = useState(DEFAULT_FEATURED_SLIDES);
  const [photoVideoServices, setPhotoVideoServices] = useState([]);
  const [weddingServices, setWeddingServices] = useState([]);
  const [carRentalServices, setCarRentalServices] = useState([]);
  const [consultancyServices, setConsultancyServices] = useState([]);
  const [foodProducts, setFoodProducts] = useState(DEFAULT_FOOD_PRODUCTS);
  const [clothesProducts, setClothesProducts] = useState(DEFAULT_CLOTHES_PRODUCTS);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [divRes, prodRes, srvRes] = await Promise.all([
          api.get('/divisions').catch(() => ({ divisions: [] })),
          api.get('/products?limit=100').catch(() => ({ products: [] })),
          api.get('/services?limit=100').catch(() => ({ services: [] }))
        ]);

        const prods = prodRes.products || [];
        const srvs = srvRes.services || [];
        const divs = divRes.divisions || [];

        // Extract all dynamic categories across divisions
        const dynamicCats = [];
        divs.forEach(div => {
          if (Array.isArray(div.categories) && div.categories.length > 0) {
            div.categories.forEach(cat => {
              dynamicCats.push({
                ...cat,
                divisionName: div.name,
                divisionSlug: div.slug,
              });
            });
          }
        });
        setCategories(dynamicCats);

        // Featured Spotlight items
        const featP = prods.filter(p => p.isFeatured).map(p => ({
          id: p.id,
          _type: 'product',
          targetUrl: `/products/${p.id}`,
          name: p.name,
          badge: 'Featured Product',
          divisionName: p.businessDivision?.name || 'Product',
          description: p.description,
          image: getImageUrl(p.featuredImage || (Array.isArray(p.images) ? p.images[0] : null)),
          ctaText: 'View Product Details',
        }));

        const featS = srvs.filter(s => s.isFeatured).map(s => ({
          id: s.id,
          _type: 'service',
          targetUrl: `/services/${s.id}`,
          name: s.name,
          badge: 'Featured Service',
          divisionName: s.businessDivision?.name || 'Service',
          description: s.description,
          image: getImageUrl(s.featuredImage || (Array.isArray(s.images) ? s.images[0] : null)),
          ctaText: 'Explore Service',
        }));

        const dynamicFeatured = [...featP, ...featS];
        if (dynamicFeatured.length > 0) {
          setFeaturedItems([...dynamicFeatured, ...DEFAULT_FEATURED_SLIDES.slice(0, 2)]);
        } else {
          setFeaturedItems(DEFAULT_FEATURED_SLIDES);
        }

        // 1. Photography & Videography (first)
        const photoVideo = srvs.filter(s => {
          const c = (s.category?.name || '').toLowerCase();
          const n = (s.name || '').toLowerCase();
          return c.includes('photo') || c.includes('video') || n.includes('photo') || n.includes('video');
        });
        if (photoVideo.length > 0) {
          setPhotoVideoServices(photoVideo);
        } else {
          setPhotoVideoServices([
            {
              id: 'demo-pv-1',
              name: 'Cinematic Wedding & Event Videography',
              description: '4K Multi-camera coverage, drone aerial shots, highlights teaser & full master film.',
              startingPrice: 350000,
              location: 'Kigali & Across Rwanda',
              businessDivision: { name: 'Wedding Services' },
              category: { name: 'Videography' },
              images: ['https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=70'],
            },
            {
              id: 'demo-pv-2',
              name: 'VIP Portrait & Event Photography',
              description: 'Professional photographers, edited digital gallery, printed photobook albums.',
              startingPrice: 200000,
              location: 'Kigali & Nationwide',
              businessDivision: { name: 'Wedding Services' },
              category: { name: 'Photography' },
              images: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70'],
            }
          ]);
        }

        // 3. Wedding Car Rentals
        const carRentals = srvs.filter(s => {
          const c = (s.category?.name || '').toLowerCase();
          const n = (s.name || '').toLowerCase();
          return c.includes('car') || n.includes('car') || c.includes('rental') || n.includes('limo');
        });
        if (carRentals.length > 0) {
          setCarRentalServices(carRentals);
        } else {
          setCarRentalServices([
            {
              id: 'demo-car-1',
              name: 'Luxury Bridal Convoy & Mercedes Benz V-Class',
              description: 'Chauffeured luxury bridal cars, decorated ribbons, executive fuel included.',
              startingPrice: 150000,
              location: 'Kigali & Provinces',
              businessDivision: { name: 'Wedding Services' },
              category: { name: 'Cars & MC' },
              images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=70'],
            },
            {
              id: 'demo-car-2',
              name: 'Range Rover & V8 VIP Bridal Limousine',
              description: 'Prestigious wedding transport for bride & groom with professional uniformed chauffeur.',
              startingPrice: 250000,
              location: 'Kigali & Countrywide',
              businessDivision: { name: 'Wedding Services' },
              category: { name: 'Cars & MC' },
              images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=70'],
            }
          ]);
        }

        // 2. Wedding Services (Decor, Catering, Protocol, DJ/MC)
        const weddingGeneral = srvs.filter(s => {
          const isPhoto = photoVideo.some(p => p.id === s.id);
          const isCar = carRentals.some(c => c.id === s.id);
          const isWeddingDiv = s.businessDivision?.slug === 'wedding-services' || (s.businessDivision?.name || '').includes('Wedding');
          return isWeddingDiv && !isPhoto && !isCar;
        });
        if (weddingGeneral.length > 0) {
          setWeddingServices(weddingGeneral);
        } else {
          setWeddingServices([
            {
              id: 'demo-decor',
              name: 'Grand Wedding Decoration & Floral Styling',
              description: 'Banquet hall decor, bride & groom stage styling, floral arches & mood lighting ambience.',
              startingPrice: 500000,
              location: 'Kigali & Across Rwanda',
              businessDivision: { name: 'Wedding Services' },
              category: { name: 'Decoration' },
              images: ['https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=70'],
            },
            {
              id: 'demo-catering',
              name: 'Gourmet Wedding Catering & Buffet',
              description: 'Exquisite multi-course buffet experience, welcome drinks, waitstaff & cocktail tables.',
              startingPrice: 350000,
              location: 'Kigali Nationwide',
              businessDivision: { name: 'Wedding Services' },
              category: { name: 'Catering' },
              images: ['https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=70'],
            }
          ]);
        }

        // 4. Consultancy Services
        const consultancy = srvs.filter(s =>
          s.businessDivision?.slug === 'consultancy-services' ||
          (s.businessDivision?.name || '').toLowerCase().includes('consult')
        );
        if (consultancy.length > 0) {
          setConsultancyServices(consultancy);
        } else {
          setConsultancyServices([
            {
              id: 'demo-cons-1',
              name: 'Corporate Event Strategy & Protocol Advisory',
              description: 'End-to-end event planning, stakeholder protocol, vendor management & scheduling.',
              startingPrice: 200000,
              location: 'Kigali & Regional',
              businessDivision: { name: 'Consultancy Services' },
              category: { name: 'Event Consultancy' },
              images: ['https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=70'],
            },
            {
              id: 'demo-cons-2',
              name: 'SME Business & Financial Growth Strategy',
              description: 'Strategic market positioning, financial controls, procurement analysis & operational planning.',
              startingPrice: 300000,
              location: 'Kigali & Online',
              businessDivision: { name: 'Consultancy Services' },
              category: { name: 'Business Strategy' },
              images: ['https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=70'],
            }
          ]);
        }

        // 5. Food & Beverages
        const food = prods.filter(p => {
          const divStr = (p.businessDivision?.name || p.businessDivision?.slug || '').toLowerCase();
          const catStr = (p.category?.name || '').toLowerCase();
          const nameStr = (p.name || '').toLowerCase();
          return divStr.includes('food') || divStr.includes('beverage') ||
            catStr.includes('food') || catStr.includes('beverage') || catStr.includes('juice') || catStr.includes('drink') || catStr.includes('rice') ||
            nameStr.includes('juice') || nameStr.includes('rice') || nameStr.includes('drink');
        });
        if (food.length > 0) {
          setFoodProducts(food);
        } else {
          setFoodProducts(DEFAULT_FOOD_PRODUCTS);
        }

        // 6. Clothes & Shoes (Comes Last)
        const clothes = prods.filter(p => {
          const divStr = (p.businessDivision?.name || p.businessDivision?.slug || '').toLowerCase();
          const catStr = (p.category?.name || '').toLowerCase();
          const nameStr = (p.name || '').toLowerCase();
          return divStr.includes('clothe') || divStr.includes('shoe') || divStr.includes('fashion') ||
            catStr.includes('clothe') || catStr.includes('shoe') || catStr.includes('dress') || catStr.includes('shirt') || catStr.includes('suit') ||
            nameStr.includes('shoe') || nameStr.includes('dress') || nameStr.includes('suit') || nameStr.includes('heel') || nameStr.includes('mushanana');
        });
        if (clothes.length > 0) {
          setClothesProducts(clothes);
        } else {
          setClothesProducts(DEFAULT_CLOTHES_PRODUCTS);
        }

        // Special Offers
        const offers = prods.filter(p => p.discountPercentage > 0 || (p.salePrice && p.salePrice < p.regularPrice));
        setSpecialOffers(offers);

      } catch (err) {
        console.warn('Notice loading homepage data:', err.message);
      }
    }

    loadData();
  }, []);

  // Smooth Auto-sliding for Featured Banner every 5 seconds
  useEffect(() => {
    if (!featuredItems || featuredItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredItems]);

  const prevFeaturedSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? featuredItems.length - 1 : prev - 1));
  };

  const nextFeaturedSlide = () => {
    setCurrentSlide(prev => (prev + 1) % featuredItems.length);
  };

  const scrollContainer = (id, direction) => {
    const container = document.getElementById(id);
    if (container) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* =========================================================================
          DYNAMIC CATEGORIES HORIZONTAL SCROLLER
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-dark relative inline-block pb-2">
              Explore Categories
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-brand-yellow rounded-full" />
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
              Shop dynamic catalog of products and book professional services
            </p>
          </div>
          {categories.length > 4 && (
            <div className="flex gap-1.5">
              <button
                onClick={() => scrollContainer('categories-scroller', 'left')}
                className="p-2 border border-brand-border rounded-full bg-white hover:bg-brand-yellow text-brand-dark shadow-sm transition"
                aria-label="Previous categories"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollContainer('categories-scroller', 'right')}
                className="p-2 border border-brand-border rounded-full bg-white hover:bg-brand-yellow text-brand-dark shadow-sm transition"
                aria-label="Next categories"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div
          id="categories-scroller"
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x"
        >
          {categories.length > 0 ? (
            categories.map((cat) => {
              const isService = cat.type === 'SERVICE';
              const targetUrl = isService
                ? `/services?category=${encodeURIComponent(cat.slug || cat.name)}`
                : `/products?category=${encodeURIComponent(cat.slug || cat.name)}`;

              return (
                <Link
                  key={cat.id || cat.slug}
                  to={targetUrl}
                  className="group flex-shrink-0 w-36 sm:w-44 bg-white border border-brand-border hover:border-brand-yellow rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 text-center flex flex-col items-center justify-between snap-start hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-soft group-hover:bg-amber-100 flex items-center justify-center text-2xl transition duration-300 mb-2.5 shadow-inner">
                    {getCategoryEmoji(cat.name)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-brand-dark group-hover:text-brand-red transition line-clamp-1">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                      {cat.divisionName}
                    </span>
                  </div>
                  <span className="mt-2 text-[10px] font-black text-brand-dark bg-brand-soft group-hover:bg-brand-yellow px-2 py-0.5 rounded-full transition">
                    {isService ? 'Service' : 'Product'} &rarr;
                  </span>
                </Link>
              );
            })
          ) : (
            [
              { name: 'Photography', type: 'SERVICE', div: 'Wedding Services' },
              { name: 'Videography', type: 'SERVICE', div: 'Wedding Services' },
              { name: 'Wedding Services', type: 'SERVICE', div: 'Wedding Services' },
              { name: 'Car Rentals', type: 'SERVICE', div: 'Wedding Services' },
              { name: 'Consultancy', type: 'SERVICE', div: 'Consultancy Services' },
              { name: 'Food & Beverages', type: 'PRODUCT', div: 'Food & Beverages' },
              { name: 'Clothes & Shoes', type: 'PRODUCT', div: 'Clothes & Shoes' },
            ].map((cat, i) => (
              <Link
                key={i}
                to={cat.type === 'SERVICE' ? `/services?category=${encodeURIComponent(cat.name)}` : `/products?category=${encodeURIComponent(cat.name)}`}
                className="group flex-shrink-0 w-36 sm:w-44 bg-white border border-brand-border hover:border-brand-yellow rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 text-center flex flex-col items-center justify-between snap-start"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center text-2xl mb-2.5">
                  {getCategoryEmoji(cat.name)}
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-brand-dark group-hover:text-brand-red transition line-clamp-1">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                    {cat.div}
                  </span>
                </div>
                <span className="mt-2 text-[10px] font-black text-brand-dark bg-brand-soft px-2 py-0.5 rounded-full">
                  Browse &rarr;
                </span>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* =========================================================================
          BEAUTIFUL LONG SLIDING FEATURED SPOTLIGHT BANNER (ALWAYS VISIBLE & AUTO-SLIDING)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-yellow fill-brand-yellow" />
            <span>Featured Spotlight</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prevFeaturedSlide}
              aria-label="Previous slide"
              className="p-2 rounded-full border border-gray-200 bg-white hover:bg-brand-yellow text-brand-dark shadow-sm transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextFeaturedSlide}
              aria-label="Next slide"
              className="p-2 rounded-full border border-gray-200 bg-white hover:bg-brand-yellow text-brand-dark shadow-sm transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Long Hero Slider Canvas */}
        <div className="relative rounded-3xl overflow-hidden bg-brand-dark h-80 sm:h-96 md:h-[430px] lg:h-[460px] shadow-2xl group select-none">
          {featuredItems.map((item, idx) => {
            const slideImg = item.image || getImageUrl(item.featuredImage || (Array.isArray(item.images) ? item.images[0] : item.images), 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80');
            const isActive = idx === currentSlide;

            return (
              <div
                key={item.id || idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
              >
                {/* Background Image with Dark Vignette */}
                <img
                  src={slideImg}
                  alt={item.name}
                  className="w-full h-full object-cover transform scale-105 transition-transform duration-10000"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Slide Text Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-14 max-w-2xl text-white space-y-3 z-10">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-yellow text-brand-dark text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow">
                      {item.badge || item.divisionName || 'SPOTLIGHT'}
                    </span>
                    <span className="text-white/80 text-xs font-semibold hidden sm:inline">
                      Romantic T Solutions Ltd
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight drop-shadow-md text-white">
                    {item.name}
                  </h3>

                  <p className="text-xs sm:text-sm md:text-base text-gray-200 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow">
                    {item.description}
                  </p>

                  <div className="pt-2">
                    <Link
                      to={item.targetUrl || (item._type === 'service' ? `/services/${item.id}` : `/products/${item.id}`)}
                      className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-redDark text-white px-6 py-3 rounded-full font-bold text-xs sm:text-sm shadow-xl shine-effect transition transform hover:scale-105"
                    >
                      <span>{item.ctaText || 'Discover Now'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Slider Dots */}
          <div className="absolute bottom-5 right-6 sm:right-10 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            {featuredItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-7 bg-brand-yellow' : 'w-2 bg-white/60 hover:bg-white'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ORDER 1: PHOTOGRAPHY & VIDEOGRAPHY (COMES FIRST AS REQUESTED)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-100/40 border border-brand-yellow/40 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="bg-brand-red text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                #1 SIGNATURE SERVICE
              </span>
              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                <Camera className="w-6 h-6 text-brand-red" />
                <span>📸 Photography & Videography</span>
              </h2>
              <p className="text-xs text-brand-muted">
                High-end wedding cinematography, portrait photography, 4K multi-cam coverage & drone videography
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/services?division=Wedding%20Services" className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                View All Media Services &rarr;
              </Link>
              <div className="flex gap-1">
                <button onClick={() => scrollContainer('photovideo-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollContainer('photovideo-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div id="photovideo-scroller" className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
            {photoVideoServices.map((s) => (
              <div key={s.id} className="min-w-[260px] sm:min-w-[320px] max-w-[320px] flex-shrink-0 snap-start">
                <ServiceCard service={s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ORDER 2: WEDDING SERVICES (THEN WEDDING SERVICES)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="border border-brand-border rounded-3xl p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="bg-brand-yellow text-brand-dark text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                #2 FULL EVENT COVERAGE
              </span>
              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                <HeartHandshake className="w-6 h-6 text-brand-red" />
                <span>💍 Wedding Services</span>
              </h2>
              <p className="text-xs text-brand-muted">
                Exquisite venue decoration, catering & buffet, sound & lighting, MCs, cakes & protocol
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/services?division=Wedding%20Services" className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                View Wedding Services &rarr;
              </Link>
              <div className="flex gap-1">
                <button onClick={() => scrollContainer('wedding-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollContainer('wedding-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div id="wedding-scroller" className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
            {weddingServices.map((s) => (
              <div key={s.id} className="min-w-[260px] sm:min-w-[300px] max-w-[300px] flex-shrink-0 snap-start">
                <ServiceCard service={s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ORDER 3: WEDDING CAR RENTALS (THEN WEDDING CAR RENTALS)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-slate-50 border border-brand-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                #3 LUXURY FLEET
              </span>
              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                <Car className="w-6 h-6 text-brand-red" />
                <span>🚗 Wedding Car Rentals</span>
              </h2>
              <p className="text-xs text-brand-muted">
                Chauffeured Mercedes-Benz, V8 Land Cruisers, VIP Range Rovers, and bridal convoy coaches
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/services?category=Cars%20%26%20MC" className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                View Fleet &rarr;
              </Link>
              <div className="flex gap-1">
                <button onClick={() => scrollContainer('cars-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollContainer('cars-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div id="cars-scroller" className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
            {carRentalServices.map((s) => (
              <div key={s.id} className="min-w-[260px] sm:min-w-[320px] max-w-[320px] flex-shrink-0 snap-start">
                <ServiceCard service={s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ORDER 4: CONSULTANCY SERVICES (THEN CONSULTANCY)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="border border-brand-border rounded-3xl p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="bg-brand-dark text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                #4 PROFESSIONAL ADVISORY
              </span>
              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-brand-yellow" />
                <span>💼 Consultancy Services</span>
              </h2>
              <p className="text-xs text-brand-muted">
                Expert business strategy, corporate event planning, financial planning & executive workshops
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/services?division=Consultancy%20Services" className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                View All Consultancy &rarr;
              </Link>
              <div className="flex gap-1">
                <button onClick={() => scrollContainer('consultancy-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollContainer('consultancy-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div id="consultancy-scroller" className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
            {consultancyServices.map((s) => (
              <div key={s.id} className="min-w-[260px] sm:min-w-[300px] max-w-[300px] flex-shrink-0 snap-start">
                <ServiceCard service={s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ORDER 5: FOOD & BEVERAGES (ALWAYS DISPLAYED & DYNAMICALLY LOADED)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="border border-brand-border rounded-3xl p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                #5 WHOLESALE & RETAIL
              </span>
              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                <Utensils className="w-6 h-6 text-brand-yellow" />
                <span>🍔 Food & Beverages</span>
              </h2>
              <p className="text-xs text-brand-muted">Fresh natural juices, crate soft drinks, wholesale rice & catering food supplies</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/products?division=Food%20%26%20Beverages" className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                View All Food &rarr;
              </Link>
              <div className="flex gap-1">
                <button onClick={() => scrollContainer('food-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollContainer('food-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div id="food-scroller" className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
            {foodProducts.map((p) => (
              <div key={p.id} className="min-w-[240px] sm:min-w-[280px] max-w-[280px] flex-shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers (% On Sale) */}
      {specialOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                <Flame className="w-6 h-6 text-brand-red fill-brand-red" />
                <span>Special Offers & Deals (% Discount)</span>
              </h2>
              <p className="text-xs text-brand-muted">Save more with special limited discounts across products</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/products?onSale=true" className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                View All Offers &rarr;
              </Link>
              <div className="flex gap-1">
                <button onClick={() => scrollContainer('offers-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollContainer('offers-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div id="offers-scroller" className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
            {specialOffers.map((p) => (
              <div key={p.id} className="min-w-[240px] sm:min-w-[280px] max-w-[280px] flex-shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          ORDER 6: CLOTHES & SHOES (COMES LAST ON HOME PAGE AS REQUESTED)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="border border-brand-border rounded-3xl p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                #6 FASHION & FOOTWEAR (LAST SECTION)
              </span>
              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                <Shirt className="w-6 h-6 text-brand-yellow" />
                <span>👗 Clothes & Shoes</span>
              </h2>
              <p className="text-xs text-brand-muted">Men & women shoes, dresses, suits, traditional Rwandan attire & sneakers</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/products?division=Clothes%20%26%20Shoes" className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                View All Fashion &rarr;
              </Link>
              <div className="flex gap-1">
                <button onClick={() => scrollContainer('clothes-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollContainer('clothes-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div id="clothes-scroller" className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
            {clothesProducts.map((p) => (
              <div key={p.id} className="min-w-[240px] sm:min-w-[280px] max-w-[280px] flex-shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          WHATSAPP QUICK ORDER BANNER
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <span className="bg-white/20 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
              FASTEST RESPONSE
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">Ready to Order or Book a Service?</h3>
            <p className="text-sm opacity-90 mt-1 max-w-xl">
              Connect directly with Romantic T Solutions on WhatsApp. Fast price quotes, instant availability check, and immediate dispatch.
            </p>
          </div>
          <a
            href={getWhatsAppLink('250786639945', 'Hello Romantic T Solutions! I want to inquire about products and services.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark px-6 py-3.5 rounded-full font-black text-sm shadow-lg transition whitespace-nowrap hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 fill-brand-dark" />
            <span>Chat on WhatsApp (+250 786 639 945)</span>
          </a>
        </div>
      </section>
    </div>
  );
}
