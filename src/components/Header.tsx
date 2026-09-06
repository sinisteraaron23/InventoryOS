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
  onNavigateHome?: () => void;
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
  onClearUserData,
  onNavigateHome,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors print:hidden">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink min-w-0">
            {onNavigateHome ? (
              <button 
                onClick={onNavigateHome}
                className="flex items-center shrink min-w-0 hover:opacity-85 transition-opacity cursor-pointer text-left"
                title="Return to Homepage & Feature Overview"
              >
                <InventoryOSLogo size="sm" showSubtitle={false} className="sm:hidden" />
                <InventoryOSLogo size="md" showSubtitle={true} className="hidden sm:flex" />
              </button>
            ) : (
              <div className="flex items-center shrink min-w-0">
                <InventoryOSLogo size="sm" showSubtitle={false} className="sm:hidden" />
                <InventoryOSLogo size="md" showSubtitle={true} className="hidden sm:flex" />
              </div>
            )}
          </div>

          {/* Actions: Scan, Print, Dark Mode, and Auth Account */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-colors shrink-0"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {/* Quick Primary Actions: Scan & Print */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs transition-colors shrink-0"
              title="Scan Barcode"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Scan</span>
            </button>

            <button
              onClick={onOpenPrinter}
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-medium bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-colors shrink-0"
              title="Print Barcode Labels"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* User Profile / Auth Toggle */}
            {currentUser ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1.5 bg-white dark:bg-zinc-850 p-1 sm:p-1.5 sm:pr-2.5 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-800 dark:text-zinc-200 font-bold text-xs">
                      {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : (currentUser.email?.[0]?.toUpperCase() || 'U')}
                    </div>
                  )}
                  <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[90px] truncate hidden md:block">
                    {currentUser.displayName || 'User'}
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 z-50">
                    <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {currentUser.displayName || 'Google Account'}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{currentUser.email}</p>
                    </div>

                    <div className="pt-1 flex flex-col gap-0.5">
                      {onNavigateHome && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onNavigateHome();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors font-medium text-left"
                        >
                          <Home className="w-3.5 h-3.5 shrink-0 text-zinc-500" /> Homepage & Feature Overview
                        </button>
                      )}

                      <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

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
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  onClick={onClearUserData}
                  className="hidden sm:flex p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                  title="Clear all stored local data"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onSignIn}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs transition-colors shrink-0"
                  title="Sign in with Google"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Row */}
        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2 pb-2">
          <nav className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-850/90 p-1 rounded-2xl overflow-x-auto scrollbar-none border border-zinc-200/60 dark:border-zinc-750">
            <button
              onClick={() => onTabChange('items')}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'items'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventory Items</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'items'
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-950'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}>
                {itemsCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('boxes')}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'boxes'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Storage Boxes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'boxes'
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-950'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}>
                {boxesCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('rooms')}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'rooms'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Rooms & Locations</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'rooms'
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-950'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}>
                {roomsCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('stats')}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'stats'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800'
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
              <span className="hidden md:inline">Add Item</span>
            </button>
            <button
              onClick={onOpenNewBox}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
              <span className="hidden md:inline">New Box</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
