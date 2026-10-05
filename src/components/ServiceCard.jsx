import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, MessageCircle, ArrowRight } from 'lucide-react';
import { formatCurrency, getWhatsAppLink } from '../services/api';

export default function ServiceCard({ service }) {
  const images = Array.isArray(service.images) 
    ? service.images 
    : (typeof service.images === 'string' ? JSON.parse(service.images || '[]') : []);
  const mainImage = images[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=70';

  const waMsg = `Hello Romantic T Solutions, I am interested in your ${service.name} service. I would like to know more about availability and pricing.`;

  return (
    <div className="group bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="relative aspect-video overflow-hidden bg-brand-soft">
        <img
          src={mainImage}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=70';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
        <span className="absolute top-2.5 left-2.5 bg-brand-yellow text-brand-dark text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow">
          {service.category?.name || 'SERVICE'}
        </span>
        <div className="absolute bottom-2.5 left-3 text-white">
          <span className="text-xs font-semibold opacity-90">{service.businessDivision?.name}</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/services/${service.id}`}>
            <h3 className="font-bold text-lg text-brand-dark group-hover:text-brand-red transition line-clamp-1 mb-1">
              {service.name}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {service.description}
          </p>
          {service.location && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-3">
              <MapPin className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />
              <span>{service.location}</span>
            </div>
          )}
        </div>

        <div>
          <div className="text-sm font-bold text-brand-dark mb-3">
            {service.startingPrice ? (
              <span>From <strong className="text-brand-red font-black text-base">{formatCurrency(service.startingPrice)}</strong></span>
            ) : (
              <span className="text-brand-red font-bold">Contact for Pricing</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/services/${service.id}`}
              className="py-2 px-2 bg-gray-100 hover:bg-gray-200 text-brand-dark rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1 transition"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href={getWhatsAppLink('250786639945', waMsg)}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-2 bg-[#25D366] hover:bg-[#1faa52] text-white rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1 shadow transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
