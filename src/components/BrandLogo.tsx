import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textMap = {
    sm: { title: 'text-sm', sub: 'text-[9px]' },
    md: { title: 'text-base', sub: 'text-[10px]' },
    lg: { title: 'text-xl', sub: 'text-xs' },
    xl: { title: 'text-2xl', sub: 'text-xs' },
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon with Official Mark */}
      <div
        className={`relative ${sizeMap[size]} rounded-lg overflow-hidden border border-[#1E2638] bg-[#07090D] flex items-center justify-center p-1 group shadow-[0_0_15px_rgba(77,141,255,0.15)] hover:border-[#4D8DFF]/60 transition-colors`}
      >
        <img
          src="/assets/aistudio/MK_Labs_703312e1.jpg"
          alt="MK Labs geometric monogram emblem"
          className="w-full h-full object-contain filter contrast-125"
          loading="eager"
        />
        <div className="absolute inset-0 bg-[#4D8DFF]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-bold tracking-tight text-[#F5F7FA] ${textMap[size].title}`}>
              MK LABS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4D8DFF] inline-block" />
          </div>
          <span
            className={`font-mono text-[#9AA6B5] tracking-wider uppercase mt-1 ${textMap[size].sub}`}
          >
            Internet Projects Studio
          </span>
        </div>
      )}
    </div>
  );
};
