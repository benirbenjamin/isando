import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, User, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getWhatsAppLink } from '../services/api';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-brand-yellow shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Romantic T Solutions Ltd" 
              className="h-11 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://i.postimg.cc/G2zNf3Fq/LOGO.png';
              }}
            />
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl flex bg-brand-soft border border-brand-border rounded-full overflow-hidden shadow-inner">
            <input
              type="text"
              placeholder="Search products, shoes, food & services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-transparent text-sm text-brand-dark focus:outline-none min-w-0"
            />
            <button type="submit" className="bg-brand-yellow hover:bg-brand-yellowDark px-5 font-bold text-brand-dark text-sm flex items-center gap-1 transition">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {/* Right Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/products" className="hidden md:inline-block px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-brand-red">
              Products
            </Link>
            <Link to="/services" className="hidden md:inline-block px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-brand-red">
              Services
            </Link>
            <Link to="/about" className="hidden lg:inline-block px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-brand-red">
              About
            </Link>

            {/* WhatsApp CTA */}
            <a
              href={getWhatsAppLink('250786639945', 'Hello Romantic T Solutions Ltd, I would like to inquire about your products and services.')}
              target="_blank"
              rel="noreferrer"
              className="bg-[#25D366] hover:bg-[#20ba59] text-white px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Platform Auth Button */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-brand-dark text-white px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 hover:bg-black transition shadow"
              >
                <LayoutDashboard className="w-4 h-4 text-brand-yellow" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs font-semibold">
          <Link to="/products?division=Food%20%26%20Beverages" className="px-3.5 py-1.5 rounded-full border border-brand-border bg-white hover:bg-brand-yellow hover:border-brand-yellow transition flex-shrink-0">
            🍔 Food & Beverages
          </Link>
          <Link to="/products?division=Clothes%20%26%20Shoes" className="px-3.5 py-1.5 rounded-full border border-brand-border bg-white hover:bg-brand-yellow hover:border-brand-yellow transition flex-shrink-0">
            👟 Clothes & Shoes
          </Link>
          <Link to="/services?division=Wedding%20Services" className="px-3.5 py-1.5 rounded-full border border-brand-border bg-white hover:bg-brand-yellow hover:border-brand-yellow transition flex-shrink-0">
            💍 Wedding Services
          </Link>
          <Link to="/services?division=Consultancy%20Services" className="px-3.5 py-1.5 rounded-full border border-brand-border bg-white hover:bg-brand-yellow hover:border-brand-yellow transition flex-shrink-0">
            💼 Consultancy
          </Link>
          <Link to="/products?onSale=true" className="px-3.5 py-1.5 rounded-full border border-brand-red text-brand-red bg-red-50 hover:bg-brand-red hover:text-white transition flex-shrink-0">
            🔥 Special Offers (% On Sale)
          </Link>
        </div>
      </div>
    </header>
  );
}
