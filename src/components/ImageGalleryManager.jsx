import React, { useState } from 'react';
import { Upload, Plus, Trash2, Image, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { resilientUpload } from '../utils/uploadHelper';
import { showToast } from '../utils/toast';

export default function ImageGalleryManager({
  featuredImage = '',
  onFeaturedChange,
  onChangeFeatured,
  gallery = [], // array of { url: string, caption: string }
  onGalleryChange,
  onChangeGallery,
}) {
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingGalleryIdx, setUploadingGalleryIdx] = useState(null);

  // Robustly notify parent regardless of prop naming convention
  const notifyFeatured = (url, backupUrl) => {
    if (typeof onFeaturedChange === 'function') onFeaturedChange(url, backupUrl);
    if (typeof onChangeFeatured === 'function') onChangeFeatured(url, backupUrl);
  };

  const notifyGallery = (items) => {
    if (typeof onGalleryChange === 'function') onGalleryChange(items);
    if (typeof onChangeGallery === 'function') onChangeGallery(items);
  };

  const formatUploadError = (err) => {
    const msg = String(err?.message || err || '');
    if (msg.includes('FUNCTION_PAYLOAD_TOO_LARGE') || msg.includes('Too Large') || msg.includes('413')) {
      return 'The upload was too large. Large files are automatically chunked; please try again.';
    }
    return msg || 'Failed to upload image. Please check your connection and try again.';
  };

  const handleUploadFeatured = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setUploadingFeatured(true);
    try {
      // Auto-compress and chunk if necessary
      const res = await resilientUpload(rawFile);
      notifyFeatured(res.url, res.backupUrl);
      showToast('Primary cover image uploaded successfully!', 'success');
    } catch (err) {
      showToast(formatUploadError(err), 'error');
    } finally {
      setUploadingFeatured(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadGalleryItem = async (e, idx) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setUploadingGalleryIdx(idx);
    try {
      // Auto-compress and chunk if necessary
      const res = await resilientUpload(rawFile);
      const updated = [...gallery];
      updated[idx] = { ...updated[idx], url: res.url, backupUrl: res.backupUrl || null };
      notifyGallery(updated);
      showToast(`Gallery slide #${idx + 1} uploaded successfully!`, 'success');
    } catch (err) {
      showToast(formatUploadError(err), 'error');
    } finally {
      setUploadingGalleryIdx(null);
      if (e.target) e.target.value = '';
    }
  };

  const addGalleryItem = () => {
    notifyGallery([
      ...gallery,
      { url: '', caption: '' }
    ]);
  };

  const updateGalleryCaption = (idx, caption) => {
    const updated = [...gallery];
    updated[idx] = { ...updated[idx], caption };
    notifyGallery(updated);
  };

  const updateGalleryUrl = (idx, url) => {
    const updated = [...gallery];
    updated[idx] = { ...updated[idx], url };
    notifyGallery(updated);
  };

  const removeGalleryItem = (idx) => {
    notifyGallery(gallery.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 bg-brand-soft p-3 sm:p-4 rounded-2xl border border-brand-border text-xs">
      {/* 1. Featured Cover Image */}
      <div>
        <label className="font-extrabold text-brand-dark flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-yellow flex-shrink-0" />
          <span>Featured Primary Image (Thumbnail & Cover) *</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex-1 flex gap-2 min-w-0">
            <input
              type="text"
              placeholder="Paste image URL (https://...)"
              value={featuredImage}
              onChange={(e) => notifyFeatured(e.target.value)}
              className="flex-1 min-w-0 p-2.5 bg-white border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            />
            <label className="bg-brand-dark hover:bg-black text-white px-3.5 py-2.5 rounded-xl cursor-pointer font-bold text-xs flex items-center gap-1.5 shadow transition flex-shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingFeatured ? 'Uploading...' : 'Upload'}</span>
              <input type="file" accept="image/*" onChange={handleUploadFeatured} className="hidden" />
            </label>
          </div>

          {featuredImage && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-brand-border bg-white flex-shrink-0 shadow-inner">
                <img
                  src={featuredImage}
                  alt="Featured preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=150&q=70'; }}
                />
              </div>
              <span className="text-[10px] text-gray-500 font-semibold sm:hidden">Current Preview</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Gallery Images with Descriptions */}
      <div className="pt-2 border-t border-brand-border/60">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <span className="font-extrabold text-brand-dark flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />
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
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="flex gap-2 items-center flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 font-mono w-5 flex-shrink-0">#{idx + 1}</span>
                  <input
                    type="text"
                    placeholder="Image URL or upload..."
                    value={item.url || ''}
                    onChange={(e) => updateGalleryUrl(idx, e.target.value)}
                    className="flex-1 min-w-0 p-2 bg-brand-soft border border-brand-border rounded-lg text-xs"
                  />
                  <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-2 rounded-lg cursor-pointer font-bold text-[11px] flex items-center gap-1 transition flex-shrink-0">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingGalleryIdx === idx ? '...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleUploadGalleryItem(e, idx)} className="hidden" />
                  </label>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-2 flex-shrink-0 pl-7 sm:pl-0">
                  {item.url && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-brand-border flex-shrink-0">
                      <img src={item.url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(idx)}
                    className="text-gray-400 hover:text-brand-red p-1 rounded hover:bg-gray-100 transition"
                    title="Remove slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
