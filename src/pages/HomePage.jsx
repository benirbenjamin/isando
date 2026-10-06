import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, MessageCircle, HeartHandshake, Briefcase, ArrowRight, Utensils, Shirt, Flame, Layers } from 'lucide-react';
import { api, getWhatsAppLink, getImageUrl } from '../services/api';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';

function getCategoryEmoji(name = '') {
  const n = name.toLowerCase();
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

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [foodProducts, setFoodProducts] = useState([]);
  const [clothesProducts, setClothesProducts] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [weddingServices, setWeddingServices] = useState([]);
  const [consultancyServices, setConsultancyServices] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

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
        setAllProducts(prods);

        // Featured Slider items
        const featP = prods.filter(p => p.isFeatured).map(p => ({ ...p, _type: 'product' }));
        const featS = srvs.filter(s => s.isFeatured).map(s => ({ ...s, _type: 'service' }));
        setFeaturedItems([...featP, ...featS]);

        // Section 1: Photography & Videography
        const photoVideo = srvs.filter(s => {
          const c = (s.category?.name || '').toLowerCase();
          const n = (s.name || '').toLowerCase();
          return c.includes('photo') || c.includes('video') || n.includes('photo') || n.includes('video');
        });

        // Section 3: Wedding Car Rentals
        const carRentals = srvs.filter(s => {
          const c = (s.category?.name || '').toLowerCase();
          const n = (s.name || '').toLowerCase();
          return c.includes('car') || n.includes('car') || c.includes('rental') || n.includes('limo');
        });

        // Section 2: Other Wedding Services (Decor, Catering, Protocol, DJ/MC)
        const weddingGeneral = srvs.filter(s => {
          const isPhoto = photoVideo.some(p => p.id === s.id);
          const isCar = carRentals.some(c => c.id === s.id);
          const isWeddingDiv = s.businessDivision?.slug === 'wedding-services' || s.businessDivision?.name?.includes('Wedding');
          return isWeddingDiv && !isPhoto && !isCar;
        });

        // Section 4: Consultancy
        const consultancy = srvs.filter(s => s.businessDivision?.slug === 'consultancy-services' || s.businessDivision?.name?.includes('Consultancy'));

        // Section 5: Food & Beverages
        const food = prods.filter(p => p.businessDivision?.slug === 'food-beverages' || p.businessDivision?.name?.includes('Food'));

        // Section 6: Clothes & Shoes (Comes Last)
        const clothes = prods.filter(p => p.businessDivision?.slug === 'clothes-shoes' || p.businessDivision?.name?.includes('Clothes'));

        setFoodProducts(food);
        setClothesProducts(clothes);
        setSpecialOffers(prods.filter(p => p.discountPercentage > 0).sort((a, b) => b.discountPercentage - a.discountPercentage));
        setNewArrivals(prods.filter(p => p.isNewArrival || p.createdAt));
        setWeddingServices(weddingGeneral);
        setConsultancyServices(consultancy);

        // Store custom lists on state
        setPhotoVideoServices(photoVideo.length > 0 ? photoVideo : [
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

        setCarRentalServices(carRentals.length > 0 ? carRentals : [
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
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const [photoVideoServices, setPhotoVideoServices] = useState([]);
  const [carRentalServices, setCarRentalServices] = useState([]);

  // Auto slide featured spotlight
  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredItems]);

  const scrollContainer = (id, direction) => {
    const container = document.getElementById(id);
    if (container) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Dynamic Categories Horizontal Scroller */}
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

        {/* Dynamic Category Cards */}
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

      {/* Interactive Featured Spotlight Slider */}
      {featuredItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-yellow fill-brand-yellow" />
              <span>Featured Spotlight</span>
            </h2>
          </div>

          <div className="relative rounded-3xl overflow-hidden bg-brand-dark h-80 sm:h-96 shadow-xl">
            {featuredItems.map((item, idx) => {
              const imgRaw = Array.isArray(item.images) ? item.images[0] : (typeof item.images === 'string' ? JSON.parse(item.images || '[]')[0] : '');
              const img = getImageUrl(imgRaw, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=70');
              return (
                <div
                  key={item.id || idx}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img
                    src={img}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-8 left-6 sm:left-10 max-w-lg text-white space-y-2">
                    <span className="bg-brand-yellow text-brand-dark text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                      {item.businessDivision?.name || 'FEATURED'}
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-extrabold leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-sm opacity-90 line-clamp-2">
                      {item.description}
                    </p>
                    <Link
                      to={item._type === 'service' ? `/services/${item.id}` : `/products/${item.id}`}
                      className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-redDark text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shine-effect transition mt-2"
                    >
                      <span>Explore Item</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Slider Dots */}
            <div className="absolute bottom-4 right-6 z-20 flex gap-2">
              {featuredItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-brand-yellow' : 'w-2.5 bg-white/60'}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

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
            {weddingServices.length > 0 ? (
              weddingServices.map((s) => (
                <div key={s.id} className="min-w-[260px] sm:min-w-[300px] max-w-[300px] flex-shrink-0 snap-start">
                  <ServiceCard service={s} />
                </div>
              ))
            ) : (
              [
                {
                  id: 'demo-decor',
                  name: 'Grand Wedding Decoration & Floral Styling',
                  description: 'Stage setup, centerpieces, floral arches, banquet hall styling & lighting ambience.',
                  startingPrice: 500000,
                  location: 'Kigali & Across Rwanda',
                  businessDivision: { name: 'Wedding Services' },
                  category: { name: 'Decoration' },
                  images: ['https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=70'],
                },
                {
                  id: 'demo-catering',
                  name: 'Gourmet Wedding Catering & Buffet',
                  description: 'Multi-course culinary experience, cocktail tables, waitstaff & professional bartenders.',
                  startingPrice: 350000,
                  location: 'Kigali Nationwide',
                  businessDivision: { name: 'Wedding Services' },
                  category: { name: 'Catering' },
                  images: ['https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=70'],
                }
              ].map(s => (
                <div key={s.id} className="min-w-[260px] sm:min-w-[300px] max-w-[300px] flex-shrink-0 snap-start">
                  <ServiceCard service={s} />
                </div>
              ))
            )}
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
            {consultancyServices.length > 0 ? (
              consultancyServices.map((s) => (
                <div key={s.id} className="min-w-[260px] sm:min-w-[300px] max-w-[300px] flex-shrink-0 snap-start">
                  <ServiceCard service={s} />
                </div>
              ))
            ) : (
              [
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
              ].map(s => (
                <div key={s.id} className="min-w-[260px] sm:min-w-[300px] max-w-[300px] flex-shrink-0 snap-start">
                  <ServiceCard service={s} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ORDER 5: FOOD & BEVERAGES (THEN FOOD AND BEVERAGES)
          ========================================================================= */}
      {foodProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
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
        </section>
      )}

      {/* Special Offers (% On Sale) highlight */}
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
      {clothesProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
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
        </section>
      )}

      {/* WhatsApp Quick Order Banner */}
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
            className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark px-6 py-3.5 rounded-full font-black text-sm shadow-lg transition whitespace-nowrap"
          >
            <MessageCircle className="w-5 h-5 fill-brand-dark" />
            <span>Chat on WhatsApp (+250 786 639 945)</span>
          </a>
        </div>
      </section>
    </div>
  );
}
