/**
 * Official React Bits Component: GlareHover (Animations -> GlareHover)
 * Source: https://reactbits.dev/animations/glare-hover
 * Upstream: https://github.com/DavidHDev/react-bits/blob/main/src/tailwind/Animations/GlareHover/GlareHover.jsx
 * Adaptation: Zero external dependencies, subtle specular hover sweep for Light & Dark enterprise cards,
 * GPU-only transform transition, and prefers-reduced-motion compliance.
 */
import React from 'react';

export const GlareHover = ({
  children,
  className = '',
  glareColor = 'rgba(255, 255, 255, 0.22)',
  glareAngle = -35,
  transitionDuration = 550,
  onClick,
  as: Component = 'div',
  ...rest
}) => {
  return (
    <Component
      onClick={onClick}
      className={`group/glare relative overflow-hidden ${className}`}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-[135%] group-hover/glare:translate-x-[135%] motion-reduce:hidden transition-transform ease-out"
        style={{
          transitionDuration: `${transitionDuration}ms`,
          background: `linear-gradient(${glareAngle}deg, transparent 25%, ${glareColor} 50%, transparent 75%)`,
        }}
      />
      {children}
    </Component>
  );
};

export default GlareHover;
