import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { api, getWhatsAppLink } from '../services/api';

const DEFAULT_FOOTER_DIVISIONS = [
  { id: 'f-1', name: 'Car rentals' },
  { id: 'f-2', name: 'Clothes & Shoes' },
  { id: 'f-3', name: 'Consultancy Services' },
  { id: 'f-4', name: 'Food & Beverages' },
  { id: 'f-5', name: 'Wedding Services' },
];

export default function Footer() {
  const [divisions, setDivisions] = useState(DEFAULT_FOOTER_DIVISIONS);

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

  const divisionsDescription = divisions.length > 0
    ? divisions.map(d => d.name).join(', ')
    : 'Food & Beverages, Fashion Apparel, Wedding Services and Business Consultancy';

  return (
    <footer className="bg-[#1C1F27] text-gray-300 pt-10 pb-6 border-t-4 border-brand-yellow text-sm">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Column */}
        <div className="md:col-span-1">
          <img 
            src="/logo.png" 
            alt="Romantic T Solutions Ltd" 
            className="h-12 w-auto bg-white p-1.5 rounded-lg mb-3 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://i.postimg.cc/G2zNf3Fq/LOGO.png';
            }}
          />
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Romantic T Solutions Ltd brings {divisionsDescription} together under one trusted name in Rwanda.
          </p>
          <a
            href={getWhatsAppLink('250786639945', 'Hello Romantic T Solutions, I need assistance.')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full font-bold text-xs shadow hover:opacity-90 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        {/* Dynamic Business Divisions */}
        <div>
          <h4 className="text-white font-bold mb-3 border-b border-gray-700 pb-1">Our Divisions</h4>
          <ul className="space-y-2 text-xs">
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
                <li key={div.id || div.name}>
                  <Link to={targetUrl} className="hover:text-brand-yellow transition">
                    {div.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-3 border-b border-gray-700 pb-1">Quick Links</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/products" className="hover:text-brand-yellow">Products Catalog</Link></li>
            <li><Link to="/services" className="hover:text-brand-yellow">Service Offerings</Link></li>
            <li><Link to="/about" className="hover:text-brand-yellow">About Our Company</Link></li>
            <li><Link to="/contact" className="hover:text-brand-yellow">Contact Us</Link></li>
            <li><Link to="/login" className="hover:text-brand-yellow font-semibold text-brand-yellow">Employee / Admin Login</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-white font-bold mb-3 border-b border-gray-700 pb-1">Contact Us</h4>
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-yellow flex-shrink-0" />
              <span>+250 786 639 945</span>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#25D366] flex-shrink-0" />
              <span>WhatsApp: 0786 639 945</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-yellow flex-shrink-0" />
              <span>info@romantictsolutions.com</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-red flex-shrink-0" />
              <span>Kigali, Rwanda</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 border-t border-gray-800 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Romantic T Solutions Ltd. All Rights Reserved.
      </div>
    </footer>
  );
}
