import React from 'react';
import { Home, Box, Package, Plus, Edit2, Trash2, ArrowRight } from 'lucide-react';
import type { Room, StorageBox, InventoryItem } from '../types';

interface RoomsViewProps {
  rooms: Room[];
  boxes: StorageBox[];
  items: InventoryItem[];
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  onFilterByRoom: (roomId: string) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  boxes,
  items,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  onFilterByRoom
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Household Rooms & Zones</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Organize your storage boxes and gear by their physical locations</p>
        </div>
        <button
          onClick={onAddRoom}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-500/20 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add New Room
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((room, index) => {
          const roomBoxes = boxes.filter((b) => b.roomId === room.id);
          const roomItems = items.filter((it) => it.roomId === room.id);
          const unboxedCount = roomItems.filter((it) => !it.boxId).length;

          // Distinct bento accent colors for rooms
          const accentColors = ['bg-indigo-500', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-purple-400'];
          const accentColor = accentColors[index % accentColors.length];

          return (
            <div
              key={room.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all p-6 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-7 ${accentColor} rounded-full shrink-0`} />
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                      <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{room.name}</h3>
                      {room.floor && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{room.floor}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditRoom(room)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Room"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteRoom(room)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Room"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {room.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {room.description}
                  </p>
                )}

                {/* Statistics Bento sub-cards */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                      <Box className="w-3 h-3 text-slate-400" /> Storage Boxes
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-base mt-0.5">{roomBoxes.length}</div>
                  </div>

                  <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                      <Package className="w-3 h-3 text-slate-400" /> Total Items
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-base mt-0.5">{roomItems.length}</div>
                  </div>
                </div>

                {/* Storage boxes list inside room */}
                {roomBoxes.length > 0 && (
                  <div className="mt-3.5">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                      Boxes in this room:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {roomBoxes.map((b) => (
                        <span key={b.id} className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          {b.boxCode}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {unboxedCount} loose unboxed items
                </span>
                <button
                  onClick={() => onFilterByRoom(room.id)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  View Items <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
