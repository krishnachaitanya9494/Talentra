/**
 * Official React Bits Component: StarBorder (Animations -> StarBorder)
 * Source: https://reactbits.dev/animations/star-border
 * Upstream: https://github.com/DavidHDev/react-bits/blob/main/src/tailwind/Animations/StarBorder/StarBorder.jsx
 * Adaptation: Zero external dependencies, subtle enterprise Light/Dark theme support,
 * and automatic prefers-reduced-motion pause via CSS keyframes in index.css.
 */
import React from 'react';

export const StarBorder = ({
  as: Component = 'button',
  className = '',
  innerClassName = '',
  color = '#10B981',
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}) => {
  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-xl btn-interactive ${className}`}
      style={{
        padding: `${thickness}px`,
        ...(rest.style || {}),
      }}
      {...rest}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[260%] h-[45%] opacity-75 bottom-[-10px] right-[-200%] rounded-full z-0 animate-star-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 15%)`,
          animationDuration: speed,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[260%] h-[45%] opacity-75 top-[-10px] left-[-200%] rounded-full z-0 animate-star-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 15%)`,
          animationDuration: speed,
        }}
      />
      <div className={`relative z-[1] rounded-[11px] ${innerClassName}`}>
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
