import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Printer, 
  X, 
  Box, 
  Package, 
  LayoutGrid, 
  FileText, 
  AlertCircle, 
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  Scissors,
  Image as ImageIcon,
  Home
} from 'lucide-react';
import type { InventoryItem, StorageBox, Room } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  boxes: StorageBox[];
  rooms: Room[];
  initialSelectedItem?: InventoryItem | null;
  initialSelectedBox?: StorageBox | null;
  initialSelectedRoom?: Room | null;
  initialPrintTarget?: 'item' | 'box' | 'box_items' | 'all_items' | 'box_sheet' | 'room_sheet';
}

export type LabelPreset = 
  | 'avery_5150_sheet' 
  | 'avery_5150_single' 
  | 'compact' 
  | 'standard' 
  | 'tote';

interface AveryLabelItem {
  id: string;
  type: 'item' | 'box';
  title: string;
  subtitle: string;
  meta: string;
  barcode: string;
  badge?: string;
  protocols?: string[];
  imageUrl?: string;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  items,
  boxes,
  rooms,
  initialSelectedItem,
  initialSelectedBox,
  initialSelectedRoom,
  initialPrintTarget
}) => {
  const [printTarget, setPrintTarget] = useState<'item' | 'box' | 'box_items' | 'all_items' | 'box_sheet' | 'room_sheet'>(
    initialPrintTarget || (initialSelectedRoom ? 'room_sheet' : initialSelectedBox ? 'box' : initialSelectedItem ? 'item' : 'item')
  );
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialSelectedItem?.id || (items[0]?.id ?? '')
  );
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => {
    if (initialSelectedItem) return [initialSelectedItem.id];
    return items.map((i) => i.id);
  });
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const [selectedBoxId, setSelectedBoxId] = useState<string>(
    initialSelectedBox?.id || (boxes[0]?.id ?? '')
  );
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>(() => {
    if (initialSelectedBox) return [initialSelectedBox.id];
    return boxes.map((b) => b.id);
  });
  const [boxSearchQuery, setBoxSearchQuery] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    initialSelectedRoom?.id || (rooms[0]?.id ?? '')
  );
  const [roomGroupByBox, setRoomGroupByBox] = useState<boolean>(true);
  const [roomIncludeLoose, setRoomIncludeLoose] = useState<boolean>(true);
  const [slipIncludePhotos, setSlipIncludePhotos] = useState<boolean>(true);
  const [slipShowSignatures, setSlipShowSignatures] = useState<boolean>(true);
  const [labelSize, setLabelSize] = useState<LabelPreset>('avery_5150_sheet');
  const [sheetMode, setSheetMode] = useState<'fill_sheet' | 'custom_count'>('fill_sheet');
  const [copies, setCopies] = useState<number>(1);
  const [startPosition, setStartPosition] = useState<number>(1);
  const [showBorders, setShowBorders] = useState<boolean>(false);
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [monochromePhotos, setMonochromePhotos] = useState<boolean>(false);

  // Full page view, split layout, and zoom controls
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [zoomMode, setZoomMode] = useState<'fit_page' | 'fit_width' | 'custom'>('fit_page');
  const [customZoom, setCustomZoom] = useState<number>(1.0);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 800
  });

  // Track preview canvas dimensions to scale the full page view responsively
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const el = previewContainerRef.current;
    const updateDimensions = () => {
      if (el) {
        setPreviewDimensions({
          width: el.clientWidth,
          height: el.clientHeight
        });
      }
    };
    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, isFullScreen]);

  // Sync state when modal opens or initial selection changes
  useEffect(() => {
    if (isOpen) {
      if (initialPrintTarget) {
        setPrintTarget(initialPrintTarget);
      }
      if (initialSelectedRoom) {
        setSelectedRoomId(initialSelectedRoom.id);
        if (!initialPrintTarget) setPrintTarget('room_sheet');
      } else if (initialSelectedBox) {
        setPrintTarget(initialPrintTarget || 'box');
        setSelectedBoxId(initialSelectedBox.id);
        setSelectedBoxIds([initialSelectedBox.id]);
      } else if (initialSelectedItem) {
        setPrintTarget(initialPrintTarget || 'item');
        setSelectedItemId(initialSelectedItem.id);
        setSelectedItemIds([initialSelectedItem.id]);
      }
    }
  }, [isOpen, initialPrintTarget, initialSelectedRoom, initialSelectedBox, initialSelectedItem]);

  // If selected item/box/room became invalid, fall back to first item/box/room
  useEffect(() => {
    if (!items.find((i) => i.id === selectedItemId) && items.length > 0) {
      setSelectedItemId(items[0].id);
    }
    if (!boxes.find((b) => b.id === selectedBoxId) && boxes.length > 0) {
      setSelectedBoxId(boxes[0].id);
    }
    if (!rooms.find((r) => r.id === selectedRoomId) && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
    setSelectedItemIds((prev) => {
      const valid = prev.filter((id) => items.some((i) => i.id === id));
      if (valid.length === 0 && items.length > 0 && !initialSelectedItem) {
        return items.map((i) => i.id);
      }
      return valid;
    });
    setSelectedBoxIds((prev) => {
      const valid = prev.filter((id) => boxes.some((b) => b.id === id));
      if (valid.length === 0 && boxes.length > 0 && !initialSelectedBox) {
        return boxes.map((b) => b.id);
      }
      return valid;
    });
  }, [items, boxes, rooms, selectedItemId, selectedBoxId, selectedRoomId, initialSelectedItem, initialSelectedBox, initialSelectedRoom]);

  const currentItem = items.find((i) => i.id === selectedItemId);
  const currentBox = boxes.find((b) => b.id === selectedBoxId);
  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  const roomItems = useMemo(() => {
    if (!currentRoom) return [];
    return items.filter((i) => i.roomId === currentRoom.id);
  }, [items, currentRoom]);

  const roomBoxes = useMemo(() => {
    if (!currentRoom) return [];
    return boxes.filter((b) => b.roomId === currentRoom.id);
  }, [boxes, currentRoom]);

  const getRoomName = (roomId: string) => {
    return rooms.find((r) => r.id === roomId)?.name || 'Unassigned Room';
  };

  const getBoxName = (boxId?: string | null) => {
    if (!boxId) return 'Loose (No Box)';
    const b = boxes.find((box) => box.id === boxId);
    return b ? `${b.boxCode} • ${b.name}` : 'Unknown Box';
  };

  const getProtocols = (item: InventoryItem): string[] => {
    if (item.protocols && item.protocols.length > 0) {
      return item.protocols.filter((p) => p !== 'None');
    }
    return item.protocol && item.protocol !== 'None' ? [item.protocol] : [];
  };

  // Convert an inventory item into Avery label format
  const itemToAveryLabel = (item: InventoryItem, instanceIndex = 0): AveryLabelItem => {
    const box = boxes.find((b) => b.id === item.boxId);
    return {
      id: `${item.id}-${instanceIndex}`,
      type: 'item',
      title: item.name,
      subtitle: `${item.brand}${item.modelNumber ? ` • ${item.modelNumber}` : ''}`,
      meta: `${getRoomName(item.roomId)}${box ? ` • ${box.boxCode}` : ' • Loose'}`,
      barcode: item.barcode,
      protocols: getProtocols(item),
      imageUrl: item.imageUrl
    };
  };

  // Convert a storage box into Avery label format
  const boxToAveryLabel = (box: StorageBox, instanceIndex = 0): AveryLabelItem => {
    return {
      id: `${box.id}-${instanceIndex}`,
      type: 'box',
      title: box.name,
      subtitle: `LOC: ${getRoomName(box.roomId)}`,
      meta: box.location || 'Storage Bin',
      barcode: box.barcode || box.boxCode,
      badge: box.boxCode
    };
  };

  // Items in scope for selection depending on printTarget
  const candidateItems = useMemo(() => {
    if (printTarget === 'box_items' && currentBox) {
      return items.filter((i) => i.boxId === currentBox.id);
    }
    return items;
  }, [items, printTarget, currentBox]);

  // Build the list of target items based on printTarget and selection
  const targetItems: InventoryItem[] = useMemo(() => {
    if (printTarget === 'item') {
      return items.filter((i) => selectedItemIds.includes(i.id));
    }
    if (printTarget === 'box_items' && currentBox) {
      return candidateItems.filter((i) => selectedItemIds.includes(i.id));
    }
    if (printTarget === 'all_items') {
      return candidateItems.filter((i) => selectedItemIds.includes(i.id));
    }
    return [];
  }, [printTarget, currentBox, candidateItems, items, selectedItemIds]);

  // Build the list of target boxes based on printTarget
  const targetBoxes: StorageBox[] = (() => {
    if (printTarget === 'box') {
      return boxes.filter((b) => selectedBoxIds.includes(b.id));
    }
    return [];
  })();

  // Filter items for the search input in multi-item selector
  const filteredItems = candidateItems.filter((i) => {
    if (!itemSearchQuery.trim()) return true;
    const q = itemSearchQuery.toLowerCase();
    const roomName = getRoomName(i.roomId).toLowerCase();
    const box = boxes.find((b) => b.id === i.boxId);
    const boxCode = box?.boxCode.toLowerCase() || '';
    const boxName = box?.name.toLowerCase() || '';
    return (
      i.name.toLowerCase().includes(q) ||
      i.brand.toLowerCase().includes(q) ||
      i.barcode.toLowerCase().includes(q) ||
      (i.modelNumber && i.modelNumber.toLowerCase().includes(q)) ||
      roomName.includes(q) ||
      boxCode.includes(q) ||
      boxName.includes(q)
    );
  });

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    const candidateIds = candidateItems.map((i) => i.id);
    setSelectedItemIds((prev) => Array.from(new Set([...prev, ...candidateIds])));
  };

  const deselectAllItems = () => {
    const candidateIds = new Set(candidateItems.map((i) => i.id));
    setSelectedItemIds((prev) => prev.filter((id) => !candidateIds.has(id)));
  };

  // Filter boxes for the search input in multi-box selector
  const filteredBoxes = boxes.filter((b) => {
    if (!boxSearchQuery.trim()) return true;
    const q = boxSearchQuery.toLowerCase();
    const roomName = getRoomName(b.roomId).toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.boxCode.toLowerCase().includes(q) ||
      (b.location && b.location.toLowerCase().includes(q)) ||
      roomName.includes(q)
    );
  });

  const toggleBoxSelection = (boxId: string) => {
    setSelectedBoxIds((prev) =>
      prev.includes(boxId) ? prev.filter((id) => id !== boxId) : [...prev, boxId]
    );
  };

  const selectAllBoxes = () => {
    setSelectedBoxIds(boxes.map((b) => b.id));
  };

  const deselectAllBoxes = () => {
    setSelectedBoxIds([]);
  };

  // Build the list of Avery labels to print
  const buildAveryLabels = (): (AveryLabelItem | null)[] => {
    const rawLabels: AveryLabelItem[] = [];

    if (printTarget === 'item') {
      if (targetItems.length === 1 && sheetMode === 'fill_sheet') {
        for (let i = 0; i < 30; i++) {
          rawLabels.push(itemToAveryLabel(targetItems[0], i));
        }
      } else {
        const perItemCopies = Math.max(1, copies);
        targetItems.forEach((item) => {
          for (let c = 0; c < perItemCopies; c++) {
            rawLabels.push(itemToAveryLabel(item, c));
          }
        });
      }
    } else if (printTarget === 'box') {
      if (targetBoxes.length === 1 && sheetMode === 'fill_sheet') {
        for (let i = 0; i < 30; i++) {
          rawLabels.push(boxToAveryLabel(targetBoxes[0], i));
        }
      } else {
        const perBoxCopies = Math.max(1, copies);
        targetBoxes.forEach((box) => {
          for (let c = 0; c < perBoxCopies; c++) {
            rawLabels.push(boxToAveryLabel(box, c));
          }
        });
      }
    } else if (printTarget === 'box_items') {
      const perItemCopies = Math.max(1, copies);
      targetItems.forEach((item) => {
        for (let c = 0; c < perItemCopies; c++) {
          rawLabels.push(itemToAveryLabel(item, c));
        }
      });
    } else if (printTarget === 'all_items') {
      const perItemCopies = Math.max(1, copies);
      targetItems.forEach((item) => {
        for (let c = 0; c < perItemCopies; c++) {
          rawLabels.push(itemToAveryLabel(item, c));
        }
      });
    }

    // Offset by startPosition (1 to 30) for sheet mode
    if (labelSize === 'avery_5150_sheet' && startPosition > 1) {
      const leadingEmpty = Math.min(29, Math.max(0, startPosition - 1));
      const fullList: (AveryLabelItem | null)[] = Array(leadingEmpty).fill(null);
      return fullList.concat(rawLabels);
    }

    return rawLabels;
  };

  // Split label array into 30-label sheets for Avery 5150 pagination
  const chunkIntoSheets = (labels: (AveryLabelItem | null)[]): (AveryLabelItem | null)[][] => {
    const sheets: (AveryLabelItem | null)[][] = [];
    if (labels.length === 0) return sheets;

    for (let i = 0; i < labels.length; i += 30) {
      const sheet = labels.slice(i, i + 30);
      // Pad remaining cells on sheet to complete 30 slots for grid stability
      while (sheet.length < 30) {
        sheet.push(null);
      }
      sheets.push(sheet);
    }
    return sheets;
  };

  const averyLabelsList = buildAveryLabels();
  const averySheets = chunkIntoSheets(averyLabelsList);

  const handlePrint = () => {
    window.print();
  };

  // Determine total label count for preview status
  const totalLabelsToPrint = (() => {
    if (printTarget === 'box_sheet' || printTarget === 'room_sheet') return 1;
    if (labelSize === 'avery_5150_sheet') return averyLabelsList.filter(Boolean).length;
    if (printTarget === 'item') {
      if (targetItems.length === 1 && sheetMode === 'fill_sheet') return 30;
      return targetItems.length * Math.max(1, copies);
    }
    if (printTarget === 'box') {
      if (targetBoxes.length === 1 && sheetMode === 'fill_sheet') return 30;
      return targetBoxes.length * Math.max(1, copies);
    }
    return targetItems.length * Math.max(1, copies);
  })();

  // Zoom and layout calculations for full page preview
  const SHEET_WIDTH_PX = 816; // 8.5in * 96 DPI
  const SHEET_HEIGHT_PX = 1056; // 11in * 96 DPI

  const fitPageZoom = (() => {
    const availW = Math.max(260, previewDimensions.width - 48);
    const availH = Math.max(300, previewDimensions.height - 56);
    const scaleX = availW / SHEET_WIDTH_PX;
    const scaleY = availH / SHEET_HEIGHT_PX;
    // Bound between 0.25 and 1.15
    return Math.max(0.25, Math.min(scaleX, scaleY, 1.15));
  })();

  const fitWidthZoom = (() => {
    const availW = Math.max(260, previewDimensions.width - 48);
    return Math.max(0.25, Math.min(availW / SHEET_WIDTH_PX, 1.4));
  })();

  const effectiveZoom = (() => {
    if (labelSize !== 'avery_5150_sheet' && printTarget !== 'box_sheet' && printTarget !== 'room_sheet') {
      return zoomMode === 'custom' ? customZoom : 1.0;
    }
    if (zoomMode === 'fit_page') return fitPageZoom;
    if (zoomMode === 'fit_width') return fitWidthZoom;
    return customZoom;
  })();

  const handleZoomIn = () => {
    setZoomMode('custom');
    setCustomZoom((prev) => Math.min(2.0, +(prev + 0.1).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setCustomZoom((prev) => Math.max(0.3, +(prev - 0.1).toFixed(2)));
  };

  const handleSetFitPage = () => {
    setZoomMode('fit_page');
  };

  const handleSetFitWidth = () => {
    setZoomMode('fit_width');
  };

  const handleSetActualSize = () => {
    setZoomMode('custom');
    setCustomZoom(1.0);
  };

  if (!isOpen) return null;

  return (
    <div className={`print-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs ${isFullScreen ? 'p-0' : 'p-2 sm:p-3 md:p-4'} overflow-hidden print:p-0 print:bg-white print:static print:inset-auto`}>
      {/* Container - on screen it is a side-by-side modal, when printing it isolates the preview */}
      <div className={`print-modal-card relative w-full ${isFullScreen ? 'h-full max-w-none rounded-none' : 'h-[98vh] sm:h-[95vh] max-w-[1720px] rounded-2xl sm:rounded-3xl'} bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none print:h-auto`}>
        
        {/* Screen-only Header */}
        <div className="print:hidden flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">
                  {printTarget === 'room_sheet'
                    ? 'Print Room Packing Slip'
                    : printTarget === 'box_sheet'
                    ? 'Print Storage Box Packing Slip'
                    : 'Print Visual Barcode Labels'}
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-200">
                  {printTarget === 'room_sheet'
                    ? `Room: ${currentRoom?.name || 'Selected'} (${roomItems.length} items)`
                    : printTarget === 'box_sheet'
                    ? `Box: ${currentBox?.boxCode || 'Selected'}`
                    : `${totalLabelsToPrint} label${totalLabelsToPrint !== 1 ? 's' : ''} ready`}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {printTarget === 'room_sheet'
                  ? 'Complete room inventory manifest with storage boxes, loose items, and inspection sign-off'
                  : printTarget === 'box_sheet'
                  ? 'Detailed box contents manifest with barcodes and placement details'
                  : 'Avery 5150 / 5160 (1" × 2⅝" • 30/sheet) & standard label templates'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 sm:px-3.5 py-1.5 bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print Now"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {printTarget === 'box_sheet' || printTarget === 'room_sheet' ? 'Print Slip' : 'Print Labels'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Modal'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area: Left Options Panel + Right Live Print Preview Panel */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          
          {/* LEFT COLUMN: Options and Configuration */}
          <div className="print:hidden w-full lg:w-[410px] xl:w-[450px] 2xl:w-[490px] shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900 min-h-0">
            
            {/* Scrollable controls */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
              
              {/* Target Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1.5">
                <button
                  onClick={() => setPrintTarget('item')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    printTarget === 'item'
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xs'
                      : 'bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> Items
                  {targetItems.length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                      printTarget === 'item' ? 'bg-white/25 text-white dark:bg-black/25 dark:text-black' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                    }`}>
                      {targetItems.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setPrintTarget('box');
                    if (selectedBoxIds.length === 0 && boxes.length > 0) {
                      setSelectedBoxIds(boxes.map((b) => b.id));
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    printTarget === 'box'
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xs'
                      : 'bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" /> Boxes
                  {targetBoxes.length > 0 && printTarget === 'box' && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-white/25 text-white dark:bg-black/25 dark:text-black rounded-full font-bold">
                      {targetBoxes.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setPrintTarget('box_items');
                    if (selectedBoxId) {
                      const boxItemIds = items.filter((i) => i.boxId === selectedBoxId).map((i) => i.id);
                      setSelectedItemIds(boxItemIds);
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    printTarget === 'box_items'
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xs'
                      : 'bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Box Items
                  {printTarget === 'box_items' && targetItems.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-white/25 text-white dark:bg-black/25 dark:text-black rounded-full font-bold">
                      {targetItems.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setPrintTarget('all_items');
                    setSelectedItemIds(items.map((i) => i.id));
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    printTarget === 'all_items'
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xs'
                      : 'bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> All Items
                  {printTarget === 'all_items' && targetItems.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-white/25 text-white dark:bg-black/25 dark:text-black rounded-full font-bold">
                      {targetItems.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setPrintTarget('box_sheet')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    printTarget === 'box_sheet'
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xs'
                      : 'bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Box Slip
                </button>
                <button
                  onClick={() => setPrintTarget('room_sheet')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    printTarget === 'room_sheet'
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xs'
                      : 'bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" /> Room Slip
                </button>
              </div>

              {/* Dedicated Packing Slip Configuration Panel */}
              {(printTarget === 'box_sheet' || printTarget === 'room_sheet') && (
                <div className="bg-zinc-50 dark:bg-zinc-850/80 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-black dark:text-white" />
                      <span className="text-xs font-bold text-black dark:text-white">
                        Packing Slip Manifest Format
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                      8.5&quot; × 11&quot; Full Page
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-200/80 dark:bg-zinc-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPrintTarget('box_sheet')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        printTarget === 'box_sheet'
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>Box Packing Slip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintTarget('room_sheet')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        printTarget === 'room_sheet'
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Room Packing Slip</span>
                    </button>
                  </div>

                  {/* Storage Box Packing Slip Settings */}
                  {printTarget === 'box_sheet' && (
                    <div className="flex flex-col gap-2.5 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                          Select Storage Box
                        </label>
                        <select
                          value={selectedBoxId}
                          onChange={(e) => setSelectedBoxId(e.target.value)}
                          className="w-full text-xs py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white font-medium"
                        >
                          {boxes.map((box) => (
                            <option key={box.id} value={box.id}>
                              {box.boxCode} — {box.name} ({getRoomName(box.roomId)})
                            </option>
                          ))}
                          {boxes.length === 0 && <option value="">No boxes available</option>}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-700/60">
                        <label className="flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={slipIncludePhotos}
                            onChange={(e) => setSlipIncludePhotos(e.target.checked)}
                            className="rounded accent-black dark:accent-white w-3.5 h-3.5"
                          />
                          <span>Include item photos</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={slipShowSignatures}
                            onChange={(e) => setSlipShowSignatures(e.target.checked)}
                            className="rounded accent-black dark:accent-white w-3.5 h-3.5"
                          />
                          <span>Include sign-off block</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Room Packing Slip Settings */}
                  {printTarget === 'room_sheet' && (
                    <div className="flex flex-col gap-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Select Household Room
                          </label>
                          <select
                            value={selectedRoomId}
                            onChange={(e) => setSelectedRoomId(e.target.value)}
                            className="w-full text-xs py-2 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white font-medium"
                          >
                            {rooms.map((room) => {
                              const count = items.filter((i) => i.roomId === room.id).length;
                              const bCount = boxes.filter((b) => b.roomId === room.id).length;
                              return (
                                <option key={room.id} value={room.id}>
                                  {room.name} {room.floor ? `(${room.floor})` : ''} — {bCount} boxes, {count} items
                                </option>
                              );
                            })}
                            {rooms.length === 0 && <option value="">No rooms available</option>}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Items Arrangement
                          </label>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRoomGroupByBox(true)}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                roomGroupByBox
                                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-2xs'
                                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100'
                              }`}
                            >
                              Group by Box
                            </button>
                            <button
                              type="button"
                              onClick={() => setRoomGroupByBox(false)}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                !roomGroupByBox
                                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-2xs'
                                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100'
                              }`}
                            >
                              Single List
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-700/60">
                        <label className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={roomIncludeLoose}
                            onChange={(e) => setRoomIncludeLoose(e.target.checked)}
                            className="rounded accent-black dark:accent-white w-3.5 h-3.5"
                          />
                          <span>Loose unboxed items</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={slipIncludePhotos}
                            onChange={(e) => setSlipIncludePhotos(e.target.checked)}
                            className="rounded accent-black dark:accent-white w-3.5 h-3.5"
                          />
                          <span>Photo thumbnails</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={slipShowSignatures}
                            onChange={(e) => setSlipShowSignatures(e.target.checked)}
                            className="rounded accent-black dark:accent-white w-3.5 h-3.5"
                          />
                          <span>Sign-off block</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

          {/* Inventory Items Multi-Selector (when printing items: 'item', 'box_items', or 'all_items') */}
          {(printTarget === 'item' || printTarget === 'box_items' || printTarget === 'all_items') && (
            <div className="bg-zinc-50 dark:bg-zinc-850/80 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center flex-wrap gap-2">
                  <Package className="w-4 h-4 text-black dark:text-white shrink-0" />
                  <span className="text-xs font-bold text-black dark:text-white">
                    {printTarget === 'box_items'
                      ? `Select Items from ${currentBox ? currentBox.boxCode : 'Box'} to Print`
                      : printTarget === 'all_items'
                      ? 'Select Items from Catalog to Print'
                      : 'Select Inventory Items to Print'}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-black dark:text-zinc-200">
                    {targetItems.length} of {candidateItems.length} selected
                  </span>
                  {printTarget === 'box_items' && (
                    <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Box:</span>
                      <select
                        value={selectedBoxId}
                        onChange={(e) => {
                          const newBoxId = e.target.value;
                          setSelectedBoxId(newBoxId);
                          const boxItemIds = items.filter((i) => i.boxId === newBoxId).map((i) => i.id);
                          setSelectedItemIds(boxItemIds);
                        }}
                        className="text-xs py-1 px-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white font-semibold"
                      >
                        {boxes.map((box) => (
                          <option key={box.id} value={box.id}>
                            {box.boxCode} — {box.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {candidateItems.length > 3 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Filter items..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        className="text-xs pl-7 pr-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg w-28 sm:w-36 focus:w-44 transition-all text-black dark:text-white"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={selectAllItems}
                    className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-black dark:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllItems}
                    className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-black dark:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Scrollable multi-select grid of items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {filteredItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const box = boxes.find((b) => b.id === item.boxId);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItemSelection(item.id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-100 dark:bg-zinc-800 border-black dark:border-white text-black dark:text-white shadow-xs ring-1 ring-black/30 dark:ring-white/30'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded accent-black dark:accent-white pointer-events-none shrink-0"
                        />
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-md object-cover border border-zinc-300 dark:border-zinc-700 shrink-0"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.triedProxy && item.imageUrl) {
                                target.dataset.triedProxy = 'true';
                                target.src = `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`;
                              }
                            }}
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-mono text-[9px] font-bold px-1 py-0.2 bg-black text-white dark:bg-white dark:text-black rounded shrink-0">
                              {item.barcode}
                            </span>
                            <span className="font-medium truncate text-xs text-black dark:text-white" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {item.brand} • {box ? box.boxCode : 'Loose'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredItems.length === 0 && (
                  <div className="col-span-full py-4 text-center text-xs text-zinc-400 italic">
                    {candidateItems.length === 0
                      ? (printTarget === 'box_items' ? 'This storage box contains no items.' : 'No items available.')
                      : `No items match "${itemSearchQuery}"`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Storage Box Multi-Selector (when printTarget === 'box') */}
          {printTarget === 'box' && (
            <div className="bg-zinc-50 dark:bg-zinc-850/80 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-black dark:text-white shrink-0" />
                  <span className="text-xs font-bold text-black dark:text-white">
                    Select Storage Boxes to Print on Sheet
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-black dark:text-zinc-200">
                    {targetBoxes.length} of {boxes.length} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {boxes.length > 3 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Filter boxes..."
                        value={boxSearchQuery}
                        onChange={(e) => setBoxSearchQuery(e.target.value)}
                        className="text-xs pl-7 pr-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg w-28 sm:w-36 focus:w-44 transition-all text-black dark:text-white"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={selectAllBoxes}
                    className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-black dark:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllBoxes}
                    className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-black dark:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Scrollable multi-select grid of boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {filteredBoxes.map((box) => {
                  const isSelected = selectedBoxIds.includes(box.id);
                  const itemCount = items.filter((i) => i.boxId === box.id).length;
                  return (
                    <button
                      key={box.id}
                      type="button"
                      onClick={() => toggleBoxSelection(box.id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-100 dark:bg-zinc-800 border-black dark:border-white text-black dark:text-white shadow-xs ring-1 ring-black/30 dark:ring-white/30'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded accent-black dark:accent-white pointer-events-none"
                        />
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-black text-white dark:bg-white dark:text-black rounded shrink-0">
                          {box.boxCode}
                        </span>
                        <span className="font-medium truncate text-xs" title={box.name}>
                          {box.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0 ml-1">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </span>
                    </button>
                  );
                })}
                {filteredBoxes.length === 0 && (
                  <div className="col-span-full py-4 text-center text-xs text-zinc-400 italic">
                    {boxes.length === 0 ? 'No storage boxes available.' : `No boxes match "${boxSearchQuery}"`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selectors & Preset Row for label printing */}
          {printTarget !== 'box_sheet' && printTarget !== 'room_sheet' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {printTarget === 'box_items' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Select Storage Box</label>
                  <select
                    value={selectedBoxId}
                    onChange={(e) => setSelectedBoxId(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900"
                  >
                    {boxes.map((box) => (
                      <option key={box.id} value={box.id}>
                        {box.boxCode} — {box.name} ({getRoomName(box.roomId)})
                      </option>
                    ))}
                    {boxes.length === 0 && (
                      <option value="">No boxes available</option>
                    )}
                  </select>
                </div>
              )}

              {printTarget === 'all_items' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Catalog Scope</label>
                  <div className="text-xs py-2 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-medium">
                    All Items in Inventory ({items.length} items)
                  </div>
                </div>
              )}

              {/* Label Template Preset */}
              <div className={printTarget === 'box' || printTarget === 'item' ? 'sm:col-span-1' : ''}>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Template Preset</label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value as LabelPreset)}
                  className="w-full text-xs py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white focus:bg-white dark:focus:bg-zinc-900 font-semibold"
                >
                  <option value="avery_5150_sheet">Avery 5150 / 5160 Sheet (1&quot; × 2⅝&quot; • 30/Sheet Letter)</option>
                  <option value="avery_5150_single">Avery 5150 Single Label (1&quot; × 2⅝&quot;)</option>
                  <option value="compact">Compact Tag (2.2&quot; × 1.0&quot; - No Photo)</option>
                  <option value="standard">Standard Asset Tag (3.5&quot; × 1.5&quot; - With Photo)</option>
                  <option value="tote">Large Bin Placard (4.0&quot; × 2.5&quot; - With Photo)</option>
                </select>
              </div>

              {/* Avery Sheet Options: Sheet Mode & Start Position */}
              {labelSize === 'avery_5150_sheet' && (
                <div className={`flex items-center gap-3 ${printTarget === 'box' || printTarget === 'item' ? 'sm:col-span-2' : ''}`}>
                  {printTarget === 'item' ? (
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        {targetItems.length <= 1 ? 'Fill Quantity' : 'Copies per Item'}
                      </label>
                      {targetItems.length <= 1 ? (
                        <div className="flex gap-2">
                          <select
                            value={sheetMode}
                            onChange={(e) => setSheetMode(e.target.value as 'fill_sheet' | 'custom_count')}
                            className="w-full text-xs py-2 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white"
                          >
                            <option value="fill_sheet">Full Sheet (30 labels of this item)</option>
                            <option value="custom_count">Custom Count...</option>
                          </select>
                          {sheetMode === 'custom_count' && (
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={copies}
                              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 text-xs py-2 px-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-center bg-white dark:bg-zinc-800 text-black dark:text-white"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={copies}
                            onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 text-xs py-2 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white font-semibold text-center"
                          />
                          <span className="text-[11px] text-zinc-500">
                            {targetItems.length} items × {copies} = {targetItems.length * copies} labels total
                          </span>
                        </div>
                      )}
                    </div>
                  ) : printTarget === 'box' ? (
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        {targetBoxes.length <= 1 ? 'Fill Quantity' : 'Copies per Box'}
                      </label>
                      {targetBoxes.length <= 1 ? (
                        <div className="flex gap-2">
                          <select
                            value={sheetMode}
                            onChange={(e) => setSheetMode(e.target.value as 'fill_sheet' | 'custom_count')}
                            className="w-full text-xs py-2 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white"
                          >
                            <option value="fill_sheet">Full Sheet (30 labels of this box)</option>
                            <option value="custom_count">Custom Count...</option>
                          </select>
                          {sheetMode === 'custom_count' && (
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={copies}
                              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 text-xs py-2 px-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-center bg-white dark:bg-zinc-800 text-black dark:text-white"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={copies}
                            onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 text-xs py-2 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white font-semibold text-center"
                          />
                          <span className="text-[11px] text-zinc-500">
                            {targetBoxes.length} boxes × {copies} = {targetBoxes.length * copies} labels total
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Copies per Item</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={copies}
                        onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-xs py-2 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white font-semibold"
                      />
                    </div>
                  )}

                  <div className="w-28">
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1" title="Skip already peeled labels on your Avery sheet">
                      Start at Slot
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={startPosition}
                      onChange={(e) => setStartPosition(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full text-xs py-2 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white text-center font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Non-sheet copies counter */}
              {labelSize !== 'avery_5150_sheet' && (
                <div className={printTarget === 'box' || printTarget === 'item' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    {printTarget === 'box'
                      ? targetBoxes.length > 1
                        ? 'Copies per Box'
                        : 'Print Copies'
                      : printTarget === 'item'
                      ? targetItems.length > 1
                        ? 'Copies per Item'
                        : 'Print Copies'
                      : 'Copies per Item'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max={
                        (printTarget === 'item' && targetItems.length <= 1) ||
                        (printTarget === 'box' && targetBoxes.length <= 1)
                          ? 50
                          : 10
                      }
                      value={copies}
                      onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 text-xs py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white font-semibold"
                    />
                    {printTarget === 'box' && targetBoxes.length > 1 && (
                      <span className="text-[11px] text-zinc-500">
                        {targetBoxes.length} boxes × {copies} = {targetBoxes.length * copies} labels to print
                      </span>
                    )}
                    {printTarget === 'item' && targetItems.length > 1 && (
                      <span className="text-[11px] text-zinc-500">
                        {targetItems.length} items × {copies} = {targetItems.length * copies} labels to print
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Photo & High Contrast Formatting Options for Labels */}
          {printTarget !== 'box_sheet' && printTarget !== 'room_sheet' && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-850/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-black dark:text-white">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Item Images & Monochrome Contrast</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-700/60">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-800 dark:text-zinc-200 select-none">
                  <input
                    type="checkbox"
                    checked={includePhotos}
                    onChange={(e) => setIncludePhotos(e.target.checked)}
                    className="rounded accent-black dark:accent-white w-3.5 h-3.5"
                  />
                  <span className="text-[11px] font-medium">Include Photos on Labels</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-zinc-800 dark:text-zinc-200 select-none">
                  <input
                    type="checkbox"
                    checked={monochromePhotos}
                    onChange={(e) => setMonochromePhotos(e.target.checked)}
                    className="rounded accent-black dark:accent-white w-3.5 h-3.5"
                  />
                  <span className="text-[11px] font-medium">B&W High Contrast (For Printers)</span>
                </label>
              </div>
            </div>
          )}

          {/* Avery Sheet Banner & Cutting Guides Toggle */}
          {labelSize === 'avery_5150_sheet' && printTarget !== 'box_sheet' && printTarget !== 'room_sheet' && (
            <div className="px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-900 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <span className="text-sm">📄</span>
                <span>
                  <strong>Avery 5150 / 5160:</strong> 8.5&quot; × 11&quot; US Letter (30 labels • 1&quot; × 2⅝&quot;).
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none">
                <input
                  type="checkbox"
                  checked={showBorders}
                  onChange={(e) => setShowBorders(e.target.checked)}
                  className="rounded accent-black dark:accent-white w-3.5 h-3.5"
                />
                <span className="text-[11px] font-medium">Cutting guides</span>
              </label>
            </div>
          )}

          {/* Printer Setup Guidelines Tip */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-850/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
            <div className="font-semibold text-black dark:text-white">Printer Setup Tips:</div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>Paper: <strong>Letter (8.5&quot; × 11&quot;)</strong></li>
              <li>Margins: <strong>None / Minimum (0&quot;)</strong></li>
              <li>Scale: <strong>100% (Actual size)</strong></li>
            </ul>
          </div>
        </div>

        {/* Options Panel Pinned Action Bar */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-black dark:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {printTarget === 'box_sheet' || printTarget === 'room_sheet'
                ? 'Print Packing Slip'
                : `Print Labels (${totalLabelsToPrint})`}
            </span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Print Preview (Full Page) */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
        
        {/* Preview Toolbar */}
        <div className="print:hidden px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="w-4 h-4 text-black dark:text-white shrink-0" />
            <span className="font-bold text-black dark:text-white truncate">
              {printTarget === 'room_sheet'
                ? 'Room Packing Slip Preview'
                : printTarget === 'box_sheet'
                ? 'Storage Box Packing Slip'
                : labelSize === 'avery_5150_sheet'
                ? 'Full Page Sheet Preview'
                : 'Label Print Preview'}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-200 font-medium truncate">
              {printTarget === 'room_sheet'
                ? `${currentRoom?.name || 'Room'} • ${roomItems.length} Items • ${roomBoxes.length} Boxes`
                : printTarget === 'box_sheet'
                ? `${currentBox?.boxCode || 'Box'} • ${items.filter((i) => i.boxId === currentBox?.id).length} Items`
                : labelSize === 'avery_5150_sheet'
                ? `${averySheets.length} Sheet${averySheets.length !== 1 ? 's' : ''} • ${averyLabelsList.filter(Boolean).length} Labels`
                : `${totalLabelsToPrint} Label${totalLabelsToPrint !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Zoom / Page Display Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleSetFitPage}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  zoomMode === 'fit_page'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                }`}
                title="Fit full page in view without scrolling"
              >
                Fit Page
              </button>
              <button
                type="button"
                onClick={handleSetFitWidth}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  zoomMode === 'fit_width'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                }`}
                title="Fit sheet width"
              >
                Fit Width
              </button>
              <button
                type="button"
                onClick={handleSetActualSize}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  zoomMode === 'custom' && customZoom === 1.0
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                }`}
                title="Actual 100% size (1:1)"
              >
                100%
              </button>
            </div>

            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-semibold px-1.5 text-black dark:text-white min-w-[42px] text-center">
                {Math.round(effectiveZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Printable Area / Live Preview Canvas */}
        <div
          ref={previewContainerRef}
          className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1 flex flex-col items-center justify-start print:p-0 print:overflow-visible print:bg-white min-h-0"
        >
          <div className="print-surface flex flex-col items-center justify-start w-full">
            
            {/* Empty States Handling */}
            {printTarget === 'item' && targetItems.length === 0 && (
              <div className="p-8 my-4 text-center bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 max-w-md mx-auto">
                <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-black dark:text-white">
                  {items.length === 0 ? 'No Inventory Items Created' : 'No Items Selected'}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {items.length === 0
                    ? 'Create inventory items first to print item labels.'
                    : 'Please select one or more items above to generate and print labels.'}
                </p>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllItems}
                    className="mt-3 px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Select All ({items.length}) Items
                  </button>
                )}
              </div>
            )}

            {printTarget === 'box' && targetBoxes.length === 0 && (
              <div className="p-8 my-4 text-center bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 max-w-md mx-auto">
                <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-black dark:text-white">
                  {boxes.length === 0 ? 'No Storage Boxes Created' : 'No Storage Boxes Selected'}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {boxes.length === 0
                    ? 'Create storage boxes in your inventory first to print box labels.'
                    : 'Please select one or more boxes above to generate and print labels on this sheet.'}
                </p>
                {boxes.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllBoxes}
                    className="mt-3 px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Select All ({boxes.length}) Boxes
                  </button>
                )}
              </div>
            )}
            {printTarget === 'box_items' && targetItems.length === 0 && (
              <div className="p-8 my-4 text-center bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 max-w-md mx-auto">
                <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-black dark:text-white">No Items in this Storage Box</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Box &ldquo;{currentBox?.name || 'Selected Box'}&rdquo; currently does not have any inventory items stored in it. Select another box with items or add items to this box.
                </p>
              </div>
            )}

            {printTarget === 'all_items' && items.length === 0 && (
              <div className="p-8 my-4 text-center bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 max-w-md mx-auto">
                <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-black dark:text-white">No Inventory Items</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  You have not created any inventory items yet. Add items in the inventory tab to generate labels.
                </p>
              </div>
            )}

            {/* 1. AVERY 5150 / 5160 SHEET VIEW (30 labels / sheet) */}
            {labelSize === 'avery_5150_sheet' && printTarget !== 'box_sheet' && (
              <div className="flex flex-col items-center gap-6 print:gap-0 w-full">
                {averySheets.map((sheet, sheetIdx) => (
                  <div
                    key={`sheet-scaler-${sheetIdx}`}
                    className="avery-sheet-scaler flex flex-col items-center print:block print:w-auto print:h-auto print:m-0"
                    style={{
                      width: `${SHEET_WIDTH_PX * effectiveZoom}px`,
                      height: `${SHEET_HEIGHT_PX * effectiveZoom + (averySheets.length > 1 ? 26 : 0)}px`,
                      marginBottom: averySheets.length > 1 ? '24px' : '0px'
                    }}
                  >
                    {averySheets.length > 1 && (
                      <div className="print:hidden text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 self-start flex items-center justify-between w-full">
                        <span>Page {sheetIdx + 1} of {averySheets.length} (30 labels/page)</span>
                        <span className="text-[10px] text-slate-400">8.5&quot; × 11&quot; US Letter</span>
                      </div>
                    )}
                    <div
                      className="print:transform-none shadow-xl print:shadow-none border border-slate-300 dark:border-slate-700 print:border-none rounded-xs overflow-hidden bg-white"
                      style={{
                        transform: `scale(${effectiveZoom})`,
                        transformOrigin: 'top center',
                        width: '8.5in',
                        height: '11in'
                      }}
                    >
                      <div
                        key={`sheet-${sheetIdx}`}
                        className="avery-5150-sheet bg-white print:border-none"
                        style={{
                          width: '8.5in',
                          minHeight: '11in',
                          maxHeight: '11in',
                          height: '11in',
                          paddingTop: '0.5in',
                          paddingBottom: '0.5in',
                          paddingLeft: '0.1875in',
                          paddingRight: '0.1875in',
                          boxSizing: 'border-box',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 2.625in)',
                          gridTemplateRows: 'repeat(10, 1.0in)',
                          columnGap: '0.125in',
                          rowGap: '0in',
                          overflow: 'hidden',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        {sheet.map((label, slotIdx) => {
                          if (!label) {
                            return (
                              <div
                                key={`empty-${sheetIdx}-${slotIdx}`}
                                className={`avery-5150-label flex items-center justify-center bg-white ${
                                  showBorders ? 'border border-dashed border-slate-200' : 'border border-transparent'
                                } print:border-transparent`}
                                style={{
                                  width: '2.625in',
                                  height: '1.0in',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <span className="text-[8px] text-slate-300 font-mono print:hidden">
                                  Slot {slotIdx + 1}
                                </span>
                              </div>
                            );
                          }

                          const hasImage = Boolean(includePhotos && label.imageUrl);

                          return (
                            <div
                              key={label.id}
                              className={`avery-5150-label bg-white text-black flex flex-row items-center justify-between overflow-hidden ${
                                showBorders ? 'border border-zinc-400' : 'border border-transparent'
                              } print:border-transparent`}
                              style={{
                                width: '2.625in',
                                height: '1.0in',
                                maxWidth: '2.625in',
                                maxHeight: '1.0in',
                                padding: hasImage ? '0.03in 0.04in' : '0.04in 0.08in',
                                boxSizing: 'border-box'
                              }}
                            >
                              {/* Left: Barcode */}
                              <div className={`shrink-0 flex flex-col items-center justify-center overflow-hidden bg-white ${
                                hasImage ? 'w-[1.05in]' : 'w-[1.32in]'
                              }`}>
                                <BarcodeRenderer
                                  value={label.barcode}
                                  width={hasImage ? 0.74 : 0.92}
                                  height={hasImage ? 22 : 24}
                                  fontSize={hasImage ? 7 : 8}
                                  displayValue={true}
                                  lineColor="#000000"
                                />
                              </div>

                              {/* Center/Right: Metadata */}
                              <div className={`min-w-0 flex-1 flex flex-col justify-center leading-tight pl-1 border-l border-zinc-300 print:border-black ${
                                hasImage ? 'pr-1' : ''
                              }`}>
                                <div className="flex items-center gap-1 min-w-0">
                                  {label.badge && (
                                    <span className="font-mono text-[7px] font-black bg-black text-white px-1 py-0.2 rounded-xs shrink-0">
                                      {label.badge}
                                    </span>
                                  )}
                                  <span className="font-bold text-[8px] leading-tight truncate text-black" title={label.title}>
                                    {label.title}
                                  </span>
                                </div>

                                <div className="text-[7px] text-zinc-700 font-medium truncate mt-0.5" title={label.subtitle}>
                                  {label.subtitle}
                                </div>

                                <div className="text-[6.5px] text-zinc-600 truncate mt-0.5" title={label.meta}>
                                  {label.meta}
                                </div>

                                {label.protocols && label.protocols.length > 0 && (
                                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                                    {label.protocols.slice(0, 1).map((p) => (
                                      <span
                                        key={p}
                                        className={`text-[6px] font-bold uppercase px-0.8 py-0.1 border rounded-xs ${getLabelProtocolBadgeStyle(p, monochromePhotos)}`}
                                      >
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Right: Item Image (if enabled and present) */}
                              {hasImage && (
                                <div className="shrink-0 w-[0.52in] h-[0.78in] ml-0.5 flex items-center justify-center border border-zinc-200 rounded bg-white p-0.5 overflow-hidden">
                                  <PrintLabelImage
                                    src={label.imageUrl}
                                    name={label.title}
                                    monochrome={monochromePhotos}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. AVERY 5150 SINGLE LABEL PRESET (1" x 2-5/8" individual tags) */}
            {labelSize === 'avery_5150_single' && printTarget !== 'box_sheet' && (
              <div className="flex flex-wrap gap-3 items-start justify-center w-full">
                {/* Item copies */}
                {printTarget === 'item' && (
                  targetItems.flatMap((item) =>
                    Array.from({ length: copies }).map((_, cIdx) => {
                      const label = itemToAveryLabel(item, cIdx);
                      return renderAverySingleTag(label, `${item.id}-${cIdx}`, includePhotos, monochromePhotos);
                    })
                  )
                )}

                {/* Storage Box copies */}
                {printTarget === 'box' && (
                  targetBoxes.flatMap((box) =>
                    Array.from({ length: copies }).map((_, cIdx) => {
                      const label = boxToAveryLabel(box, cIdx);
                      return renderAverySingleTag(label, `${box.id}-${cIdx}`, includePhotos, monochromePhotos);
                    })
                  )
                )}

                {/* Box Contents or All Items */}
                {(printTarget === 'box_items' || printTarget === 'all_items') && (
                  targetItems.flatMap((item) =>
                    Array.from({ length: copies }).map((_, cIdx) => {
                      const label = itemToAveryLabel(item, cIdx);
                      return renderAverySingleTag(label, `${item.id}-${cIdx}`, includePhotos, monochromePhotos);
                    })
                  )
                )}
              </div>
            )}

            {/* 3. COMPACT ASSET TAG PRESET (2.2" x 1.0") */}
            {labelSize === 'compact' && printTarget !== 'box_sheet' && (
              <div className="flex flex-wrap gap-3 items-start justify-center w-full">
                {/* Item copies */}
                {printTarget === 'item' && (
                  targetItems.flatMap((item) =>
                    Array.from({ length: copies }).map((_, cIdx) => 
                      renderCompactItemCard(item, `${item.id}-${cIdx}`, getRoomName, getBoxName, getProtocols)
                    )
                  )
                )}

                {/* Storage Box copies */}
                {printTarget === 'box' && (
                  targetBoxes.flatMap((box) =>
                    Array.from({ length: copies }).map((_, cIdx) => 
                      renderCompactBoxCard(box, `${box.id}-${cIdx}`, getRoomName)
                    )
                  )
                )}

                {/* Box Contents or All Items */}
                {(printTarget === 'box_items' || printTarget === 'all_items') && (
                  targetItems.flatMap((item) =>
                    Array.from({ length: copies }).map((_, cIdx) => 
                      renderCompactItemCard(item, `${item.id}-${cIdx}`, getRoomName, getBoxName, getProtocols)
                    )
                  )
                )}
              </div>
            )}

            {/* 4. STANDARD & TOTE PLACARD PRESETS (With photos) */}
            {(labelSize === 'standard' || labelSize === 'tote') && printTarget !== 'box_sheet' && (
              <div className="flex flex-wrap gap-4 items-start justify-center w-full">
                {/* Item copies */}
                {printTarget === 'item' && (
                  targetItems.flatMap((item) =>
                    Array.from({ length: copies }).map((_, cIdx) => 
                      renderStandardItemCard(
                        item, 
                        `${item.id}-${cIdx}`, 
                        labelSize === 'tote', 
                        includePhotos, 
                        monochromePhotos, 
                        getRoomName, 
                        getBoxName, 
                        getProtocols
                      )
                    )
                  )
                )}

                {/* Storage Box copies */}
                {printTarget === 'box' && (
                  targetBoxes.flatMap((box) =>
                    Array.from({ length: copies }).map((_, cIdx) => 
                      renderStandardBoxCard(box, `${box.id}-${cIdx}`, labelSize === 'tote', getRoomName)
                    )
                  )
                )}

                {/* Box Contents or All Items */}
                {(printTarget === 'box_items' || printTarget === 'all_items') && (
                  targetItems.flatMap((item) =>
                    Array.from({ length: copies }).map((_, cIdx) => 
                      renderStandardItemCard(
                        item, 
                        `${item.id}-${cIdx}`, 
                        labelSize === 'tote', 
                        includePhotos, 
                        monochromePhotos, 
                        getRoomName, 
                        getBoxName, 
                        getProtocols
                      )
                    )
                  )
                )}
              </div>
            )}

            {/* 5. STORAGE BOX INVENTORY PACKING SLIP */}
            {printTarget === 'box_sheet' && currentBox && (
              <div className="print-packing-slip w-full max-w-4xl bg-white border border-black rounded-xl p-6 sm:p-8 text-black shadow-xs print:border-none print:p-0 print:max-w-none">
                {/* Slip Header */}
                <div className="border-b-2 border-black pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-black text-white rounded">
                        BOX MANIFEST
                      </span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 border border-black rounded">
                        {currentBox.boxCode}
                      </span>
                    </div>
                    <h1 className="text-2xl font-black mt-1.5 text-black tracking-tight">{currentBox.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-700 mt-1">
                      <span>Room: <strong className="text-black">{getRoomName(currentBox.roomId)}</strong></span>
                      <span>•</span>
                      <span>Location: <strong className="text-black">{currentBox.location}</strong></span>
                      {currentBox.description && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-600 italic">{currentBox.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <BarcodeRenderer
                      value={currentBox.barcode || currentBox.boxCode}
                      width={1.5}
                      height={40}
                      fontSize={11}
                      displayValue={true}
                      lineColor="#000000"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono mt-1">
                      Generated {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Box Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-zinc-100 border border-zinc-300 rounded-lg mb-4 text-center text-xs">
                  <div>
                    <span className="text-zinc-600 block text-[10px] uppercase font-bold tracking-wider">Item Entries</span>
                    <span className="text-base font-black text-black">
                      {items.filter((i) => i.boxId === currentBox.id).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px] uppercase font-bold tracking-wider">Total Quantity</span>
                    <span className="text-base font-black text-black">
                      {items
                        .filter((i) => i.boxId === currentBox.id)
                        .reduce((sum, item) => sum + (item.quantity || 1), 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px] uppercase font-bold tracking-wider">Box Barcode</span>
                    <span className="text-xs font-mono font-bold text-black mt-0.5 block">
                      {currentBox.barcode || currentBox.boxCode}
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-2 flex items-center justify-between">
                  <span>Items Packed Inside ({items.filter((i) => i.boxId === currentBox.id).length} items):</span>
                  <span className="text-[10px] font-normal text-zinc-600">Tick checkmarks during packing or audit</span>
                </h3>

                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black bg-zinc-100 text-black font-semibold">
                      <th className="py-2 px-2 w-8 text-center">✓</th>
                      <th className="py-2 px-2">Barcode</th>
                      {slipIncludePhotos && <th className="py-2 px-2 w-12 text-center">Photo</th>}
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
                        <tr key={item.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                          <td className="py-2 px-2 text-center">
                            <div className="w-3.5 h-3.5 border border-black rounded-xs mx-auto" />
                          </td>
                          <td className="py-2 px-2 font-mono font-bold text-black whitespace-nowrap">
                            {item.barcode}
                          </td>
                          {slipIncludePhotos && (
                            <td className="py-2 px-2 text-center">
                              <div className="w-8 h-8 rounded border border-zinc-200 overflow-hidden mx-auto bg-zinc-50 flex items-center justify-center">
                                <PrintLabelImage
                                  src={item.imageUrl}
                                  name={item.name}
                                  monochrome={monochromePhotos}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </td>
                          )}
                          <td className="py-2 px-2">
                            <div className="font-semibold text-black leading-tight">{item.name}</div>
                            <div className="text-[10px] text-zinc-600">
                              {item.brand} {item.modelNumber && `• ${item.modelNumber}`}
                              {item.serialNumber && ` • S/N: ${item.serialNumber}`}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-zinc-800">{item.category}</td>
                          <td className="py-2 px-2">
                            {getProtocols(item).length > 0 ? (
                              <span className="font-semibold">{getProtocols(item).join(', ')}</span>
                            ) : (
                              item.protocol || '—'
                            )}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-black">{item.quantity}</td>
                          <td className="py-2 px-2 capitalize text-zinc-800">{item.status.replace('_', ' ')}</td>
                        </tr>
                      ))}
                    {items.filter((i) => i.boxId === currentBox.id).length === 0 && (
                      <tr>
                        <td colSpan={slipIncludePhotos ? 8 : 7} className="py-8 text-center text-zinc-500 italic">
                          No items are currently packed in this storage box.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Sign-off Block */}
                {slipShowSignatures && (
                  <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs print-packing-slip-section">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-3">Packed / Verified By</span>
                      <div className="border-b border-black pb-1">
                        <span className="text-zinc-400 text-[11px]">Print Name</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-3">Signature & Date</span>
                      <div className="border-b border-black pb-1">
                        <span className="text-zinc-400 text-[11px]">Date: __________________</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-3">Audit Notes</span>
                      <div className="border-b border-black pb-1">
                        <span className="text-zinc-400 text-[11px]">Box condition / seal status</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. ROOM INVENTORY PACKING SLIP (NEW) */}
            {printTarget === 'room_sheet' && currentRoom && (
              <div className="print-packing-slip w-full max-w-4xl bg-white border border-black rounded-xl p-6 sm:p-8 text-black shadow-xs print:border-none print:p-0 print:max-w-none">
                {/* Room Manifest Header */}
                <div className="border-b-2 border-black pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-black text-white rounded">
                        ROOM MANIFEST
                      </span>
                      {currentRoom.floor && (
                        <span className="font-mono text-xs font-bold px-2 py-0.5 border border-black rounded">
                          {currentRoom.floor}
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-black mt-1.5 text-black tracking-tight">{currentRoom.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-700 mt-1">
                      <span>Room ID: <strong className="font-mono text-black">{currentRoom.id.slice(0, 10)}</strong></span>
                      {currentRoom.description && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-600 italic">{currentRoom.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <BarcodeRenderer
                      value={`RM-${currentRoom.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}`}
                      width={1.5}
                      height={40}
                      fontSize={11}
                      displayValue={true}
                      lineColor="#000000"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono mt-1">
                      Printed {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Room Statistics Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-zinc-100 border border-zinc-300 rounded-lg mb-4 text-center text-xs">
                  <div>
                    <span className="text-zinc-600 block text-[10px] uppercase font-bold tracking-wider">Total Items</span>
                    <span className="text-lg font-black text-black">
                      {roomItems.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px] uppercase font-bold tracking-wider">Storage Boxes</span>
                    <span className="text-lg font-black text-black">
                      {roomBoxes.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px] uppercase font-bold tracking-wider">Loose (Unboxed)</span>
                    <span className="text-lg font-black text-black">
                      {roomItems.filter((i) => !i.boxId).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px] uppercase font-bold tracking-wider">Total Units</span>
                    <span className="text-lg font-black text-black">
                      {roomItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                    </span>
                  </div>
                </div>

                {/* Registered Storage Boxes in this Room Summary */}
                {roomBoxes.length > 0 && (
                  <div className="mb-6 print-packing-slip-section">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-2 flex items-center justify-between">
                      <span>Storage Boxes In This Room ({roomBoxes.length}):</span>
                      <span className="text-[10px] font-normal text-zinc-600 font-mono">Scan box barcodes to inspect</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {roomBoxes.map((box) => {
                        const boxCount = items.filter((i) => i.boxId === box.id).length;
                        return (
                          <div key={box.id} className="p-2.5 border border-zinc-300 rounded-lg bg-zinc-50 flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-black text-white rounded">
                                  {box.boxCode}
                                </span>
                                <span className="text-xs font-bold text-black truncate" title={box.name}>
                                  {box.name}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-600 mt-1 truncate">
                                Placement: <strong>{box.location || 'Unassigned'}</strong>
                              </p>
                              <span className="text-[10px] text-zinc-800 font-semibold mt-0.5 block">
                                {boxCount} item{boxCount !== 1 ? 's' : ''} packed inside
                              </span>
                            </div>
                            <div className="shrink-0 flex flex-col items-end">
                              <BarcodeRenderer
                                value={box.barcode || box.boxCode}
                                width={1.0}
                                height={24}
                                fontSize={9}
                                displayValue={false}
                                lineColor="#000000"
                              />
                              <span className="font-mono text-[9px] text-zinc-600 mt-0.5">
                                {box.boxCode}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items Manifest List */}
                {roomGroupByBox ? (
                  /* MODE A: Grouped by Storage Box + Loose Items */
                  <div className="space-y-6">
                    {/* Iterate through each box in this room */}
                    {roomBoxes.map((box) => {
                      const boxItems = items.filter((i) => i.boxId === box.id);
                      if (boxItems.length === 0) return null;

                      return (
                        <div key={box.id} className="border border-black rounded-lg overflow-hidden print-packing-slip-section">
                          {/* Box section header */}
                          <div className="bg-zinc-100 p-2.5 sm:px-3.5 border-b border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-black text-white rounded">
                                {box.boxCode}
                              </span>
                              <span className="text-sm font-bold text-black truncate">{box.name}</span>
                              <span className="text-xs text-zinc-600">({box.location})</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="font-semibold text-black">
                                {boxItems.length} item{boxItems.length !== 1 ? 's' : ''}
                              </span>
                              <span className="font-mono text-[11px] text-zinc-600">
                                Barcode: {box.barcode || box.boxCode}
                              </span>
                            </div>
                          </div>

                          {/* Items Table for this Box */}
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-300 bg-zinc-50 text-zinc-800 font-semibold">
                                <th className="py-1.5 px-2 w-8 text-center">✓</th>
                                <th className="py-1.5 px-2">Barcode</th>
                                {slipIncludePhotos && <th className="py-1.5 px-2 w-12 text-center">Photo</th>}
                                <th className="py-1.5 px-2">Item Name & Brand</th>
                                <th className="py-1.5 px-2">Category</th>
                                <th className="py-1.5 px-2">Protocol</th>
                                <th className="py-1.5 px-2 text-center">Qty</th>
                                <th className="py-1.5 px-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {boxItems.map((item) => (
                                <tr key={item.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                                  <td className="py-2 px-2 text-center">
                                    <div className="w-3.5 h-3.5 border border-black rounded-xs mx-auto" />
                                  </td>
                                  <td className="py-2 px-2 font-mono font-bold text-black whitespace-nowrap">
                                    {item.barcode}
                                  </td>
                                  {slipIncludePhotos && (
                                    <td className="py-2 px-2 text-center">
                                      <div className="w-8 h-8 rounded border border-zinc-200 overflow-hidden mx-auto bg-zinc-50 flex items-center justify-center">
                                        <PrintLabelImage
                                          src={item.imageUrl}
                                          name={item.name}
                                          monochrome={monochromePhotos}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </td>
                                  )}
                                  <td className="py-2 px-2">
                                    <div className="font-semibold text-black leading-tight">{item.name}</div>
                                    <div className="text-[10px] text-zinc-600">
                                      {item.brand} {item.modelNumber && `• ${item.modelNumber}`}
                                      {item.serialNumber && ` • S/N: ${item.serialNumber}`}
                                    </div>
                                  </td>
                                  <td className="py-2 px-2 text-zinc-800">{item.category}</td>
                                  <td className="py-2 px-2">
                                    {getProtocols(item).length > 0 ? (
                                      <span className="font-semibold">{getProtocols(item).join(', ')}</span>
                                    ) : (
                                      item.protocol || '—'
                                    )}
                                  </td>
                                  <td className="py-2 px-2 text-center font-bold text-black">{item.quantity}</td>
                                  <td className="py-2 px-2 capitalize text-zinc-800">{item.status.replace('_', ' ')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}

                    {/* Loose / Unboxed Items in Room */}
                    {roomIncludeLoose && (
                      (() => {
                        const looseItems = roomItems.filter((i) => !i.boxId);
                        if (looseItems.length === 0) return null;

                        return (
                          <div className="border border-black rounded-lg overflow-hidden print-packing-slip-section">
                            <div className="bg-zinc-100 p-2.5 sm:px-3.5 border-b border-black flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-zinc-800 text-white rounded">
                                  UNBOXED
                                </span>
                                <span className="text-sm font-bold text-black">
                                  Loose Room Items (Not inside a storage box)
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-black">
                                {looseItems.length} item{looseItems.length !== 1 ? 's' : ''}
                              </span>
                            </div>

                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="border-b border-zinc-300 bg-zinc-50 text-zinc-800 font-semibold">
                                  <th className="py-1.5 px-2 w-8 text-center">✓</th>
                                  <th className="py-1.5 px-2">Barcode</th>
                                  {slipIncludePhotos && <th className="py-1.5 px-2 w-12 text-center">Photo</th>}
                                  <th className="py-1.5 px-2">Item Name & Brand</th>
                                  <th className="py-1.5 px-2">Category</th>
                                  <th className="py-1.5 px-2">Protocol</th>
                                  <th className="py-1.5 px-2 text-center">Qty</th>
                                  <th className="py-1.5 px-2">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {looseItems.map((item) => (
                                  <tr key={item.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                                    <td className="py-2 px-2 text-center">
                                      <div className="w-3.5 h-3.5 border border-black rounded-xs mx-auto" />
                                    </td>
                                    <td className="py-2 px-2 font-mono font-bold text-black whitespace-nowrap">
                                      {item.barcode}
                                    </td>
                                    {slipIncludePhotos && (
                                      <td className="py-2 px-2 text-center">
                                        <div className="w-8 h-8 rounded border border-zinc-200 overflow-hidden mx-auto bg-zinc-50 flex items-center justify-center">
                                          <PrintLabelImage
                                            src={item.imageUrl}
                                            name={item.name}
                                            monochrome={monochromePhotos}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      </td>
                                    )}
                                    <td className="py-2 px-2">
                                      <div className="font-semibold text-black leading-tight">{item.name}</div>
                                      <div className="text-[10px] text-zinc-600">
                                        {item.brand} {item.modelNumber && `• ${item.modelNumber}`}
                                        {item.serialNumber && ` • S/N: ${item.serialNumber}`}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-zinc-800">{item.category}</td>
                                    <td className="py-2 px-2">
                                      {getProtocols(item).length > 0 ? (
                                        <span className="font-semibold">{getProtocols(item).join(', ')}</span>
                                      ) : (
                                        item.protocol || '—'
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-center font-bold text-black">{item.quantity}</td>
                                    <td className="py-2 px-2 capitalize text-zinc-800">{item.status.replace('_', ' ')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()
                    )}

                    {roomItems.length === 0 && (
                      <div className="py-10 text-center text-zinc-500 border border-dashed border-zinc-300 rounded-xl">
                        No inventory items are currently assigned to {currentRoom.name}.
                      </div>
                    )}
                  </div>
                ) : (
                  /* MODE B: Consolidated Single Room Table */
                  <div className="border border-black rounded-lg overflow-hidden print-packing-slip-section">
                    <div className="bg-zinc-100 p-2.5 sm:px-3.5 border-b border-black flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-black">
                        Room Inventory Manifest List
                      </span>
                      <span className="text-xs font-semibold text-black">
                        {roomIncludeLoose ? roomItems.length : roomItems.filter((i) => i.boxId).length} Items Total
                      </span>
                    </div>

                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-black bg-zinc-100 text-black font-semibold">
                          <th className="py-2 px-2 w-8 text-center">✓</th>
                          <th className="py-2 px-2">Barcode</th>
                          {slipIncludePhotos && <th className="py-2 px-2 w-12 text-center">Photo</th>}
                          <th className="py-2 px-2">Item Name & Details</th>
                          <th className="py-2 px-2">Storage Box / Placement</th>
                          <th className="py-2 px-2">Category</th>
                          <th className="py-2 px-2">Protocol</th>
                          <th className="py-2 px-2 text-center">Qty</th>
                          <th className="py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomItems
                          .filter((i) => (roomIncludeLoose ? true : Boolean(i.boxId)))
                          .map((item) => {
                            const itemBox = boxes.find((b) => b.id === item.boxId);
                            return (
                              <tr key={item.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                                <td className="py-2 px-2 text-center">
                                  <div className="w-3.5 h-3.5 border border-black rounded-xs mx-auto" />
                                </td>
                                <td className="py-2 px-2 font-mono font-bold text-black whitespace-nowrap">
                                  {item.barcode}
                                </td>
                                {slipIncludePhotos && (
                                  <td className="py-2 px-2 text-center">
                                    <div className="w-8 h-8 rounded border border-zinc-200 overflow-hidden mx-auto bg-zinc-50 flex items-center justify-center">
                                      <PrintLabelImage
                                        src={item.imageUrl}
                                        name={item.name}
                                        monochrome={monochromePhotos}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </td>
                                )}
                                <td className="py-2 px-2">
                                  <div className="font-semibold text-black leading-tight">{item.name}</div>
                                  <div className="text-[10px] text-zinc-600">
                                    {item.brand} {item.modelNumber && `• ${item.modelNumber}`}
                                    {item.serialNumber && ` • S/N: ${item.serialNumber}`}
                                  </div>
                                </td>
                                <td className="py-2 px-2">
                                  {itemBox ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-black text-white rounded">
                                        {itemBox.boxCode}
                                      </span>
                                      <span className="font-medium text-black truncate max-w-[120px]" title={itemBox.name}>
                                        {itemBox.name}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-mono text-[11px] text-zinc-500 italic">
                                      Loose (Unboxed)
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-zinc-800">{item.category}</td>
                                <td className="py-2 px-2">
                                  {getProtocols(item).length > 0 ? (
                                    <span className="font-semibold">{getProtocols(item).join(', ')}</span>
                                  ) : (
                                    item.protocol || '—'
                                  )}
                                </td>
                                <td className="py-2 px-2 text-center font-bold text-black">{item.quantity}</td>
                                <td className="py-2 px-2 capitalize text-zinc-800">{item.status.replace('_', ' ')}</td>
                              </tr>
                            );
                          })}
                        {roomItems.length === 0 && (
                          <tr>
                            <td colSpan={slipIncludePhotos ? 9 : 8} className="py-8 text-center text-zinc-500 italic">
                              No inventory items are currently assigned to this room.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sign-off & Room Audit Verification Block */}
                {slipShowSignatures && (
                  <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs print-packing-slip-section">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-3">Room Auditor / Inspector</span>
                      <div className="border-b border-black pb-1">
                        <span className="text-zinc-400 text-[11px]">Print Name</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-3">Signature & Date</span>
                      <div className="border-b border-black pb-1">
                        <span className="text-zinc-400 text-[11px]">Date: __________________</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-3">Audit / Moving Notes</span>
                      <div className="border-b border-black pb-1">
                        <span className="text-zinc-400 text-[11px]">Condition / missing items</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  </div>
</div>
  );
};

// Robust Label Image Component for labels with direct fetch, proxy fallback, and clean placeholder
const PrintLabelImage: React.FC<{
  src?: string;
  name: string;
  className?: string;
  monochrome?: boolean;
}> = ({ src, name, className = '', monochrome = false }) => {
  const [hasTriedProxy, setHasTriedProxy] = useState(false);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  if (!src || hasFailedAll) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 rounded p-0.5 text-center ${className}`}>
        <Package className="w-5 h-5 text-zinc-400 stroke-[1.5]" />
        <span className="text-[7px] text-zinc-500 font-mono leading-none mt-0.5 truncate max-w-full">
          {name ? name.slice(0, 8) : ''}
        </span>
      </div>
    );
  }

  const isLocalOrData = src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/');
  const imageSource = hasTriedProxy && !isLocalOrData
    ? `/api/proxy-image?url=${encodeURIComponent(src)}`
    : src;

  return (
    <img
      src={imageSource}
      alt=""
      referrerPolicy="no-referrer"
      className={`w-full h-full object-contain ${
        monochrome ? 'grayscale contrast-125' : ''
      } ${className}`}
      onError={() => {
        if (!hasTriedProxy && !isLocalOrData) {
          setHasTriedProxy(true);
        } else {
          setHasFailedAll(true);
        }
      }}
    />
  );
};

// Protocol badge style helper for labels (supports colorful badges or monochrome)
function getLabelProtocolBadgeStyle(proto: string, monochrome: boolean) {
  if (monochrome) {
    return 'bg-zinc-100 text-zinc-900 border-zinc-300';
  }
  const clean = proto.trim();
  switch (clean) {
    case 'Matter':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'Zigbee':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Z-Wave':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Thread':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'HomeKit':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Wi-Fi':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'Bluetooth':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'LoRaWAN':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    default:
      return 'bg-zinc-100 text-zinc-800 border-zinc-200';
  }
}

// Helper: Render Single Avery 5150 Tag (2.625" x 1.0")
function renderAverySingleTag(
  label: AveryLabelItem, 
  key: string | number, 
  includePhotos: boolean = true, 
  monochromePhotos: boolean = false
) {
  const hasImage = Boolean(includePhotos && label.imageUrl);

  return (
    <div
      key={key}
      className="print-label-item avery-5150-label bg-white border border-zinc-300 rounded-xs text-zinc-900 flex flex-row items-center justify-between overflow-hidden shadow-xs print:shadow-none print:border-black"
      style={{
        width: '2.625in',
        height: '1.0in',
        maxWidth: '2.625in',
        maxHeight: '1.0in',
        padding: hasImage ? '0.03in 0.04in' : '0.04in 0.08in',
        boxSizing: 'border-box'
      }}
    >
      {/* Left: Barcode */}
      <div className={`shrink-0 flex flex-col items-center justify-center overflow-hidden bg-white ${
        hasImage ? 'w-[1.05in]' : 'w-[1.32in]'
      }`}>
        <BarcodeRenderer
          value={label.barcode}
          width={hasImage ? 0.74 : 0.92}
          height={hasImage ? 22 : 24}
          fontSize={hasImage ? 7 : 8}
          displayValue={true}
          lineColor="#000000"
        />
      </div>

      {/* Center/Right: Metadata */}
      <div className={`min-w-0 flex-1 flex flex-col justify-center leading-tight pl-1 border-l border-zinc-200 print:border-black ${
        hasImage ? 'pr-1' : ''
      }`}>
        <div className="flex items-center gap-1 min-w-0">
          {label.badge && (
            <span className="font-mono text-[7px] font-bold bg-zinc-900 text-white px-1 py-0.2 rounded-xs shrink-0">
              {label.badge}
            </span>
          )}
          <span className="font-bold text-[8px] leading-tight truncate text-zinc-950" title={label.title}>
            {label.title}
          </span>
        </div>
        <div className="text-[7px] text-zinc-600 font-medium truncate mt-0.5" title={label.subtitle}>
          {label.subtitle}
        </div>
        <div className="text-[6.5px] text-zinc-500 truncate mt-0.5" title={label.meta}>
          {label.meta}
        </div>
        {label.protocols && label.protocols.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {label.protocols.slice(0, 1).map((p) => (
              <span
                key={p}
                className={`text-[6px] font-bold uppercase px-0.8 py-0.1 border rounded-xs ${getLabelProtocolBadgeStyle(p, monochromePhotos)}`}
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: Item Image (if enabled and present) */}
      {hasImage && (
        <div className="shrink-0 w-[0.52in] h-[0.78in] ml-0.5 flex items-center justify-center border border-zinc-200 rounded bg-white p-0.5 overflow-hidden">
          <PrintLabelImage
            src={label.imageUrl}
            name={label.title}
            monochrome={monochromePhotos}
          />
        </div>
      )}
    </div>
  );
}

// Helper: Render Compact Item Card (2.2" x 1.0")
function renderCompactItemCard(
  item: InventoryItem, 
  key: string | number, 
  getRoomName: (id: string) => string, 
  getBoxName: (id?: string | null) => string,
  getProtocols: (item: InventoryItem) => string[]
) {
  const protos = getProtocols(item);
  return (
    <div
      key={key}
      className="print-label-item bg-white border border-zinc-300 print:border-black rounded-lg p-2 text-zinc-900 flex flex-col justify-between shadow-xs print:shadow-none print:m-1 w-[220px] min-h-[105px]"
    >
      <div className="flex justify-between items-start border-b border-zinc-200 print:border-black/30 pb-1 gap-1">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-xs leading-tight truncate text-zinc-950">
            {item.name}
          </div>
          <div className="text-[9px] text-zinc-600 truncate">
            <span className="font-semibold text-zinc-900">{item.brand}</span>
            {item.modelNumber && ` • Mod: ${item.modelNumber}`}
          </div>
        </div>
        {protos.length > 0 && (
          <div className="flex flex-wrap gap-0.5 shrink-0 justify-end max-w-[80px]">
            {protos.slice(0, 2).map((p) => (
              <span key={p} className={`text-[7px] font-bold uppercase px-1 py-0.2 border rounded ${getLabelProtocolBadgeStyle(p, false)}`}>
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="my-1 py-0.5 bg-white flex justify-center">
        <BarcodeRenderer
          value={item.barcode}
          width={1.15}
          height={28}
          fontSize={9}
          displayValue={true}
          lineColor="#000000"
        />
      </div>

      <div className="border-t border-zinc-200 print:border-black/30 pt-1 text-[8px] text-zinc-700 flex justify-between items-center font-mono">
        <span className="truncate">LOC: {getRoomName(item.roomId)}</span>
        <span className="truncate ml-1 font-bold">{getBoxName(item.boxId).split('•')[0]}</span>
      </div>
    </div>
  );
}

// Helper: Render Compact Box Card
function renderCompactBoxCard(
  box: StorageBox, 
  key: string | number, 
  getRoomName: (id: string) => string
) {
  return (
    <div
      key={key}
      className="print-label-item bg-white border border-zinc-300 print:border-black rounded-lg p-2.5 text-zinc-900 flex flex-col justify-between shadow-xs print:shadow-none print:m-1 w-[240px] min-h-[115px]"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 print:border-black/30 pb-1 gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded">
            {box.boxCode}
          </span>
          <span className="font-bold text-xs text-zinc-950 truncate max-w-[140px]">
            {box.name}
          </span>
        </div>
      </div>
      <div className="my-1.5 flex justify-center bg-white">
        <BarcodeRenderer
          value={box.barcode || box.boxCode}
          width={1.25}
          height={30}
          fontSize={9.5}
          displayValue={true}
          lineColor="#000000"
        />
      </div>
      <div className="border-t border-zinc-200 print:border-black/30 pt-1 text-[8.5px] text-zinc-700 flex justify-between items-center font-mono">
        <span>{getRoomName(box.roomId)}</span>
        <span className="font-bold">{box.location || 'Storage Box'}</span>
      </div>
    </div>
  );
}

// Helper: Render Standard & Tote Item Card (With Image)
function renderStandardItemCard(
  item: InventoryItem, 
  key: string | number, 
  isTote: boolean,
  includePhotos: boolean,
  monochromePhotos: boolean,
  getRoomName: (id: string) => string, 
  getBoxName: (id?: string | null) => string,
  getProtocols: (item: InventoryItem) => string[]
) {
  const hasImage = Boolean(includePhotos && item.imageUrl);
  const protos = getProtocols(item);

  return (
    <div
      key={key}
      className={`print-label-item bg-white border border-zinc-300 print:border-black rounded-xl p-3 text-zinc-900 flex flex-col justify-between shadow-xs print:shadow-none print:m-1 ${
        isTote ? 'w-[360px] min-h-[190px]' : 'w-[310px] min-h-[150px]'
      }`}
    >
      <div className="flex justify-between items-start border-b border-zinc-200 print:border-black/30 pb-1.5 gap-2">
        <div className="min-w-0 flex-1">
          <div className={`font-bold leading-tight truncate text-zinc-950 ${isTote ? 'text-sm' : 'text-xs'}`}>
            {item.name}
          </div>
          <div className="text-[10px] text-zinc-600 font-medium truncate mt-0.5">
            <span className="font-semibold text-zinc-900">{item.brand}</span>
            {item.modelNumber && ` • Mod: ${item.modelNumber}`}
          </div>
        </div>
        {protos.length > 0 && (
          <div className="flex flex-wrap gap-1 shrink-0 justify-end max-w-[120px]">
            {protos.map((proto) => (
              <span
                key={proto}
                className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${getLabelProtocolBadgeStyle(proto, monochromePhotos)}`}
              >
                {proto}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="my-2 py-0.5 bg-white flex items-center justify-between gap-3">
        {hasImage && (
          <div
            className={`shrink-0 flex items-center justify-center border border-zinc-300 rounded-lg bg-white p-1 overflow-hidden ${
              isTote ? 'w-[76px] h-[76px]' : 'w-[56px] h-[56px]'
            }`}
          >
            <PrintLabelImage
              src={item.imageUrl}
              name={item.name}
              monochrome={monochromePhotos}
            />
          </div>
        )}

        <div className="flex-1 flex justify-center items-center min-w-0 overflow-hidden">
          <BarcodeRenderer
            value={item.barcode}
            width={hasImage ? (isTote ? 1.35 : 1.15) : (isTote ? 1.6 : 1.45)}
            height={isTote ? 48 : 36}
            fontSize={isTote ? 11 : 10}
            displayValue={true}
            lineColor="#000000"
          />
        </div>
      </div>

      <div className="border-t border-zinc-200 print:border-black/30 pt-1 text-[9px] text-zinc-700 flex justify-between items-center font-mono">
        <span className="truncate">LOC: {getRoomName(item.roomId)}</span>
        <span className="truncate ml-1 font-bold">{getBoxName(item.boxId)}</span>
      </div>
    </div>
  );
}

// Helper: Render Standard & Tote Box Card
function renderStandardBoxCard(
  box: StorageBox, 
  key: string | number, 
  isTote: boolean,
  getRoomName: (id: string) => string
) {
  return (
    <div
      key={key}
      className={`print-label-item bg-white border border-zinc-300 print:border-black rounded-xl p-4 text-zinc-900 flex flex-col justify-between shadow-xs print:shadow-none print:m-1 ${
        isTote ? 'w-[380px] min-h-[210px]' : 'w-[320px] min-h-[170px]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 print:border-black/30 pb-2">
        <div className="flex items-center gap-2">
          <div className="font-mono text-base font-bold bg-zinc-900 text-white px-2 py-0.5 rounded">
            {box.boxCode}
          </div>
          <div className="font-bold text-sm text-zinc-950 truncate max-w-[200px]">
            {box.name}
          </div>
        </div>
      </div>

      <div className="my-3 flex justify-center bg-white">
        <BarcodeRenderer
          value={box.barcode || box.boxCode}
          width={isTote ? 1.8 : 1.5}
          height={isTote ? 46 : 38}
          fontSize={isTote ? 12 : 11}
          displayValue={true}
          lineColor="#000000"
        />
      </div>

      <div className="border-t border-zinc-200 print:border-black/30 pt-2 text-xs flex justify-between items-center">
        <div>
          <span className="font-semibold text-zinc-900">Room:</span> {getRoomName(box.roomId)}
        </div>
        <div className="text-[11px] text-zinc-700">
          <span className="font-semibold text-zinc-900">Loc:</span> {box.location}
        </div>
      </div>

      {box.description && (
        <div className="text-[10px] text-zinc-600 italic mt-1.5 border-t border-dashed border-zinc-300 pt-1">
          {box.description}
        </div>
      )}
    </div>
  );
}
