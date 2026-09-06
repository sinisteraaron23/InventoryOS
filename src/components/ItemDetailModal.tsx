import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Box, 
  MapPin, 
  Printer, 
  QrCode, 
  Radio, 
  Tag, 
  Calendar, 
  DollarSign, 
  Edit2, 
  Trash2, 
  Check, 
  Copy,
  ArrowRightLeft,
  Plus,
  Minus,
  Image as ImageIcon,
  Search
} from 'lucide-react';
import type { InventoryItem, StorageBox, Room } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { GoogleImageSearchModal } from './GoogleImageSearchModal';

interface ItemDetailModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  boxes: StorageBox[];
  rooms: Room[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onPrintBarcode: (item: InventoryItem) => void;
  onUpdateItem: (updated: InventoryItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  boxes,
  rooms,
  onEdit,
  onDelete,
  onPrintBarcode,
  onUpdateItem
}) => {
  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [isRelocating, setIsRelocating] = useState(false);
  const [targetBoxId, setTargetBoxId] = useState<string>('');
  const [targetRoomId, setTargetRoomId] = useState<string>('');
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);

  if (!isOpen || !item) return null;

  const currentBox = boxes.find((b) => b.id === item.boxId);
  const currentRoom = rooms.find((r) => r.id === item.roomId);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2000);
  };

  const handleQuickQtyChange = (delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    onUpdateItem({
      ...item,
      quantity: newQty,
      updatedAt: new Date().toISOString()
    });
  };

  const handleQuickStatusChange = (newStatus: InventoryItem['status']) => {
    onUpdateItem({
      ...item,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveRelocation = () => {
    const selectedBox = boxes.find((b) => b.id === targetBoxId);
    const newRoomId = selectedBox ? selectedBox.roomId : (targetRoomId || item.roomId);

    onUpdateItem({
      ...item,
      boxId: targetBoxId === 'unboxed' ? null : (targetBoxId || null),
      roomId: newRoomId,
      updatedAt: new Date().toISOString()
    });
    setIsRelocating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {item.category}
            </span>
            {item.protocol && item.protocol !== 'None' && (
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" /> {item.protocol}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Photo Section */}
          {item.imageUrl ? (
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-center max-h-64 shadow-2xs">
              <img
                src={item.imageUrl}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-full max-h-60 object-contain p-2"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedProxy && item.imageUrl) {
                    target.dataset.triedProxy = 'true';
                    target.src = `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`;
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setIsImageSearchOpen(true)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Search className="w-3 h-3" /> Change Photo (Google)
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No item photo</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Add a product photo with Google Images</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImageSearchOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Search className="w-3 h-3" />
                Find Photo
              </button>
            </div>
          )}

          {/* Title & Brand */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">{item.name}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Brand: <strong className="text-slate-800 dark:text-slate-200">{item.brand}</strong>
              {item.modelNumber && <span className="ml-2">• Model: {item.modelNumber}</span>}
              {item.serialNumber && <span className="ml-2 font-mono text-xs">• S/N: {item.serialNumber}</span>}
            </p>
          </div>

          {/* Barcode Showcase Card */}
          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center relative group">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Barcode Code 128
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(item.barcode)}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copiedBarcode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedBarcode ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => onPrintBarcode(item)}
                  className="inline-flex items-center gap-1 text-xs text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 px-2.5 py-1 rounded-md shadow-2xs transition-colors"
                >
                  <Printer className="w-3 h-3" /> Print Label
                </button>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs w-full flex justify-center">
              <BarcodeRenderer
                value={item.barcode}
                width={1.8}
                height={48}
                fontSize={12}
                displayValue={true}
                lineColor="#000000"
              />
            </div>
          </div>

          {/* Location & Storage Details */}
          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Storage & Placement
              </span>
              <button
                onClick={() => {
                  setTargetBoxId(item.boxId || 'unboxed');
                  setTargetRoomId(item.roomId);
                  setIsRelocating(!isRelocating);
                }}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 hover:underline"
              >
                <ArrowRightLeft className="w-3 h-3" />
                {isRelocating ? 'Cancel Move' : 'Move Item'}
              </button>
            </div>

            {!isRelocating ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <Box className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Storage Box</span>
                    {currentBox ? (
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {currentBox.boxCode} • {currentBox.name}
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400 italic">Unboxed (Not in a box)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Room & Location</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {currentRoom?.name || 'Unassigned'}
                    </span>
                    {item.location && (
                      <span className="text-slate-600 dark:text-slate-400 block text-[11px]">{item.location}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Target Storage Box</label>
                  <select
                    value={targetBoxId}
                    onChange={(e) => setTargetBoxId(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="unboxed">Unboxed / Loose item (No box)</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.boxCode} — {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {targetBoxId === 'unboxed' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Assign to Room</label>
                    <select
                      value={targetRoomId}
                      onChange={(e) => setTargetRoomId(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsRelocating(false)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRelocation}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-indigo-700"
                  >
                    Confirm Move
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Quantity control */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Quantity</span>
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => handleQuickQtyChange(-1)}
                  className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-base text-slate-900 dark:text-slate-100">{item.quantity}</span>
                <button
                  onClick={() => handleQuickQtyChange(1)}
                  className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Condition */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] block">Condition</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize mt-2 block">
                {item.condition.replace('_', ' ')}
              </span>
            </div>

            {/* Purchase Price */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] block">Unit Value</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 mt-2 block">
                {item.purchasePrice ? `$${item.purchasePrice.toFixed(2)}` : '—'}
              </span>
            </div>

            {/* Status */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] block">Status</span>
              <select
                value={item.status}
                onChange={(e) => handleQuickStatusChange(e.target.value as InventoryItem['status'])}
                className="mt-1 text-xs font-semibold py-1 px-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-full"
              >
                <option value="in_storage">In Storage</option>
                <option value="in_use">In Use</option>
                <option value="spare">Spare</option>
                <option value="lent_out">Lent Out</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Notes & Hardware Specs
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 px-3.5 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete Item
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(item);
                onClose();
              }}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Details
            </button>
            <button
              onClick={onClose}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl shadow-xs shadow-indigo-500/20 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Google Image Search Modal */}
      <GoogleImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        onSelectImage={(newUrl) => {
          onUpdateItem({
            ...item,
            imageUrl: newUrl || undefined,
            updatedAt: new Date().toISOString()
          });
        }}
        currentImageUrl={item.imageUrl}
        itemName={item.name}
        itemBrand={item.brand}
        itemModel={item.modelNumber}
        initialQuery={[item.brand, item.modelNumber, item.name].filter(Boolean).join(' ')}
      />
    </div>
  );
};
