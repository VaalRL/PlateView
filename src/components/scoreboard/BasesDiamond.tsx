import React from 'react';

interface BasesDiamondProps {
  hasFirst?: boolean;
  hasSecond?: boolean;
  hasThird?: boolean;
  className?: string;
}

export const BasesDiamond: React.FC<BasesDiamondProps> = ({
  hasFirst = false,
  hasSecond = false,
  hasThird = false,
  className = '',
}) => {
  return (
    <div className={`relative w-7 h-7 flex items-center justify-center ${className}`}>
      {/* 2nd Base (Top) */}
      <div
        data-base="2nd"
        data-active={hasSecond ? 'true' : 'false'}
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border transition-all ${
          hasSecond
            ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.8)] scale-110'
            : 'bg-page/70 border-border/80'
        }`}
      />

      {/* 3rd Base (Left) */}
      <div
        data-base="3rd"
        data-active={hasThird ? 'true' : 'false'}
        className={`absolute top-1/2 left-0 -translate-y-1/2 w-2.5 h-2.5 rotate-45 border transition-all ${
          hasThird
            ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.8)] scale-110'
            : 'bg-page/70 border-border/80'
        }`}
      />

      {/* 1st Base (Right) */}
      <div
        data-base="1st"
        data-active={hasFirst ? 'true' : 'false'}
        className={`absolute top-1/2 right-0 -translate-y-1/2 w-2.5 h-2.5 rotate-45 border transition-all ${
          hasFirst
            ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.8)] scale-110'
            : 'bg-page/70 border-border/80'
        }`}
      />

      {/* Home Plate (Bottom indicator) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-muted/40 rotate-45" />
    </div>
  );
};
