import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, LogIn, LayoutDashboard, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getWhatsAppLink } from '../services/api';

function getDivisionEmoji(name = '') {
  const n = (name || '').toLowerCase();
  if (n.includes('car') || n.includes('rental') || n.includes('convoy')) return '🚗';
  if (n.includes('cloth') || n.includes('shoe') || n.includes('dress') || n.includes('fashion')) return '👟';
  if (n.includes('food') || n.includes('beverage') || n.includes('juice') || n.includes('drink')) return '🍔';
  if (n.includes('wedding') || n.includes('decor')) return '💍';
  if (n.includes('consult')) return '💼';
  if (n.includes('photo') || n.includes('video')) return '📸';
  return '🏷️';
}

const DEFAULT_DIVISIONS = [
  { id: 'def-car', name: 'Car rentals' },
  { id: 'def-clothes', name: 'Clothes & Shoes' },
  { id: 'def-consult', name: 'Consultancy Services' },
  { id: 'def-food', name: 'Food & Beverages' },
  { id: 'def-wedding', name: 'Wedding Services' },
];

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [divisions, setDivisions] = useState(DEFAULT_DIVISIONS);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    api.get('/divisions')
      .then(res => {
        if (isMounted && Array.isArray(res.divisions) && res.divisions.length > 0) {
          setDivisions(res.divisions);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-brand-yellow shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Romantic T Solutions Ltd" 
              className="h-10 sm:h-11 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://i.postimg.cc/G2zNf3Fq/LOGO.png';
              }}
            />
          </Link>

          {/* Desktop Search Bar (hidden on mobile, expanded after divisions on mobile) */}
          <form 
            onSubmit={handleSearch} 
            className="hidden md:flex flex-1 max-w-xl bg-brand-soft border border-brand-border rounded-full overflow-hidden shadow-inner"
          >
            <input
              type="text"
              placeholder="Search products, shoes, food & services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-transparent text-sm text-brand-dark focus:outline-none min-w-0"
            />
            <button 
              type="submit" 
              className="bg-brand-yellow hover:bg-brand-yellowDark px-5 font-bold text-brand-dark text-sm flex items-center gap-1 transition"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>

          {/* Right Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop-only Home button (removed from mobile view as requested) */}
            <Link 
              to="/" 
              className="hidden md:flex px-3 py-1.5 text-sm font-bold text-brand-dark hover:text-brand-red items-center gap-1.5 transition"
            >
              <Home className="w-4 h-4 text-brand-red" />
              <span>Home</span>
            </Link>

            <Link to="/products" className="hidden lg:inline-block px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-brand-red">
              Products
            </Link>
            <Link to="/services" className="hidden lg:inline-block px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-brand-red">
              Services
            </Link>
            <Link to="/about" className="hidden xl:inline-block px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-brand-red">
              About
            </Link>

            {/* Desktop-only WhatsApp button (removed from mobile top view as requested) */}
            <a
              href={getWhatsAppLink('250786639945', 'Hello Romantic T Solutions Ltd, I would like to inquire about your products and services.')}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex bg-[#25D366] hover:bg-[#20ba59] text-white px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm items-center gap-1.5 shadow transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            {/* Platform Auth / Dashboard Button */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-brand-dark text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 hover:bg-black transition shadow"
              >
                <LayoutDashboard className="w-4 h-4 text-brand-yellow" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic Business Divisions Menu Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2.5 pb-1 no-scrollbar text-xs font-semibold">
          {divisions.map((div) => {
            const isServiceDiv = (
              div.name.toLowerCase().includes('service') ||
              div.name.toLowerCase().includes('rental') ||
              div.name.toLowerCase().includes('consult') ||
              div.name.toLowerCase().includes('photo') ||
              div.name.toLowerCase().includes('wedding')
            ) && !div.name.toLowerCase().includes('cloth') && !div.name.toLowerCase().includes('food');

            const targetUrl = isServiceDiv
              ? `/services?division=${encodeURIComponent(div.name)}`
              : `/products?division=${encodeURIComponent(div.name)}`;

            return (
              <Link
                key={div.id || div.name}
                to={targetUrl}
                className="px-3.5 py-1.5 rounded-full border border-brand-border bg-white hover:bg-brand-yellow hover:border-brand-yellow transition flex-shrink-0 flex items-center gap-1.5 shadow-sm text-brand-dark whitespace-nowrap"
              >
                <span>{getDivisionEmoji(div.name)}</span>
                <span>{div.name}</span>
              </Link>
            );
          })}

          {/* Special Offers Pill */}
          <Link
            to="/products?onSale=true"
            className="px-3.5 py-1.5 rounded-full border border-brand-red text-brand-red bg-red-50 hover:bg-brand-red hover:text-white transition flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap font-bold shadow-sm"
          >
            <span>🔥</span>
            <span>Special Offers (% On Sale)</span>
          </Link>
        </div>

        {/* Mobile View: Expanded Search Bar right after divisions */}
        <div className="md:hidden pt-2">
          <form 
            onSubmit={handleSearch} 
            className="flex bg-brand-soft border border-brand-border rounded-full overflow-hidden shadow-inner w-full"
          >
            <input
              type="text"
              placeholder="Search products, shoes, food & services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-transparent text-xs sm:text-sm text-brand-dark focus:outline-none min-w-0"
            />
            <button 
              type="submit" 
              className="bg-brand-yellow hover:bg-brand-yellowDark px-4 font-bold text-brand-dark text-xs sm:text-sm flex items-center gap-1.5 transition flex-shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
