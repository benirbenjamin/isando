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

function normalizeSocialUrl(url, platform) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  switch (platform) {
    case 'instagram': return `https://instagram.com/${handle}`;
    case 'facebook': return `https://facebook.com/${handle}`;
    case 'twitter': return `https://x.com/${handle}`;
    case 'linkedin': return handle.includes('/') ? `https://linkedin.com/${handle}` : `https://linkedin.com/company/${handle}`;
    case 'youtube': return handle.startsWith('@') ? `https://youtube.com/${handle}` : `https://youtube.com/@${handle}`;
    case 'tiktok': return `https://tiktok.com/@${handle}`;
    default: return `https://${trimmed}`;
  }
}

export default function Footer() {
  const [divisions, setDivisions] = useState(DEFAULT_FOOTER_DIVISIONS);
  const [settings, setSettings] = useState({
    company_name: 'Romantic T Solutions Ltd',
    company_phone: '+250 786 639 945',
    whatsapp_number: '250786639945',
    company_email: 'info@romantictsolutions.com',
    company_address: 'Kigali, Rwanda',
    social_instagram: '',
    social_facebook: '',
    social_twitter: '',
    social_linkedin: '',
    social_youtube: '',
    social_tiktok: '',
  });

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.get('/divisions').catch(() => ({ divisions: [] })),
      api.get('/settings').catch(() => ({ settings: {} }))
    ]).then(([divRes, setRes]) => {
      if (!isMounted) return;
      if (Array.isArray(divRes?.divisions) && divRes.divisions.length > 0) {
        setDivisions(divRes.divisions);
      }
      if (setRes?.settings && typeof setRes.settings === 'object') {
        setSettings(prev => ({ ...prev, ...setRes.settings }));
      }
    });
    return () => { isMounted = false; };
  }, []);

  const companyName = settings.company_name || 'Romantic T Solutions Ltd';
  const displayPhone = settings.company_phone || '+250 786 639 945';
  const whatsappNum = settings.whatsapp_number || '250786639945';
  const displayEmail = settings.company_email || 'info@romantictsolutions.com';
  const displayAddress = settings.company_address || 'Kigali, Rwanda';

  const divisionsDescription = divisions.length > 0
    ? divisions.map(d => d.name).join(', ')
    : 'Food & Beverages, Fashion Apparel, Wedding Services and Business Consultancy';

  // Configured or fallback social channels
  const socialChannels = [
    {
      name: 'Instagram',
      url: normalizeSocialUrl(settings.social_instagram || 'https://instagram.com/romantictsolutions', 'instagram'),
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
    {
      name: 'Facebook',
      url: normalizeSocialUrl(settings.social_facebook || 'https://facebook.com/romantictsolutions', 'facebook'),
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      url: normalizeSocialUrl(settings.social_twitter || 'https://x.com/romantictsolutions', 'twitter'),
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      url: normalizeSocialUrl(settings.social_linkedin || 'https://linkedin.com/company/romantictsolutions', 'linkedin'),
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      ),
    },
    {
      name: 'YouTube',
      url: normalizeSocialUrl(settings.social_youtube || 'https://youtube.com/@romantictsolutions', 'youtube'),
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
    {
      name: 'TikTok',
      url: normalizeSocialUrl(settings.social_tiktok || 'https://tiktok.com/@romantictsolutions', 'tiktok'),
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.19 2.09 2.35 2.26.88.14 1.78-.07 2.49-.62.6-.43.99-1.06 1.14-1.78.13-.57.15-1.16.14-1.75.02-4.99.01-9.98.01-14.97z"/>
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-[#1C1F27] text-gray-300 pt-10 pb-6 border-t-4 border-brand-yellow text-sm">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Column */}
        <div className="md:col-span-1">
          <img 
            src="/logo.png" 
            alt={companyName} 
            className="h-12 w-auto bg-white p-1.5 rounded-lg mb-3 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://i.postimg.cc/G2zNf3Fq/LOGO.png';
            }}
          />
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            {companyName} brings {divisionsDescription} together under one trusted name in Rwanda.
          </p>
          
          <div className="space-y-4">
            <a
              href={getWhatsAppLink(whatsappNum, `Hello ${companyName}, I need assistance.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full font-bold text-xs shadow hover:opacity-90 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>

            {/* Social channels row */}
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Connect With Us</span>
              <div className="flex flex-wrap items-center gap-2">
                {socialChannels.map((channel) => (
                  <a
                    key={channel.name}
                    href={channel.url}
                    target="_blank"
                    rel="noreferrer"
                    title={channel.name}
                    className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-brand-yellow hover:text-brand-dark text-gray-400 flex items-center justify-center transition shadow-sm"
                  >
                    {channel.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
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

        {/* Contact Info (Dynamic from Settings) */}
        <div>
          <h4 className="text-white font-bold mb-3 border-b border-gray-700 pb-1">Contact Us</h4>
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-yellow flex-shrink-0" />
              <a 
                href={`tel:${displayPhone.replace(/[^0-9+]/g, '')}`} 
                className="hover:text-brand-yellow transition font-medium"
              >
                {displayPhone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#25D366] flex-shrink-0" />
              <a
                href={getWhatsAppLink(whatsappNum, `Hello ${companyName}, I need assistance.`)}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#25D366] transition font-medium"
              >
                WhatsApp: {whatsappNum}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-yellow flex-shrink-0" />
              <a 
                href={`mailto:${displayEmail}`} 
                className="hover:text-brand-yellow transition font-medium"
              >
                {displayEmail}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-red flex-shrink-0" />
              <span>{displayAddress}</span>
            </li>
          </ul>

          {/* Social Links under Contact Info */}
          <div className="mt-4 pt-3 border-t border-gray-800">
            <span className="text-[11px] font-bold text-gray-400 block mb-2">Official Socials:</span>
            <div className="flex flex-wrap items-center gap-2">
              {socialChannels.map((channel) => (
                <a
                  key={channel.name}
                  href={channel.url}
                  target="_blank"
                  rel="noreferrer"
                  title={channel.name}
                  className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-brand-yellow hover:text-brand-dark text-gray-400 flex items-center justify-center transition shadow-sm"
                >
                  {channel.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
        <div>
          &copy; {new Date().getFullYear()} {companyName}. All Rights Reserved.
        </div>
        <div className="flex items-center gap-3">
          {socialChannels.map((channel) => (
            <a
              key={channel.name}
              href={channel.url}
              target="_blank"
              rel="noreferrer"
              title={channel.name}
              className="text-gray-400 hover:text-brand-yellow transition"
            >
              {channel.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
