import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { MessageCircle } from 'lucide-react';
import { getWhatsAppLink } from '../services/api';

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-dark">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Floating Action Button for WhatsApp */}
      <a
        href={getWhatsAppLink('250786639945', 'Hello Romantic T Solutions Ltd, I would like to inquire about your products and services.')}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-110 animate-pulse-green transition-transform"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
      </a>
    </div>
  );
}
