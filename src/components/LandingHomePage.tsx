import React from 'react';
import { 
  Box, 
  Package, 
  Home, 
  Camera, 
  Printer, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Cloud, 
  Smartphone, 
  Laptop, 
  Monitor, 
  CheckCircle2, 
  QrCode, 
  Search, 
  BarChart3, 
  Layers, 
  FolderCheck,
  Sun,
  Moon,
  LogIn
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { InventoryOSLogo } from './InventoryOSLogo';

interface LandingHomePageProps {
  currentUser: User | null;
  onNavigateToApp: () => void;
  onSignInWithGoogle: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LandingHomePage: React.FC<LandingHomePageProps> = ({
  currentUser,
  onNavigateToApp,
  onSignInWithGoogle,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center cursor-pointer text-left"
            >
              <InventoryOSLogo size="md" showSubtitle={true} />
            </button>
            
            <nav className="hidden md:flex items-center gap-1">
              <a 
                href="#uses" 
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Use Cases
              </a>
              <a 
                href="#features" 
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Capabilities
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 transition-colors cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            {currentUser ? (
              <button
                onClick={onNavigateToApp}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Launch InventoryOS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onNavigateToApp}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Launch App</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-zinc-200 dark:border-zinc-800 bg-linear-to-b from-white via-zinc-50 to-zinc-100/60 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-[1.12]">
              Never lose track of what's inside a box again.
            </h1>

            {/* Subhead */}
            <p className="mt-5 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              InventoryOS organizes your physical world. Map rooms, catalog storage boxes, generate scannable barcode placards & packing slips, and retrieve any item instantly with camera or laser scanning.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onNavigateToApp}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-2xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Launch InventoryOS</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Explore Capabilities</span>
              </a>
            </div>

            {/* Device Support Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5" /> Desktop & Laptop</span>
              <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Mobile Responsive</span>
              <span className="flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5" /> Google Cloud Sync</span>
              <span className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" /> Instant Barcodes</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: Application Uses & Practical Scenarios */}
      <section id="uses" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
            Engineered For Real Life
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
            Practical uses of InventoryOS
          </h3>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            From cross-country family moves to organizing high-density workshop hardware, InventoryOS solves physical clutter with digital precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Use Case 1: Moving */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <Home className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">1. Moving & Home Relocations</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Pack room-by-room, label every cardboard box with a scannable barcode placard, and print comprehensive room packing slips for movers. Check off delivered boxes at your new house without opening them.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Room manifests & delivery sign-offs</span>
            </div>
          </div>

          {/* Use Case 2: Garage & Workshop */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <Box className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">2. Garage, Workshop & Tool Caddies</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Stop tearing through 15 drawers for an M4 hex wrench, drill bit set, or soldering flux. Tag bin organizers with barcodes, plug in a USB laser gun, and retrieve items in two keystrokes.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Sub-location shelf & drawer mapping</span>
            </div>
          </div>

          {/* Use Case 3: Home Insurance & Warranties */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">3. Insurance & Asset Protection</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Record serial numbers, purchase prices, dates, photos, and warranty notes for high-value cameras, electronics, laptops, and appliances. Keep a secure cloud record for insurance claims.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Total replacement valuation analytics</span>
            </div>
          </div>

          {/* Use Case 4: Smart Home & Electronics */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">4. Smart Home, IoT & Cables</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Track smart home protocol tags (Matter, Zigbee, Z-Wave, Thread, Wi-Fi) across sensors, smart plugs, dongles, and adapters. Search for a protocol when planning your smart home automation mesh.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Protocol badges & smart image tags</span>
            </div>
          </div>

          {/* Use Case 5: Seasonal & Attic Storage */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <FolderCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">5. Attic & Basement Storage Tubs</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Tired of unstacking 6 heavy plastic tubs to find holiday lights, winter ski jackets, or camping cookware? Scan the outside barcode with your phone camera to see the full contents on-screen.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Zero-ladder visual contents inspection</span>
            </div>
          </div>

          {/* Use Case 6: Small Business & Maker Inventory */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">6. Maker Studio & Micro-Business</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Keep tabs on component parts, 3D printing filaments, PCB blanks, packaging supplies, and finished products with batch barcode printing, quantity tracking, and instant search.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Multi-quantity batch stock counts</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: Feature Capabilities Bento */}
      <section id="features" className="py-16 md:py-24 bg-zinc-100/70 dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              Architecture & Features
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              Built for speed, accuracy, and physical labeling
            </h3>
            <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              A cohesive hardware-and-software workflow bridging physical barcode stickers with Google Cloud data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Barcode Placards */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <Printer className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Industrial Barcode & QR Placards</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Generate high-density Code128 barcodes and QR codes. Print single placards, 4x6" thermal labels, Avery 30-up sheets, or jewelry barbell tags with one click.
              </p>
            </div>

            {/* Feature 2: Dual Scanning */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <Camera className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Dual Camera & USB Laser Scanning</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Scan with your phone or laptop camera stream, or plug in any standard handheld USB or Bluetooth laser barcode gun for instant keyboard-intercept scanning.
              </p>
            </div>

            {/* Feature 3: Spatial Room Mapping */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Spatial Rooms & Storage Hierarchy</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Organize by House &gt; Floor &gt; Room &gt; Storage Box &gt; Sub-location. Differentiate between boxed items and loose unboxed furniture or tools.
              </p>
            </div>

            {/* Feature 4: Cloud Sync & Auth */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <Cloud className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Google Cloud Firestore Sync</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                End-to-end cloud synchronization via Firebase Firestore. Changes made on your Android phone update your desktop Mac or Windows app in real time.
              </p>
            </div>

            {/* Feature 5: Smart Search & Image Matching */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Visual Product Search</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Instantly fetch product photos, model specs, and brand tags with integrated Google Image Search, keeping your item cards clean and visually identifiable.
              </p>
            </div>

            {/* Feature 6: Valuation & Stats */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Valuation Analytics & Asset Ledger</h4>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                View total inventory worth, average box value, category breakdowns, and boxed vs. loose asset ratios with responsive graphical summaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section: Get Started Call to Action */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-950 text-white rounded-3xl p-8 sm:p-12 border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to organize your spaces and items?
            </h3>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              Launch InventoryOS directly in your web browser with Google Account cloud sync, spatial room mapping, and instant barcode generation.
            </p>
          </div>

          <button
            onClick={onNavigateToApp}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm shadow-md transition-colors cursor-pointer shrink-0"
          >
            <span>Launch InventoryOS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 py-10 bg-white dark:bg-zinc-950 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <InventoryOSLogo size="sm" showSubtitle={false} />
            <span>© {new Date().getFullYear()} InventoryOS. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
              Back to Top
            </button>
            <button onClick={onNavigateToApp} className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer font-semibold text-zinc-900 dark:text-white">
              Launch App
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
