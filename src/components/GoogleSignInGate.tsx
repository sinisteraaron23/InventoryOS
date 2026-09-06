import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Cloud, 
  Lock, 
  Sparkles, 
  Sun, 
  Moon, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { InventoryOSLogo } from './InventoryOSLogo';

interface GoogleSignInGateProps {
  onSignIn: () => Promise<void>;
  onNavigateHome: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const GoogleSignInGate: React.FC<GoogleSignInGateProps> = ({
  onSignIn,
  onNavigateHome,
  darkMode,
  onToggleDarkMode,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignInClick = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      await onSignIn();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setErrorMessage(
        err?.message || 'Sign in with Google could not be completed. Please ensure popups are allowed and try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      
      {/* Top Bar */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <InventoryOSLogo size="sm" showSubtitle={false} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 transition-colors cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Auth Card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl relative overflow-hidden">
          
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-5 text-zinc-900 dark:text-zinc-100 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Private Account Access
            </div>

            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Sign In to InventoryOS
            </h1>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              To protect your household items and sync your inventory in real-time across your devices, please sign in with your Google Account.
            </p>
          </div>

          {/* Error notice if present */}
          {errorMessage && (
            <div className="mt-5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="mt-7">
            <button
              onClick={handleGoogleSignInClick}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 shadow-sm font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              {/* Official Google G Logo SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Highlights */}
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Private Google Firestore storage instance</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Real-time sync between Mac, Windows & Android</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Never loses data even when clearing cache</span>
            </div>
          </div>

          {/* Bottom Back Button */}
          <div className="mt-6 pt-4 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              ← Return to Homepage & Feature Overview
            </button>
          </div>

        </div>
      </main>

      <footer className="py-4 border-t border-zinc-200/60 dark:border-zinc-800/60 text-center text-[11px] text-zinc-400">
        InventoryOS • Authenticated Cloud Workspace
      </footer>

    </div>
  );
};
