import React, { useState, useEffect } from 'react';
import { Printer, X, Check, Box, Package, Sliders, Bluetooth } from 'lucide-react';
import type { InventoryItem, StorageBox, Room } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { BluetoothPTouchModal } from './BluetoothPTouchModal';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  boxes: StorageBox[];
  rooms: Room[];
  initialSelectedItem?: InventoryItem | null;
  initialSelectedBox?: StorageBox | null;
}

export type LabelPreset = 'standard' | 'compact' | 'tote' | 'ptouch_12mm' | 'ptouch_9mm';

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  items,
  boxes,
  rooms,
  initialSelectedItem,
  initialSelectedBox
}) => {
  const [printTarget, setPrintTarget] = useState<'item' | 'box' | 'all_items' | 'box_sheet'>(
    initialSelectedBox ? 'box' : initialSelectedItem ? 'item' : 'item'
  );
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialSelectedItem?.id || (items[0]?.id ?? '')
  );
  const [selectedBoxId, setSelectedBoxId] = useState<string>(
    initialSelectedBox?.id || (boxes[0]?.id ?? '')
  );
  const [labelSize, setLabelSize] = useState<LabelPreset>('ptouch_12mm');
  const [copies, setCopies] = useState<number>(1);
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);

  // Sync state when modal opens or initial selection changes
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedBox) {
        setPrintTarget('box');
        setSelectedBoxId(initialSelectedBox.id);
      } else if (initialSelectedItem) {
        setPrintTarget('item');
        setSelectedItemId(initialSelectedItem.id);
      }
    }
  }, [isOpen, initialSelectedBox, initialSelectedItem]);

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === selectedItemId);
  const currentBox = boxes.find((b) => b.id === selectedBoxId);

  const currentItemProtocols = currentItem
    ? (currentItem.protocols && currentItem.protocols.length > 0)
      ? currentItem.protocols.filter((p) => p !== 'None')
      : (currentItem.protocol && currentItem.protocol !== 'None' ? [currentItem.protocol] : [])
    : [];

  const getRoomName = (roomId: string) => {
    return rooms.find((r) => r.id === roomId)?.name || 'Unassigned Room';
  };

  const getBoxName = (boxId?: string | null) => {
    if (!boxId) return 'Loose (No Box)';
    const b = boxes.find((box) => box.id === boxId);
    return b ? `${b.boxCode} • ${b.name}` : 'Unknown Box';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container - on screen it is a modal, when printing it isolates the preview */}
      <div className="print-modal-card relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Screen-only Header */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Print Visual Barcode Labels</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Brother P-Touch Cube PT-P300BT & standard label presets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Screen Controls */}
        <div className="print:hidden p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-4">
          {/* Target Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setPrintTarget('item')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                printTarget === 'item'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Single Item
            </button>
            <button
              onClick={() => setPrintTarget('box')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                printTarget === 'box'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> Storage Box Label
            </button>
            <button
              onClick={() => setPrintTarget('box_sheet')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                printTarget === 'box_sheet'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Box Inventory Sheet
            </button>
            <button
              onClick={() => setPrintTarget('all_items')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                printTarget === 'all_items'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> All Items Sheet
            </button>
          </div>

          {/* Select item or box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(printTarget === 'item') && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Select Item to Print</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.barcode} — {item.name} ({item.brand})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(printTarget === 'box' || printTarget === 'box_sheet') && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Select Storage Box</label>
                <select
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
                >
                  {boxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.boxCode} — {box.name} ({getRoomName(box.roomId)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Label Size Preset */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Label Preset & Printer</label>
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as LabelPreset)}
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 font-medium"
              >
                <option value="ptouch_12mm">Brother P-Touch Cube PT-P300BT (12mm Tape / 0.47")</option>
                <option value="ptouch_9mm">Brother P-Touch Cube PT-P300BT (9mm Tape / 0.35")</option>
                <option value="compact">Compact Cable/Dev Tag (2.2" × 1.0" - No Image)</option>
                <option value="standard">Standard Asset Tag (3.5" × 1.5" - With Item Photo)</option>
                <option value="tote">Large Bin Placard (4.0" × 2.5" - With Item Photo)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Printable Area / Live Preview */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70 dark:bg-slate-950 print:bg-white print:p-0">
          {/* PT-P300BT Helpful Tips Banner */}
          {(labelSize === 'ptouch_12mm' || labelSize === 'ptouch_9mm') && (
            <div className="mb-3 px-3.5 py-2.5 bg-sky-50/90 dark:bg-sky-950/60 border border-sky-200/90 dark:border-sky-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-950 dark:text-sky-200 print:hidden shadow-2xs">
              <div className="flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">🏷️</span>
                <div className="text-[11px] leading-normal">
                  <span className="font-bold text-sky-900 dark:text-sky-100">Brother P-Touch Cube PT-P300BT Preset:</span> Sized precisely for <strong>{labelSize === 'ptouch_12mm' ? '12mm (0.47")' : '9mm (0.35")'} TZe thermal tape</strong>. You can print directly over Bluetooth (Web BLE) or through your OS print driver.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBluetoothModalOpen(true)}
                className="shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-sky-600/20 transition-all cursor-pointer"
              >
                <Bluetooth className="w-3.5 h-3.5" /> Bluetooth Print
              </button>
            </div>
          )}

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider print:hidden flex items-center justify-between">
            <span>Label Print Preview:</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Ready for Brother Cube or thermal printer</span>
          </div>

          <div className="print-surface flex flex-wrap gap-4 items-start justify-center">
            {/* Single Item Label */}
            {printTarget === 'item' && currentItem && (
              Array.from({ length: copies }).map((_, idx) => {
                if (labelSize === 'ptouch_12mm') {
                  return (
                    <div
                      key={idx}
                      className="bg-white border-2 border-slate-950 rounded-sm p-1.5 text-slate-950 flex flex-row items-center justify-between gap-2.5 w-[250px] h-[54px] print:w-[60mm] print:h-[12mm] print-ptouch-12mm shadow-xs print:shadow-none print:m-0 print:border-black overflow-hidden"
                    >
                      {/* Left: Barcode */}
                      <div className="shrink-0 flex items-center justify-center bg-white">
                        <BarcodeRenderer
                          value={currentItem.barcode}
                          width={0.88}
                          height={22}
                          fontSize={8}
                          displayValue={true}
                          lineColor="#000000"
                        />
                      </div>

                      {/* Right: Item Details */}
                      <div className="min-w-0 flex-1 flex flex-col justify-center leading-tight">
                        <div className="font-black text-[10px] leading-tight truncate text-black">
                          {currentItem.name}
                        </div>
                        <div className="text-[8.5px] text-slate-800 truncate font-semibold">
                          {currentItem.brand} {currentItem.modelNumber ? `• ${currentItem.modelNumber}` : ''}
                        </div>
                        <div className="text-[7.5px] text-slate-600 font-mono truncate flex items-center justify-between mt-0.5 border-t border-slate-300 pt-0.5">
                          <span className="truncate">{getBoxName(currentItem.boxId).split('•')[0]}</span>
                          <span className="font-bold text-black">{currentItem.barcode}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (labelSize === 'ptouch_9mm') {
                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-950 rounded-xs p-1 text-slate-950 flex flex-row items-center justify-between gap-2 w-[220px] h-[42px] print:w-[50mm] print:h-[9mm] print-ptouch-9mm shadow-xs print:shadow-none print:m-0 print:border-black overflow-hidden"
                    >
                      {/* Left: Barcode */}
                      <div className="shrink-0 flex items-center justify-center bg-white">
                        <BarcodeRenderer
                          value={currentItem.barcode}
                          width={0.78}
                          height={17}
                          fontSize={7}
                          displayValue={true}
                          lineColor="#000000"
                        />
                      </div>

                      {/* Right: Item Details */}
                      <div className="min-w-0 flex-1 flex flex-col justify-center leading-none">
                        <div className="font-black text-[9px] truncate text-black">
                          {currentItem.name}
                        </div>
                        <div className="text-[7.5px] text-slate-800 truncate font-bold mt-0.5">
                          {currentItem.brand}
                        </div>
                        <div className="text-[7px] text-slate-700 font-mono truncate font-semibold mt-0.5">
                          {currentItem.barcode}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Compact preset (Cable/Device tag - No photo as requested)
                if (labelSize === 'compact') {
                  return (
                    <div
                      key={idx}
                      className="bg-white border-2 border-slate-900 rounded-lg p-2.5 text-slate-950 flex flex-col justify-between shadow-xs print:shadow-none print:m-1 w-[220px] min-h-[105px]"
                    >
                      <div className="flex justify-between items-start border-b border-slate-900/30 pb-1 gap-1.5">
                        <div className="min-w-0">
                          <div className="font-bold text-xs leading-tight truncate text-slate-950">
                            {currentItem.name}
                          </div>
                          <div className="text-[9.5px] text-slate-600 truncate">
                            {currentItem.brand} {currentItem.modelNumber && `• Mod: ${currentItem.modelNumber}`}
                          </div>
                        </div>
                        {currentItemProtocols.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 shrink-0 justify-end max-w-[85px]">
                            {currentItemProtocols.map((proto) => (
                              <span
                                key={proto}
                                className="text-[7.5px] font-bold uppercase tracking-wider px-1 py-0.5 border border-slate-900 rounded bg-slate-100 text-slate-900"
                              >
                                {proto}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Visual Barcode */}
                      <div className="my-1 py-0.5 bg-white flex justify-center">
                        <BarcodeRenderer
                          value={currentItem.barcode}
                          width={1.2}
                          height={32}
                          fontSize={10}
                          displayValue={true}
                          lineColor="#000000"
                        />
                      </div>

                      <div className="border-t border-slate-900/30 pt-1 text-[8.5px] text-slate-700 flex justify-between items-center font-mono">
                        <span className="truncate">LOC: {getRoomName(currentItem.roomId)}</span>
                        <span className="truncate ml-1 font-bold">{getBoxName(currentItem.boxId)}</span>
                      </div>
                    </div>
                  );
                }

                // Standard and Tote presets (Include item image if available)
                const isTote = labelSize === 'tote';
                const hasImage = Boolean(currentItem.imageUrl);

                return (
                  <div
                    key={idx}
                    className={`bg-white border-2 border-slate-900 rounded-xl p-3 text-slate-950 flex flex-col justify-between shadow-xs print:shadow-none print:m-1 ${
                      isTote ? 'w-[360px] min-h-[190px]' : 'w-[310px] min-h-[150px]'
                    }`}
                  >
                    <div className="flex justify-between items-start border-b border-slate-900/30 pb-1.5 gap-2">
                      <div className="min-w-0 flex-1">
                        <div className={`font-bold leading-tight truncate text-slate-950 ${isTote ? 'text-sm' : 'text-xs'}`}>
                          {currentItem.name}
                        </div>
                        <div className="text-[10px] text-slate-600 truncate mt-0.5">
                          <span className="font-semibold">{currentItem.brand}</span>
                          {currentItem.modelNumber && ` • Mod: ${currentItem.modelNumber}`}
                        </div>
                      </div>
                      {currentItemProtocols.length > 0 && (
                        <div className="flex flex-wrap gap-1 shrink-0 justify-end max-w-[120px]">
                          {currentItemProtocols.map((proto) => (
                            <span
                              key={proto}
                              className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-slate-900 rounded bg-slate-100 text-slate-900"
                            >
                              {proto}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Middle: Item Photo (if available) + Barcode */}
                    <div className="my-2 py-0.5 bg-white flex items-center justify-between gap-3">
                      {hasImage && (
                        <div
                          className={`shrink-0 flex items-center justify-center border border-slate-300 rounded-lg bg-slate-50 p-1 overflow-hidden ${
                            isTote ? 'w-18 h-18' : 'w-13 h-13'
                          }`}
                        >
                          <img
                            src={currentItem.imageUrl}
                            alt={currentItem.name}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.triedProxy && currentItem.imageUrl) {
                                target.dataset.triedProxy = 'true';
                                target.src = `/api/proxy-image?url=${encodeURIComponent(currentItem.imageUrl)}`;
                              }
                            }}
                          />
                        </div>
                      )}

                      <div className="flex-1 flex justify-center items-center min-w-0 overflow-hidden">
                        <BarcodeRenderer
                          value={currentItem.barcode}
                          width={hasImage ? (isTote ? 1.35 : 1.15) : (isTote ? 1.6 : 1.45)}
                          height={isTote ? 50 : 38}
                          fontSize={isTote ? 11 : 10}
                          displayValue={true}
                          lineColor="#000000"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-900/30 pt-1 text-[9px] text-slate-700 flex justify-between items-center font-mono">
                      <span className="truncate">LOC: {getRoomName(currentItem.roomId)}</span>
                      <span className="truncate ml-1 font-bold">{getBoxName(currentItem.boxId)}</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Storage Box Label */}
            {printTarget === 'box' && currentBox && (
              Array.from({ length: copies }).map((_, idx) => {
                if (labelSize === 'ptouch_12mm') {
                  return (
                    <div
                      key={idx}
                      className="bg-white border-2 border-slate-950 rounded-xs p-1.5 text-slate-950 flex flex-row items-center justify-between gap-2.5 w-[260px] h-[54px] print:w-[65mm] print:h-[12mm] print-ptouch-12mm shadow-xs print:shadow-none print:m-0 print:border-black overflow-hidden"
                    >
                      {/* Left: Barcode */}
                      <div className="shrink-0 flex items-center justify-center bg-white">
                        <BarcodeRenderer
                          value={currentBox.barcode || currentBox.boxCode}
                          width={0.88}
                          height={22}
                          fontSize={8}
                          displayValue={true}
                          lineColor="#000000"
                        />
                      </div>

                      {/* Right: Box Details */}
                      <div className="min-w-0 flex-1 flex flex-col justify-center leading-tight">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px] font-black bg-black text-white px-1 py-0.2 rounded-xs">
                            {currentBox.boxCode}
                          </span>
                          <span className="font-black text-[10px] leading-tight truncate text-black">
                            {currentBox.name}
                          </span>
                        </div>
                        <div className="text-[8px] text-slate-800 truncate font-semibold mt-0.5">
                          LOC: {getRoomName(currentBox.roomId)} {currentBox.location ? `• ${currentBox.location}` : ''}
                        </div>
                        <div className="text-[7.5px] text-slate-600 font-mono truncate flex items-center justify-between mt-0.5 border-t border-slate-300 pt-0.5">
                          <span className="font-bold text-slate-700">STORAGE BOX</span>
                          <span className="font-bold text-black">{currentBox.barcode}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (labelSize === 'ptouch_9mm') {
                  return (
                    <div
                      key={idx}
                      className="bg-white border-2 border-slate-950 rounded-xs p-1 text-slate-950 flex flex-row items-center justify-between gap-2 w-[230px] h-[44px] print:w-[58mm] print:h-[9mm] print-ptouch-9mm shadow-xs print:shadow-none print:m-0 print:border-black overflow-hidden"
                    >
                      {/* Left: Barcode */}
                      <div className="shrink-0 flex items-center justify-center bg-white">
                        <BarcodeRenderer
                          value={currentBox.barcode || currentBox.boxCode}
                          width={0.78}
                          height={17}
                          fontSize={7}
                          displayValue={true}
                          lineColor="#000000"
                        />
                      </div>

                      {/* Right: Box Details */}
                      <div className="min-w-0 flex-1 flex flex-col justify-center leading-none">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[8px] font-black bg-black text-white px-0.5 py-0.2 rounded-xs">
                            {currentBox.boxCode}
                          </span>
                          <span className="font-black text-[9px] truncate text-black">
                            {currentBox.name}
                          </span>
                        </div>
                        <div className="text-[7.5px] text-slate-800 truncate font-bold mt-0.5">
                          {getRoomName(currentBox.roomId)}
                        </div>
                        <div className="text-[7px] text-slate-700 font-mono truncate font-semibold mt-0.5">
                          BIN: {currentBox.barcode}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (labelSize === 'compact') {
                  return (
                    <div
                      key={idx}
                      className="bg-white border-2 border-slate-900 rounded-lg p-2.5 text-slate-950 flex flex-col justify-between shadow-xs print:shadow-none print:m-1 w-[240px] min-h-[115px]"
                    >
                      <div className="flex items-center justify-between border-b border-slate-900/30 pb-1 gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black bg-slate-950 text-white px-1.5 py-0.5 rounded">
                            {currentBox.boxCode}
                          </span>
                          <span className="font-bold text-xs truncate max-w-[140px]">
                            {currentBox.name}
                          </span>
                        </div>
                      </div>
                      <div className="my-1.5 flex justify-center bg-white">
                        <BarcodeRenderer
                          value={currentBox.barcode}
                          width={1.3}
                          height={32}
                          fontSize={10}
                          displayValue={true}
                          lineColor="#000000"
                        />
                      </div>
                      <div className="border-t border-slate-900/30 pt-1 text-[8.5px] text-slate-700 flex justify-between items-center font-mono">
                        <span>{getRoomName(currentBox.roomId)}</span>
                        <span className="font-bold">{currentBox.location || 'Storage Box'}</span>
                      </div>
                    </div>
                  );
                }

                // Standard and Tote placards
                const isTote = labelSize === 'tote';
                return (
                  <div
                    key={idx}
                    className={`bg-white border-3 border-slate-950 rounded-xl p-4 text-slate-950 flex flex-col justify-between shadow-xs print:shadow-none print:m-1 ${
                      isTote ? 'w-[380px] min-h-[210px]' : 'w-[320px] min-h-[170px]'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-base font-black bg-slate-950 text-white px-2 py-0.5 rounded">
                          {currentBox.boxCode}
                        </div>
                        <div className="font-bold text-sm text-slate-950 truncate max-w-[200px]">
                          {currentBox.name}
                        </div>
                      </div>
                    </div>

                    <div className="my-3 flex justify-center bg-white">
                      <BarcodeRenderer
                        value={currentBox.barcode}
                        width={isTote ? 1.8 : 1.5}
                        height={isTote ? 46 : 38}
                        fontSize={isTote ? 12 : 11}
                        displayValue={true}
                        lineColor="#000000"
                      />
                    </div>

                    <div className="border-t border-slate-900/40 pt-2 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-900">Room:</span> {getRoomName(currentBox.roomId)}
                      </div>
                      <div className="text-[11px] text-slate-700">
                        <span className="font-semibold text-slate-900">Loc:</span> {currentBox.location}
                      </div>
                    </div>

                    {currentBox.description && (
                      <div className="text-[10px] text-slate-600 italic mt-1.5 border-t border-dashed border-slate-300 pt-1">
                        {currentBox.description}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Box Inventory Sheet */}
            {printTarget === 'box_sheet' && currentBox && (
              <div className="w-full bg-white border border-slate-300 rounded-xl p-6 text-slate-950 shadow-xs print:border-none print:p-0">
                <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                      {currentBox.boxCode}
                    </span>
                    <h1 className="text-xl font-bold mt-1 text-slate-900">{currentBox.name}</h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Room: <strong>{getRoomName(currentBox.roomId)}</strong> | Location: <strong>{currentBox.location}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <BarcodeRenderer
                      value={currentBox.barcode}
                      width={1.4}
                      height={36}
                      fontSize={11}
                      displayValue={true}
                      lineColor="#000000"
                    />
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Items Packed Inside ({items.filter((i) => i.boxId === currentBox.id).length}):
                </h3>

                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 text-slate-700 font-semibold">
                      <th className="py-2 px-2">Barcode</th>
                      <th className="py-2 px-2">Item Name & Brand</th>
                      <th className="py-2 px-2">Category</th>
                      <th className="py-2 px-2">Protocol</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items
                      .filter((item) => item.boxId === currentBox.id)
                      .map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2 font-mono font-bold text-slate-900">{item.barcode}</td>
                          <td className="py-2 px-2">
                            <div className="font-semibold text-slate-900">{item.name}</div>
                            <div className="text-[10px] text-slate-500">{item.brand} {item.modelNumber && `• ${item.modelNumber}`}</div>
                          </td>
                          <td className="py-2 px-2 text-slate-600">{item.category}</td>
                          <td className="py-2 px-2">{item.protocol || '—'}</td>
                          <td className="py-2 px-2 text-center font-semibold">{item.quantity}</td>
                          <td className="py-2 px-2 capitalize text-slate-700">{item.status.replace('_', ' ')}</td>
                        </tr>
                      ))}
                    {items.filter((i) => i.boxId === currentBox.id).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                          No items are currently packed in this storage box.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* All Items Sheet */}
            {printTarget === 'all_items' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border-2 border-slate-800 rounded-lg p-2.5 text-slate-950 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start gap-1 pb-1 border-b border-slate-200">
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.brand}</div>
                      </div>
                      <span className="text-[9px] font-mono px-1 py-0.5 bg-slate-100 rounded border border-slate-300">
                        {getBoxName(item.boxId).split('•')[0]}
                      </span>
                    </div>

                    <div className="my-1 flex justify-center">
                      <BarcodeRenderer
                        value={item.barcode}
                        width={1.3}
                        height={34}
                        fontSize={10}
                        displayValue={true}
                        lineColor="#000000"
                      />
                    </div>

                    <div className="text-[9px] text-slate-600 flex justify-between border-t border-slate-100 pt-1">
                      <span>{getRoomName(item.roomId)}</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="print:hidden px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Tip: For Brother PT-P300BT, set margins to <strong>None</strong> and scale to <strong>100%</strong>.
          </div>
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsBluetoothModalOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-sky-600/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bluetooth className="w-4 h-4" /> Bluetooth P-Touch
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-500/20 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Labels
            </button>
          </div>
        </div>
      </div>

      {/* Bluetooth P-Touch Wireless Printing Assistant */}
      <BluetoothPTouchModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        item={printTarget === 'item' ? (currentItem || null) : null}
        box={printTarget === 'box' || printTarget === 'box_sheet' ? (currentBox || null) : null}
        rooms={rooms}
        boxes={boxes}
        defaultTapeWidth={labelSize === 'ptouch_9mm' ? 9 : 12}
      />
    </div>
  );
};
