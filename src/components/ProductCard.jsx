import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle } from 'lucide-react';
import { formatCurrency, calcDiscountPct, getWhatsAppLink, getImageUrl } from '../services/api';

export default function ProductCard({ product }) {
  const images = Array.isArray(product.images) 
    ? product.images 
    : (typeof product.images === 'string' ? JSON.parse(product.images || '[]') : []);
  const mainImage = getImageUrl(images[0], 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=70');

  const discount = calcDiscountPct(product.regularPrice, product.salePrice);
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockThreshold || 5);

  const waMsg = `Hello Romantic T Solutions, I am interested in ${product.name}. Is it available?`;

  return (
    <div className="group bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative">
      {/* Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
        {discount > 0 && (
          <span className="bg-brand-red text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow">
            {discount}% OFF
          </span>
        )}
        {product.isNewArrival && (
          <span className="bg-brand-yellow text-brand-dark text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow">
            NEW
          </span>
        )}
      </div>

      {/* Image Gallery Container */}
      <Link to={`/products/${product.id}`} className="block aspect-square overflow-hidden bg-brand-soft relative">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=70';
          }}
        />
      </Link>

      {/* Card Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-muted mb-1 flex justify-between items-center">
            <span>{product.category?.name || product.businessDivision?.name}</span>
            {isOutOfStock ? (
              <span className="text-brand-red font-bold">OUT OF STOCK</span>
            ) : isLowStock ? (
              <span className="text-amber-600 font-bold">LOW STOCK ({product.stockQuantity})</span>
            ) : (
              <span className="text-emerald-600 font-semibold">In Stock</span>
            )}
          </div>

          <Link to={`/products/${product.id}`}>
            <h3 className="font-bold text-base text-brand-dark group-hover:text-brand-red transition line-clamp-1 mb-2">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Price Header */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-black text-brand-red">
              {formatCurrency(product.salePrice || product.regularPrice)}
            </span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.regularPrice)}
              </span>
            )}
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/products/${product.id}`}
              className="w-full py-2 px-2 bg-gray-100 hover:bg-gray-200 text-brand-dark rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1 transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Details</span>
            </Link>

            <a
              href={getWhatsAppLink('250786639945', waMsg)}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-2 bg-[#25D366] hover:bg-[#1faa52] text-white rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1 shadow transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Order</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
