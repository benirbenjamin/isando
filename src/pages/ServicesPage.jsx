import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import ServiceCard from '../components/ServiceCard';

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentDivision = searchParams.get('division') || '';

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        let query = `/services?limit=100`;
        if (currentDivision) query += `&division=${encodeURIComponent(currentDivision)}`;

        const res = await api.get(query);
        setServices(res.services || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [currentDivision]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-brand-dark">Our Services</h1>
        <p className="text-xs text-brand-muted mt-1">
          Professional Wedding Services & Consultancy Solutions in Rwanda
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => setSearchParams(new URLSearchParams())}
          className={`px-4 py-2 rounded-full border transition ${!currentDivision ? 'bg-brand-yellow border-brand-yellow text-brand-dark font-extrabold' : 'bg-white border-brand-border hover:bg-gray-50'}`}
        >
          All Services
        </button>
        <button
          onClick={() => setSearchParams({ division: 'Wedding Services' })}
          className={`px-4 py-2 rounded-full border transition ${currentDivision === 'Wedding Services' ? 'bg-brand-yellow border-brand-yellow text-brand-dark font-extrabold' : 'bg-white border-brand-border hover:bg-gray-50'}`}
        >
          💍 Wedding Services
        </button>
        <button
          onClick={() => setSearchParams({ division: 'Consultancy Services' })}
          className={`px-4 py-2 rounded-full border transition ${currentDivision === 'Consultancy Services' ? 'bg-brand-yellow border-brand-yellow text-brand-dark font-extrabold' : 'bg-white border-brand-border hover:bg-gray-50'}`}
        >
          💼 Consultancy Services
        </button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-gray-100 rounded-2xl aspect-video" />
          ))}
        </div>
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-brand-soft rounded-3xl border border-brand-border">
          <p className="text-base font-bold text-brand-dark">No services found in this category</p>
        </div>
      )}
    </div>
  );
}
