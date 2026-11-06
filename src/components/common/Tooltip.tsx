import React from 'react';

export type TooltipPosition = 'bottom' | 'top' | 'right' | 'left';

interface TooltipProps {
  title: string;
  description?: string;
  shortcut?: string | string[];
  position?: TooltipPosition;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Universal Tailwind-styled Tooltip with Radix-UI-inspired styling,
 * keyboard shortcut kbd badges, pointer arrow, and hover/focus transitions.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  title,
  description,
  shortcut,
  position = 'bottom',
  children,
  className = '',
  disabled = false,
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  // Positioning & arrow orientation
  let positionClasses = '';
  let arrowClasses = '';

  switch (position) {
    case 'bottom':
      positionClasses = 'top-full left-1/2 -translate-x-1/2 mt-2';
      arrowClasses = '-top-1 left-1/2 -translate-x-1/2 border-t border-l border-slate-700/90 bg-slate-900';
      break;
    case 'top':
      positionClasses = 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      arrowClasses = '-bottom-1 left-1/2 -translate-x-1/2 border-b border-r border-slate-700/90 bg-slate-900';
      break;
    case 'right':
      positionClasses = 'left-full top-1/2 -translate-y-1/2 ml-2';
      arrowClasses = '-left-1 top-1/2 -translate-y-1/2 border-b border-l border-slate-700/90 bg-slate-900';
      break;
    case 'left':
      positionClasses = 'right-full top-1/2 -translate-y-1/2 mr-2';
      arrowClasses = '-right-1 top-1/2 -translate-y-1/2 border-t border-r border-slate-700/90 bg-slate-900';
      break;
  }

  const shortcuts = Array.isArray(shortcut) ? shortcut : shortcut ? [shortcut] : [];

  return (
    <div className={`relative group inline-flex ${className}`}>
      {children}

      <div
        role="tooltip"
        className={`absolute ${positionClasses} pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-visible:opacity-100 transition-all duration-150 delay-75 ease-out z-50 flex flex-col items-center min-w-[120px] max-w-xs`}
      >
        {/* Pointer Arrow */}
        <div className={`absolute w-2 h-2 rotate-45 ${arrowClasses} z-10 pointer-events-none`} />

        {/* Content Box */}
        <div className="relative bg-slate-900/95 backdrop-blur-md text-slate-100 border border-slate-700/90 rounded-lg px-2.5 py-1.5 shadow-2xl text-xs space-y-1">
          <div className="flex items-center justify-between space-x-2">
            <span className="font-semibold text-white tracking-wide text-[11px] whitespace-nowrap">
              {title}
            </span>
            {shortcuts.length > 0 && (
              <div className="flex items-center space-x-1 shrink-0">
                {shortcuts.map((sc, i) => (
                  <kbd
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600/80 font-mono text-[9px] text-amber-300 font-semibold shadow-inner"
                  >
                    {sc}
                  </kbd>
                ))}
              </div>
            )}
          </div>
          {description && (
            <p className="text-[10px] text-slate-300/90 font-normal leading-relaxed whitespace-normal text-left max-w-[210px]">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
