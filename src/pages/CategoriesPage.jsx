import React, { useState, useEffect } from 'react';
import { 
  Tags, Plus, Edit2, ChevronUp, ChevronDown, 
  ChevronsUp, ChevronsDown, GripVertical, Check, Trash2, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';

export default function CategoriesPage() {
  const [divisions, setDivisions] = useState([]);
  const [showDivModal, setShowDivModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showEditDivModal, setShowEditDivModal] = useState(false);
  const [selectedDivId, setSelectedDivId] = useState(null);
  const [editingDivision, setEditingDivision] = useState(null);

  const [divName, setDivName] = useState('');
  const [divDesc, setDivDesc] = useState('');
  const [editDivName, setEditDivName] = useState('');
  const [editDivDesc, setEditDivDesc] = useState('');
  
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState('PRODUCT');
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  async function loadDivisions() {
    setLoading(true);
    try {
      const res = await api.get('/divisions');
      setDivisions(res.divisions || []);
    } catch (err) {
      console.error('Error loading divisions:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDivisions();
  }, []);

  const showNotification = (msg) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => {
      setSaveSuccessMessage('');
    }, 3000);
  };

  // Reorder API call
  const persistDivisionOrder = async (newDivs) => {
    setDivisions(newDivs);
    setSavingOrder(true);
    try {
      const orderedIds = newDivs.map(d => d.id);
      await api.put('/divisions/reorder', { orderedIds });
      showNotification('Division order saved successfully!');
    } catch (err) {
      alert('Failed to save order: ' + (err.message || 'Unknown error'));
      loadDivisions();
    } finally {
      setSavingOrder(false);
    }
  };

  // Move division to top
  const handleMoveToTop = (index) => {
    if (index === 0) return;
    const item = divisions[index];
    const newDivs = [item, ...divisions.filter((_, i) => i !== index)];
    persistDivisionOrder(newDivs);
  };

  // Move division up by 1
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newDivs = [...divisions];
    const temp = newDivs[index - 1];
    newDivs[index - 1] = newDivs[index];
    newDivs[index] = temp;
    persistDivisionOrder(newDivs);
  };

  // Move division down by 1
  const handleMoveDown = (index) => {
    if (index === divisions.length - 1) return;
    const newDivs = [...divisions];
    const temp = newDivs[index + 1];
    newDivs[index + 1] = newDivs[index];
    newDivs[index] = temp;
    persistDivisionOrder(newDivs);
  };

  // Move division to bottom
  const handleMoveToBottom = (index) => {
    if (index === divisions.length - 1) return;
    const item = divisions[index];
    const newDivs = [...divisions.filter((_, i) => i !== index), item];
    persistDivisionOrder(newDivs);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newDivs = [...divisions];
    const [draggedItem] = newDivs.splice(draggedIndex, 1);
    newDivs.splice(targetIndex, 0, draggedItem);
    setDraggedIndex(null);
    setDragOverIndex(null);
    persistDivisionOrder(newDivs);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Create new division
  const handleCreateDivision = async (e) => {
    e.preventDefault();
    try {
      await api.post('/divisions', { name: divName, description: divDesc });
      setShowDivModal(false);
      setDivName('');
      setDivDesc('');
      showNotification('Division created successfully!');
      loadDivisions();
    } catch (err) {
      alert(err.message);
    }
  };

  // Edit division
  const openEditDivision = (div) => {
    setEditingDivision(div);
    setEditDivName(div.name);
    setEditDivDesc(div.description || '');
    setShowEditDivModal(true);
  };

  const handleUpdateDivision = async (e) => {
    e.preventDefault();
    if (!editingDivision) return;
    try {
      await api.put(`/divisions/${editingDivision.id}`, {
        name: editDivName,
        description: editDivDesc,
      });
      setShowEditDivModal(false);
      setEditingDivision(null);
      showNotification('Division name updated successfully!');
      loadDivisions();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete division
  const handleDeleteDivision = async (div) => {
    if (!window.confirm(`Are you sure you want to delete division "${div.name}"?`)) return;
    try {
      await api.delete(`/divisions/${div.id}`);
      showNotification('Division deleted successfully!');
      loadDivisions();
    } catch (err) {
      alert(err.message);
    }
  };

  // Create Category inside division
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!selectedDivId) return;
    try {
      await api.post(`/divisions/${selectedDivId}/categories`, { name: catName, type: catType });
      setShowCatModal(false);
      setCatName('');
      showNotification('Category added successfully!');
      loadDivisions();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
        <span>Loading divisions & categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-dark flex items-center gap-2">
            <Tags className="w-8 h-8 text-brand-yellow" />
            <span>Business Divisions & Dynamic Categories</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Order divisions by sliding or using buttons to control how they appear in the top menu and homepage. Click Edit to rename divisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccessMessage && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              {saveSuccessMessage}
            </span>
          )}

          <button
            onClick={() => setShowDivModal(true)}
            className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Division</span>
          </button>
        </div>
      </div>

      {/* Info helper banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold bg-brand-yellow text-brand-dark px-2 py-0.5 rounded-md text-[10px]">
            ORDERING GUIDE
          </span>
          <span>
            The order here directly defines the <strong>Top Menu Bar</strong> under Home and the order of sections on the <strong>Homepage</strong>. Use <strong>Move to Top</strong>, <strong>↑ Up</strong>, <strong>↓ Down</strong>, or drag the cards to slide reorder!
          </span>
        </div>
        {savingOrder && (
          <span className="text-[11px] font-bold text-brand-dark flex items-center gap-1 flex-shrink-0">
            <div className="w-3 h-3 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
            Saving order...
          </span>
        )}
      </div>

      {/* Divisions List */}
      {divisions.length === 0 ? (
        <div className="bg-white border border-brand-border rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-brand-soft mx-auto flex items-center justify-center text-3xl">
            🏷️
          </div>
          <div>
            <h3 className="text-base font-black text-brand-dark">No Divisions Loaded</h3>
            <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto">
              No business divisions were found. You can create a new division now or retry loading.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={loadDivisions}
              className="bg-brand-soft border border-brand-border hover:bg-gray-100 text-brand-dark font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowDivModal(true)}
              className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-extrabold text-xs px-5 py-2 rounded-xl shadow inline-flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Business Division</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {divisions.map((div, index) => {
          const isFirst = index === 0;
          const isLast = index === divisions.length - 1;
          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;

          return (
            <div
              key={div.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white border transition-all duration-200 rounded-2xl p-5 shadow-sm space-y-4 ${
                isDragging ? 'opacity-40 scale-[0.99] border-dashed border-brand-yellow' : ''
              } ${isOver ? 'border-brand-yellow ring-2 ring-brand-yellow/30' : 'border-brand-border'}`}
            >
              {/* Top Header of Division Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-3">
                  {/* Drag Handle */}
                  <div 
                    className="cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-brand-dark hover:bg-gray-100 rounded-lg transition"
                    title="Drag to slide reorder"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Order Index Badge */}
                  <span className="w-7 h-7 rounded-xl bg-brand-soft border border-brand-border font-black text-xs text-brand-dark flex items-center justify-center shadow-inner">
                    #{index + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-brand-dark">{div.name}</h3>
                      <button
                        onClick={() => openEditDivision(div)}
                        className="text-gray-400 hover:text-brand-red p-1 rounded-md hover:bg-red-50 transition"
                        title="Edit Division Name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">{div.description || 'Business Division'}</p>
                  </div>
                </div>

                {/* Ordering and Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 sm:self-center">
                  {/* Move to Top */}
                  <button
                    onClick={() => handleMoveToTop(index)}
                    disabled={isFirst}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                      isFirst
                        ? 'opacity-40 text-gray-400 cursor-not-allowed bg-gray-50'
                        : 'bg-amber-100/70 hover:bg-brand-yellow text-brand-dark border border-amber-300/60 shadow-sm'
                    }`}
                    title="Move this division to the very top (first)"
                  >
                    <ChevronsUp className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Move to Top</span>
                  </button>

                  {/* Move Up */}
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={isFirst}
                    className={`p-1.5 rounded-xl text-xs font-bold transition ${
                      isFirst
                        ? 'opacity-40 text-gray-400 cursor-not-allowed bg-gray-50'
                        : 'bg-brand-soft hover:bg-brand-yellow text-brand-dark border border-brand-border'
                    }`}
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={isLast}
                    className={`p-1.5 rounded-xl text-xs font-bold transition ${
                      isLast
                        ? 'opacity-40 text-gray-400 cursor-not-allowed bg-gray-50'
                        : 'bg-brand-soft hover:bg-brand-yellow text-brand-dark border border-brand-border'
                    }`}
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Edit Division Button */}
                  <button
                    onClick={() => openEditDivision(div)}
                    className="bg-brand-soft border border-brand-border hover:bg-brand-yellow text-brand-dark font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                    title="Rename division"
                  >
                    <Edit2 className="w-3 h-3 text-brand-dark" />
                    <span>Edit</span>
                  </button>

                  {/* Add Category Button */}
                  <button
                    onClick={() => { setSelectedDivId(div.id); setShowCatModal(true); }}
                    className="bg-brand-dark hover:bg-black text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-yellow" />
                    <span>Add Category</span>
                  </button>

                  {/* Delete Division Button (if empty) */}
                  {(!div._count?.products && !div._count?.services && (!div.categories || div.categories.length === 0)) && (
                    <button
                      onClick={() => handleDeleteDivision(div)}
                      className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded-xl border border-red-200 transition"
                      title="Delete Empty Division"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories list */}
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                  Linked Categories ({div.categories ? div.categories.length : 0})
                </span>
                <div className="flex flex-wrap gap-2">
                  {div.categories && div.categories.length > 0 ? (
                    div.categories.map(cat => (
                      <span key={cat.id} className="bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-brand-dark flex items-center gap-1.5 shadow-sm">
                        <span className={`w-2 h-2 rounded-full ${cat.type === 'SERVICE' ? 'bg-brand-yellow' : 'bg-brand-red'}`} />
                        <span>{cat.name}</span>
                        <span className="text-[9px] text-gray-400 font-mono">({cat.type})</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No categories created yet in this division</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Create Division Modal */}
      {showDivModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-pop">
            <h3 className="text-base font-black text-brand-dark border-b pb-2">New Business Division</h3>
            <form onSubmit={handleCreateDivision} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Division Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Car rentals"
                  value={divName}
                  onChange={(e) => setDivName(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Executive vehicle rentals & convoy"
                  value={divDesc}
                  onChange={(e) => setDivDesc(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDivModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-yellow text-brand-dark font-black rounded-xl shadow">Create Division</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Division Modal */}
      {showEditDivModal && editingDivision && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-pop">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-black text-brand-dark flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-brand-yellow" />
                <span>Edit Division</span>
              </h3>
            </div>
            
            <form onSubmit={handleUpdateDivision} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Division Name *</label>
                <input
                  type="text"
                  required
                  value={editDivName}
                  onChange={(e) => setEditDivName(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Description</label>
                <input
                  type="text"
                  value={editDivDesc}
                  onChange={(e) => setEditDivDesc(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowEditDivModal(false)} 
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-black rounded-xl shadow transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-pop">
            <h3 className="text-base font-black text-brand-dark border-b pb-2">Add Category to Division</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kia sorental cars"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Category Type</label>
                <select
                  value={catType}
                  onChange={(e) => setCatType(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                >
                  <option value="PRODUCT">PRODUCT (Physical goods)</option>
                  <option value="SERVICE">SERVICE (Professional services)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-yellow text-brand-dark font-black rounded-xl shadow">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
