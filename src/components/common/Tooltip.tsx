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

  // Positioning classes
  let positionClasses = '';
  let arrowClasses = '';

  switch (position) {
    case 'bottom':
      positionClasses = 'top-full left-1/2 -translate-x-1/2 mt-2';
      arrowClasses = '-top-1 left-1/2 -translate-x-1/2 border-t-0 border-r-transparent border-b-slate-700 border-l-transparent';
      break;
    case 'top':
      positionClasses = 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      arrowClasses = '-bottom-1 left-1/2 -translate-x-1/2 border-b-0 border-r-transparent border-t-slate-700 border-l-transparent';
      break;
    case 'right':
      positionClasses = 'left-full top-1/2 -translate-y-1/2 ml-2';
      arrowClasses = '-left-1 top-1/2 -translate-y-1/2 border-l-0 border-t-transparent border-r-slate-700 border-b-transparent';
      break;
    case 'left':
      positionClasses = 'right-full top-1/2 -translate-y-1/2 mr-2';
      arrowClasses = '-right-1 top-1/2 -translate-y-1/2 border-r-0 border-t-transparent border-l-slate-700 border-b-transparent';
      break;
  }

  const shortcuts = Array.isArray(shortcut) ? shortcut : shortcut ? [shortcut] : [];

  return (
    <div className={`relative group inline-flex ${className}`}>
      {children}

      <div
        role="tooltip"
        className={`absolute ${positionClasses} pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 transition-all duration-150 ease-out z-50 flex flex-col items-center min-w-[120px] max-w-xs`}
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-slate-100 border border-slate-700/90 rounded-lg px-2.5 py-1.5 shadow-2xl text-xs space-y-1">
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
            <p className="text-[10px] text-slate-300/90 font-normal leading-relaxed whitespace-normal text-left max-w-[200px]">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
