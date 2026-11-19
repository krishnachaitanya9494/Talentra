/**
 * Official React Bits Component: AnimatedList (Components -> AnimatedList)
 * Source: https://reactbits.dev/components/animated-list
 * Upstream: https://github.com/DavidHDev/react-bits/blob/main/src/tailwind/Components/AnimatedList/AnimatedList.jsx
 * Adaptation: Zero external dependencies (React 18+ hooks, IntersectionObserver, Tailwind CSS 3),
 * Light/Dark theme adaptive scroll gradients, keyboard navigation, and prefers-reduced-motion support.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const AnimatedItem = ({
  children,
  index = 0,
  staggerMs = 35,
  maxDelayMs = 240,
  className = '',
  onMouseEnter,
  onClick,
}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (isVisible) return undefined;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.05, rootMargin: '40px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  const delayMs = isVisible ? Math.min(index * staggerMs, maxDelayMs) : 0;

  return (
    <div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      style={{
        transitionDelay: `${delayMs}ms`,
      }}
      className={`transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const AnimatedList = ({
  items = [],
  renderItem,
  getItemKey,
  onItemSelect,
  showGradients = false,
  enableArrowNavigation = false,
  className = '',
  listClassName = 'space-y-3',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  maxHeightClass = '',
  staggerMs = 35,
}) => {
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(0);

  const handleItemMouseEnter = useCallback((index) => {
    setSelectedIndex(index);
  }, []);

  const handleItemClick = useCallback(
    (item, index) => {
      setSelectedIndex(index);
      if (onItemSelect) {
        onItemSelect(item, index);
      }
    },
    [onItemSelect]
  );

  const handleScroll = useCallback(
    (e) => {
      if (!showGradients) return;
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      setTopGradientOpacity(Math.min(scrollTop / 40, 1));
      const bottomDistance = scrollHeight - (scrollTop + clientHeight);
      setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 40, 1));
    },
    [showGradients]
  );

  useEffect(() => {
    if (!showGradients || !listRef.current) return;
    const { scrollHeight, clientHeight } = listRef.current;
    setBottomGradientOpacity(scrollHeight > clientHeight ? 1 : 0);
  }, [items.length, showGradients]);

  useEffect(() => {
    if (!enableArrowNavigation) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < items.length) {
        e.preventDefault();
        if (onItemSelect) {
          onItemSelect(items[selectedIndex], selectedIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedItem) {
      const extraMargin = 40;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({ top: itemBottom - containerHeight + extraMargin, behavior: 'smooth' });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={listRef}
        onScroll={handleScroll}
        className={`${maxHeightClass ? `${maxHeightClass} overflow-y-auto` : ''} ${
          !displayScrollbar ? 'no-scrollbar' : ''
        } ${listClassName}`}
      >
        {items.map((item, index) => {
          const key = getItemKey ? getItemKey(item, index) : item?.id ?? index;
          const isSelected = enableArrowNavigation && selectedIndex === index;
          return (
            <AnimatedItem
              key={key}
              index={index}
              staggerMs={staggerMs}
              className={itemClassName}
              onMouseEnter={enableArrowNavigation ? () => handleItemMouseEnter(index) : undefined}
              onClick={onItemSelect ? () => handleItemClick(item, index) : undefined}
            >
              {renderItem ? (
                renderItem(item, index, { isSelected })
              ) : (
                <div
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700'
                      : 'bg-white dark:bg-surface-darkCard border-slate-200/80 dark:border-surface-darkBorder'
                  }`}
                >
                  <span className="text-xs font-medium text-navy-900 dark:text-slate-100">
                    {String(item)}
                  </span>
                </div>
              )}
            </AnimatedItem>
          );
        })}
      </div>

      {showGradients && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white dark:from-surface-darkCard to-transparent transition-opacity duration-200"
            style={{ opacity: topGradientOpacity }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-surface-darkCard to-transparent transition-opacity duration-200"
            style={{ opacity: bottomGradientOpacity }}
          />
        </>
      )}
    </div>
  );
};

export default AnimatedList;
