import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentDivision = searchParams.get('division') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const onSaleOnly = searchParams.get('onSale') === 'true';
  const newOnly = searchParams.get('new') === 'true';

  useEffect(() => {
    async function loadDivisions() {
      try {
        const res = await api.get('/divisions');
        setDivisions(res.divisions || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadDivisions();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let query = `/products?limit=100`;
        if (currentDivision) query += `&division=${encodeURIComponent(currentDivision)}`;
        if (currentCategory) query += `&category=${encodeURIComponent(currentCategory)}`;
        if (currentSearch) query += `&search=${encodeURIComponent(currentSearch)}`;
        if (onSaleOnly) query += `&isOnSale=true`;
        if (newOnly) query += `&isNewArrival=true`;

        const res = await api.get(query);
        setProducts(res.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [currentDivision, currentCategory, currentSearch, onSaleOnly, newOnly]);

  const updateFilter = (key, val) => {
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark">Products Catalog</h1>
          <p className="text-xs text-brand-muted mt-1">
            Browse our Food & Beverages, Clothes, Shoes, and merchandise
          </p>
        </div>

        {/* Clear Filters Button */}
        {(currentDivision || currentCategory || currentSearch || onSaleOnly || newOnly) && (
          <button
            onClick={clearFilters}
            className="text-xs font-bold text-brand-red flex items-center gap-1 hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => updateFilter('division', '')}
          className={`px-4 py-2 rounded-full border transition ${!currentDivision ? 'bg-brand-yellow border-brand-yellow text-brand-dark font-extrabold' : 'bg-white border-brand-border hover:bg-gray-50'}`}
        >
          All Divisions
        </button>
        {divisions.map(d => (
          <button
            key={d.id}
            onClick={() => updateFilter('division', d.name)}
            className={`px-4 py-2 rounded-full border transition ${currentDivision === d.name ? 'bg-brand-yellow border-brand-yellow text-brand-dark font-extrabold' : 'bg-white border-brand-border hover:bg-gray-50'}`}
          >
            {d.name}
          </button>
        ))}

        <button
          onClick={() => updateFilter('onSale', onSaleOnly ? '' : 'true')}
          className={`px-4 py-2 rounded-full border transition ${onSaleOnly ? 'bg-brand-red border-brand-red text-white font-extrabold' : 'bg-white border-brand-red text-brand-red hover:bg-red-50'}`}
        >
          🔥 On Sale (% Discount)
        </button>
      </div>

      {/* Active Search Notice */}
      {currentSearch && (
        <div className="bg-brand-soft border border-brand-border px-4 py-2 rounded-xl text-xs font-semibold text-brand-dark">
          Showing search results for: <strong className="text-brand-red">"{currentSearch}"</strong>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} className="bg-gray-100 rounded-2xl aspect-[3/4]" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-brand-soft rounded-3xl border border-brand-border">
          <p className="text-base font-bold text-brand-dark mb-1">No products found</p>
          <p className="text-xs text-brand-muted mb-4">Try adjusting your filters or search terms</p>
          <button
            onClick={clearFilters}
            className="bg-brand-yellow text-brand-dark font-bold text-xs px-5 py-2.5 rounded-full shadow"
          >
            View All Products
          </button>
        </div>
      )}
    </div>
  );
}
