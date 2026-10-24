import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Sparkles, MessageCircle, HeartHandshake,
  Briefcase, ArrowRight, Utensils, Shirt, Flame, Camera, Car, RefreshCw,
  Database, ShieldCheck, Video, Play
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
  if (n.includes('cater') || n.includes('dish') || n.includes('buffet') || n.includes('chafing') || n.includes('tableware')) return '🍽️';
  if (n.includes('car') || n.includes('vehic') || n.includes('limo') || n.includes('convoy') || n.includes('fleet') || n.includes('transport') || n.includes('mc')) return '🚗';
  if (n.includes('business') || n.includes('consult')) return '📈';
  if (n.includes('event')) return '🎯';
  if (n.includes('it') || n.includes('tech') || n.includes('comput') || n.includes('suppl') || n.includes('laptop')) return '💻';
  return '✨';
}

// Permanent high-impact default featured slides for Romantic T Solutions Ltd
// Permanent high-impact default featured slides for Romantic T Solutions Ltd
const DEFAULT_FALLBACK_VIDEOS = [
  {
    id: 'vid-default-1',
    title: 'Romantic T Solutions - Cinematic Wedding Production & Highlights',
    description: 'Experience the magic of romantic weddings captured in stunning 4K cinematography by Romantic T Solutions Ltd.',
    videoUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    youtubeId: 'LXb3EKWsInQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    sourceType: 'YOUTUBE',
    duration: '4:15',
    viewsCount: 1420,
    isFeatured: true,
  },
  {
    id: 'vid-default-2',
    title: 'Executive Bridal Convoy & Luxury Car Fleet in Rwanda',
    description: 'Uniformed VIP chauffeurs, Mercedes-Benz, and V8 Land Cruiser convoy for executive bridal transport.',
    videoUrl: 'https://www.youtube.com/watch?v=7wtfhZwyrcc',
    youtubeId: '7wtfhZwyrcc',
    thumbnailUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    sourceType: 'YOUTUBE',
    duration: '3:30',
    viewsCount: 980,
    isFeatured: true,
  }
];

const DEFAULT_FEATURED_SLIDES = [
  {
    id: 'feat-slide-video-1',
    _type: 'video',
    targetUrl: '/videos',
    name: 'Romantic T Solutions - Cinematic Wedding Highlights',
    badge: 'Featured Video Premiere',
    divisionName: 'Cinematic Media',
    description: 'Experience pure romance with our high-end 4K multi-camera wedding cinematography and drone footage across Rwanda.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Watch Video Now',
  },
  {
    id: 'feat-slide-video-2',
    _type: 'video',
    targetUrl: '/videos',
    name: 'Executive Bridal Convoy & Luxury Car Fleet in Rwanda',
    badge: 'Featured Video Spotlight',
    divisionName: 'Executive Fleet Video',
    description: 'VIP Mercedes-Benz, V8 Land Cruisers and Range Rovers with professional uniformed chauffeurs for your memorable day.',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Watch Fleet Video',
  }
];

// High-availability baseline divisions
const FALLBACK_DIVISIONS = [
  { id: 'div-photo', name: 'Photography & Videography', slug: 'photography-videography', description: 'Cinematic 4K wedding films, aerial drone footage & heirloom albums', sortOrder: 1 },
  { id: 'div-wedding', name: 'Wedding Services', slug: 'wedding-services', description: 'Exquisite venue decoration, catering & buffet, sound, lighting & MCs', sortOrder: 2 },
  { id: 'div-cater', name: 'Catering Equipment Rentals', slug: 'catering-equipment', description: 'Chafing dishes, banquet tableware, food warmers & equipment rentals', sortOrder: 3 },
  { id: 'div-car', name: 'Wedding Car Rentals', slug: 'wedding-car-rentals', description: 'Mercedes-Benz, V8 Land Cruisers, VIP Range Rovers & bridal convoys', sortOrder: 4 },
  { id: 'div-consult', name: 'Consultancy Services', slug: 'consultancy-services', description: 'Business strategy advisory, corporate event planning & executive training', sortOrder: 5 },
  { id: 'div-food', name: 'Food & Beverages', slug: 'food-beverages', description: 'Fresh 100% natural juices, crate soft drinks, wholesale rice & catering food', sortOrder: 6 },
  { id: 'div-clothes', name: 'Clothes & Shoes', slug: 'clothes-shoes', description: 'Authentic royal Mushanana, bespoke tuxedos, wedding dresses & leather shoes', sortOrder: 7 },
];

