import React from 'react';
import { 
  Box, 
  MapPin, 
  Package, 
  Printer, 
  QrCode, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import type { StorageBox, InventoryItem, Room } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';

interface BoxCardProps {
  box: StorageBox;
  itemsInBox: InventoryItem[];
  rooms: Room[];
  onOpenBox: (box: StorageBox) => void;
  onEditBox: (box: StorageBox) => void;
  onDeleteBox: (box: StorageBox) => void;
  onPrintBoxLabel: (box: StorageBox) => void;
  onAddItemToBox: (box: StorageBox) => void;
}

export const BoxCard: React.FC<BoxCardProps> = ({
  box,
  itemsInBox,
  rooms,
  onOpenBox,
  onEditBox,
  onDeleteBox,
  onPrintBoxLabel,
  onAddItemToBox
}) => {
  const room = rooms.find((r) => r.id === box.roomId);
  const totalValue = itemsInBox.reduce((sum, it) => sum + (it.purchasePrice || 0) * (it.quantity || 1), 0);

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden shadow-xs">
      <div className="p-6">
        {/* Top Code Badge & Color */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span 
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: box.colorTag || '#4f46e5' }}
            />
            <span className="font-mono text-xs font-extrabold tracking-wider text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {box.boxCode}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPrintBoxLabel(box)}
              title="Print Storage Box Barcode Label"
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEditBox(box)}
              title="Edit Box"
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteBox(box)}
              title="Delete Box"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Box Name & Description */}
        <div className="cursor-pointer" onClick={() => onOpenBox(box)}>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {box.name}
          </h3>
          {box.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {box.description}
            </p>
          )}
        </div>

        {/* Location Breadcrumb */}
        <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-900 dark:text-slate-100">{room?.name || 'Unassigned Room'}</strong> • {box.location}
          </span>
        </div>

        {/* Barcode Snippet Preview */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl px-3.5 py-2">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
              {box.barcode}
            </span>
          </div>
          <button
            onClick={() => onPrintBoxLabel(box)}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold hover:underline flex items-center gap-1"
          >
            Label Placard
          </button>
        </div>

        {/* Items Preview Chips */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <Package className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Contains <strong className="text-slate-800 dark:text-slate-200">{itemsInBox.length}</strong> items
            </span>
            {totalValue > 0 && (
              <span>Est. <strong className="text-slate-800 dark:text-slate-200">${totalValue.toFixed(2)}</strong></span>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {itemsInBox.slice(0, 3).map((it) => (
              <span key={it.id} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 truncate max-w-[140px]">
                {it.name}
              </span>
            ))}
            {itemsInBox.length > 3 && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">
                +{itemsInBox.length - 3} more
              </span>
            )}
            {itemsInBox.length === 0 && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Empty storage container</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => onAddItemToBox(box)}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Pack Item
        </button>

        <button
          onClick={() => onOpenBox(box)}
          className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-2xs"
        >
          <FolderOpen className="w-3.5 h-3.5" /> View Contents <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
