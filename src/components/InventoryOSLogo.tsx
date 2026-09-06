import React from 'react';

interface InventoryOSLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const InventoryOSIcon: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = ''
}) => {
  const containerSizes = {
    sm: 'w-8 h-8 rounded-[12px]',
    md: 'w-10 h-10 rounded-[15px]',
    lg: 'w-13 h-13 rounded-[18px]'
  };

  const iconSizes = {
    sm: 'w-4.5 h-4.5',
    md: 'w-5.5 h-5.5',
    lg: 'w-7 h-7'
  };

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm border border-zinc-800 dark:border-zinc-200 ${containerSizes[size]} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${iconSizes[size]} drop-shadow-xs`}
      >
        {/* Top rhombus face */}
        <path d="M12 2.8 L20.5 7.6 L12 12.4 L3.5 7.6 Z" />
        {/* Tape strips across top diamond */}
        <path d="M7.8 5.2 L16.3 10" />
        <path d="M9.8 4.1 L18.3 8.9" />
        {/* Left face */}
        <path d="M3.5 7.6 V16.4 L12 21.2 V12.4" />
        {/* Right face */}
        <path d="M20.5 7.6 V16.4 L12 21.2" />
      </svg>
    </div>
  );
};

export const InventoryOSLogo: React.FC<InventoryOSLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl'
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-[11px] sm:text-xs',
    lg: 'text-sm'
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <InventoryOSIcon size={size} />
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className={`font-bold tracking-tight leading-none text-zinc-900 dark:text-white ${titleSizes[size]}`}>
            Inventory<span className="text-zinc-400 dark:text-zinc-500">OS</span>
          </span>
        </div>
        {showSubtitle && (
          <span className={`text-zinc-500 dark:text-zinc-400 font-normal leading-tight mt-0.5 tracking-tight ${subtitleSizes[size]}`}>
            Home Inventory System
          </span>
        )}
      </div>
    </div>
  );
};
