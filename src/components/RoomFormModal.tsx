import React, { useState, useEffect } from 'react';
import { X, Home } from 'lucide-react';
import type { Room } from '../types';

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Room) => void;
  initialRoom?: Room | null;
}

export const RoomFormModal: React.FC<RoomFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRoom
}) => {
  const [name, setName] = useState('');
  const [floor, setFloor] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialRoom) {
      setName(initialRoom.name);
      setFloor(initialRoom.floor || '');
      setDescription(initialRoom.description || '');
    } else {
      setName('');
      setFloor('');
      setDescription('');
    }
    setErrors({});
  }, [initialRoom, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: 'Room name is required' });
      return;
    }

    const savedRoom: Room = {
      id: initialRoom ? initialRoom.id : `room-${Date.now()}`,
      name: name.trim(),
      floor: floor.trim() || undefined,
      description: description.trim() || undefined
    };

    onSave(savedRoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shadow-xs">
              <Home className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {initialRoom ? 'Edit Room' : 'Add Room Location'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Room / Zone Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Basement Storage, Workshop, Master Closet"
              className={`w-full text-xs py-2 px-3 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
                errors.name ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-700'
              }`}
            />
            {errors.name && <p className="text-[11px] text-red-500 mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Floor / Level (Optional)
            </label>
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g. 1st Floor, Basement, Attic"
              className="w-full text-xs py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. North storage shelves and battery recharge station."
              className="w-full text-xs py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

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
              {initialRoom ? 'Update Room' : 'Save Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
