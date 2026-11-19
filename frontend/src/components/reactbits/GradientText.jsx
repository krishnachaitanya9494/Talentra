/**
 * Official React Bits Component: GradientText (Text Animations -> GradientText)
 * Source: https://reactbits.dev/text-animations/gradient-text
 * Upstream: https://github.com/DavidHDev/react-bits/blob/main/src/tailwind/TextAnimations/GradientText/GradientText.jsx
 * Adaptation: Zero external dependencies, smooth CSS gradient sweep via index.css keyframes,
 * Light/Dark theme adaptive colors, and prefers-reduced-motion compliance.
 */
import React from 'react';

export const GradientText = ({
  children,
  className = '',
  colors = ['#059669', '#0ea5e9', '#10b981', '#059669'],
  animationSpeed = 7,
  showBorder = false,
}) => {
  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundSize: '250% 100%',
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      {showBorder && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full p-[1px] animate-gradient-sweep pointer-events-none"
          style={gradientStyle}
        >
          <span className="block w-full h-full rounded-full bg-white dark:bg-surface-darkCard" />
        </span>
      )}
      <span
        className="relative z-[1] inline-block bg-clip-text text-transparent animate-gradient-sweep"
        style={gradientStyle}
      >
        {children}
      </span>
    </span>
  );
};

export default GradientText;
