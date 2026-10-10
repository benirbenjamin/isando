import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, Eye, Target, Shield, CheckCircle, 
  Sparkles, Award, HeartHandshake, Phone, MessageCircle
} from 'lucide-react';
import { getWhatsAppLink } from '../services/api';

export default function AboutPage() {
  const coreValues = [
    {
      number: '1',
      title: 'Professionalism',
      description: 'We implement what learnt with respect and integrity',
      icon: Award,
      badgeColor: 'bg-brand-red text-white',
    },
    {
      number: '2',
      title: 'Accountability',
      description: 'We are decisive and Responsible',
      icon: Shield,
      badgeColor: 'bg-brand-yellow text-brand-dark',
    },
    {
      number: '3',
      title: 'Honesty',
      description: 'We always seek to do what is Right',
      icon: CheckCircle,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      number: '4',
      title: 'Customer Expectations',
      description: 'We always aim to satisfy our costomers',
      icon: HeartHandshake,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      number: '5',
      title: 'Innovative',
      description: 'We Solve it differently',
      icon: Sparkles,
      badgeColor: 'bg-purple-600 text-white',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-5">
        <span className="bg-brand-yellow text-brand-dark text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
          ABOUT OUR COMPANY
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-brand-dark leading-tight">
          Romantic T Solutions Ltd
        </h1>
        <p className="text-base sm:text-lg text-brand-red font-extrabold">
          Your Trusted Partner in Business Solutions!!!
        </p>

        {/* Main Overview Text */}
        <div className="bg-brand-soft border border-brand-border rounded-3xl p-6 sm:p-8 text-sm sm:text-base text-gray-700 leading-relaxed font-medium shadow-sm text-left sm:text-center">
          <em>
            Romantic T Solutions is an e-commerce platform,all in one service provider based in Kigali,Rwanda.Romantic T Solutions  Provides  a wide range of professional services integrating Photography&Videography,Catering Equipment Rentals, Luxury Car rentals,Food &Beverages,IT Supplies and  Consultancy services For Individuals, Businesses,Private and Public institutions!!!
          </em>
        </div>

        {/* Lightning Speed Delivery Promise Banner */}
        <div className="bg-gradient-to-r from-brand-red to-rose-700 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 shadow-lg">
          <Zap className="w-6 h-6 text-brand-yellow fill-brand-yellow flex-shrink-0 animate-bounce" />
          <span className="text-sm sm:text-base font-black italic">
            Make order you will be served within 24hours at Lightning Speed!!!
          </span>
        </div>
      </div>

      {/* Vision & Mission Statements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Vision Card */}
        <div className="bg-white border-2 border-brand-yellow rounded-3xl p-6 sm:p-8 shadow-sm space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-brand-yellow/20 text-brand-dark flex items-center justify-center mb-4">
            <Eye className="w-6 h-6 text-brand-dark" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
            Vision statement
          </span>
          <h3 className="text-xl font-black text-brand-dark">Our Vision</h3>
          <p className="text-sm text-gray-700 leading-relaxed font-semibold">
            To be a champion in High-value event solutions ,ICT Solutions, Agri-Food Supply ,and Consultancy services.
          </p>
        </div>

        {/* Mission Card */}
        <div className="bg-white border-2 border-brand-red/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-3 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-brand-red flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-brand-red" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-red bg-rose-50 px-3 py-1 rounded-full">
            Mission statement
          </span>
          <h3 className="text-xl font-black text-brand-dark">Our Mission</h3>
          <p className="text-sm text-gray-700 leading-relaxed font-semibold">
            To provide High Quality Product access and Consultancy to every Rwandan.
          </p>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-black text-brand-red uppercase tracking-wider">
            OUR FOUNDATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-dark">
            Core Values
          </h2>
          <p className="text-xs text-gray-500">
            The principles that guide our everyday operations and client service
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {coreValues.map((val) => {
            const IconComp = val.icon;
            return (
              <div 
                key={val.number} 
                className="bg-white border border-brand-border hover:border-brand-yellow rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-8 h-8 rounded-xl ${val.badgeColor} font-black text-xs flex items-center justify-center shadow-xs`}>
                      {val.number}
                    </span>
                    <IconComp className="w-5 h-5 text-gray-400" />
                  </div>
                  <h4 className="font-extrabold text-sm text-brand-dark mb-1">
                    {val.title}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {val.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#1C1F27] to-gray-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl max-w-5xl mx-auto border-t-4 border-brand-yellow">
        <div>
          <h3 className="text-2xl font-black">Need Products or Event Services?</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-lg">
            We deliver lightning-speed service across Kigali and Rwanda. Contact us directly or order online.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={getWhatsAppLink('250786639945', 'Hello Romantic T Solutions, I would like to inquire about your services and products.')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-5 py-3 rounded-full font-bold text-xs shadow transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark px-5 py-3 rounded-full font-bold text-xs shadow transition"
          >
            <span>Explore Products</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
