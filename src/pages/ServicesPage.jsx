import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tag, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Layers, Check } from 'lucide-react';
import { api } from '../services/api';
import ServiceCard from '../components/ServiceCard';

function getDivisionEmoji(name = '') {
  const n = (name || '').toLowerCase();
  if (n.includes('car') || n.includes('rental') || n.includes('convoy')) return '🚗';
  if (n.includes('cloth') || n.includes('shoe') || n.includes('dress') || n.includes('fashion')) return '👟';
  if (n.includes('food') || n.includes('beverage') || n.includes('juice') || n.includes('drink')) return '🍔';
  if (n.includes('wedding') || n.includes('decor')) return '💍';
  if (n.includes('cater')) return '🍽️';
  if (n.includes('consult')) return '💼';
  if (n.includes('photo') || n.includes('video')) return '📸';
  if (n.includes('tech') || n.includes('it') || n.includes('suppl')) return '💻';
  return '💼';
}

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoryScrollRef = useRef(null);

  const currentDivision = searchParams.get('division') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';

  // 1. Fetch Dynamic Business Divisions & their categories
  useEffect(() => {
    async function loadDivisions() {
      try {
        const res = await api.get('/divisions');
        setDivisions(res.divisions || []);
      } catch (err) {
        console.error('Failed to load divisions:', err);
      }
    }
    loadDivisions();
  }, []);

  // 2. Fetch Services filtered by dynamic division, dynamic category, and search
  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        let query = `/services?limit=100`;
        if (currentDivision) query += `&division=${encodeURIComponent(currentDivision)}`;
        if (currentCategory) query += `&category=${encodeURIComponent(currentCategory)}`;
        if (currentSearch) query += `&search=${encodeURIComponent(currentSearch)}`;

        const res = await api.get(query);
        setServices(res.services || []);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [currentDivision, currentCategory, currentSearch]);

  // Find active division object to get its dynamic categories
  const activeDivObj = divisions.find(d => {
    if (!currentDivision) return false;
    const q = currentDivision.toLowerCase();
    return (
      d.name.toLowerCase() === q ||
      d.slug.toLowerCase() === q ||
      d.id === currentDivision ||
      (q.includes('wedding') && (d.name.toLowerCase().includes('wedding') || d.name.toLowerCase().includes('photo'))) ||
      (q.includes('photo') && d.name.toLowerCase().includes('photo'))
    );
  });

  // Filter divisions to those providing professional services (or all available)
  const serviceDivisions = divisions.filter(d => {
    const n = d.name.toLowerCase();
    const hasServiceCategories = Array.isArray(d.categories) && d.categories.some(c => c.type === 'SERVICE');
    const hasServiceCount = d._count && d._count.services > 0;
    const isServiceKeyword = n.includes('photo') || n.includes('video') || n.includes('consult') || 
                             n.includes('wedding') || n.includes('rental') || n.includes('cater') || 
                             n.includes('event') || n.includes('service');
    return hasServiceCategories || hasServiceCount || isServiceKeyword || d.id === activeDivObj?.id;
  });

  // Final list of divisions to display in Row 1 pills (fallback to all divisions if list is small)
  const displayedDivisions = serviceDivisions.length > 0 ? serviceDivisions : divisions;

  // Dynamic Categories: extracted directly from the active division or across all services
  let dynamicCategories = [];
  if (activeDivObj && Array.isArray(activeDivObj.categories) && activeDivObj.categories.length > 0) {
    dynamicCategories = activeDivObj.categories;
  } else {
    // If "All Services" is selected, extract distinct categories across service divisions
    const catMap = new Map();
    displayedDivisions.forEach(d => {
      (d.categories || []).forEach(c => {
        if (!catMap.has(c.name.toLowerCase())) {
          catMap.set(c.name.toLowerCase(), c);
        }
      });
    });
    dynamicCategories = Array.from(catMap.values());
  }

  // Update query params helper
  const updateFilter = (key, val) => {
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }

    // When changing division, clear category if the old category does not exist in the new division
    if (key === 'division') {
      const newDivObj = divisions.find(d => d.name === val || d.slug === val);
      const categoryExists = newDivObj?.categories?.some(c => c.name === currentCategory);
      if (!categoryExists) {
        params.delete('category');
      }
    }

    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const amount = direction === 'left' ? -260 : 260;
      categoryScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Layers className="w-8 h-8 text-brand-yellow" />
            <span>Our Services</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Dynamic Wedding, Media Production, Car Rentals, Catering & Consultancy Solutions in Rwanda
          </p>
        </div>

        {/* Reset Filters button */}
        {(currentDivision || currentCategory || currentSearch) && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-brand-red flex items-center gap-1.5 hover:underline bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* ROW 1: Dynamic Business Division Pills */}
      {/* ============================================================== */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-extrabold text-brand-muted uppercase tracking-wider flex items-center gap-1">
          <span>Business Divisions:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => updateFilter('division', '')}
            className={`px-4 py-2 rounded-full border transition flex items-center gap-1.5 ${
              !currentDivision
                ? 'bg-brand-yellow border-brand-yellow text-brand-dark font-extrabold shadow-sm'
                : 'bg-white border-brand-border text-brand-dark hover:bg-gray-50'
            }`}
          >
            <span>✨ All Services</span>
          </button>

          {displayedDivisions.map(d => {
            const isSelected = activeDivObj?.id === d.id || currentDivision === d.name || currentDivision === d.slug;
            return (
              <button
                key={d.id || d.name}
                onClick={() => updateFilter('division', isSelected ? '' : d.name)}
                className={`px-4 py-2 rounded-full border transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-yellow border-brand-yellow text-brand-dark font-extrabold shadow-sm ring-2 ring-brand-yellow/30'
                    : 'bg-white border-brand-border text-brand-dark hover:bg-gray-50'
                }`}
              >
                <span>{getDivisionEmoji(d.name)}</span>
                <span>{d.name}</span>
                {d._count?.services > 0 && (
                  <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                    {d._count.services}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: Dynamic Categories from the Selected Division */}
      {/* ============================================================== */}
      {dynamicCategories.length > 0 && (
        <div className="bg-brand-soft/80 border border-brand-border rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />
                <span>
                  {activeDivObj ? `${activeDivObj.name} Categories` : 'Dynamic Service Categories'}
                </span>
                <span className="text-gray-400 font-semibold text-[10px]">
                  ({dynamicCategories.length})
                </span>
              </span>
            </div>

            {currentCategory && (
              <button
                onClick={() => updateFilter('category', '')}
                className="text-[11px] text-brand-red font-bold hover:underline flex items-center gap-1"
              >
                <span>Clear category filter &times;</span>
              </button>
            )}
          </div>

          {/* Scrollable Category Chips */}
          <div className="relative flex items-center">
            {dynamicCategories.length > 5 && (
              <button
                type="button"
                onClick={() => scrollCategories('left')}
                className="hidden sm:flex p-1.5 bg-white shadow border border-brand-border rounded-full hover:bg-brand-yellow transition mr-1 z-10 text-brand-dark flex-shrink-0"
                title="Scroll categories left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scroll-smooth w-full no-scrollbar px-0.5"
            >
              {/* "All Categories" pill */}
              <button
                onClick={() => updateFilter('category', '')}
                className={`px-3.5 py-1.5 rounded-xl border transition flex-shrink-0 whitespace-nowrap text-xs ${
                  !currentCategory
                    ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                    : 'bg-white border-brand-border text-brand-dark hover:bg-gray-100'
                }`}
              >
                <span>All {activeDivObj ? activeDivObj.name : 'Categories'}</span>
              </button>

              {/* Dynamic Category pills */}
              {dynamicCategories.map(cat => {
                const isCatActive = currentCategory.toLowerCase() === cat.name.toLowerCase() ||
                                    currentCategory.toLowerCase() === (cat.slug || '').toLowerCase();
                return (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => updateFilter('category', isCatActive ? '' : cat.name)}
                    className={`px-3.5 py-1.5 rounded-xl border transition flex-shrink-0 whitespace-nowrap text-xs flex items-center gap-1.5 ${
                      isCatActive
                        ? 'bg-brand-red text-white border-brand-red shadow-sm'
                        : 'bg-white border-brand-border text-brand-dark hover:bg-brand-yellow hover:border-brand-yellow'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isCatActive && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>

            {dynamicCategories.length > 5 && (
              <button
                type="button"
                onClick={() => scrollCategories('right')}
                className="hidden sm:flex p-1.5 bg-white shadow border border-brand-border rounded-full hover:bg-brand-yellow transition ml-1 z-10 text-brand-dark flex-shrink-0"
                title="Scroll categories right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Filter Summary Bar */}
      {(currentDivision || currentCategory || currentSearch) && (
        <div className="flex flex-wrap items-center gap-2 text-xs bg-white border border-brand-border p-3 rounded-2xl shadow-xs">
          <span className="font-bold text-gray-400">Filtering:</span>

          {currentDivision && (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-brand-dark font-extrabold px-3 py-1 rounded-lg">
              <span>Division: {activeDivObj?.name || currentDivision}</span>
              <button onClick={() => updateFilter('division', '')} className="text-gray-500 hover:text-red-500 font-black ml-1">&times;</button>
            </span>
          )}

          {currentCategory && (
            <span className="inline-flex items-center gap-1 bg-red-100 text-brand-red font-extrabold px-3 py-1 rounded-lg">
              <span>Category: {currentCategory}</span>
              <button onClick={() => updateFilter('category', '')} className="text-brand-red hover:text-black font-black ml-1">&times;</button>
            </span>
          )}

          {currentSearch && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-brand-dark font-semibold px-3 py-1 rounded-lg">
              <span>Search: "{currentSearch}"</span>
              <button onClick={() => updateFilter('search', '')} className="text-gray-500 hover:text-red-500 font-black ml-1">&times;</button>
            </span>
          )}

          <span className="ml-auto text-gray-400 font-semibold text-[11px]">
            {loading ? 'Searching...' : `${services.length} services found`}
          </span>
        </div>
      )}

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
        <div className="text-center py-16 bg-brand-soft rounded-3xl border border-brand-border space-y-3">
          <p className="text-base font-bold text-brand-dark">No services found for the selected category</p>
          <p className="text-xs text-brand-muted max-w-md mx-auto">
            Try choosing another category, selecting "All Services", or resetting your filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="bg-brand-yellow text-brand-dark font-extrabold text-xs px-5 py-2.5 rounded-full shadow transition hover:bg-brand-yellowDark"
          >
            Show All Services
          </button>
        </div>
      )}
    </div>
  );
}
