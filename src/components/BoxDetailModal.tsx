import React, { useState } from 'react';
import { 
  X, 
  Box, 
  Package, 
  MapPin, 
  Printer, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink,
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import type { StorageBox, InventoryItem, Room } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';

interface BoxDetailModalProps {
  box: StorageBox | null;
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  rooms: Room[];
  onSelectItem: (item: InventoryItem) => void;
  onAddItemToBox: (box: StorageBox) => void;
  onEditBox: (box: StorageBox) => void;
  onDeleteBox: (box: StorageBox) => void;
  onPrintBoxLabel: (box: StorageBox) => void;
  onPrintBoxPackingSlip?: (box: StorageBox) => void;
  onRemoveItemFromBox: (item: InventoryItem) => void;
}

export const BoxDetailModal: React.FC<BoxDetailModalProps> = ({
  box,
  isOpen,
  onClose,
  items,
  rooms,
  onSelectItem,
  onAddItemToBox,
  onEditBox,
  onDeleteBox,
  onPrintBoxLabel,
  onPrintBoxPackingSlip,
  onRemoveItemFromBox
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !box) return null;

  const room = rooms.find((r) => r.id === box.roomId);
  const itemsInBox = items.filter((it) => it.boxId === box.id);
  const filteredItems = itemsInBox.filter((it) => 
    it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    it.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    it.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    it.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = itemsInBox.reduce((sum, it) => sum + (it.purchasePrice || 0) * (it.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <span 
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: box.colorTag || '#4f46e5' }}
            />
            <span className="font-mono text-xs font-black bg-slate-900 dark:bg-indigo-950 text-white dark:text-indigo-200 border border-transparent dark:border-indigo-800 px-2.5 py-1 rounded-lg">
              {box.boxCode}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">• Storage Box Inventory</span>
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
          {/* Title & Location Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{box.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>
                  Room: <strong>{room?.name || 'Unassigned'}</strong> • Location: <strong>{box.location}</strong>
                </span>
              </div>
              {box.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">{box.description}</p>
              )}
            </div>

            <div className="shrink-0 flex flex-col items-center sm:items-end">
              <div className="bg-white p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                <BarcodeRenderer
                  value={box.barcode}
                  width={1.4}
                  height={38}
                  fontSize={10}
                  displayValue={true}
                  lineColor="#000000"
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => onPrintBoxLabel(box)}
                  className="inline-flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white font-medium hover:underline cursor-pointer"
                  title="Print Storage Box Label Placard"
                >
                  <Printer className="w-3.5 h-3.5" /> Box Label
                </button>
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <button
                  onClick={() => onPrintBoxPackingSlip ? onPrintBoxPackingSlip(box) : onPrintBoxLabel(box)}
                  className="inline-flex items-center gap-1 text-xs text-black dark:text-white font-semibold hover:underline cursor-pointer"
                  title="Print Storage Box Packing Slip & Contents"
                >
                  <FileText className="w-3.5 h-3.5" /> Packing Slip
                </button>
              </div>
            </div>
          </div>

          {/* Stats & Search row */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium border border-transparent dark:border-slate-700">
                Items: <strong className="text-slate-900 dark:text-slate-100">{itemsInBox.length}</strong>
              </span>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium border border-transparent dark:border-slate-700">
                Total Value: <strong className="text-slate-900 dark:text-slate-100">${totalValue.toFixed(2)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter box contents..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <button
                onClick={() => onAddItemToBox(box)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Pack Item
              </button>
            </div>
          </div>

          {/* Items List in Box */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                {itemsInBox.length === 0 ? (
                  <div>
                    <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">This storage box is empty</p>
                    <p className="mt-1">Click "Pack Item" above to add gear to this box.</p>
                  </div>
                ) : (
                  <p>No items inside match your search filter.</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-3"
                  >
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        onSelectItem(item);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {item.barcode}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400">
                          {item.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{item.brand}</span>
                        <span>•</span>
                        <span>Qty: <strong className="text-slate-700 dark:text-slate-300">{item.quantity}</strong></span>
                        {item.purchasePrice && (
                          <>
                            <span>•</span>
                            <span>${item.purchasePrice.toFixed(2)}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="capitalize">{item.status.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onRemoveItemFromBox(item)}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors flex items-center gap-1"
                        title="Unpack item from this box"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Unpack
                      </button>
                      <button
                        onClick={() => {
                          onSelectItem(item);
                          onClose();
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="View details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDeleteBox(box);
                onClose();
              }}
              className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Box
            </button>
            <button
              onClick={() => {
                onEditBox(box);
                onClose();
              }}
              className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Box
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl shadow-xs shadow-indigo-500/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
