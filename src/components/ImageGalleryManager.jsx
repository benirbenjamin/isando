import React, { useState } from 'react';
import { Upload, Plus, Trash2, Image, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function ImageGalleryManager({
  featuredImage = '',
  onFeaturedChange,
  gallery = [], // array of { url: string, caption: string }
  onGalleryChange,
}) {
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingGalleryIdx, setUploadingGalleryIdx] = useState(null);

  const handleUploadFeatured = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFeatured(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData);
      onFeaturedChange(res.url);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingFeatured(false);
    }
  };

  const handleUploadGalleryItem = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingGalleryIdx(idx);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData);
      const updated = [...gallery];
      updated[idx] = { ...updated[idx], url: res.url };
      onGalleryChange(updated);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingGalleryIdx(null);
    }
  };

  const addGalleryItem = () => {
    onGalleryChange([
      ...gallery,
      { url: '', caption: '' }
    ]);
  };

  const updateGalleryCaption = (idx, caption) => {
    const updated = [...gallery];
    updated[idx] = { ...updated[idx], caption };
    onGalleryChange(updated);
  };

  const updateGalleryUrl = (idx, url) => {
    const updated = [...gallery];
    updated[idx] = { ...updated[idx], url };
    onGalleryChange(updated);
  };

  const removeGalleryItem = (idx) => {
    onGalleryChange(gallery.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 bg-brand-soft p-4 rounded-2xl border border-brand-border text-xs">
      {/* 1. Featured Cover Image */}
      <div>
        <label className="font-extrabold text-brand-dark flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-yellow" />
          <span>Featured Primary Image (Thumbnail & Cover) *</span>
        </label>
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Paste image URL (https://...)"
              value={featuredImage}
              onChange={(e) => onFeaturedChange(e.target.value)}
              className="flex-1 p-2.5 bg-white border border-brand-border rounded-xl text-xs font-semibold focus:outline-none"
            />
            <label className="bg-brand-dark hover:bg-black text-white px-3.5 py-2.5 rounded-xl cursor-pointer font-bold text-xs flex items-center gap-1.5 shadow transition flex-shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingFeatured ? 'Uploading...' : 'Upload'}</span>
              <input type="file" accept="image/*" onChange={handleUploadFeatured} className="hidden" />
            </label>
          </div>

          {featuredImage && (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-brand-border bg-white flex-shrink-0 shadow-inner">
              <img
                src={featuredImage}
                alt="Featured preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=150&q=70'; }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Gallery Images with Descriptions */}
      <div className="pt-2 border-t border-brand-border/60">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-extrabold text-brand-dark flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-brand-red" />
              <span>Image Gallery & Slider (with Captions)</span>
            </span>
            <span className="text-[10px] text-gray-500 block">
              Each image description will be displayed on the slider when visiting the detail page
            </span>
          </div>

          <button
            type="button"
            onClick={addGalleryItem}
            className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark px-3 py-1.5 rounded-xl font-black text-[11px] shadow flex items-center gap-1 transition"
          >
            <Plus className="w-3 h-3" />
            <span>Add Slide</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {gallery.map((item, idx) => (
            <div key={idx} className="bg-white border border-brand-border rounded-xl p-2.5 space-y-2 shadow-sm">
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold text-gray-400 font-mono w-5">#{idx + 1}</span>
                <input
                  type="text"
                  placeholder="Image URL or upload..."
                  value={item.url || ''}
                  onChange={(e) => updateGalleryUrl(idx, e.target.value)}
                  className="flex-1 p-2 bg-brand-soft border border-brand-border rounded-lg text-xs"
                />
                <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-2 rounded-lg cursor-pointer font-bold text-[11px] flex items-center gap-1 transition flex-shrink-0">
                  <Upload className="w-3 h-3" />
                  <span>{uploadingGalleryIdx === idx ? '...' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={(e) => handleUploadGalleryItem(e, idx)} className="hidden" />
                </label>
                {item.url && (
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-brand-border flex-shrink-0">
                    <img src={item.url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeGalleryItem(idx)}
                  className="text-gray-400 hover:text-brand-red p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Description / Caption Text */}
              <input
                type="text"
                placeholder="📝 Image Description / Caption (e.g. 4K Drone aerial shot, Back detail, Banquet hall)"
                value={item.caption || ''}
                onChange={(e) => updateGalleryCaption(idx, e.target.value)}
                className="w-full p-2 bg-amber-50/50 border border-amber-200 rounded-lg text-xs font-semibold text-brand-dark focus:bg-white"
              />
            </div>
          ))}

          {gallery.length === 0 && (
            <div className="text-center py-4 bg-white/60 border border-dashed border-brand-border rounded-xl text-gray-400 text-[11px]">
              No gallery images added yet. Click "+ Add Slide" to add extra views with captions!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
