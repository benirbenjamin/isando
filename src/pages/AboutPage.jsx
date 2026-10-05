import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, HeartHandshake, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="bg-brand-yellow text-brand-dark text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
          ABOUT OUR COMPANY
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-brand-dark">
          Romantic T Solutions Ltd
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          We bring Food & Beverages, Fashion Apparel, Wedding Services, and Business Consultancy together under one trusted name in Rwanda. Quality products, reliable execution teams, and friendly customer support.
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-brand-yellow flex items-center justify-center mb-4">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Food & Beverages</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Bulk supplies, quality long-grain rice, crate drinks, natural fruit juices, and catering ingredients for businesses and events.
          </p>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-brand-red flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Clothes & Shoes</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Men's shoes, women's dresses, cotton T-shirts, leather footwear, and trendy fashion accessories.
          </p>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Wedding Services</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Full-day 4K videography, drone shots, photography, venue decoration, catering chefs, decorated wedding cars, sound & MC.
          </p>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Consultancy</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Business strategy plans, market research, event planning advice, procurement support, and staff training workshops.
          </p>
        </div>
      </div>
    </div>
  );
}
