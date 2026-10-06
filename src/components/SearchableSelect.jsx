import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Search, Check } from 'lucide-react';

export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = '-- Select Option --',
  allowAddNew = true,
  addNewLabel = 'Add New Option',
  onAddNew,
  className = '',
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newVal, setNewVal] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsAddingNew(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return opt;
  });

  const filtered = normalizedOptions.filter(opt =>
    (opt.label || '').toLowerCase().includes(search.toLowerCase()) ||
    (opt.subtitle || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = normalizedOptions.find(o => o.value === value);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleCreateNew = (e) => {
    e.preventDefault();
    if (!newVal.trim()) return;
    const created = newVal.trim();
    if (onAddNew) {
      onAddNew(created);
    } else {
      onChange(created);
    }
    setNewVal('');
    setIsAddingNew(false);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl text-left text-xs font-semibold flex items-center justify-between hover:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/30 transition shadow-sm"
      >
        <span className={`truncate ${selectedOption ? 'text-brand-dark font-bold' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-brand-border rounded-2xl shadow-2xl z-50 overflow-hidden text-xs max-h-72 flex flex-col animate-pop">
          {/* Search bar */}
          <div className="p-2 border-b bg-gray-50 flex items-center gap-1.5 sticky top-0">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search or type to filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-brand-dark focus:outline-none"
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50 max-h-48">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-brand-soft flex items-center justify-between transition ${
                    opt.value === value ? 'bg-amber-50 font-black text-brand-dark' : 'text-gray-700'
                  }`}
                >
                  <div className="truncate">
                    <div>{opt.label}</div>
                    {opt.subtitle && <div className="text-[10px] text-gray-400 font-normal">{opt.subtitle}</div>}
                  </div>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />}
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-[11px] text-gray-400 font-medium">
                No matching options found
              </div>
            )}
          </div>

          {/* Add New Section */}
          {allowAddNew && (
            <div className="p-2 border-t bg-brand-soft/60">
              {isAddingNew ? (
                <form onSubmit={handleCreateNew} className="flex gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter new item name..."
                    value={newVal}
                    onChange={(e) => setNewVal(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-brand-border rounded-lg text-xs font-bold focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark px-3 py-1.5 rounded-lg font-black text-xs shadow transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-2 py-1.5 text-gray-400 hover:text-gray-600 font-bold"
                  >
                    &times;
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(true);
                    if (search) setNewVal(search);
                  }}
                  className="w-full text-brand-red hover:text-brand-redDark font-extrabold text-[11px] py-1 flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ {addNewLabel}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
