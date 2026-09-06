import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  Upload, 
  Keyboard, 
  X, 
  Package, 
  Box, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  Zap,
  MapPin,
  FolderOpen
} from 'lucide-react';
import type { InventoryItem, StorageBox, Room } from '../types';
import { playScanSuccessSound, playScanAlertSound } from '../utils/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  boxes: StorageBox[];
  rooms: Room[];
  onSelectItem: (item: InventoryItem) => void;
  onSelectBox: (box: StorageBox) => void;
  onCreateItemWithCode: (code: string) => void;
  onCreateBoxWithCode: (code: string) => void;
  onQuickMoveItem?: (item: InventoryItem, newBoxId: string | null, newRoomId: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  boxes,
  rooms,
  onSelectItem,
  onSelectBox,
  onCreateItemWithCode,
  onCreateBoxWithCode
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    item?: InventoryItem;
    box?: StorageBox;
  } | null>(null);
  const [recentScans, setRecentScans] = useState<string[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'interactive-barcode-viewport';

  // Lookup match
  const lookupCode = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    // Check item barcode, id, or serial number
    const matchedItem = items.find(
      (it) => it.barcode.toLowerCase() === code.toLowerCase() ||
              it.id.toLowerCase() === code.toLowerCase() ||
              (it.serialNumber && it.serialNumber.toLowerCase() === code.toLowerCase())
    );

    // Check box barcode or box code
    const matchedBox = boxes.find(
      (b) => b.barcode.toLowerCase() === code.toLowerCase() ||
             b.boxCode.toLowerCase() === code.toLowerCase() ||
             b.id.toLowerCase() === code.toLowerCase()
    );

    if (matchedItem || matchedBox) {
      playScanSuccessSound();
    } else {
      playScanAlertSound();
    }

    setScannedResult({
      code,
      item: matchedItem,
      box: matchedBox
    });

    setRecentScans((prev) => [code, ...prev.filter((c) => c !== code)].slice(0, 5));
  };

  // Start Camera
  const startCameraScanner = async () => {
    try {
      setCameraError(null);
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_39
        ],
        verbose: false
      });

      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.85),
              height: Math.floor(minEdge * 0.55)
            };
          }
        },
        (decodedText) => {
          if (decodedText) {
            lookupCode(decodedText);
          }
        },
        () => {
          // Frame scanner ignore
        }
      );

      setIsScanning(true);
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      setIsScanning(false);
      setCameraError(
        'Unable to access camera. Please check permissions or switch to Image Upload or Manual Input.'
      );
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCameraScanner();
      };
    } else {
      stopCameraScanner();
    }
  }, [isOpen, activeTab]);

  // Handle image upload scanning
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraError(null);
      let html5QrCode = scannerRef.current;
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode('file-scanner-temp', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_39
          ],
          verbose: false
        });
      }
      const decodedResult = await html5QrCode.scanFile(file, true);
      if (decodedResult) {
        lookupCode(decodedResult);
      }
    } catch (err) {
      playScanAlertSound();
      setCameraError('No readable barcode or QR code found in that image. Try a higher contrast photo.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    lookupCode(manualCode.trim());
  };

  if (!isOpen) return null;

  const getRoomName = (roomId: string) => {
    return rooms.find((r) => r.id === roomId)?.name || 'Unassigned Room';
  };

  const getBoxName = (boxId?: string | null) => {
    if (!boxId) return 'Not boxed (loose item)';
    const box = boxes.find((b) => b.id === boxId);
    return box ? `${box.boxCode} • ${box.name}` : 'Unknown Box';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-transparent dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Inventory Barcode Scanner</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scan Code 128, EAN/UPC, or QR code labels</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Live Camera
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Photo
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Type / Scanner Gun
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-4/3 max-h-[300px] bg-slate-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
                <div id={scannerContainerId} className="w-full h-full" />
                
                {/* Visual reticle overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-32 border-2 border-emerald-400/80 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-300" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-300" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-300" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-300" />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-red-500/60 animate-pulse" />
                  </div>
                </div>

                {!isScanning && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-300 text-xs gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                    Initializing camera video stream...
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-800 dark:text-red-300 text-xs flex items-start gap-2 w-full">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Camera Access Notice</p>
                    <p className="mt-0.5">{cameraError}</p>
                    <button
                      onClick={startCameraScanner}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/60 hover:bg-red-200 dark:hover:bg-red-800 text-red-900 dark:text-red-200 rounded font-medium text-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                Point camera at barcode or QR code label. Scanner reads automatically.
              </p>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center gap-4">
              <label className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Choose photo or drag file here</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload a snapshot of a label, package, or device barcode</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <div id="file-scanner-temp" className="hidden" />
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Barcode Number or Asset ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. ITM-10021 or BOX-001"
                  autoFocus
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  Lookup <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports USB handheld barcode scanner guns, manual keypad entry, or copy-pasted serials.
              </p>
            </form>
          )}

          {/* Scanned Result Card */}
          {scannedResult && (
            <div className="mt-2 border rounded-xl p-4 bg-slate-50/90 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Scanned Value:</span>
                  <code className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded text-xs font-mono font-bold">
                    {scannedResult.code}
                  </code>
                </div>
                {scannedResult.item || scannedResult.box ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-transparent dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Found in Inventory
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-transparent dark:border-amber-800/50 px-2.5 py-0.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" /> Unregistered Barcode
                  </span>
                )}
              </div>

              {/* Matched Item */}
              {scannedResult.item && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-transparent dark:border-blue-800 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {scannedResult.item.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {scannedResult.item.brand} {scannedResult.item.modelNumber && `• ${scannedResult.item.modelNumber}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {getRoomName(scannedResult.item.roomId)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Box className="w-3 h-3 text-slate-400" />
                          {getBoxName(scannedResult.item.boxId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        onSelectItem(scannedResult.item!);
                        onClose();
                      }}
                      className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> View Item Details
                    </button>
                  </div>
                </div>
              )}

              {/* Matched Storage Box */}
              {scannedResult.box && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg text-white flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: scannedResult.box.colorTag || '#3b82f6' }}
                    >
                      <Box className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {scannedResult.box.boxCode}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {scannedResult.box.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Location: {getRoomName(scannedResult.box.roomId)} • {scannedResult.box.location}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        onSelectBox(scannedResult.box!);
                        onClose();
                      }}
                      className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> Open Storage Box
                    </button>
                  </div>
                </div>
              )}

              {/* Not found options */}
              {!scannedResult.item && !scannedResult.box && (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    No existing item or box has barcode <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{scannedResult.code}</span>.
                    You can register it now:
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        onCreateItemWithCode(scannedResult.code);
                        onClose();
                      }}
                      className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" /> Add New Item
                    </button>
                    <button
                      onClick={() => {
                        onCreateBoxWithCode(scannedResult.code);
                        onClose();
                      }}
                      className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Box className="w-3.5 h-3.5" /> Create Storage Box
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Scans Strip */}
          {recentScans.length > 0 && (
            <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Recent Scans:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {recentScans.map((code) => (
                  <button
                    key={code}
                    onClick={() => lookupCode(code)}
                    className="text-xs font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
