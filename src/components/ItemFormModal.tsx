import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Sparkles, 
  Camera, 
  Tag, 
  Check, 
  QrCode, 
  Plus,
  Image as ImageIcon,
  Search,
  Trash2,
  Radio
} from 'lucide-react';
import { GoogleImageSearchModal } from './GoogleImageSearchModal';
import type { 
  InventoryItem, 
  StorageBox, 
  Room, 
  ItemCategory, 
  SmartHomeProtocol, 
  ItemCondition, 
  ItemStatus 
} from '../types';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  initialItem?: InventoryItem | null;
  boxes: StorageBox[];
  rooms: Room[];
  prefilledBoxId?: string | null;
  prefilledBarcode?: string | null;
  onScanBarcodeClick?: () => void;
}

const CATEGORIES: ItemCategory[] = [
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

const PROTOCOLS: SmartHomeProtocol[] = [
  'Matter',
  'Thread',
  'Zigbee',
  'Z-Wave',
  'Wi-Fi',
  'Bluetooth',
  'Ethernet',
  'RF / 433MHz'
];

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialItem,
  boxes,
  rooms,
  prefilledBoxId,
  prefilledBarcode
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Smart Home & IoT');
  const [selectedProtocols, setSelectedProtocols] = useState<SmartHomeProtocol[]>([]);
  const [roomId, setRoomId] = useState('');
  const [location, setLocation] = useState('');
  const [boxId, setBoxId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<ItemCondition>('good');
  const [status, setStatus] = useState<ItemStatus>('in_storage');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const generateRandomBarcode = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setBarcode(`ITM-${randomNum}`);
  };

  const toggleProtocol = (proto: SmartHomeProtocol) => {
    setSelectedProtocols((prev) =>
      prev.includes(proto) ? prev.filter((p) => p !== proto) : [...prev, proto]
    );
  };

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setBrand(initialItem.brand);
      setModelNumber(initialItem.modelNumber || '');
      setSerialNumber(initialItem.serialNumber || '');
      setBarcode(initialItem.barcode);
      setCategory(initialItem.category);
      
      // Load protocols (support both protocols array and legacy protocol field)
      const initialProtocols: SmartHomeProtocol[] = [];
      if (initialItem.protocols && Array.isArray(initialItem.protocols) && initialItem.protocols.length > 0) {
        initialProtocols.push(...initialItem.protocols.filter((p) => p !== 'None'));
      } else if (initialItem.protocol && initialItem.protocol !== 'None') {
        initialProtocols.push(initialItem.protocol);
      }
      setSelectedProtocols(initialProtocols);

      setRoomId(initialItem.roomId);
      setLocation(initialItem.location || '');
      setBoxId(initialItem.boxId || '');
      setQuantity(initialItem.quantity);
      setCondition(initialItem.condition);
      setStatus(initialItem.status);
      setPurchasePrice(initialItem.purchasePrice ? String(initialItem.purchasePrice) : '');
      setPurchaseDate(initialItem.purchaseDate || '');
      setNotes(initialItem.notes || '');
      setTags(initialItem.tags || []);
      setImageUrl(initialItem.imageUrl || '');
    } else {
      // Default new item values
      setName('');
      setBrand('');
      setModelNumber('');
      setSerialNumber('');
      setBarcode(prefilledBarcode || `ITM-${Math.floor(10000 + Math.random() * 90000)}`);
      setCategory('Smart Home & IoT');
      setSelectedProtocols([]);
      setRoomId(rooms[0]?.id || '');
      setLocation('');
      setBoxId(prefilledBoxId || '');
      setQuantity(1);
      setCondition('like_new');
      setStatus(prefilledBoxId ? 'in_storage' : 'in_use');
      setPurchasePrice('');
      setPurchaseDate('');
      setNotes('');
      setTags([]);
      setImageUrl('');
    }
    setErrors({});
  }, [initialItem, prefilledBoxId, prefilledBarcode, isOpen, rooms]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Item name is required';
    if (!brand.trim()) newErrors.brand = 'Brand or manufacturer is required';
    if (!barcode.trim()) newErrors.barcode = 'Barcode is required';
    if (!roomId) newErrors.roomId = 'Room is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const targetBox = boxes.find((b) => b.id === boxId);

    const savedItem: InventoryItem = {
      id: initialItem ? initialItem.id : `item-${Date.now()}`,
      name: name.trim(),
      brand: brand.trim(),
      modelNumber: modelNumber.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      barcode: barcode.trim(),
      category,
      protocol: selectedProtocols.length > 0 ? selectedProtocols[0] : undefined,
      protocols: selectedProtocols,
      roomId: targetBox ? targetBox.roomId : roomId,
      location: targetBox ? (location || targetBox.location) : location,
      boxId: boxId || null,
      quantity: Math.max(1, Number(quantity) || 1),
      condition,
      status,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      purchaseDate: purchaseDate || undefined,
      notes: notes.trim() || undefined,
      tags,
      imageUrl: imageUrl.trim() || undefined,
      createdAt: initialItem ? initialItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-transparent dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {initialItem ? 'Edit Item Details' : 'Add New Inventory Item'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Item Photo & Google Image Search Card */}
          <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
            {imageUrl ? (
              <div className="relative group shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
                <img
                  src={imageUrl}
                  alt={name || 'Item photo'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-1"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                  title="Remove photo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsImageSearchOpen(true)}
                className="shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-850 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors group"
              >
                <ImageIcon className="w-7 h-7 stroke-[1.5] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold mt-1 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">No Photo</span>
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Item Photo
                </span>
                <span className="text-[10px] font-bold tracking-wide text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800 px-1.5 py-0.2 rounded-md">
                  Google Images
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mb-2.5">
                Search Google for official product photos or packaging images based on brand, model, and item title.
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setIsImageSearchOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  {imageUrl ? 'Change Photo (Google Search)' : 'Search Google for Photo'}
                </button>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Item Title / Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aqara Zigbee Temperature Sensor"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                  errors.name ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.name && <p className="text-[11px] text-red-500 mt-0.5">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Aqara, Eve, Apple, Anker, Fluke"
                className={`w-full text-xs py-2 px-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                  errors.brand ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.brand && <p className="text-[11px] text-red-500 mt-0.5">{errors.brand}</p>}
            </div>
          </div>

          {/* Barcode & Auto-Generator */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                Barcode / Asset Tag Code *
              </label>
              <button
                type="button"
                onClick={generateRandomBarcode}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Auto-Generate
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. ITM-10021 or scan packaging barcode"
                className={`flex-1 font-mono text-xs py-2 px-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                  errors.barcode ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Supports custom asset codes (ITM-XXXXX) or standard manufacturer UPC/EAN retail barcodes.
            </p>
          </div>

          {/* Model & Serial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Model Number (Optional)
              </label>
              <input
                type="text"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="e.g. WSDCGQ11LM or A8743"
                className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Serial Number (Optional)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-882941-X"
                className="w-full text-xs font-mono py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Category & Smart Home Protocols */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Smart Home Protocols
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    (Multi-select: pick all that apply)
                  </span>
                </div>
                {selectedProtocols.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProtocols([])}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Clear all ({selectedProtocols.length})
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PROTOCOLS.map((p) => {
                  const isSelected = selectedProtocols.includes(p);
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => toggleProtocol(p)}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white font-semibold shadow-xs shadow-indigo-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[2.5]" />}
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Storage Box & Room Assignment */}
          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Storage Placement
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Pack into Storage Box
                </label>
                <select
                  value={boxId}
                  onChange={(e) => setBoxId(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">None (Unboxed / Active in Room)</option>
                  {boxes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.boxCode}: {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Room Location *
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Specific Location (Shelf, Drawer, Bin, Rack)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Shelf B2, Workbench Drawer 3, TV Console"
                className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Quantity, Condition, Status, Price */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="new">New in Box</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="needs_repair">Needs Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
                className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="in_storage">In Storage</option>
                <option value="in_use">In Active Use</option>
                <option value="spare">Spare / Backup</option>
                <option value="lent_out">Lent Out</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Unit Value ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Tags (Press Enter to add)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="e.g. zigbee, backup, hdmi, sensor..."
                className="flex-1 text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => {
                  if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                    setTags([...tags, tagInput.trim()]);
                    setTagInput('');
                  }
                }}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Notes, Specifications & Compatibility
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Firmware version, included accessories, pinout, or repair history..."
              className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              {initialItem && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(initialItem);
                    onClose();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Item
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-500/20 transition-colors cursor-pointer"
              >
                {initialItem ? 'Update Item' : 'Save Item'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Google Image Search Modal */}
      <GoogleImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        onSelectImage={(newUrl) => setImageUrl(newUrl)}
        currentImageUrl={imageUrl}
        itemName={name}
        itemBrand={brand}
        itemModel={modelNumber}
        initialQuery={[brand, modelNumber, name].filter(Boolean).join(' ')}
      />
    </div>
  );
};
