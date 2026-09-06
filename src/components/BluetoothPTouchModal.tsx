import React, { useState, useEffect, useRef } from 'react';
import {
  Bluetooth,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Smartphone,
  Laptop,
  HelpCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import type { InventoryItem, StorageBox, Room } from '../types';
import {
  isWebBluetoothSupported,
  isRunningInIframe,
  renderPTouchLabelToCanvas,
  buildBrotherRasterPayload,
  printToBrotherPTouchBluetooth,
  downloadLabelImage,
  type BluetoothPrintProgress
} from '../utils/ptouchBluetooth';

interface BluetoothPTouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  box: StorageBox | null;
  rooms: Room[];
  boxes: StorageBox[];
  defaultTapeWidth?: 12 | 9;
}

export const BluetoothPTouchModal: React.FC<BluetoothPTouchModalProps> = ({
  isOpen,
  onClose,
  item,
  box,
  rooms,
  boxes,
  defaultTapeWidth = 12
}) => {
  const [tapeWidth, setTapeWidth] = useState<12 | 9>(defaultTapeWidth);
  const [activeTab, setActiveTab] = useState<'ble' | 'os_print' | 'mobile_export'>('ble');
  const [copies, setCopies] = useState<number>(1);
  const [printProgress, setPrintProgress] = useState<BluetoothPrintProgress>({
    status: 'idle',
    progress: 0,
    message: 'Ready to connect'
  });
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bluetoothSupported = isWebBluetoothSupported();
  const inIframe = isRunningInIframe();

  // Render preview canvas whenever item, box, or tapeWidth changes
  useEffect(() => {
    if (!isOpen) return;

    try {
      const generatedCanvas = renderPTouchLabelToCanvas(item, box, tapeWidth, rooms, boxes);
      if (previewCanvasRef.current) {
        const dest = previewCanvasRef.current;
        dest.width = generatedCanvas.width;
        dest.height = generatedCanvas.height;
        const destCtx = dest.getContext('2d');
        if (destCtx) {
          destCtx.clearRect(0, 0, dest.width, dest.height);
          destCtx.drawImage(generatedCanvas, 0, 0);
        }
      }
    } catch (err) {
      console.error('Error rendering P-Touch label canvas preview:', err);
    }
  }, [isOpen, item, box, tapeWidth, rooms, boxes]);

  if (!isOpen) return null;

  const targetName = item ? item.name : (box ? box.name : 'Unknown Target');
  const targetCode = item ? item.barcode : (box ? box.boxCode : '—');

  const handleDirectBluetoothPrint = async () => {
    setPrintProgress({
      status: 'preparing_raster',
      progress: 5,
      message: 'Generating 180 DPI Brother raster bitmap...'
    });

    try {
      // 1. Generate label canvas
      const canvas = renderPTouchLabelToCanvas(item, box, tapeWidth, rooms, boxes);

      // 2. Build raster stream
      const payload = buildBrotherRasterPayload(canvas, tapeWidth);

      // 3. Print for specified copies
      for (let c = 1; c <= copies; c++) {
        if (copies > 1) {
          setPrintProgress({
            status: 'sending',
            progress: 10,
            message: `Printing copy ${c} of ${copies}...`
          });
        }
        await printToBrotherPTouchBluetooth(payload, (prog) => {
          setPrintProgress(prog);
        });
      }
    } catch (err: any) {
      console.error('Direct Bluetooth print error:', err);
      setPrintProgress({
        status: 'error',
        progress: 0,
        message: 'Print failed',
        error: err?.message || 'Failed to communicate with Brother Bluetooth printer.'
      });
    }
  };

  const handleDownloadPNG = () => {
    try {
      const canvas = renderPTouchLabelToCanvas(item, box, tapeWidth, rooms, boxes);
      const filename = `ptouch-label-${targetCode}-${tapeWidth}mm.png`;
      downloadLabelImage(canvas, filename);
    } catch (err) {
      console.error('Error downloading label PNG:', err);
    }
  };

  const handleOpenStandaloneTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  const handleSystemPrint = () => {
    window.print();
  };

  return (
    <div className="print-modal-overlay fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="print-modal-card relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Header */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
              <Bluetooth className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Brother P-Touch Bluetooth
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  PT-P300BT / Cube
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct wireless printing to Brother Bluetooth thermal label printers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="print:hidden p-6 overflow-y-auto flex-1 flex flex-col gap-5 bg-white dark:bg-slate-900">
          
          {/* Label Live Canvas Preview */}
          <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
              <span>Tape Preview ({tapeWidth}mm TZe Continuous Tape):</span>
              <span className="font-mono text-[11px]">{targetCode}</span>
            </div>
            
            {/* White Tape Canvas Display */}
            <div className="bg-white p-2.5 rounded-lg shadow-inner border border-slate-300 dark:border-slate-700 flex justify-center items-center overflow-x-auto max-w-full">
              <canvas
                ref={previewCanvasRef}
                className="max-h-20 shadow-xs border border-slate-200"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span><strong>{targetName}</strong></span>
              <span>•</span>
              <span>180 DPI Brother Raster</span>
            </div>
          </div>

          {/* Tape Width & Copies Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tape Width
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTapeWidth(12)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    tapeWidth === 12
                      ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  12mm (0.47")
                </button>
                <button
                  type="button"
                  onClick={() => setTapeWidth(9)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    tapeWidth === 9
                      ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  9mm (0.35")
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Copies
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCopies(Math.max(1, copies - 1))}
                  className="w-9 h-9 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  -
                </button>
                <div className="flex-1 text-center font-bold text-sm text-slate-900 dark:text-slate-100">
                  {copies}
                </div>
                <button
                  type="button"
                  onClick={() => setCopies(Math.min(20, copies + 1))}
                  className="w-9 h-9 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Connection Mode Selection Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('ble')}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'ble'
                  ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5" /> Direct Web Bluetooth (BLE)
            </button>
            <button
              onClick={() => setActiveTab('os_print')}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'os_print'
                  ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> Paired OS Bluetooth
            </button>
            <button
              onClick={() => setActiveTab('mobile_export')}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'mobile_export'
                  ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Brother App Export
            </button>
          </div>

          {/* Tab 1: Direct Web Bluetooth (BLE) */}
          {activeTab === 'ble' && (
            <div className="flex flex-col gap-3">
              {/* Browser & Iframe Notice */}
              {inIframe && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Direct Bluetooth Security Tip:</p>
                    <p className="text-[11px] leading-relaxed mb-2">
                      In sandboxed browser previews, web browsers restrict direct Bluetooth hardware access. If pairing is blocked, open the application in a new standalone browser tab to grant direct Bluetooth hardware access.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenStandaloneTab}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab for Bluetooth
                    </button>
                  </div>
                </div>
              )}

              {!bluetoothSupported && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-900 dark:text-red-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Web Bluetooth not detected:</span> Your current browser doesn't support the Web Bluetooth API. Please use <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or <strong>Bluefy</strong> on iOS for direct wireless printing.
                  </div>
                </div>
              )}

              {/* Action Button & Status */}
              <div className="flex flex-col gap-3 mt-1">
                <button
                  type="button"
                  onClick={handleDirectBluetoothPrint}
                  disabled={printProgress.status === 'connecting' || printProgress.status === 'sending'}
                  className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {printProgress.status === 'connecting' || printProgress.status === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{printProgress.message}</span>
                    </>
                  ) : (
                    <>
                      <Bluetooth className="w-4 h-4" />
                      <span>Connect & Print via Bluetooth</span>
                    </>
                  )}
                </button>

                {/* Progress Bar & Status Message */}
                {printProgress.status !== 'idle' && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        {printProgress.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : printProgress.status === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                        )}
                        <span>{printProgress.message}</span>
                      </div>
                      <span className="font-mono text-[11px]">{printProgress.progress}%</span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 transition-all duration-300 rounded-full ${
                          printProgress.status === 'completed'
                            ? 'bg-emerald-500'
                            : printProgress.status === 'error'
                            ? 'bg-rose-500'
                            : 'bg-sky-500'
                        }`}
                        style={{ width: `${printProgress.progress}%` }}
                      />
                    </div>

                    {printProgress.error && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium leading-relaxed">
                        {printProgress.error}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Troubleshooting Accordion */}
              <div className="mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                  className="text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showTroubleshooting ? 'Hide pairing checklist' : 'Brother PT-P300BT pairing checklist & tips'}
                </button>

                {showTroubleshooting && (
                  <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 flex flex-col gap-1.5 leading-normal border border-slate-200 dark:border-slate-700">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                      Checklist before connecting:
                    </div>
                    <div>1. <strong>Power On</strong>: Turn on the P-Touch Cube and ensure the green LED is illuminated.</div>
                    <div>2. <strong>Disconnect Phone App</strong>: The PT-P300BT only supports <strong>1 active Bluetooth connection</strong> at a time. If the official Brother app is currently open on your phone, force close it so the printer is available for this browser.</div>
                    <div>3. <strong>Tape Cartridge</strong>: Confirm a 12mm or 9mm TZe tape cassette is inserted securely.</div>
                    <div>4. <strong>Supported Browsers</strong>: Chrome, Edge, Brave, or Bluefy on iOS.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Paired OS Bluetooth */}
          {activeTab === 'os_print' && (
            <div className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/70 rounded-xl">
                <span className="font-bold text-sky-950 dark:text-sky-200 block mb-1">
                  How it works:
                </span>
                If your Brother P-Touch Cube is already paired as a printer in <strong>Windows Settings &gt; Bluetooth & Devices</strong> or <strong>macOS System Settings &gt; Printers</strong>:
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-[11px] pl-1">
                <li>Click <strong>Open Tape Print Dialog</strong> below.</li>
                <li>In your browser's print destination, select your paired <strong>Brother PT-P300BT</strong>.</li>
                <li>Ensure paper size is set to <strong>12mm or 9mm continuous tape</strong>, margins set to <strong>None</strong>, and scale to <strong>100%</strong>.</li>
              </ol>

              <button
                type="button"
                onClick={handleSystemPrint}
                className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" /> Open Tape Print Dialog
              </button>
            </div>
          )}

          {/* Tab 3: Brother App Export */}
          {activeTab === 'mobile_export' && (
            <div className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  Using Brother's official smartphone apps:
                </span>
                You can download this pixel-perfect 180 DPI label as an image and print it using <strong>Brother P-touch Design&amp;Print 2</strong> or <strong>Brother iPrint&amp;Label</strong>.
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-[11px] pl-1">
                <li>Click <strong>Download High-Res Label PNG</strong> below.</li>
                <li>Open <strong>P-touch Design&amp;Print 2</strong> on your phone.</li>
                <li>Select <em>Create Own Label</em> &gt; <em>Insert Image / Photo</em> and choose the downloaded file.</li>
                <li>Hit Print! The barcode and text will print with zero distortion.</li>
              </ol>

              <button
                type="button"
                onClick={handleDownloadPNG}
                className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs shadow-indigo-500/20"
              >
                <Download className="w-4 h-4" /> Download High-Res Label PNG ({tapeWidth}mm)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="print:hidden px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Target: <strong>{targetCode}</strong> ({tapeWidth}mm)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Printable Surface for OS Print Mode */}
        <div className="hidden print:flex print-surface flex-col items-start gap-1">
          {Array.from({ length: copies }).map((_, idx) => (
            <div
              key={idx}
              className={`bg-white border-2 border-black p-0 overflow-hidden ${
                tapeWidth === 9 ? 'print-ptouch-9mm' : 'print-ptouch-12mm'
              }`}
            >
              {previewCanvasRef.current && (
                <img
                  src={previewCanvasRef.current.toDataURL('image/png')}
                  alt="Brother P-Touch Label"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
