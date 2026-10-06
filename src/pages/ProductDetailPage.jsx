import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Check, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api, formatCurrency, calcDiscountPct, getWhatsAppLink } from '../services/api';
import ProductCard from '../components/ProductCard';
import ImageSlider from '../components/ImageSlider';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await api.get(`/products/${id}`);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          const sizes = [...new Set(data.variants.map(v => v.size).filter(Boolean))];
          const colors = [...new Set(data.variants.map(v => v.color).filter(Boolean))];
          if (sizes.length > 0) setSelectedSize(sizes[0]);
          if (colors.length > 0) setSelectedColor(colors[0]);
        }

        // Load related products from same division
        if (data.businessDivisionId) {
          const rel = await api.get(`/products?limit=5`);
          setRelatedProducts((rel.products || []).filter(p => p.id !== id).slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500 font-bold">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-brand-dark mb-2">Product Not Found</h2>
        <Link to="/products" className="text-brand-red font-bold underline">
          &larr; Return to Products
        </Link>
      </div>
    );
  }

  const images = Array.isArray(product.images) 
    ? product.images 
    : (typeof product.images === 'string' ? JSON.parse(product.images || '[]') : []);

  const discount = calcDiscountPct(product.regularPrice, product.salePrice);
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= (product.lowStockThreshold || 5);

  const availableSizes = [...new Set((product.variants || []).map(v => v.size).filter(Boolean))];
  const availableColors = [...new Set((product.variants || []).map(v => v.color).filter(Boolean))];

  const waMsg = `Hello Romantic T Solutions, I am interested in ${product.name}${selectedSize ? ` (size ${selectedSize})` : ''}${selectedColor ? ` (${selectedColor})` : ''}. I would like to know if it is available.`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Back Button */}
      <div>
        <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-brand-red">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white border border-brand-border rounded-3xl p-6 shadow-sm">
        {/* Gallery Slider with Captions */}
        <div className="space-y-4 relative">
          {discount > 0 && (
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <span className="bg-brand-red text-white text-xs font-black px-3 py-1.5 rounded-lg shadow">
                {discount}% OFF
              </span>
            </div>
          )}
          <ImageSlider images={images} title={product.name} aspectRatio="aspect-square" />
        </div>

        {/* Product Details & Selection */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="bg-brand-soft border border-brand-border px-3 py-1 rounded-full text-xs font-semibold text-brand-dark">
                {product.businessDivision?.name}
              </span>
              <span className="bg-brand-soft border border-brand-border px-3 py-1 rounded-full text-xs font-semibold text-brand-dark">
                {product.category?.name}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-brand-dark leading-tight">
              {product.name}
            </h1>

            {/* Pricing Section */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-black text-brand-red">
                {formatCurrency(product.salePrice || product.regularPrice)}
              </span>
              {discount > 0 && (
                <span className="text-lg text-gray-400 line-through">
                  {formatCurrency(product.regularPrice)}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed border-t border-b border-gray-100 py-3">
              {product.description}
            </p>

            {/* Stock Availability */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <span>Status:</span>
              {isOutOfStock ? (
                <span className="text-brand-red flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>OUT OF STOCK</span>
                </span>
              ) : isLowStock ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>LOW STOCK ({product.stockQuantity} left)</span>
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>In Stock ({product.stockQuantity} available)</span>
                </span>
              )}
            </div>

            {/* Variants Picker (Size) */}
            {availableSizes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-brand-dark block">Select Size:</span>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(sz => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition ${selectedSize === sz ? 'bg-brand-yellow border-brand-yellow text-brand-dark shadow' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variants Picker (Color) */}
            {availableColors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-brand-dark block">Select Color:</span>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map(col => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition ${selectedColor === col ? 'bg-brand-yellow border-brand-yellow text-brand-dark shadow' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Primary Order Action */}
          <div className="space-y-3 pt-4 border-t">
            <a
              href={getWhatsAppLink('250786639945', waMsg)}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#1faa52] text-white py-3.5 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shine-effect transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span>ORDER ON WHATSAPP NOW</span>
            </a>
            <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Instant order verification & delivery options in Kigali & Rwanda</span>
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-dark">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map(rel => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
