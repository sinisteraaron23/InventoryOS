import React from 'react';
import { 
  Package, 
  DollarSign, 
  Box, 
  Radio, 
  Layers, 
  Home, 
  Cpu, 
  ShieldCheck 
} from 'lucide-react';
import type { InventoryItem, StorageBox, Room } from '../types';

interface AnalyticsViewProps {
  items: InventoryItem[];
  boxes: StorageBox[];
  rooms: Room[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  items,
  boxes,
  rooms
}) => {
  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const totalValue = items.reduce((acc, it) => acc + (it.purchasePrice || 0) * (it.quantity || 1), 0);
  const boxedItemsCount = items.filter((it) => Boolean(it.boxId)).length;
  const unboxedItemsCount = items.filter((it) => !it.boxId).length;

  // Protocol stats
  const protocolCounts: { [key: string]: number } = {};
  items.forEach((it) => {
    const protoList = (it.protocols && it.protocols.length > 0)
      ? it.protocols.filter((p) => p !== 'None')
      : (it.protocol && it.protocol !== 'None' ? [it.protocol] : []);
    
    protoList.forEach((proto) => {
      protocolCounts[proto] = (protocolCounts[proto] || 0) + it.quantity;
    });
  });

  // Category stats
  const categoryCounts: { [key: string]: { count: number; value: number } } = {};
  items.forEach((it) => {
    const cat = it.category || 'Other';
    if (!categoryCounts[cat]) {
      categoryCounts[cat] = { count: 0, value: 0 };
    }
    categoryCounts[cat].count += it.quantity;
    categoryCounts[cat].value += (it.purchasePrice || 0) * (it.quantity || 1);
  });

  // Room stats
  const roomCounts: { [key: string]: { count: number; value: number } } = {};
  items.forEach((it) => {
    const roomObj = rooms.find((r) => r.id === it.roomId);
    const roomName = roomObj?.name || 'Unassigned';
    if (!roomCounts[roomName]) {
      roomCounts[roomName] = { count: 0, value: 0 };
    }
    roomCounts[roomName].count += it.quantity;
    roomCounts[roomName].value += (it.purchasePrice || 0) * (it.quantity || 1);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top 4 Key Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Catalog Items</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">{items.length}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
            <strong className="text-zinc-800 dark:text-zinc-200">{totalUnits}</strong> total physical units/parts
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Valuation</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-transparent dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">${totalValue.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
            Based on logged purchase prices
          </div>
        </div>

        {/* Emerald Bento Card for Boxed Storage */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 p-6 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Storage Containers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-100 tracking-tight">{boxes.length} Boxes</div>
          <div className="text-xs text-emerald-800 dark:text-emerald-300 mt-1.5">
            <strong className="text-emerald-950 dark:text-emerald-100">{boxedItemsCount}</strong> items safely boxed ({((boxedItemsCount / (items.length || 1)) * 100).toFixed(0)}%)
          </div>
        </div>

        {/* Amber Bento Card for Standalone / Unboxed */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 p-6 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rooms & Locations</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 dark:bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-950 dark:text-amber-100 tracking-tight">{rooms.length} Zones</div>
          <div className="text-xs text-amber-800 dark:text-amber-300 mt-1.5">
            <strong className="text-amber-950 dark:text-amber-100">{unboxedItemsCount}</strong> active unboxed items
          </div>
        </div>
      </div>

      {/* Grid: Categories Breakdown & Smart Home Protocol Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bento Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-5">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> Categories & Inventory Valuation
              </h3>
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{Object.keys(categoryCounts).length} Categories</span>
            </div>

            <div className="space-y-4">
              {Object.entries(categoryCounts).map(([catName, data]) => {
                const percent = Math.min(100, Math.round((data.count / (totalUnits || 1)) * 100));
                return (
                  <div key={catName}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{catName}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {data.count} units • <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">${data.value.toFixed(2)}</strong>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-zinc-900 dark:bg-zinc-100 h-2.5 rounded-full transition-all shadow-2xs"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Smart Home Protocols & Room Distribution */}
        <div className="flex flex-col gap-6">
          {/* Smart Protocols Bento Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> Smart Home Protocols Breakdown
              </h3>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Wireless & Mesh Gear</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(protocolCounts).map(([proto, count]) => (
                <div key={proto} className="p-3.5 bg-zinc-50/80 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80">
                  <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">{proto}</div>
                  <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">{count} units</div>
                </div>
              ))}
              {Object.keys(protocolCounts).length === 0 && (
                <div className="col-span-3 text-center py-5 text-xs text-zinc-400 dark:text-zinc-500 italic">
                  No smart protocols specified yet.
                </div>
              )}
            </div>
          </div>

          {/* Rooms breakdown Bento Card with indicator pills */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Home className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> Inventory by Room Location
              </h3>
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Total Valuation</span>
            </div>

            <div className="space-y-2.5">
              {Object.entries(roomCounts).map(([rName, data], idx) => {
                const colors = ['bg-zinc-900 dark:bg-zinc-100', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400'];
                const indicatorColor = colors[idx % colors.length];

                return (
                  <div key={rName} className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/60 hover:bg-zinc-100/60 dark:hover:bg-zinc-800 text-xs transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-5 ${indicatorColor} rounded-full`} />
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{rName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                      <span>{data.count} items</span>
                      <span>•</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">${data.value.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
