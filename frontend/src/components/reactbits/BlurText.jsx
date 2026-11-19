/**
 * Official React Bits Component: BlurText (Text Animations -> BlurText)
 * Source: https://reactbits.dev/text-animations/blur-text
 * Upstream: https://github.com/DavidHDev/react-bits/blob/main/src/tailwind/TextAnimations/BlurText/BlurText.jsx
 * Adaptation: Zero external dependencies (React 18+ hooks, IntersectionObserver, Tailwind CSS 3 transitions),
 * Light/Dark theme text inheritance, and automatic prefers-reduced-motion compliance.
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const BlurText = ({
  text = '',
  delay = 65,
  className = '',
  as: Component = 'span',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  stepDuration = 0.28,
  onAnimationComplete,
}) => {
  const elements = useMemo(
    () => (animateBy === 'words' ? text.split(' ') : text.split('')),
    [text, animateBy]
  );

  const reduced = prefersReducedMotion();
  const [inView, setInView] = useState(reduced);
  const ref = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (reduced || inView) return undefined;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, inView, threshold, rootMargin]);

  useEffect(() => {
    if (!inView || completedRef.current || !onAnimationComplete) return undefined;
    const totalMs = reduced
      ? 0
      : Math.max(0, (elements.length - 1) * delay + stepDuration * 1000);
    const timer = window.setTimeout(() => {
      completedRef.current = true;
      onAnimationComplete();
    }, totalMs);
    return () => window.clearTimeout(timer);
  }, [inView, elements.length, delay, stepDuration, reduced, onAnimationComplete]);

  const hiddenTransform = direction === 'top' ? 'translateY(-6px)' : 'translateY(6px)';

  return (
    <Component ref={ref} className={`inline-flex flex-wrap items-baseline ${className}`}>
      {elements.map((segment, index) => {
        const displaySegment = segment === ' ' ? '\u00A0' : segment;
        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              willChange: inView ? 'auto' : 'transform, filter, opacity',
              transitionProperty: reduced ? 'none' : 'opacity, transform, filter',
              transitionDuration: reduced ? '0ms' : `${stepDuration}s`,
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              transitionDelay: reduced || !inView ? '0ms' : `${index * delay}ms`,
              opacity: inView ? 1 : 0,
              filter: inView || reduced ? 'blur(0px)' : 'blur(6px)',
              transform: inView || reduced ? 'translateY(0px)' : hiddenTransform,
            }}
          >
            {displaySegment}
            {animateBy === 'words' && index < elements.length - 1 ? '\u00A0' : ''}
          </span>
        );
      })}
    </Component>
  );
};

export default BlurText;
