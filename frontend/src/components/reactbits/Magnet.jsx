/**
 * Official React Bits Component: Magnet (Animations -> Magnet)
 * Source: https://reactbits.dev/animations/magnet
 * Upstream: https://github.com/DavidHDev/react-bits/blob/main/src/tailwind/Animations/Magnet/Magnet.jsx
 * Adaptation: Zero external dependencies, subtle tactile pull for primary CTAs,
 * with automatic prefers-reduced-motion bypass and clean mouse listener cleanup.
 */
import React, { useState, useEffect, useRef } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const Magnet = ({
  children,
  padding = 40,
  disabled = false,
  magnetStrength = 4,
  activeTransition = 'transform 0.2s ease-out',
  inactiveTransition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
  wrapperClassName = '',
  innerClassName = '',
}) => {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const magnetRef = useRef(null);

  useEffect(() => {
    if (disabled || prefersReducedMotion()) {
      setPosition({ x: 0, y: 0 });
      return undefined;
    }

    const handleMouseMove = (e) => {
      const el = magnetRef.current;
      if (!el) return;
      const { left, top, width, height } = el.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true);
        setPosition({
          x: (e.clientX - centerX) / magnetStrength,
          y: (e.clientY - centerY) / magnetStrength,
        });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [padding, disabled, magnetStrength]);

  return (
    <div ref={magnetRef} className={`relative inline-block ${wrapperClassName}`}>
      <div
        className={innerClassName}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: isActive ? activeTransition : inactiveTransition,
          willChange: isActive ? 'transform' : 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;