// High-availability baseline products
const FALLBACK_PRODUCTS = [
  {
    id: 'prod-fb-1',
    name: 'Premium Natural Fruit Juice (12 Bottles)',
    sku: 'FB-JUICE-12P',
    description: 'Refreshing 100% natural Inyange fruit juices, ideal for events, homes and offices.',
    regularPrice: 18000,
    salePrice: 14400,
    discountPercentage: 20,
    stockQuantity: 40,
    isFeatured: true,
    isOnSale: true,
    businessDivision: { id: 'div-food', name: 'Food & Beverages', slug: 'food-beverages' },
    category: { id: 'cat-juice', name: 'Fresh Juices & Smoothies', slug: 'fresh-juices' },
    images: ['https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'prod-fb-2',
    name: 'Super Grade Tanzanian Rice 25kg',
    sku: 'FB-RICE-25KG',
    description: 'Premium quality aromatic long-grain rice supplied in bulk for retail and catering.',
    regularPrice: 38000,
    salePrice: 38000,
    discountPercentage: 0,
    stockQuantity: 25,
    isPopular: true,
    businessDivision: { id: 'div-food', name: 'Food & Beverages', slug: 'food-beverages' },
    category: { id: 'cat-rice', name: 'Wholesale Rice & Grains', slug: 'wholesale-rice' },
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'prod-fb-3',
    name: 'Assorted Soft Drinks Crate (Cold Ready)',
    sku: 'FB-DRINKS-CRATE',
    description: 'Chilled crate of assorted sparkling soft drinks ready for celebrations and retail.',
    regularPrice: 12000,
    salePrice: 10000,
    discountPercentage: 17,
    stockQuantity: 60,
    isNewArrival: true,
    isOnSale: true,
    businessDivision: { id: 'div-food', name: 'Food & Beverages', slug: 'food-beverages' },
    category: { id: 'cat-drinks', name: 'Beverages & Soft Drinks', slug: 'beverages-soft-drinks' },
    images: ['https://images.unsplash.com/photo-1581636625402-29b2a704ef4c?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'prod-cs-1',
    name: 'Classic Designer Red Sneakers',
    sku: 'CS-RED-SNEAK',
    description: 'Comfortable everyday designer sneakers with durable, cushioned rubber soles.',
    regularPrice: 50000,
    salePrice: 35000,
    discountPercentage: 30,
    stockQuantity: 25,
    isFeatured: true,
    isOnSale: true,
    isPopular: true,
    businessDivision: { id: 'div-clothes', name: 'Clothes & Shoes', slug: 'clothes-shoes' },
    category: { id: 'cat-shoes', name: "Men's Shoes & Sneakers", slug: 'mens-shoes-sneakers' },
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'prod-cs-2',
    name: 'Authentic Royal Rwandan Mushanana Attire',
    sku: 'CS-MUSHANANA',
    description: 'Graceful authentic Rwandan cultural ceremonial dress with fine gold embroidery styling.',
    regularPrice: 65000,
    salePrice: 52000,
    discountPercentage: 20,
    stockQuantity: 15,
    isFeatured: true,
    isOnSale: true,
    businessDivision: { id: 'div-clothes', name: 'Clothes & Shoes', slug: 'clothes-shoes' },
    category: { id: 'cat-mush', name: 'Traditional Rwandan Attire', slug: 'traditional-rwandan-mushanana' },
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'prod-cs-3',
    name: 'Bespoke Tailored Royal Tuxedo Suit',
    sku: 'CS-TUXEDO',
    description: 'High-end slim-fit groom and executive tuxedo suit tailored with Italian wool blend.',
    regularPrice: 120000,
    salePrice: 95000,
    discountPercentage: 21,
    stockQuantity: 10,
    isNewArrival: true,
    isOnSale: true,
    businessDivision: { id: 'div-clothes', name: 'Clothes & Shoes', slug: 'clothes-shoes' },
    category: { id: 'cat-suit', name: "Men's Suits & Formal Wear", slug: 'mens-suits' },
    images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'prod-cs-4',
    name: 'Elegant Evening Banquet Dress',
    sku: 'CS-DRESS-EVE',
    description: 'Stunning floor-length evening dress crafted for weddings and gala banquets.',
    regularPrice: 45000,
    salePrice: 32000,
    discountPercentage: 29,
    stockQuantity: 18,
    isNewArrival: true,
    isOnSale: true,
    businessDivision: { id: 'div-clothes', name: 'Clothes & Shoes', slug: 'clothes-shoes' },
    category: { id: 'cat-dress', name: "Women's Dresses & Gowns", slug: 'womens-dresses' },
    images: ['https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=70'],
  }
];

// High-availability baseline services
const FALLBACK_SERVICES = [
  {
    id: 'srv-pv-1',
    name: 'Cinematic 4K Wedding Photography & Albums',
    description: 'Master photographers capturing every precious moment with drone aerials and heirloom albums.',
    location: 'Kigali & Nationwide',
    startingPrice: 150000,
    features: ['Full-day dual camera coverage', '500+ High-res retouched photos', 'Luxury embossed photo album'],
    isFeatured: true,
    businessDivision: { id: 'div-photo', name: 'Photography & Videography', slug: 'photography-videography' },
    category: { id: 'cat-photo', name: 'Photography & Photo Albums', slug: 'photography' },
    images: ['https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'srv-pv-2',
    name: 'Aerial Drone 4K Wedding Videography & Films',
    description: 'Cinematic wedding highlight films with 4K drone cinematography and full documentary edits.',
    location: 'Kigali & Across Rwanda',
    startingPrice: 200000,
    features: ['4K Ultra HD video', 'Licensed drone aerial shots', 'Cinematic trailer & full footage'],
    isFeatured: true,
    businessDivision: { id: 'div-photo', name: 'Photography & Videography', slug: 'photography-videography' },
    category: { id: 'cat-video', name: 'Cinematic Videography & Drones', slug: 'videography' },
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'srv-car-1',
    name: 'Luxury Chauffeured Bridal Convoy & Car Rentals',
    description: 'Prestige Mercedes-Benz, V8 Land Cruisers and VIP Range Rovers with uniformed chauffeurs.',
    location: 'Kigali & Provinces',
    startingPrice: 150000,
    features: ['Professional uniformed chauffeur', 'Bridal ribbon decor', 'Fuel & protocol escort included'],
    isFeatured: true,
    businessDivision: { id: 'div-car', name: 'Wedding Car Rentals', slug: 'wedding-car-rentals' },
    category: { id: 'cat-cars', name: 'Bridal VIP Cars & Limousines', slug: 'bridal-vip-cars' },
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'srv-wed-1',
    name: 'Grand Wedding Venue Decoration & Floral Styling',
    description: 'Exquisite hall transformation, floral arches, crystal lighting, bride & groom royal stage.',
    location: 'Kigali & Nationwide',
    startingPrice: 500000,
    features: ['Royal stage setup', 'Fresh imported floral arches', 'Ambiance mood lighting & centerpieces'],
    isFeatured: true,
    businessDivision: { id: 'div-wedding', name: 'Wedding Services', slug: 'wedding-services' },
    category: { id: 'cat-decor', name: 'Venue Decoration & Floral Styling', slug: 'venue-decoration' },
    images: ['https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'srv-cat-1',
    name: 'Chafing Dishes & Banquet Tableware Equipment Rentals',
    description: 'Stainless steel roll-top chafing dishes, buffet warming trays, porcelain tableware & glassware rentals.',
    location: 'Kigali & Surrounding Districts',
    startingPrice: 50000,
    features: ['Stainless roll-top chafing dishes', 'Complete dining tableware sets', 'Delivery & setup support'],
    isFeatured: true,
    businessDivision: { id: 'div-cater', name: 'Catering Equipment Rentals', slug: 'catering-equipment' },
    category: { id: 'cat-cater', name: 'Full Catering & Equipment', slug: 'catering' },
    images: ['https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'srv-cat-2',
    name: 'Gourmet Wedding Catering & Multi-Course Buffet',
    description: 'Delicious African & continental buffet menu, welcome mocktails, carving stations & trained waitstaff.',
    location: 'Kigali Nationwide',
    startingPrice: 350000,
    features: ['Full multi-course buffet', 'Welcome drinks & cocktail station', 'Professional banquet waitstaff'],
    isFeatured: true,
    businessDivision: { id: 'div-wedding', name: 'Wedding Services', slug: 'wedding-services' },
    category: { id: 'cat-cater', name: 'Full Catering & Equipment', slug: 'catering' },
    images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'srv-con-1',
    name: 'Business Strategy, SME Advisory & Growth Planning',
    description: 'Practical SME advisory, feasibility plans, budget optimization and commercial development.',
    location: 'Kigali / Remote Online',
    startingPrice: null,
    features: ['Comprehensive business roadmap', 'Market expansion analysis', 'Operational coaching'],
    isFeatured: true,
    businessDivision: { id: 'div-consult', name: 'Consultancy Services', slug: 'consultancy-services' },
    category: { id: 'cat-cons', name: 'Business Strategy & Planning', slug: 'business-strategy' },
    images: ['https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=70'],
  },
  {
    id: 'srv-con-2',
    name: 'Corporate Event Conceptualization & Protocol Advisory',
    description: 'High-stakes diplomatic & executive corporate event production, vendor management & scheduling.',
    location: 'Kigali & Regional',
    startingPrice: null,
    features: ['End-to-end event production', 'Protocol & VIP guest management', 'Budget & supplier coordination'],
    isFeatured: true,
    businessDivision: { id: 'div-consult', name: 'Consultancy Services', slug: 'consultancy-services' },
    category: { id: 'cat-cons', name: 'Corporate Event Planning', slug: 'corporate-event-planning' },
    images: ['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=70'],
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
  const [cateringServices, setCateringServices] = useState([]);
  const [consultancyServices, setConsultancyServices] = useState([]);
  const [foodProducts, setFoodProducts] = useState([]);
  const [clothesProducts, setClothesProducts] = useState([]);
  const [itProducts, setItProducts] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [featuredVideos, setFeaturedVideos] = useState(DEFAULT_FALLBACK_VIDEOS);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Connection & Database Sleep State
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDbWakingUp, setIsDbWakingUp] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(1);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [hasCachedData, setHasCachedData] = useState(false);

  // Categorize and structure raw items into division buckets
  const applyCatalog = useCallback((prods = [], srvs = [], divs = [], vids = []) => {
    const rawProds = Array.isArray(prods) ? prods : [];
    const rawSrvs = Array.isArray(srvs) ? srvs : [];
    const rawDivs = Array.isArray(divs) && divs.length > 0 ? divs : FALLBACK_DIVISIONS;
    const rawVids = Array.isArray(vids) ? vids : [];

    setDivisions(rawDivs);
    setAllProducts(rawProds);
    setAllServices(rawSrvs);
    setFeaturedVideos(rawVids);

    // Extract dynamic categories across divisions
    const dynamicCats = [];
    rawDivs.forEach(div => {
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

    // If divisions didn't embed categories, extract unique categories from products & services
    if (dynamicCats.length === 0) {
      const seen = new Set();
      [...rawProds, ...rawSrvs].forEach(item => {
        if (item.category && item.category.name && !seen.has(item.category.name)) {
          seen.add(item.category.name);
          dynamicCats.push({
            id: item.category.id || item.category.slug,
            name: item.category.name,
            slug: item.category.slug || item.category.name,
            type: item.regularPrice !== undefined ? 'PRODUCT' : 'SERVICE',
            divisionName: item.businessDivision?.name || 'General',
          });
        }
      });
    }
    setCategories(dynamicCats);

    // Dynamic Featured Spotlight slides - only include REAL live items from database, no dummy fallbacks
    const isLiveCatalog = !isUsingFallback && (isLiveConnected || hasCachedData);
    const featP = (isLiveCatalog ? rawProds.filter(p => Boolean(p.isFeatured)) : []).map(p => ({
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

    const featS = (isLiveCatalog ? rawSrvs.filter(s => Boolean(s.isFeatured)) : []).map(s => ({
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

    // Videos for Spotlight - use fetched videos if available, or signature fallback videos
    const vidsList = Array.isArray(rawVids) && rawVids.length > 0 ? rawVids : DEFAULT_FALLBACK_VIDEOS;
    setFeaturedVideos(vidsList);

    const featV = vidsList.map(v => {
      const thumb = v.thumbnailUrl || (v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg` : null);
      return {
        id: v.id,
        _type: 'video',
        targetUrl: `/videos?play=${v.id}`,
        name: v.title,
        badge: 'Featured Video Premiere',
        divisionName: v.sourceType === 'YOUTUBE' ? 'YouTube Production' : 'Exclusive Video',
        description: v.description || 'Watch our premier cinematography and video production.',
        image: getImageUrl(thumb, 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1600&q=80'),
        ctaText: 'Watch Video Now',
        isYouTube: v.sourceType === 'YOUTUBE',
        youtubeId: v.youtubeId
      };
    });

    // Interleave slides: Videos first, followed by live featured items
    const dynamicFeatured = [];
    const maxLen = Math.max(featV.length, featS.length, featP.length);
    for (let i = 0; i < maxLen; i++) {
      if (featV[i]) dynamicFeatured.push(featV[i]);
      if (featS[i]) dynamicFeatured.push(featS[i]);
      if (featP[i]) dynamicFeatured.push(featP[i]);
    }

    if (dynamicFeatured.length > 0) {
      setFeaturedItems(dynamicFeatured);
    } else {
      setFeaturedItems(DEFAULT_FEATURED_SLIDES);
    }

    // 1. Photography & Videography
    const photoVideo = rawSrvs.filter(s => {
      const c = (s.category?.name || '').toLowerCase();
      const n = (s.name || '').toLowerCase();
      const d = (s.businessDivision?.name || '').toLowerCase();
      return c.includes('photo') || c.includes('video') || n.includes('photo') || n.includes('video') || d.includes('photo') || d.includes('video');
    });
    setPhotoVideoServices(photoVideo);

    // 2. Catering Equipment Rentals & Catering
    const catering = rawSrvs.filter(s => {
      const c = (s.category?.name || '').toLowerCase();
      const n = (s.name || '').toLowerCase();
      const d = (s.businessDivision?.name || '').toLowerCase();
      return c.includes('cater') || n.includes('cater') || d.includes('cater') || 
             c.includes('dish') || n.includes('dish') || c.includes('buffet') || n.includes('buffet') || 
             c.includes('chafing') || n.includes('chafing') || n.includes('tableware');
    });
    setCateringServices(catering);

    // 3. Wedding Car Rentals (Excluding catering dishes)
    const carRentals = rawSrvs.filter(s => {
      const c = (s.category?.name || '').toLowerCase();
      const n = (s.name || '').toLowerCase();
      const d = (s.businessDivision?.name || '').toLowerCase();
      const isCatering = c.includes('cater') || n.includes('cater') || d.includes('cater') || 
                         c.includes('dish') || n.includes('dish') || c.includes('buffet') || n.includes('buffet');
      if (isCatering) return false;
      return c.includes('car') || n.includes('car') || d.includes('car') || 
             n.includes('limo') || n.includes('convoy') || c.includes('convoy') || 
             n.includes('sorento') || n.includes('land cruiser') || n.includes('range rover') || n.includes('benz') || 
             (d === 'car rentals' || d === 'car rental');
    });
    setCarRentalServices(carRentals);

    // 4. Wedding Services (Decor, Protocol, DJ/MC)
    const weddingGeneral = rawSrvs.filter(s => {
      const isPhoto = photoVideo.some(p => p.id === s.id);
      const isCar = carRentals.some(c => c.id === s.id);
      const isCater = catering.some(cat => cat.id === s.id);
      const isWeddingDiv = s.businessDivision?.slug === 'wedding-services' || (s.businessDivision?.name || '').toLowerCase().includes('wedding');
      return isWeddingDiv && !isPhoto && !isCar && !isCater;
    });
    setWeddingServices(weddingGeneral);

    // 5. Consultancy Services
    const consultancy = rawSrvs.filter(s =>
      s.businessDivision?.slug === 'consultancy-services' ||
      (s.businessDivision?.name || '').toLowerCase().includes('consult')
    );
    setConsultancyServices(consultancy);

    // 6. Food & Beverages
    const food = rawProds.filter(p => {
      const divStr = (p.businessDivision?.name || p.businessDivision?.slug || '').toLowerCase();
      const catStr = (p.category?.name || '').toLowerCase();
      const nameStr = (p.name || '').toLowerCase();
      return divStr.includes('food') || divStr.includes('beverage') ||
        catStr.includes('food') || catStr.includes('beverage') || catStr.includes('juice') || catStr.includes('drink') || catStr.includes('rice') ||
        nameStr.includes('juice') || nameStr.includes('rice') || nameStr.includes('drink');
    });
    setFoodProducts(food);

    // 7. Clothes & Shoes
    const clothes = rawProds.filter(p => {
      const divStr = (p.businessDivision?.name || p.businessDivision?.slug || '').toLowerCase();
      const catStr = (p.category?.name || '').toLowerCase();
      const nameStr = (p.name || '').toLowerCase();
      return divStr.includes('clothe') || divStr.includes('shoe') || divStr.includes('fashion') ||
        catStr.includes('clothe') || catStr.includes('shoe') || catStr.includes('dress') || catStr.includes('shirt') || catStr.includes('suit') ||
        nameStr.includes('shoe') || nameStr.includes('dress') || nameStr.includes('suit') || nameStr.includes('heel') || nameStr.includes('mushanana');
    });
    setClothesProducts(clothes);

    // 8. IT Supplies & Electronics
    const itItems = rawProds.filter(p => {
      const divStr = (p.businessDivision?.name || p.businessDivision?.slug || '').toLowerCase();
      const catStr = (p.category?.name || '').toLowerCase();
      const nameStr = (p.name || '').toLowerCase();
      return divStr.includes('it') || divStr.includes('tech') || divStr.includes('comput') || divStr.includes('suppl') ||
        catStr.includes('comput') || catStr.includes('laptop') || catStr.includes('it') ||
        nameStr.includes('computer') || nameStr.includes('hp') || nameStr.includes('laptop');
    });
    setItProducts(itItems);

    // Special Offers
    const offers = rawProds.filter(p => p.discountPercentage > 0 || (p.salePrice && p.salePrice < p.regularPrice));
    setSpecialOffers(offers);
  }, []);

  // Fetch live catalog with multi-attempt retry for database sleep wake-up
  const loadData = useCallback(async (isManualRetry = false) => {
    setIsConnecting(true);

    let succeeded = false;

    // Retry loop: allows sleeping database up to 3 cycles (with backoff) to wake up
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        setConnectionAttempt(attempt);
        if (attempt > 1 || isManualRetry) {
          setIsDbWakingUp(true);
        }

        const [divRes, prodRes, srvRes] = await Promise.all([
          api.get('/divisions', { retries: 2, delayMs: 1200 }),
          api.get('/products?limit=100', { retries: 2, delayMs: 1200 }),
          api.get('/services?limit=100', { retries: 2, delayMs: 1200 }),
          api.get('/videos?limit=20', { retries: 2, delayMs: 1200 }).catch(() => ({ videos: [] }))
        ]);

        const prods = Array.isArray(prodRes?.products) ? prodRes.products : [];
        const srvs = Array.isArray(srvRes?.services) ? srvRes.services : [];
        const divs = Array.isArray(divRes?.divisions) ? divRes.divisions : [];
        const vids = Array.isArray(vidRes?.videos) ? vidRes.videos : [];

        // If database returned catalog items, populate and cache
        if (prods.length > 0 || srvs.length > 0 || divs.length > 0 || vids.length > 0) {
          applyCatalog(prods, srvs, divs, vids);

          try {
            localStorage.setItem('romantic_home_cache_v2', JSON.stringify({
              products: prods,
              services: srvs,
              divisions: divs,
              videos: vids,
              timestamp: Date.now()
            }));
          } catch (_) {}

          setIsLiveConnected(true);
          setIsDbWakingUp(false);
          setIsUsingFallback(false);
          setLoading(false);
          succeeded = true;
          break;
        } else {
          // If arrays came back empty, DB might still be seeding or cold; wait and retry
          if (attempt < 3) {
            setIsDbWakingUp(true);
            await new Promise(r => setTimeout(r, 2000 * attempt));
          }
        }
      } catch (err) {
        console.warn(`⏳ [Catalog DB Wake-up] Attempt ${attempt} failed:`, err.message);
        setIsDbWakingUp(true);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2200 * attempt));
        }
      }
    }

    if (!succeeded) {
      // If no live database data arrived and user had no previous cache, activate fallback catalog
      // This ensures the homepage NEVER appears blank or broken!
      setAllProducts(prevProds => {
        if (prevProds.length === 0) {
          console.info('🛡️ Activating high-availability baseline catalog while database wakes up.');
          applyCatalog(FALLBACK_PRODUCTS, FALLBACK_SERVICES, FALLBACK_DIVISIONS, []);
          setIsUsingFallback(true);
        }
        return prevProds;
      });
    }

    setIsConnecting(false);
    setLoading(false);
  }, [applyCatalog]);

  // Initial mount: hydrate from cache immediately, then fetch live data with retry
  useEffect(() => {
    // 1. Instantly check localStorage cache so user NEVER sees a blank screen
    try {
      const cached = localStorage.getItem('romantic_home_cache_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if ((parsed.products && parsed.products.length > 0) || (parsed.services && parsed.services.length > 0)) {
          applyCatalog(parsed.products || [], parsed.services || [], parsed.divisions || [], parsed.videos || []);
          setLoading(false);
          setHasCachedData(true);
        }
      }
    } catch (_) {}

    // 2. Fetch fresh live data from database with retry
    loadData();

    // 3. Listen to global database waking-up events from API transport
    const handleDbWakeup = () => {
      setIsDbWakingUp(true);
    };
    const handleDbReady = () => {
      setIsDbWakingUp(false);
      setIsLiveConnected(true);
    };

    window.addEventListener('database-waking-up', handleDbWakeup);
    window.addEventListener('database-ready', handleDbReady);

    return () => {
      window.removeEventListener('database-waking-up', handleDbWakeup);
      window.removeEventListener('database-ready', handleDbReady);
    };
  }, [applyCatalog, loadData]);

  // Background auto-reconnector: if fallback mode is active, quietly ping database every 14s
  useEffect(() => {
    if (!isUsingFallback || isLiveConnected) return;

    const interval = setInterval(() => {
      console.log('🔄 Re-checking live database connection in background...');
      loadData(false);
    }, 14000);

    return () => clearInterval(interval);
  }, [isUsingFallback, isLiveConnected, loadData]);

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

  // Safe division set: if server returned empty divisions, use fallback divisions
  const effectiveDivisions = divisions && divisions.length > 0 ? divisions : FALLBACK_DIVISIONS;

  return (
    <div className="space-y-12 pb-16">
      {/* =========================================================================
          FIRST-TIME VISITOR SKELETON LOADER (WHILE DATABASE IS WAKING UP)
          ========================================================================= */}
      {loading && !hasCachedData && (
        <div className="max-w-7xl mx-auto px-4 space-y-10 pt-4 animate-pulse">
          {/* Skeleton Categories */}
          <div className="space-y-3">
            <div className="h-6 w-48 bg-gray-200 rounded-lg" />
            <div className="flex gap-4 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-36 h-36 bg-gray-100 border border-gray-200 rounded-2xl flex flex-col items-center justify-center p-4 gap-2 flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gray-200" />
                  <div className="w-20 h-3 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Hero Banner */}
          <div className="w-full h-80 sm:h-96 rounded-3xl bg-gray-200 relative overflow-hidden flex flex-col justify-end p-8 gap-4">
            <div className="h-5 w-32 bg-gray-300 rounded-full" />
            <div className="h-10 w-3/4 max-w-md bg-gray-300 rounded-lg" />
            <div className="h-4 w-1/2 max-w-sm bg-gray-300 rounded" />
            <div className="h-10 w-40 bg-gray-300 rounded-full mt-2" />
          </div>

          {/* Skeleton Product Row */}
          <div className="space-y-3">
            <div className="h-6 w-56 bg-gray-200 rounded-lg" />
            <div className="flex gap-4 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-72 h-80 bg-gray-100 border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 flex-shrink-0">
                  <div className="w-full h-44 bg-gray-200 rounded-xl" />
                  <div className="w-3/4 h-4 bg-gray-200 rounded" />
                  <div className="w-1/2 h-4 bg-gray-200 rounded" />
                  <div className="w-24 h-5 bg-gray-200 rounded mt-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DYNAMIC CATEGORIES HORIZONTAL SCROLLER
          ========================================================================= */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-4">
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
                    <span className="bg-brand-yellow text-brand-dark text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1.5">
                      {item._type === 'video' && <Video className="w-3.5 h-3.5 text-brand-red" />}
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

                {/* Floating Play Indicator for Video Slides */}
                {item._type === 'video' && (
                  <Link
                    to={item.targetUrl}
                    className="absolute top-1/2 right-8 md:right-20 -translate-y-1/2 z-20 hidden sm:flex flex-col items-center gap-2 group/playbtn"
                    title="Play Video"
                  >
                    <div className="w-20 h-20 rounded-full bg-brand-red/95 text-white flex items-center justify-center shadow-2xl border-4 border-white/80 group-hover/playbtn:scale-110 group-hover/playbtn:bg-red-600 transition duration-300">
                      <Play className="w-8 h-8 fill-white translate-x-0.5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white bg-black/60 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
                      Watch Video
                    </span>
                  </Link>
                )}

                  <div className="pt-2">
                    <Link
                      to={item.targetUrl || (item._type === 'service' ? `/services/${item.id}` : `/products/${item.id}`)}
                      className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-redDark text-white px-6 py-3 rounded-full font-bold text-xs sm:text-sm shadow-xl shine-effect transition transform hover:scale-105"
                    >
                      {item._type === 'video' ? <Play className="w-4 h-4 fill-white flex-shrink-0" /> : null}
                      <span>{item.ctaText || (item._type === 'video' ? 'Watch Video' : 'Discover Now')}</span>
                      {item._type !== 'video' && <ArrowRight className="w-4 h-4" />}
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
          FEATURED SPOTLIGHT VIDEOS SCROLLER
          ========================================================================= */}
      {featuredVideos && featuredVideos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-[#1C1F27] via-[#242938] to-[#1C1F27] border-2 border-brand-yellow/60 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
            {/* Background glow decoration */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 bg-brand-red text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    Spotlight Video Reel
                  </span>
                  <span className="text-brand-yellow font-bold text-xs uppercase tracking-wider">
                    Cinematic Highlights
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Video className="w-6 h-6 text-brand-yellow" />
                  <span>Featured Videos in Spotlight</span>
                </h2>
                <p className="text-xs text-gray-400">
                  Watch our latest video releases, wedding films, bridal convoys & commercial productions
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Link
                  to="/videos"
                  className="text-xs font-bold text-brand-yellow hover:text-white transition flex items-center gap-1 mr-2"
                >
                  <span>Explore All Videos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {featuredVideos.length > 3 && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => scrollContainer('videos-spotlight-scroller', 'left')}
                      className="p-2 border border-gray-700 rounded-full bg-gray-800/80 hover:bg-brand-yellow hover:text-brand-dark text-white transition shadow"
                      aria-label="Previous videos"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollContainer('videos-spotlight-scroller', 'right')}
                      className="p-2 border border-gray-700 rounded-full bg-gray-800/80 hover:bg-brand-yellow hover:text-brand-dark text-white transition shadow"
                      aria-label="Next videos"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scrolling Videos List */}
            <div
              id="videos-spotlight-scroller"
              className="relative z-10 flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x"
            >
              {featuredVideos.map((vid) => {
                const thumb = vid.thumbnailUrl || (vid.youtubeId ? `https://i.ytimg.com/vi/${vid.youtubeId}/hqdefault.jpg` : '/placeholder-video.jpg');
                return (
                  <Link
                    key={vid.id}
                    to={`/videos?play=${vid.id}`}
                    className="group min-w-[260px] sm:min-w-[300px] max-w-[300px] flex-shrink-0 bg-gray-900/90 border border-gray-800 hover:border-brand-yellow rounded-2xl overflow-hidden shadow-lg transition duration-300 hover:-translate-y-1 snap-start flex flex-col"
                  >
                    {/* Thumbnail with overlay play icon */}
                    <div className="relative aspect-video bg-black overflow-hidden">
                      <img
                        src={thumb}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-brand-red/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-brand-red transition">
                          <Play className="w-5 h-5 fill-white translate-x-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-bold">
                        <span className="bg-black/70 backdrop-blur-sm text-brand-yellow px-2 py-0.5 rounded">
                          {vid.sourceType === 'YOUTUBE' ? 'YouTube' : 'Uploaded'}
                        </span>
                        {vid.duration ? (
                          <span className="bg-black/80 backdrop-blur-sm text-white px-2 py-0.5 rounded">
                            {vid.duration}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-white group-hover:text-brand-yellow transition line-clamp-2 leading-snug">
                        {vid.title}
                      </h3>
                      {vid.description && (
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {vid.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-800 text-[11px] text-gray-400">
                        <span>{vid.viewsCount || 0} views</span>
                        <span className="text-brand-yellow font-semibold group-hover:underline flex items-center gap-1">
                          <span>Watch now</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          ORDER-AWARE BUSINESS DIVISION SECTIONS
          ========================================================================= */}
      {effectiveDivisions.map((div) => {
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

        // 3. Catering Equipment Rentals & Catering
        if (nameLower.includes('cater') || nameLower.includes('dish') || nameLower.includes('buffet')) {
          const specificCatering = allServices.filter(s => s.businessDivisionId === div.id || (s.businessDivision?.name || '').toLowerCase() === nameLower);
          const cateringToDisplay = specificCatering.length > 0 ? specificCatering : cateringServices;
          if (cateringToDisplay.length === 0) return null;
          return (
            <section key={div.id || 'catering'} className="max-w-7xl mx-auto px-4">
              <div className="border border-brand-border rounded-3xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
                      <Utensils className="w-6 h-6 text-brand-yellow" />
                      <span>🍽️ {div.name}</span>
                    </h2>
                    <p className="text-xs text-brand-muted">
                      {div.description || 'Chafing dishes, banquet tableware, warming trays, and professional event catering equipment rentals'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/services?division=${encodeURIComponent(div.name)}`} className="text-xs font-bold text-brand-red hover:underline hidden sm:block">
                      View {div.name} &rarr;
                    </Link>
                    {cateringToDisplay.length > 3 && (
                      <div className="flex gap-1">
                        <button onClick={() => scrollContainer(`catering-scroller-${div.id || 'cater'}`, 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Previous">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => scrollContainer(`catering-scroller-${div.id || 'cater'}`, 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Next">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div id={`catering-scroller-${div.id || 'cater'}`} className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                  {cateringToDisplay.map((s) => (
                    <div key={s.id} className="min-w-[260px] sm:min-w-[320px] max-w-[320px] flex-shrink-0 snap-start">
                      <ServiceCard service={s} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        // 4. Car rentals (ONLY actual cars, limousines, convoys - NEVER catering!)
        if ((nameLower.includes('car') || nameLower.includes('transport') || nameLower.includes('convoy') || nameLower.includes('fleet') || nameLower.includes('limo')) && !nameLower.includes('cater')) {
          const specificCars = allServices.filter(s => s.businessDivisionId === div.id || (s.businessDivision?.name || '').toLowerCase() === nameLower);
          const carToDisplay = specificCars.length > 0 ? specificCars : carRentalServices;
          if (carToDisplay.length === 0) return null;
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
                    {carToDisplay.length > 3 && (
                      <div className="flex gap-1">
                        <button onClick={() => scrollContainer(`cars-scroller-${div.id || 'car'}`, 'left')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Previous">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => scrollContainer(`cars-scroller-${div.id || 'car'}`, 'right')} className="p-2 border rounded-full bg-white hover:bg-brand-yellow transition" aria-label="Next">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div id={`cars-scroller-${div.id || 'car'}`} className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                  {carToDisplay.map((s) => (
                    <div key={s.id} className="min-w-[260px] sm:min-w-[320px] max-w-[320px] flex-shrink-0 snap-start">
                      <ServiceCard service={s} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        // 5. Consultancy Services
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

        // 6. Food & Beverages
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

        // 7. Clothes & Shoes
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

        // 8. Generic / Newly Created Custom Business Division
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
                    <span>{getCategoryEmoji(div.name)} {div.name}</span>
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
