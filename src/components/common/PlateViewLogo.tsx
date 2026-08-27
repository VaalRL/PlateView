import React from 'react';

interface PlateViewLogoProps {
  className?: string;
  size?: number;
}

export const PlateViewLogo: React.FC<PlateViewLogoProps> = ({
  className = 'w-8 h-8',
  size,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PlateView Logo"
    >
      {/* Home Plate Pentagonal Shield Container */}
      <path
        d="M6 4H26C27.1 4 28 4.9 28 6V16C28 16.6 27.7 17.1 27.3 17.5L16.8 27.6C16.4 28 15.6 28 15.2 27.6L4.7 17.5C4.3 17.1 4 16.6 4 16V6C4 4.9 4.9 4 6 4Z"
        fill="currentColor"
        className="text-team-primary transition-colors"
      />
      {/* 4 Analytics Bars inside Home Plate (Option E) */}
      <rect x="7.5" y="12" width="2.8" height="6.5" rx="1.4" fill="#ffffff" fillOpacity="0.85" />
      <rect x="12" y="8" width="2.8" height="12.5" rx="1.4" fill="#ffffff" fillOpacity="0.95" />
      <rect x="16.5" y="6" width="2.8" height="16.5" rx="1.4" fill="#ffffff" />
      <rect x="21" y="10.5" width="2.8" height="9" rx="1.4" fill="#ffffff" fillOpacity="0.9" />
    </svg>
  );
};
