import React from 'react';
import { 
  Package, 
  Box, 
  MapPin, 
  Printer, 
  QrCode, 
  Radio, 
  Tag, 
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import type { InventoryItem, StorageBox, Room } from '../types';

interface ItemCardProps {
  item: InventoryItem;
  boxes: StorageBox[];
  rooms: Room[];
  onSelect: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onPrintBarcode: (item: InventoryItem) => void;
}

const STATUS_CONFIG = {
  in_storage: { label: 'In Storage', bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700' },
  in_use: { label: 'In Active Use', bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  spare: { label: 'Spare / Backup', bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  lent_out: { label: 'Lent Out', bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' }
};

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  boxes,
  rooms,
  onSelect,
  onEdit,
  onDelete,
  onPrintBarcode
}) => {
  const box = boxes.find((b) => b.id === item.boxId);
  const room = rooms.find((r) => r.id === item.roomId);
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.in_storage;

  const itemProtocols = (item.protocols && item.protocols.length > 0)
    ? item.protocols.filter((p) => p !== 'None')
    : (item.protocol && item.protocol !== 'None' ? [item.protocol] : []);

  return (
    <div 
      className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden shadow-xs"
    >
      {/* Item Photo banner if present */}
      {item.imageUrl && (
        <div 
          className="w-full h-36 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 overflow-hidden relative cursor-pointer flex items-center justify-center p-2"
          onClick={() => onSelect(item)}
        >
          <img
            src={item.imageUrl}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedProxy && item.imageUrl) {
                target.dataset.triedProxy = 'true';
                target.src = `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`;
              }
            }}
          />
        </div>
      )}

      {/* Top Bar / Category & Status */}
      <div className="p-5 pb-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 truncate">
            {item.category}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.bg}`}>
              {statusCfg.label}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrintBarcode(item);
              }}
              title="Print Barcode Label"
              className="p-1 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Item Title & Brand */}
        <div className="cursor-pointer" onClick={() => onSelect(item)}>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors line-clamp-1">
            {item.name}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.brand}</span>
            {item.modelNumber && <span>• Mod: {item.modelNumber}</span>}
          </p>
        </div>

        {/* Barcode Strip */}
        <div className="mt-3.5 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl px-3.5 py-1.5">
          <div className="flex items-center gap-2">
            <QrCode className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 tracking-wider">
              {item.barcode}
            </span>
          </div>
          {itemProtocols.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {itemProtocols.map((proto) => (
                <span
                  key={proto}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 px-2 py-0.5 rounded-md"
                >
                  <Radio className="w-2.5 h-2.5" /> {proto}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Location & Storage Box Breadcrumbs */}
        <div className="mt-3.5 flex flex-col gap-1.5 text-xs">
          {/* Storage Box */}
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 truncate">
            <Box className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
            {box ? (
              <span className="flex items-center gap-1.5 truncate">
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: box.colorTag || '#71717a' }}
                />
                <strong className="text-zinc-800 dark:text-zinc-200 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[11px] border border-zinc-200/80 dark:border-zinc-700">{box.boxCode}</strong>
                <span className="truncate text-zinc-600 dark:text-zinc-400">({box.name})</span>
              </span>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500 italic">Not packed in box (Standalone)</span>
            )}
          </div>

          {/* Room & Sub-location */}
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 truncate">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
            <span className="truncate">
              <strong className="text-zinc-800 dark:text-zinc-200">{room?.name || 'Unassigned Room'}</strong>
              {item.location && <span className="text-zinc-500 dark:text-zinc-400"> • {item.location}</span>}
            </span>
          </div>
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60"
              >
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 self-center">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer info: Quantity, Value, Actions */}
      <div className="px-5 py-3 bg-zinc-50/60 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
          <span>Qty: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{item.quantity}</strong></span>
          {item.purchasePrice !== undefined && item.purchasePrice > 0 && (
            <span>Val: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">${item.purchasePrice.toFixed(2)}</strong></span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelect(item)}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors shadow-2xs"
            title="View Details"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors shadow-2xs"
            title="Edit Item"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            title="Delete Item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
