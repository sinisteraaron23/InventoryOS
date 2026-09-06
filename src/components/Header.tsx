import React, { useState } from 'react';
import { 
  Package, 
  Box, 
  Home, 
  Camera, 
  Printer, 
  Plus, 
  LogIn, 
  LogOut, 
  Cloud, 
  BarChart3, 
  ChevronDown,
  Sun,
  Moon,
  Trash2,
  User as UserIcon
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { InventoryOSLogo } from './InventoryOSLogo';

interface HeaderProps {
  activeTab: 'items' | 'boxes' | 'rooms' | 'stats';
  onTabChange: (tab: 'items' | 'boxes' | 'rooms' | 'stats') => void;
  currentUser: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenScanner: () => void;
  onOpenPrinter: () => void;
  onOpenNewItem: () => void;
  onOpenNewBox: () => void;
  itemsCount: number;
  boxesCount: number;
  roomsCount: number;
  isSyncing: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onClearUserData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onSignIn,
  onSignOut,
  onOpenScanner,
  onOpenPrinter,
  onOpenNewItem,
  onOpenNewBox,
  itemsCount,
  boxesCount,
  roomsCount,
  isSyncing,
  darkMode,
  onToggleDarkMode,
  onClearUserData
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors print:hidden">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center shrink-0">
            <InventoryOSLogo size="md" />
          </div>

          {/* Actions: Scan, Print, Dark Mode, and Auth Account */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Quick Primary Actions: Scan & Print */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/25 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>

            <button
              onClick={onOpenPrinter}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
              title="Print Barcode Labels"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Labels</span>
            </button>

            {/* User Profile / Auth Toggle */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 pr-2.5 border border-slate-200 dark:border-slate-700 rounded-full shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/60 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                      {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : (currentUser.email?.[0]?.toUpperCase() || 'U')}
                    </div>
                  )}
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate hidden sm:block">
                    {currentUser.displayName || 'User'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {currentUser.displayName || 'Google Account'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                    </div>

                    <div className="pt-1 flex flex-col gap-0.5">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onClearUserData();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors font-medium text-left"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" /> Clear All Account & Test Data
                      </button>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors font-medium text-left"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onClearUserData}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Clear all stored local data"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onSignIn}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/25 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Google Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Row */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 pb-2">
          <nav className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl overflow-x-auto scrollbar-none border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => onTabChange('items')}
              className={`flex items-center gap-2 py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'items'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventory Items</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'items' ? 'bg-indigo-700/80 text-white' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {itemsCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('boxes')}
              className={`flex items-center gap-2 py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'boxes'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Storage Boxes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'boxes' ? 'bg-indigo-700/80 text-white' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {boxesCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('rooms')}
              className={`flex items-center gap-2 py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'rooms'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Rooms & Locations</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'rooms' ? 'bg-indigo-700/80 text-white' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {roomsCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('stats')}
              className={`flex items-center gap-2 py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Overview & Analytics</span>
            </button>
          </nav>

          {/* Quick Creation CTA for active view */}
          <div className="flex items-center gap-2 pl-2">
            <button
              onClick={onOpenNewItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Add Item</span>
            </button>
            <button
              onClick={onOpenNewBox}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">New Box</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
