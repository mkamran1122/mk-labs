import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textMap = {
    sm: { title: 'text-sm font-semibold tracking-tight', sub: 'text-[10px]' },
    md: { title: 'text-base font-semibold tracking-tight', sub: 'text-xs' },
    lg: { title: 'text-lg font-bold tracking-tight', sub: 'text-xs' },
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Mark */}
      <div
        className={`relative ${sizeMap[size]} rounded-md overflow-hidden bg-slate-950 flex items-center justify-center p-0.5 border border-slate-800 shadow-xs shrink-0`}
      >
        <img
          src="/assets/aistudio/MK_Labs_703312e1.jpg"
          alt="MK Labs logo mark"
          className="w-full h-full object-contain filter contrast-125"
          loading="eager"
        />
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-tight">
        <span className={`text-slate-900 ${textMap[size].title}`}>
          MK Labs
        </span>
        {showSubtitle && (
          <span className={`text-slate-500 font-normal ${textMap[size].sub}`}>
            Technology Studio
          </span>
        )}
      </div>
    </div>
  );
};
