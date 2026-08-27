import React from 'react';

interface CountDisplayProps {
  balls?: number;
  strikes?: number;
  outs?: number;
  className?: string;
}

export const CountDisplay: React.FC<CountDisplayProps> = ({
  balls = 0,
  strikes = 0,
  outs = 0,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 font-mono text-xs ${className}`}>
      {/* Count text */}
      <span className="font-bold text-main">
        {balls}-{strikes}
      </span>

      {/* Out indicator dots */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted font-sans mr-0.5">O:</span>
        <div
          data-out-active={outs >= 1 ? 'true' : 'false'}
          className={`w-2 h-2 rounded-full transition-all ${
            outs >= 1
              ? 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)]'
              : 'bg-page border border-border/80'
          }`}
        />
        <div
          data-out-active={outs >= 2 ? 'true' : 'false'}
          className={`w-2 h-2 rounded-full transition-all ${
            outs >= 2
              ? 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)]'
              : 'bg-page border border-border/80'
          }`}
        />
      </div>
    </div>
  );
};
