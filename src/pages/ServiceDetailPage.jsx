import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, MessageCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api, formatCurrency, getWhatsAppLink } from '../services/api';
import ImageSlider from '../components/ImageSlider';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadService() {
      setLoading(true);
      try {
        const data = await api.get(`/services/${id}`);
        setService(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [id]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500 font-bold">Loading service...</div>;
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-brand-dark mb-2">Service Not Found</h2>
        <Link to="/services" className="text-brand-red font-bold underline">&larr; Return to Services</Link>
      </div>
    );
  }

  let images = [];
  try {
    images = Array.isArray(service.images) ? service.images : JSON.parse(service.images || '[]');
  } catch {
    images = service.images ? [service.images] : [];
  }

  if (service.featuredImage && !images.some(img => (typeof img === 'string' ? img === service.featuredImage : img?.url === service.featuredImage))) {
    images = [{ url: service.featuredImage, caption: 'Featured Cover' }, ...images];
  }

  let features = [];
  try {
    features = Array.isArray(service.features) ? service.features : JSON.parse(service.features || '[]');
  } catch {
    features = [];
  }

  const waMsg = `Hello Romantic T Solutions, I am interested in your ${service.name} service. I would like to know more about availability and pricing.`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <Link to="/services" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-brand-red">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Services</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-4">
          <ImageSlider images={images} title={service.name} aspectRatio="aspect-video" />
        </div>

        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="bg-brand-yellow text-brand-dark px-3 py-1 rounded-full text-xs font-black">
                {service.businessDivision?.name}
              </span>
              <span className="bg-brand-soft border border-brand-border px-3 py-1 rounded-full text-xs font-semibold text-brand-dark">
                {service.category?.name}
              </span>
            </div>

            <h1 className="text-3xl font-black text-brand-dark">{service.name}</h1>

            <div className="text-2xl font-black text-brand-red">
              {service.startingPrice ? `From ${formatCurrency(service.startingPrice)}` : 'Pricing Negotiable / Contact Us'}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed border-t border-b border-gray-100 py-3">
              {service.description}
            </p>

            {service.location && (
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <MapPin className="w-4 h-4 text-brand-red" />
                <span>Coverage: {service.location}</span>
              </div>
            )}

            {/* Features list */}
            {features.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-extrabold uppercase text-brand-dark">Service Highlights & Features:</h4>
                <ul className="space-y-1.5">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-gray-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <a
              href={getWhatsAppLink('250786639945', waMsg)}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#1faa52] text-white py-3.5 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shine-effect transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span>CONTACT ON WHATSAPP</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
