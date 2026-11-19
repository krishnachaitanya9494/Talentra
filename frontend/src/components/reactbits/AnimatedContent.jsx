/**
 * Official React Bits Component: AnimatedContent (Animations -> AnimatedContent)
 * Source: https://reactbits.dev/animations/animated-content
 * Upstream: https://github.com/DavidHDev/react-bits/blob/main/src/tailwind/Animations/AnimatedContent/AnimatedContent.jsx
 * Adaptation: Zero external dependencies (React 18+ hooks, IntersectionObserver, Tailwind CSS 3),
 * Light/Dark theme neutral, GPU-friendly transform/opacity, and prefers-reduced-motion support.
 */
import React, { useRef, useEffect, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const AnimatedContent = ({
  children,
  distance = 14,
  direction = 'bottom',
  reverse = false,
  duration = 0.36,
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.08,
  delay = 0,
  onComplete,
  className = '',
}) => {
  const ref = useRef(null);
  const reduced = prefersReducedMotion();
  const [visible, setVisible] = useState(reduced);

  useEffect(() => {
    if (reduced || visible) return undefined;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin: '30px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, visible, threshold]);

  useEffect(() => {
    if (!visible || !onComplete) return undefined;
    const totalMs = reduced ? 0 : delay + duration * 1000;
    const timer = window.setTimeout(onComplete, totalMs);
    return () => window.clearTimeout(timer);
  }, [visible, reduced, delay, duration, onComplete]);

  const sign = reverse ? -1 : 1;
  let initialTransform = `scale(${scale})`;
  if (direction === 'top' || direction === 'vertical') {
    initialTransform = `translate3d(0, ${-distance * sign}px, 0) scale(${scale})`;
  } else if (direction === 'bottom') {
    initialTransform = `translate3d(0, ${distance * sign}px, 0) scale(${scale})`;
  } else if (direction === 'left' || direction === 'horizontal') {
    initialTransform = `translate3d(${-distance * sign}px, 0, 0) scale(${scale})`;
  } else if (direction === 'right') {
    initialTransform = `translate3d(${distance * sign}px, 0, 0) scale(${scale})`;
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible || !animateOpacity ? 1 : initialOpacity,
        transform: visible || reduced ? 'translate3d(0, 0, 0) scale(1)' : initialTransform,
        transitionProperty: reduced ? 'none' : 'opacity, transform',
        transitionDuration: reduced ? '0ms' : `${duration}s`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: reduced || !visible ? '0ms' : `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedContent;
