import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, MessageCircle, HeartHandshake, Briefcase, ArrowRight, Utensils, Shirt, Flame } from 'lucide-react';
import { api, getWhatsAppLink } from '../services/api';
import ProductCard from '../components/ProductCard';
import ServiceCard from '../components/ServiceCard';

export default function HomePage() {
  const [divisions, setDivisions] = useState([]);
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

        setDivisions(divRes.divisions || []);
        setAllProducts(prods);

        // Featured Slider items
        const featP = prods.filter(p => p.isFeatured).map(p => ({ ...p, _type: 'product' }));
        const featS = srvs.filter(s => s.isFeatured).map(s => ({ ...s, _type: 'service' }));
        setFeaturedItems([...featP, ...featS]);

        // Division specific product scrollers
        setFoodProducts(prods.filter(p => p.businessDivision?.slug === 'food-beverages' || p.businessDivision?.name?.includes('Food')));
        setClothesProducts(prods.filter(p => p.businessDivision?.slug === 'clothes-shoes' || p.businessDivision?.name?.includes('Clothes')));

        // Special Offers & New Arrivals
        setSpecialOffers(prods.filter(p => p.discountPercentage > 0).sort((a, b) => b.discountPercentage - a.discountPercentage));
        setNewArrivals(prods.filter(p => p.isNewArrival || p.createdAt));

        // Wedding Services & Consultancy Services
        setWeddingServices(srvs.filter(s => s.businessDivision?.slug === 'wedding-services' || s.businessDivision?.name?.includes('Wedding')));
        setConsultancyServices(srvs.filter(s => s.businessDivision?.slug === 'consultancy-services' || s.businessDivision?.name?.includes('Consultancy')));
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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
    <div className="space-y-12 pb-12">
      {/* 1. Hero / Business Divisions Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-brand-dark relative inline-block pb-2">
            Our Business Divisions
            <span className="absolute bottom-0 left-0 w-12 h-1 bg-brand-yellow rounded-full" />
          </h2>
          <p className="text-sm text-brand-muted mt-1">Four major divisions under Romantic T Solutions Ltd</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {divisions.map((div) => (
            <Link
              key={div.id}
              to={div.name.includes('Services') ? `/services?division=${encodeURIComponent(div.name)}` : `/products?division=${encodeURIComponent(div.name)}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-gradient-to-br from-brand-yellow to-brand-red shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 block"
            >
              <img
                src={div.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70'}
                alt={div.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              {div.tag && (
                <span className="absolute top-3 left-3 bg-brand-red text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow animate-pulse">
                  {div.tag}
                </span>
              )}
              <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                <b className="block text-lg font-bold leading-tight group-hover:text-brand-yellow transition">
                  {div.name}
                </b>
                <small className="text-xs opacity-90 line-clamp-1 block mt-0.5">
                  {div.description}
                </small>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Interactive Featured Spotlight Slider */}
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
              const img = Array.isArray(item.images) ? item.images[0] : (typeof item.images === 'string' ? JSON.parse(item.images)[0] : '');
              return (
                <div
                  key={item.id || idx}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img
                    src={img || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=70'}
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

      {/* 3. Food & Beverages Products (Sliding Scroller) */}
      {foodProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                <Utensils className="w-6 h-6 text-brand-yellow" />
                <span>Food & Beverages</span>
              </h2>
              <p className="text-xs text-brand-muted">Juices, crate drinks, wholesale rice & food supplies</p>
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

          <div id="food-scroller" className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {foodProducts.map(product => (
              <div key={product.id} className="w-64 flex-shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Clothes & Shoes Products (Sliding Scroller) */}
      {clothesProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                <Shirt className="w-6 h-6 text-brand-red" />
                <span>Clothes & Shoes</span>
              </h2>
              <p className="text-xs text-brand-muted">Sneakers, dresses, T-shirts & fashion apparel</p>
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

          <div id="clothes-scroller" className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {clothesProducts.map(product => (
              <div key={product.id} className="w-64 flex-shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Special Offers (% On Sale) Sliding Scroller */}
      {specialOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                <Flame className="w-6 h-6 text-brand-red" />
                <span>Special Offers & Discounts</span>
              </h2>
              <p className="text-xs text-brand-muted">Limited-time discounted prices with auto-calculated % OFF</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => scrollContainer('offers-scroller', 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollContainer('offers-scroller', 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div id="offers-scroller" className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {specialOffers.map(product => (
              <div key={product.id} className="w-64 flex-shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Wedding & Event Services Sliding Scroller */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-amber-100 rounded-3xl p-6 sm:p-8 border border-brand-border relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-brand-dark flex items-center gap-2">
                <HeartHandshake className="w-7 h-7 text-brand-red" />
                <span>Wedding & Event Services</span>
              </h2>
              <p className="text-sm text-brand-muted">Photography, videography, catering, decor & cars</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/services?division=Wedding%20Services" className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                View All Wedding Services &rarr;
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

          <div id="wedding-scroller" className="flex gap-5 overflow-x-auto no-scrollbar py-2 relative z-10">
            {weddingServices.map(service => (
              <div key={service.id} className="w-72 flex-shrink-0">
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Consultancy Services Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="mb-4">
          <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-brand-yellow" />
            <span>Consultancy Services</span>
          </h2>
          <p className="text-xs text-brand-muted">Expert business strategy, event planning & procurement advice</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {consultancyServices.map(cs => (
            <Link
              key={cs.id}
              to={`/services/${cs.id}`}
              className="bg-white border-t-4 border-brand-yellow border-x border-b border-brand-border rounded-2xl p-5 hover:-translate-y-1.5 hover:border-t-brand-red shadow-sm hover:shadow-xl transition-all duration-300 block"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-yellow text-brand-dark flex items-center justify-center text-2xl font-bold mb-3 animate-float">
                {cs.icon || '💼'}
              </div>
              <h3 className="font-bold text-base text-brand-dark mb-1">{cs.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-3 mb-3">{cs.description}</p>
              <span className="text-xs font-bold text-brand-red flex items-center gap-1">
                <span>Learn Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. All Products Catalog Grid */}
      {allProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-brand-dark">All Products Catalog</h2>
              <p className="text-xs text-brand-muted">Explore items across all divisions</p>
            </div>
            <Link to="/products" className="text-xs font-bold text-brand-red hover:underline">
              View All Products ({allProducts.length}) &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {allProducts.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 9. Direct WhatsApp Order Banner */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl font-black mb-1">Ready to Order or Book Services?</h3>
            <p className="text-sm opacity-90">Chat directly with our team on WhatsApp for availability and instant pricing.</p>
          </div>
          <a
            href={getWhatsAppLink('250786639945', 'Hello Romantic T Solutions, I am interested in ordering/booking.')}
            target="_blank"
            rel="noreferrer"
            className="bg-white text-[#128C7E] hover:bg-gray-100 font-extrabold text-sm px-7 py-3 rounded-full shadow-lg shine-effect transition flex-shrink-0 flex items-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </section>
    </div>
  );
}
