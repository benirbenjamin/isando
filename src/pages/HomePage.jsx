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

export default function HomePage() {
  const [divisions, setDivisions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredItems, setFeaturedItems] = useState(DEFAULT_FEATURED_SLIDES);
  const [photoVideoServices, setPhotoVideoServices] = useState([]);
  const [weddingServices, setWeddingServices] = useState([]);
  const [carRentalServices, setCarRentalServices] = useState([]);
  const [consultancyServices, setConsultancyServices] = useState([]);
  const [foodProducts, setFoodProducts] = useState([]);
  const [clothesProducts, setClothesProducts] = useState([]);
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
        setDivisions(divs);
        setAllProducts(prods);
        setAllServices(srvs);

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
          setFeaturedItems(dynamicFeatured);
        } else {
          // If no items are flagged as featured, feature real services and products from the catalog
          const realSlides = [
            ...srvs.slice(0, 3).map(s => ({
              id: s.id,
              _type: 'service',
              targetUrl: `/services/${s.id}`,
              name: s.name,
              badge: s.businessDivision?.name || 'Service',
              divisionName: s.businessDivision?.name || 'Service',
              description: s.description,
              image: getImageUrl(s.featuredImage || (Array.isArray(s.images) ? s.images[0] : null)),
              ctaText: 'Explore Service',
            })),
            ...prods.slice(0, 3).map(p => ({
              id: p.id,
              _type: 'product',
              targetUrl: `/products/${p.id}`,
              name: p.name,
              badge: p.businessDivision?.name || 'Product',
              divisionName: p.businessDivision?.name || 'Product',
              description: p.description,
              image: getImageUrl(p.featuredImage || (Array.isArray(p.images) ? p.images[0] : null)),
              ctaText: 'View Product Details',
            }))
          ];

          if (realSlides.length > 0) {
            setFeaturedItems(realSlides);
          } else {
            setFeaturedItems(DEFAULT_FEATURED_SLIDES);
          }
        }

        // 1. Photography & Videography (first)
        const photoVideo = srvs.filter(s => {
          const c = (s.category?.name || '').toLowerCase();
          const n = (s.name || '').toLowerCase();
          const d = (s.businessDivision?.name || '').toLowerCase();
          return c.includes('photo') || c.includes('video') || n.includes('photo') || n.includes('video') || d.includes('photo') || d.includes('video');
        });
        setPhotoVideoServices(photoVideo);

        // 2. Wedding Car Rentals
        const carRentals = srvs.filter(s => {
          const c = (s.category?.name || '').toLowerCase();
          const n = (s.name || '').toLowerCase();
          const d = (s.businessDivision?.name || '').toLowerCase();
          return c.includes('car') || n.includes('car') || c.includes('rental') || d.includes('car') || d.includes('rental') || n.includes('limo');
        });
        setCarRentalServices(carRentals);

        // 3. Wedding Services (Decor, Catering, Protocol, DJ/MC)
        const weddingGeneral = srvs.filter(s => {
          const isPhoto = photoVideo.some(p => p.id === s.id);
          const isCar = carRentals.some(c => c.id === s.id);
          const isWeddingDiv = s.businessDivision?.slug === 'wedding-services' || (s.businessDivision?.name || '').toLowerCase().includes('wedding');
          return isWeddingDiv && !isPhoto && !isCar;
        });
        setWeddingServices(weddingGeneral);

        // 4. Consultancy Services
        const consultancy = srvs.filter(s =>
          s.businessDivision?.slug === 'consultancy-services' ||
          (s.businessDivision?.name || '').toLowerCase().includes('consult')
        );
        setConsultancyServices(consultancy);

        // 5. Food & Beverages
        const food = prods.filter(p => {
          const divStr = (p.businessDivision?.name || p.businessDivision?.slug || '').toLowerCase();
          const catStr = (p.category?.name || '').toLowerCase();
          const nameStr = (p.name || '').toLowerCase();
          return divStr.includes('food') || divStr.includes('beverage') ||
            catStr.includes('food') || catStr.includes('beverage') || catStr.includes('juice') || catStr.includes('drink') || catStr.includes('rice') ||
            nameStr.includes('juice') || nameStr.includes('rice') || nameStr.includes('drink');
        });
        setFoodProducts(food);

        // 6. Clothes & Shoes (Comes Last)
        const clothes = prods.filter(p => {
          const divStr = (p.businessDivision?.name || p.businessDivision?.slug || '').toLowerCase();
          const catStr = (p.category?.name || '').toLowerCase();
          const nameStr = (p.name || '').toLowerCase();
          return divStr.includes('clothe') || divStr.includes('shoe') || divStr.includes('fashion') ||
            catStr.includes('clothe') || catStr.includes('shoe') || catStr.includes('dress') || catStr.includes('shirt') || catStr.includes('suit') ||
            nameStr.includes('shoe') || nameStr.includes('dress') || nameStr.includes('suit') || nameStr.includes('heel') || nameStr.includes('mushanana');
        });
        setClothesProducts(clothes);

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
      {categories.length > 0 && (
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
            {categories.map((cat) => {
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
            })}
          </div>
        </section>
      )}

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
          DYNAMIC ORDER-AWARE BUSINESS DIVISION SECTIONS
          ========================================================================= */}
      {(divisions || []).map((div) => {
        const nameLower = (div.name || '').toLowerCase();

        // 1. Photography & Videography
        if (nameLower.includes('photo') || nameLower.includes('video')) {
          if (photoVideoServices.length === 0) return null;
          return (
            <section key={div.id || 'photo'} className="max-w-7xl mx-auto px-4">
              <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-100/40 border border-brand-yellow/40 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                      <Camera className="w-6 h-6 text-brand-red" />
                      <span>📸 {div.name}</span>
                    </h2>
                    <p className="text-xs text-brand-muted">
                      {div.description || 'High-end wedding cinematography, portrait photography, 4K multi-cam coverage & drone videography'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/services?division=${encodeURIComponent(div.name)}`} className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                      View All {div.name} &rarr;
                    </Link>
                    {photoVideoServices.length > 3 && (
                      <div className="flex gap-1">
                        <button onClick={() => scrollContainer('photovideo-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Previous">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => scrollContainer('photovideo-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Next">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
          );
        }

        // 2. Wedding Services (General)
        if (nameLower.includes('wedding')) {
          if (weddingServices.length === 0) return null;
          return (
            <section key={div.id || 'wedding'} className="max-w-7xl mx-auto px-4">
              <div className="border border-brand-border rounded-3xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                      <HeartHandshake className="w-6 h-6 text-brand-red" />
                      <span>💍 {div.name}</span>
                    </h2>
                    <p className="text-xs text-brand-muted">
                      {div.description || 'Exquisite venue decoration, catering & buffet, sound & lighting, MCs, cakes & protocol'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/services?division=${encodeURIComponent(div.name)}`} className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                      View {div.name} &rarr;
                    </Link>
                    {weddingServices.length > 3 && (
                      <div className="flex gap-1">
                        <button onClick={() => scrollContainer('wedding-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Previous">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => scrollContainer('wedding-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Next">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
          );
        }

        // 3. Car rentals
        if (nameLower.includes('car') || nameLower.includes('rental') || nameLower.includes('transport')) {
          if (carRentalServices.length === 0) return null;
          return (
            <section key={div.id || 'car'} className="max-w-7xl mx-auto px-4">
              <div className="bg-slate-50 border border-brand-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                      <Car className="w-6 h-6 text-brand-red" />
                      <span>🚗 {div.name}</span>
                    </h2>
                    <p className="text-xs text-brand-muted">
                      {div.description || 'Chauffeured Mercedes-Benz, V8 Land Cruisers, VIP Range Rovers, and bridal convoy coaches'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/services?division=${encodeURIComponent(div.name)}`} className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                      View Fleet &rarr;
                    </Link>
                    {carRentalServices.length > 3 && (
                      <div className="flex gap-1">
                        <button onClick={() => scrollContainer('cars-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Previous">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => scrollContainer('cars-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Next">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
          );
        }

        // 4. Consultancy Services
        if (nameLower.includes('consult')) {
          if (consultancyServices.length === 0) return null;
          return (
            <section key={div.id || 'consult'} className="max-w-7xl mx-auto px-4">
              <div className="border border-brand-border rounded-3xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                      <Briefcase className="w-6 h-6 text-brand-yellow" />
                      <span>💼 {div.name}</span>
                    </h2>
                    <p className="text-xs text-brand-muted">
                      {div.description || 'Expert business strategy, corporate event planning, financial planning & executive workshops'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/services?division=${encodeURIComponent(div.name)}`} className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                      View All {div.name} &rarr;
                    </Link>
                    {consultancyServices.length > 3 && (
                      <div className="flex gap-1">
                        <button onClick={() => scrollContainer('consultancy-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Previous">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => scrollContainer('consultancy-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Next">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
          );
        }

        // 5. Food & Beverages
        if (nameLower.includes('food') || nameLower.includes('beverage') || nameLower.includes('drink')) {
          if (foodProducts.length === 0) return null;
          return (
            <section key={div.id || 'food'} className="max-w-7xl mx-auto px-4">
              <div className="border border-brand-border rounded-3xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                      <Utensils className="w-6 h-6 text-brand-yellow" />
                      <span>🍔 {div.name}</span>
                    </h2>
                    <p className="text-xs text-brand-muted">
                      {div.description || 'Fresh natural juices, crate soft drinks, wholesale rice & catering food supplies'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/products?division=${encodeURIComponent(div.name)}`} className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                      View All {div.name} &rarr;
                    </Link>
                    {foodProducts.length > 3 && (
                      <div className="flex gap-1">
                        <button onClick={() => scrollContainer('food-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Previous">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => scrollContainer('food-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Next">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
          );
        }

        // 6. Clothes & Shoes
        if (nameLower.includes('cloth') || nameLower.includes('shoe') || nameLower.includes('fashion') || nameLower.includes('apparel')) {
          if (clothesProducts.length === 0) return null;
          return (
            <section key={div.id || 'clothes'} className="max-w-7xl mx-auto px-4">
              <div className="border border-brand-border rounded-3xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                      <Shirt className="w-6 h-6 text-brand-yellow" />
                      <span>👗 {div.name}</span>
                    </h2>
                    <p className="text-xs text-brand-muted">
                      {div.description || 'Men & women shoes, dresses, suits, traditional Rwandan attire & sneakers'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/products?division=${encodeURIComponent(div.name)}`} className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                      View All {div.name} &rarr;
                    </Link>
                    {clothesProducts.length > 3 && (
                      <div className="flex gap-1">
                        <button onClick={() => scrollContainer('clothes-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Previous">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => scrollContainer('clothes-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Next">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
          );
        }

        // 7. Generic / Newly Created Custom Business Division
        const customProds = allProducts.filter(p => p.businessDivisionId === div.id || (p.businessDivision?.name || '').toLowerCase() === nameLower);
        const customSrvs = allServices.filter(s => s.businessDivisionId === div.id || (s.businessDivision?.name || '').toLowerCase() === nameLower);

        if (customProds.length === 0 && customSrvs.length === 0) return null;

        return (
          <section key={div.id} className="max-w-7xl mx-auto px-4">
            <div className="border border-brand-border rounded-3xl p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-brand-yellow" />
                    <span>{div.name}</span>
                  </h2>
                  <p className="text-xs text-brand-muted">{div.description || 'Dynamic business division catalog'}</p>
                </div>
                <Link to={customProds.length > 0 ? `/products?division=${encodeURIComponent(div.name)}` : `/services?division=${encodeURIComponent(div.name)}`} className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                  Explore {div.name} &rarr;
                </Link>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
                {customProds.map((p) => (
                  <div key={p.id} className="min-w-[240px] sm:min-w-[280px] max-w-[280px] flex-shrink-0 snap-start">
                    <ProductCard product={p} />
                  </div>
                ))}
                {customSrvs.map((s) => (
                  <div key={s.id} className="min-w-[260px] sm:min-w-[300px] max-w-[300px] flex-shrink-0 snap-start">
                    <ServiceCard service={s} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

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
