import React, { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { 
  Plus, 
  Package, 
  Box as BoxIcon, 
  Camera, 
  Printer, 
  Search, 
  AlertCircle,
  Cloud,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

import type { InventoryItem, StorageBox, Room, FilterState } from './types';
import { INITIAL_ITEMS, INITIAL_BOXES, INITIAL_ROOMS } from './data/initialData';
import { 
  subscribeToAuth, 
  signInWithGoogle, 
  logOut, 
  subscribeToItems, 
  subscribeToBoxes, 
  subscribeToRooms,
  saveItemToCloud,
  deleteItemFromCloud,
  saveBoxToCloud,
  deleteBoxFromCloud,
  saveRoomToCloud,
  deleteRoomFromCloud,
  bulkUploadInitialData
} from './lib/firebase';

import { Header } from './components/Header';
import { SearchFilterBar } from './components/SearchFilterBar';
import { ItemCard } from './components/ItemCard';
import { BoxCard } from './components/BoxCard';
import { RoomsView } from './components/RoomsView';
import { AnalyticsView } from './components/AnalyticsView';

import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { BarcodePrintModal } from './components/BarcodePrintModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { BoxDetailModal } from './components/BoxDetailModal';
import { ItemFormModal } from './components/ItemFormModal';
import { BoxFormModal } from './components/BoxFormModal';
import { RoomFormModal } from './components/RoomFormModal';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Core data states
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('household_inventory_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [boxes, setBoxes] = useState<StorageBox[]>(() => {
    const saved = localStorage.getItem('household_inventory_boxes');
    return saved ? JSON.parse(saved) : INITIAL_BOXES;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('household_inventory_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'items' | 'boxes' | 'rooms' | 'stats'>('items');

  // Search and Filtering State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: '',
    roomId: '',
    boxId: '',
    status: '',
    protocol: '',
    sortBy: 'name_asc',
    onlyUnboxed: false
  });

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  const [printTargetItem, setPrintTargetItem] = useState<InventoryItem | null>(null);
  const [printTargetBox, setPrintTargetBox] = useState<StorageBox | null>(null);

  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [detailBox, setDetailBox] = useState<StorageBox | null>(null);

  const [itemFormState, setItemFormState] = useState<{
    isOpen: boolean;
    item?: InventoryItem | null;
    prefilledBoxId?: string | null;
    prefilledBarcode?: string | null;
  }>({ isOpen: false });

  const [boxFormState, setBoxFormState] = useState<{
    isOpen: boolean;
    box?: StorageBox | null;
    prefilledBarcode?: string | null;
  }>({ isOpen: false });

  const [roomFormState, setRoomFormState] = useState<{
    isOpen: boolean;
    room?: Room | null;
  }>({ isOpen: false });

  // Save to localStorage whenever offline/guest state changes
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('household_inventory_items', JSON.stringify(items));
      localStorage.setItem('household_inventory_boxes', JSON.stringify(boxes));
      localStorage.setItem('household_inventory_rooms', JSON.stringify(rooms));
    }
  }, [items, boxes, rooms, currentUser]);

  // Auth observer & real-time Firestore synchronization
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        setIsSyncing(true);

        // Subscribe to items in real-time
        const unsubItems = subscribeToItems(user.uid, (cloudItems) => {
          if (cloudItems.length > 0) {
            setItems(cloudItems);
          } else {
            // First time login with empty cloud: upload current state
            bulkUploadInitialData(user.uid, items, boxes, rooms).catch(console.warn);
          }
          setIsSyncing(false);
        });

        // Subscribe to boxes in real-time
        const unsubBoxes = subscribeToBoxes(user.uid, (cloudBoxes) => {
          if (cloudBoxes.length > 0) {
            setBoxes(cloudBoxes);
          }
        });

        // Subscribe to rooms in real-time
        const unsubRooms = subscribeToRooms(user.uid, (cloudRooms) => {
          if (cloudRooms.length > 0) {
            setRooms(cloudRooms);
          }
        });

        return () => {
          unsubItems();
          unsubBoxes();
          unsubRooms();
        };
      }
    });

    return () => unsubAuth();
  }, []);

  // Global Keydown Handler for USB Barcode Scanner guns (scanners send fast keystrokes followed by Enter)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          const scannedCode = buffer.trim();
          buffer = '';
          // Find item or box
          const foundItem = items.find(
            (it) => it.barcode.toLowerCase() === scannedCode.toLowerCase() ||
                    it.id.toLowerCase() === scannedCode.toLowerCase()
          );
          if (foundItem) {
            setDetailItem(foundItem);
          } else {
            const foundBox = boxes.find(
              (b) => b.barcode.toLowerCase() === scannedCode.toLowerCase() ||
                     b.boxCode.toLowerCase() === scannedCode.toLowerCase()
            );
            if (foundBox) {
              setDetailBox(foundBox);
            } else {
              // Open scanner modal with code
              setIsScannerOpen(true);
            }
          }
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, boxes]);

  // Auth actions
  const handleSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      console.warn('Google sign-in error:', err);
      setAuthError('Sign in cancelled or interrupted. Try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  // Item Handlers
  const handleSaveItem = (savedItem: InventoryItem) => {
    setItems((prev) => {
      const exists = prev.some((it) => it.id === savedItem.id);
      if (exists) {
        return prev.map((it) => (it.id === savedItem.id ? savedItem : it));
      }
      return [savedItem, ...prev];
    });

    if (currentUser) {
      saveItemToCloud(currentUser.uid, savedItem).catch(console.warn);
    }
  };

  const handleDeleteItem = (itemToDelete: InventoryItem) => {
    if (window.confirm(`Are you sure you want to remove "${itemToDelete.name}"?`)) {
      setItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
      if (detailItem?.id === itemToDelete.id) {
        setDetailItem(null);
      }
      if (currentUser) {
        deleteItemFromCloud(currentUser.uid, itemToDelete.id).catch(console.warn);
      }
    }
  };

  // Box Handlers
  const handleSaveBox = (savedBox: StorageBox) => {
    setBoxes((prev) => {
      const exists = prev.some((b) => b.id === savedBox.id);
      if (exists) {
        return prev.map((b) => (b.id === savedBox.id ? savedBox : b));
      }
      return [savedBox, ...prev];
    });

    if (currentUser) {
      saveBoxToCloud(currentUser.uid, savedBox).catch(console.warn);
    }
  };

  const handleDeleteBox = (boxToDelete: StorageBox) => {
    const itemsInBox = items.filter((it) => it.boxId === boxToDelete.id);
    const confirmMsg = itemsInBox.length > 0
      ? `"${boxToDelete.name}" contains ${itemsInBox.length} items. Deleting the box will move these items to unboxed storage. Proceed?`
      : `Delete storage box "${boxToDelete.name}"?`;

    if (window.confirm(confirmMsg)) {
      // Unpack items
      setItems((prev) =>
        prev.map((it) => (it.boxId === boxToDelete.id ? { ...it, boxId: null } : it))
      );
      setBoxes((prev) => prev.filter((b) => b.id !== boxToDelete.id));

      if (detailBox?.id === boxToDelete.id) {
        setDetailBox(null);
      }

      if (currentUser) {
        deleteBoxFromCloud(currentUser.uid, boxToDelete.id).catch(console.warn);
        itemsInBox.forEach((it) => {
          saveItemToCloud(currentUser.uid, { ...it, boxId: null }).catch(console.warn);
        });
      }
    }
  };

  const handleRemoveItemFromBox = (item: InventoryItem) => {
    const updated = { ...item, boxId: null, updatedAt: new Date().toISOString() };
    handleSaveItem(updated);
  };

  // Room Handlers
  const handleSaveRoom = (savedRoom: Room) => {
    setRooms((prev) => {
      const exists = prev.some((r) => r.id === savedRoom.id);
      if (exists) {
        return prev.map((r) => (r.id === savedRoom.id ? savedRoom : r));
      }
      return [...prev, savedRoom];
    });

    if (currentUser) {
      saveRoomToCloud(currentUser.uid, savedRoom).catch(console.warn);
    }
  };

  const handleDeleteRoom = (roomToDelete: Room) => {
    const boxesInRoom = boxes.filter((b) => b.roomId === roomToDelete.id);
    const itemsInRoom = items.filter((it) => it.roomId === roomToDelete.id);

    if (boxesInRoom.length > 0 || itemsInRoom.length > 0) {
      alert(`Cannot delete room "${roomToDelete.name}" because it still contains ${boxesInRoom.length} boxes and ${itemsInRoom.length} items. Please relocate them first.`);
      return;
    }

    if (window.confirm(`Delete room "${roomToDelete.name}"?`)) {
      setRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
      if (currentUser) {
        deleteRoomFromCloud(currentUser.uid, roomToDelete.id).catch(console.warn);
      }
    }
  };

  // Filtering & Sorting
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.brand.toLowerCase().includes(q) ||
          it.barcode.toLowerCase().includes(q) ||
          (it.modelNumber && it.modelNumber.toLowerCase().includes(q)) ||
          (it.serialNumber && it.serialNumber.toLowerCase().includes(q)) ||
          (it.location && it.location.toLowerCase().includes(q)) ||
          (it.notes && it.notes.toLowerCase().includes(q)) ||
          (it.tags && it.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Category
    if (filters.category) {
      result = result.filter((it) => it.category === filters.category);
    }

    // Room
    if (filters.roomId) {
      result = result.filter((it) => it.roomId === filters.roomId);
    }

    // Storage Box
    if (filters.boxId) {
      result = result.filter((it) => it.boxId === filters.boxId);
    }

    // Only unboxed
    if (filters.onlyUnboxed) {
      result = result.filter((it) => !it.boxId);
    }

    // Status
    if (filters.status) {
      result = result.filter((it) => it.status === filters.status);
    }

    // Protocol
    if (filters.protocol) {
      result = result.filter((it) => it.protocol === filters.protocol);
    }

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'date_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'value_desc':
          return (b.purchasePrice || 0) - (a.purchasePrice || 0);
        case 'quantity_desc':
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

    return result;
  }, [items, filters]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenPrinter={() => {
          setPrintTargetItem(null);
          setPrintTargetBox(null);
          setIsPrinterOpen(true);
        }}
        onOpenNewItem={() => setItemFormState({ isOpen: true, item: null })}
        onOpenNewBox={() => setBoxFormState({ isOpen: true, box: null })}
        itemsCount={items.length}
        boxesCount={boxes.length}
        roomsCount={rooms.length}
        isSyncing={isSyncing}
      />

      {/* Auth Banner message if notice exists */}
      {authError && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-800 dark:text-amber-300 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{authError}</span>
          <button onClick={() => setAuthError(null)} className="font-bold underline ml-2 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: ITEMS CATALOG */}
        {activeTab === 'items' && (
          <div>
            <SearchFilterBar
              filters={filters}
              onFilterChange={setFilters}
              boxes={boxes}
              rooms={rooms}
              totalCount={items.length}
              filteredCount={filteredItems.length}
            />

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    boxes={boxes}
                    rooms={rooms}
                    onSelect={(it) => setDetailItem(it)}
                    onEdit={(it) => setItemFormState({ isOpen: true, item: it })}
                    onDelete={handleDeleteItem}
                    onPrintBarcode={(it) => {
                      setPrintTargetItem(it);
                      setPrintTargetBox(null);
                      setIsPrinterOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-transparent dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No items match your filters</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Try adjusting your search query, clearing category filters, or add a new item.
                </p>
                <div className="flex items-center gap-2 mt-5">
                  <button
                    onClick={() =>
                      setFilters({
                        searchQuery: '',
                        category: '',
                        roomId: '',
                        boxId: '',
                        status: '',
                        protocol: '',
                        sortBy: 'name_asc',
                        onlyUnboxed: false
                      })
                    }
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => setItemFormState({ isOpen: true, item: null })}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-indigo-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Item
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: STORAGE BOXES */}
        {activeTab === 'boxes' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Storage Boxes & Bins</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Physical storage totes with visual barcode labels for fast scanning and tracking
                </p>
              </div>
              <button
                onClick={() => setBoxFormState({ isOpen: true, box: null })}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-500/20 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create Storage Box
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {boxes.map((box) => {
                const itemsInBox = items.filter((it) => it.boxId === box.id);
                return (
                  <BoxCard
                    key={box.id}
                    box={box}
                    itemsInBox={itemsInBox}
                    rooms={rooms}
                    onOpenBox={(b) => setDetailBox(b)}
                    onEditBox={(b) => setBoxFormState({ isOpen: true, box: b })}
                    onDeleteBox={handleDeleteBox}
                    onPrintBoxLabel={(b) => {
                      setPrintTargetBox(b);
                      setPrintTargetItem(null);
                      setIsPrinterOpen(true);
                    }}
                    onAddItemToBox={(b) => {
                      setItemFormState({ isOpen: true, item: null, prefilledBoxId: b.id });
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: ROOMS & LOCATIONS */}
        {activeTab === 'rooms' && (
          <RoomsView
            rooms={rooms}
            boxes={boxes}
            items={items}
            onAddRoom={() => setRoomFormState({ isOpen: true, room: null })}
            onEditRoom={(r) => setRoomFormState({ isOpen: true, room: r })}
            onDeleteRoom={handleDeleteRoom}
            onFilterByRoom={(roomId) => {
              setFilters((prev) => ({ ...prev, roomId }));
              setActiveTab('items');
            }}
          />
        )}

        {/* Tab 4: OVERVIEW & ANALYTICS */}
        {activeTab === 'stats' && (
          <AnalyticsView
            items={items}
            boxes={boxes}
            rooms={rooms}
          />
        )}
      </main>

      {/* Floating Bottom Quick Action Bar on Mobile */}
      <div className="sm:hidden fixed bottom-4 right-4 left-4 z-30 flex items-center justify-center gap-2 pointer-events-none print:hidden">
        <div className="bg-slate-900 text-white p-1.5 rounded-2xl shadow-xl flex items-center gap-1 pointer-events-auto border border-slate-700">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-xs"
          >
            <Camera className="w-4 h-4" /> Scan
          </button>
          <button
            onClick={() => setItemFormState({ isOpen: true, item: null })}
            className="flex items-center gap-1.5 px-3 py-2 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
          <button
            onClick={() => {
              setPrintTargetItem(null);
              setPrintTargetBox(null);
              setIsPrinterOpen(true);
            }}
            className="p-2 text-slate-300 hover:text-white rounded-xl"
            title="Print Barcode Labels"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modals */}
      {/* 1. Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={items}
        boxes={boxes}
        rooms={rooms}
        onSelectItem={(item) => setDetailItem(item)}
        onSelectBox={(box) => setDetailBox(box)}
        onCreateItemWithCode={(code) => {
          setItemFormState({ isOpen: true, item: null, prefilledBarcode: code });
        }}
        onCreateBoxWithCode={(code) => {
          setBoxFormState({ isOpen: true, box: null, prefilledBarcode: code });
        }}
      />

      {/* 2. Barcode Print Modal */}
      <BarcodePrintModal
        isOpen={isPrinterOpen}
        onClose={() => setIsPrinterOpen(false)}
        items={items}
        boxes={boxes}
        rooms={rooms}
        initialSelectedItem={printTargetItem}
        initialSelectedBox={printTargetBox}
      />

      {/* 3. Item Detail Modal */}
      <ItemDetailModal
        item={detailItem}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        boxes={boxes}
        rooms={rooms}
        onEdit={(it) => setItemFormState({ isOpen: true, item: it })}
        onDelete={handleDeleteItem}
        onPrintBarcode={(it) => {
          setPrintTargetItem(it);
          setPrintTargetBox(null);
          setIsPrinterOpen(true);
        }}
        onUpdateItem={handleSaveItem}
      />

      {/* 4. Box Detail Modal */}
      <BoxDetailModal
        box={detailBox}
        isOpen={Boolean(detailBox)}
        onClose={() => setDetailBox(null)}
        items={items}
        rooms={rooms}
        onSelectItem={(it) => setDetailItem(it)}
        onAddItemToBox={(b) => {
          setItemFormState({ isOpen: true, item: null, prefilledBoxId: b.id });
        }}
        onEditBox={(b) => setBoxFormState({ isOpen: true, box: b })}
        onDeleteBox={handleDeleteBox}
        onPrintBoxLabel={(b) => {
          setPrintTargetBox(b);
          setPrintTargetItem(null);
          setIsPrinterOpen(true);
        }}
        onRemoveItemFromBox={handleRemoveItemFromBox}
      />

      {/* 5. Item Form Modal (Add / Edit) */}
      <ItemFormModal
        isOpen={itemFormState.isOpen}
        onClose={() => setItemFormState({ isOpen: false })}
        onSave={handleSaveItem}
        initialItem={itemFormState.item}
        boxes={boxes}
        rooms={rooms}
        prefilledBoxId={itemFormState.prefilledBoxId}
        prefilledBarcode={itemFormState.prefilledBarcode}
      />

      {/* 6. Box Form Modal (Add / Edit) */}
      <BoxFormModal
        isOpen={boxFormState.isOpen}
        onClose={() => setBoxFormState({ isOpen: false })}
        onSave={handleSaveBox}
        initialBox={boxFormState.box}
        rooms={rooms}
        prefilledBarcode={boxFormState.prefilledBarcode}
      />

      {/* 7. Room Form Modal (Add / Edit) */}
      <RoomFormModal
        isOpen={roomFormState.isOpen}
        onClose={() => setRoomFormState({ isOpen: false })}
        onSave={handleSaveRoom}
        initialRoom={roomFormState.room}
      />
    </div>
  );
}
