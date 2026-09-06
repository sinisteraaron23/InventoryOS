import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ArrowUpDown, 
  Cpu, 
  Home, 
  Box as BoxIcon, 
  Tag, 
  Radio
} from 'lucide-react';
import type { FilterState, StorageBox, Room } from '../types';

interface SearchFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  boxes: StorageBox[];
  rooms: Room[];
  totalCount: number;
  filteredCount: number;
}

const CATEGORIES = [
  'All Categories',
  'Smart Home & IoT',
  'Electronics & Gadgets',
  'Computing & Networking',
  'Audio & Video',
  'Cables & Adapters',
  'Power & Batteries',
  'Tools & Hardware',
  'Home Appliances',
  'Office & Studio',
  'Other'
];

const PROTOCOLS = [
  'All Protocols',
  'Matter',
  'Zigbee',
  'Z-Wave',
  'Thread',
  'Wi-Fi',
  'Bluetooth',
  'Ethernet',
  'RF / 433MHz'
];

const STATUSES = [
  { id: 'all', label: 'All Statuses' },
  { id: 'in_storage', label: 'In Storage Box' },
  { id: 'in_use', label: 'In Active Use' },
  { id: 'spare', label: 'Spare / Backup' },
  { id: 'lent_out', label: 'Lent Out' }
];

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  onFilterChange,
  boxes,
  rooms,
  totalCount,
  filteredCount
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (val: string) => {
    onFilterChange({ ...filters, searchQuery: val });
  };

  const handleCategoryChange = (val: string) => {
    onFilterChange({ ...filters, category: val === 'All Categories' ? '' : val });
  };

  const handleRoomChange = (val: string) => {
    onFilterChange({ ...filters, roomId: val });
  };

  const handleBoxChange = (val: string) => {
    onFilterChange({ ...filters, boxId: val, onlyUnboxed: false });
  };

  const handleUnboxedToggle = () => {
    onFilterChange({ 
      ...filters, 
      onlyUnboxed: !filters.onlyUnboxed,
      boxId: !filters.onlyUnboxed ? '' : filters.boxId 
    });
  };

  const handleStatusChange = (val: string) => {
    onFilterChange({ ...filters, status: val === 'all' ? '' : val });
  };

  const handleProtocolChange = (val: string) => {
    onFilterChange({ ...filters, protocol: val === 'All Protocols' ? '' : val });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] });
  };

  const clearFilters = () => {
    onFilterChange({
      searchQuery: '',
      category: '',
      roomId: '',
      boxId: '',
      status: '',
      protocol: '',
      sortBy: 'name_asc',
      onlyUnboxed: false
    });
  };

  const hasActiveFilters = 
    Boolean(filters.searchQuery) ||
    Boolean(filters.category) ||
    Boolean(filters.roomId) ||
    Boolean(filters.boxId) ||
    Boolean(filters.status) ||
    Boolean(filters.protocol) ||
    filters.onlyUnboxed;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs p-5 mb-6 transition-colors">
      {/* Primary Search Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search input with Bento Pill Design */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by item, barcode, brand, model, room, or box..."
            className="w-full pl-11 pr-16 py-2.5 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-zinc-900 dark:focus:border-white focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 rounded-full text-sm text-zinc-900 dark:text-zinc-100 transition-all shadow-2xs focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          {filters.searchQuery ? (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 pointer-events-none">
              ⌘K
            </div>
          )}
        </div>

        {/* Quick action buttons & filter toggler */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold border transition-all ${
              showAdvanced || hasActiveFilters
                ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters {hasActiveFilters && '(Active)'}
          </button>

          {/* Sort dropdown */}
          <div className="relative flex items-center">
            <select
              value={filters.sortBy}
              onChange={handleSortChange}
              className="appearance-none pl-8 pr-8 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="name_asc" className="dark:bg-zinc-800">Name (A-Z)</option>
              <option value="name_desc" className="dark:bg-zinc-800">Name (Z-A)</option>
              <option value="date_desc" className="dark:bg-zinc-800">Newest First</option>
              <option value="date_asc" className="dark:bg-zinc-800">Oldest First</option>
              <option value="value_desc" className="dark:bg-zinc-800">Highest Value</option>
              <option value="quantity_desc" className="dark:bg-zinc-800">Highest Quantity</option>
            </select>
            <ArrowUpDown className="absolute left-2.5 pointer-events-none w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-zinc-400 dark:text-zinc-500" /> Category
            </label>
            <select
              value={filters.category || 'All Categories'}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-800 dark:text-zinc-200 shadow-2xs"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="dark:bg-zinc-800">{cat}</option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Home className="w-3 h-3 text-zinc-400 dark:text-zinc-500" /> Room Location
            </label>
            <select
              value={filters.roomId}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-800 dark:text-zinc-200 shadow-2xs"
            >
              <option value="" className="dark:bg-zinc-800">All Rooms</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id} className="dark:bg-zinc-800">{room.name}</option>
              ))}
            </select>
          </div>

          {/* Storage Box */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <BoxIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500" /> Storage Box
            </label>
            <select
              value={filters.boxId}
              onChange={(e) => handleBoxChange(e.target.value)}
              disabled={filters.onlyUnboxed}
              className="w-full text-xs py-2 px-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-800 dark:text-zinc-200 disabled:opacity-50 shadow-2xs"
            >
              <option value="" className="dark:bg-zinc-800">All Storage Boxes</option>
              {boxes.map((box) => (
                <option key={box.id} value={box.id} className="dark:bg-zinc-800">{box.boxCode}: {box.name}</option>
              ))}
            </select>
          </div>

          {/* Smart Home Protocol */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Radio className="w-3 h-3 text-zinc-400 dark:text-zinc-500" /> Smart Protocol
            </label>
            <select
              value={filters.protocol || 'All Protocols'}
              onChange={(e) => handleProtocolChange(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-800 dark:text-zinc-200 shadow-2xs"
            >
              {PROTOCOLS.map((p) => (
                <option key={p} value={p} className="dark:bg-zinc-800">{p}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-zinc-400 dark:text-zinc-500" /> Item Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-800 dark:text-zinc-200 shadow-2xs"
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-zinc-800">{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Filter Stats & Reset Strip */}
      <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-2">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{filteredCount}</strong> of{' '}
            <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{totalCount}</strong> items
          </span>

          <label className="inline-flex items-center gap-1.5 ml-3 cursor-pointer text-zinc-700 dark:text-zinc-300 select-none font-medium">
            <input
              type="checkbox"
              checked={filters.onlyUnboxed}
              onChange={handleUnboxedToggle}
              className="rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white focus:ring-zinc-950"
            />
            <span>Unboxed / loose items only</span>
          </label>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-medium flex items-center gap-1 hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};
