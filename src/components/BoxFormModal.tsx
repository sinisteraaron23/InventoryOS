import React, { useState, useEffect } from 'react';
import { X, Box, Sparkles, QrCode } from 'lucide-react';
import type { StorageBox, Room } from '../types';

interface BoxFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (box: StorageBox) => void;
  initialBox?: StorageBox | null;
  rooms: Room[];
  prefilledBarcode?: string | null;
}

const COLOR_PRESETS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Slate', hex: '#64748b' },
  { name: 'Orange', hex: '#f97316' }
];

export const BoxFormModal: React.FC<BoxFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBox,
  rooms,
  prefilledBarcode
}) => {
  const [boxCode, setBoxCode] = useState('');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [roomId, setRoomId] = useState('');
  const [location, setLocation] = useState('');
  const [colorTag, setColorTag] = useState('#3b82f6');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialBox) {
      setBoxCode(initialBox.boxCode);
      setName(initialBox.name);
      setBarcode(initialBox.barcode);
      setRoomId(initialBox.roomId);
      setLocation(initialBox.location);
      setColorTag(initialBox.colorTag || '#3b82f6');
      setDescription(initialBox.description || '');
    } else {
      const nextNum = Math.floor(10 + Math.random() * 90);
      setBoxCode(`BOX-${nextNum}`);
      setName('');
      setBarcode(prefilledBarcode || `BOX-0${nextNum}`);
      setRoomId(rooms[0]?.id || '');
      setLocation('');
      setColorTag('#3b82f6');
      setDescription('');
    }
    setErrors({});
  }, [initialBox, prefilledBarcode, isOpen, rooms]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!boxCode.trim()) newErrors.boxCode = 'Box Code is required';
    if (!name.trim()) newErrors.name = 'Box name is required';
    if (!barcode.trim()) newErrors.barcode = 'Barcode is required';
    if (!roomId) newErrors.roomId = 'Room is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const savedBox: StorageBox = {
      id: initialBox ? initialBox.id : `box-${Date.now()}`,
      boxCode: boxCode.trim().toUpperCase(),
      name: name.trim(),
      barcode: barcode.trim(),
      roomId,
      location: location.trim() || 'General Storage',
      colorTag,
      description: description.trim() || undefined,
      createdAt: initialBox ? initialBox.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(savedBox);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shadow-xs">
              <Box className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {initialBox ? 'Edit Storage Box' : 'Create Storage Box / Tote'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Box Code Identifier *
              </label>
              <input
                type="text"
                value={boxCode}
                onChange={(e) => setBoxCode(e.target.value)}
                placeholder="e.g. BOX-05 or TOTE-A"
                className={`w-full font-mono font-bold text-xs py-2 px-3 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
                  errors.boxCode ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-700'
                }`}
              />
              {errors.boxCode && <p className="text-[11px] text-red-500 mt-0.5">{errors.boxCode}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Barcode Code *
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. BOX-005"
                className={`w-full font-mono text-xs py-2 px-3 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
                  errors.barcode ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-700'
                }`}
              />
              {errors.barcode && <p className="text-[11px] text-red-500 mt-0.5">{errors.barcode}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Box Name / Category Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spare HDMI Cables, Zigbee Sensors, Test Gear"
              className={`w-full text-xs py-2 px-3 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
                errors.name ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-700'
              }`}
            />
            {errors.name && <p className="text-[11px] text-red-500 mt-0.5">{errors.name}</p>}
          </div>

          {/* Color tag */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
              Color Tag Indicator (for quick physical identification)
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.hex}
                  onClick={() => setColorTag(preset.hex)}
                  className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center cursor-pointer ${
                    colorTag === preset.hex ? 'scale-110 ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-zinc-900' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Room & Placement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Room *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Exact Location / Shelf
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Rack A Shelf 2, Top Closet"
                className="w-full text-xs py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Clear plastic bin with latching handles. Keep away from humidity."
              className="w-full text-xs py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {initialBox ? 'Update Box' : 'Save Box'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
