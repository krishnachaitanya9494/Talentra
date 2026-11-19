import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Reusable enterprise CustomSelect dropdown replacing boxy OS-native <select> menus.
 * Uses a React Portal (document.body) with fixed viewport positioning so open menus
 * never get overlapped by sibling cards, stacking contexts, or overflow containers.
 */
export const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  ariaLabel,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  icon: Icon,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? { value: opt.value, label: opt.label ?? String(opt.value), badge: opt.badge }
      : { value: opt, label: String(opt) }
  );

  const selected = normalizedOptions.find((o) => String(o.value) === String(value));

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const alignRight = menuClassName.includes('right-0');
    const estimatedHeight = Math.min(260, normalizedOptions.length * 42 + 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    setMenuStyle({
      position: 'fixed',
      top: openUpward ? 'auto' : `${rect.bottom + 6}px`,
      bottom: openUpward ? `${window.innerHeight - rect.top + 6}px` : 'auto',
      left: alignRight ? 'auto' : `${rect.left}px`,
      right: alignRight ? `${window.innerWidth - rect.right}px` : 'auto',
      minWidth: `${Math.max(rect.width, 160)}px`,
      zIndex: 9999,
    });
  }, [menuClassName, normalizedOptions.length]);

  useEffect(() => {
    if (!isOpen) return undefined;
    updatePosition();

    const handleClickOutside = (e) => {
      const clickedTrigger = containerRef.current && containerRef.current.contains(e.target);
      const clickedMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const sizePadding =
    size === 'sm' ? 'px-3 py-1.5 text-[14px]' : 'px-3.5 py-2 text-[15px]';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`w-full inline-flex items-center justify-between gap-2 rounded-xl border bg-white dark:bg-surface-darkCard text-navy-900 dark:text-slate-100 font-medium shadow-subtle transition-all duration-150 ${
          isOpen
            ? 'border-brand-500 ring-2 ring-brand-500/20 dark:border-brand-400'
            : 'border-slate-200/90 dark:border-surface-darkBorder hover:border-brand-300 dark:hover:border-brand-700'
        } ${sizePadding} ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            style={menuStyle}
            className={`max-w-xs max-h-64 overflow-y-auto rounded-2xl bg-white/95 dark:bg-surface-darkCard/95 backdrop-blur-md border border-slate-200/90 dark:border-surface-darkBorder shadow-dropdown p-1.5 animate-slideDown ${menuClassName}`}
          >
            {normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <li key={String(opt.value)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange && onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left text-[15px] transition-colors ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'text-navy-900 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-surface-darkHover'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
};

export default CustomSelect;
