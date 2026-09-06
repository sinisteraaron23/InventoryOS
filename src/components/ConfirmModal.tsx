import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  subMessage,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isDestructive 
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60' 
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60'
            }`}>
              {isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
                {message}
              </p>

              {subMessage && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5 italic">
                  {subMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 rounded-xl transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-black/20'
            }`}
          >
            {isDestructive && <Trash2 className="w-3.5 h-3.5" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
