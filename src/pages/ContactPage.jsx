import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { api, getWhatsAppLink } from '../services/api';

export default function ContactPage() {
  const [settings, setSettings] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get('/settings')
      .then(res => {
        if (isMounted && res?.settings) {
          setSettings(res.settings);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/messages/public-inbox', formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-brand-dark mb-2">Contact Us</h1>
        <p className="text-xs text-brand-muted">
          Get in touch with Romantic T Solutions Ltd for inquiries, product orders, or event bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Left: Interactive Contact Form (Sends directly to App Inbox!) */}
        <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-brand-dark">Send us a Direct Message</h2>
            <p className="text-xs text-brand-muted">Your inquiry will be delivered straight to our platform inbox</p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <b className="block text-base font-bold">Message Sent Successfully!</b>
              <p className="text-xs text-emerald-700">Thank you for reaching out. Our team will review your inquiry in our internal inbox and contact you shortly.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-bold text-emerald-800 underline"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-brand-red p-3 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-brand-dark block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jean Paul"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-brand-dark block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="jean@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-brand-dark block mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="0788 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-brand-dark block mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="Wedding Services Inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-brand-dark block mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can Romantic T Solutions Ltd assist you today?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3 rounded-2xl font-black text-xs shadow transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Sending to App Inbox...' : 'Send Message to App Inbox'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right: Contact Cards & WhatsApp */}
        <div className="space-y-4">
          <a
            href={getWhatsAppLink(settings.whatsapp_number || '250786639945', `Hello ${settings.company_name || 'Romantic T Solutions'}, I need assistance.`)}
            target="_blank"
            rel="noreferrer"
            className="bg-brand-soft border border-brand-border rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition block"
          >
            <div className="w-12 h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-sm text-brand-dark">WhatsApp Instant Chat</b>
              <span className="text-xs text-emerald-700 font-bold">+{settings.whatsapp_number || '250786639945'}</span>
            </div>
          </a>

          <a
            href={`tel:${(settings.company_phone || '+250 786 639 945').replace(/[^0-9+]/g, '')}`}
            className="bg-brand-soft border border-brand-border rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition block"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-yellow text-brand-dark flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-sm text-brand-dark">Phone Line</b>
              <span className="text-xs text-gray-700 font-medium">{settings.company_phone || '0786 639 945'}</span>
            </div>
          </a>

          <div className="bg-brand-soft border border-brand-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-red text-white flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <b className="block text-sm text-brand-dark">Location</b>
              <span className="text-xs text-gray-700 font-medium">{settings.company_address || 'Kigali, Rwanda'}</span>
            </div>
          </div>

          {/* WhatsApp Direct Action Banner */}
          <div className="bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-3xl p-6 text-white shadow-xl">
            <h3 className="text-xl font-black mb-1">Or Chat Directly on WhatsApp</h3>
            <p className="text-xs opacity-90 mb-4">
              Get instant answers regarding product availability, sizes, or event dates.
            </p>
            <a
              href={getWhatsAppLink(settings.whatsapp_number || '250786639945', `Hello ${settings.company_name || 'Romantic T Solutions'}, I need assistance.`)}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-white text-[#128C7E] hover:bg-gray-100 py-3 px-4 rounded-xl font-black text-xs text-center shadow transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
