import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  Briefcase,
  Layers,
  Headphones,
  Code2,
  KeyRound,
} from 'lucide-react';
import {
  StoreProductRecord,
  getEffectiveProductPrice,
  formatProductPrice,
} from '../../types/store';

export { getEffectiveProductPrice, formatProductPrice };

interface PlaceholderTheme {
  bgClass: string;
  iconBgClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function getPlaceholderTheme(categoryId?: string): PlaceholderTheme {
  switch (categoryId) {
    case 'educational-knowledge-products':
      return {
        bgClass: 'from-slate-50 via-indigo-50/70 to-blue-50/70',
        iconBgClass: 'text-indigo-600 border-indigo-200/80',
        Icon: BookOpen,
      };
    case 'productivity-templates-business-systems':
      return {
        bgClass: 'from-slate-50 via-emerald-50/60 to-teal-50/60',
        iconBgClass: 'text-emerald-600 border-emerald-200/80',
        Icon: Briefcase,
      };
    case 'graphic-design-visual-creative-assets':
      return {
        bgClass: 'from-slate-50 via-violet-50/65 to-purple-50/60',
        iconBgClass: 'text-violet-600 border-violet-200/80',
        Icon: Layers,
      };
    case 'audio-music-entertainment-media':
      return {
        bgClass: 'from-slate-50 via-amber-50/60 to-orange-50/50',
        iconBgClass: 'text-amber-600 border-amber-200/80',
        Icon: Headphones,
      };
    case 'software-web-code-products':
      return {
        bgClass: 'from-slate-50 via-sky-50/70 to-blue-50/70',
        iconBgClass: 'text-sky-600 border-sky-200/80',
        Icon: Code2,
      };
    case 'memberships-communities-digital-access':
      return {
        bgClass: 'from-slate-50 via-rose-50/55 to-slate-100/80',
        iconBgClass: 'text-rose-600 border-rose-200/80',
        Icon: KeyRound,
      };
    default:
      return {
        bgClass: 'from-slate-50 via-blue-50/60 to-slate-100/80',
        iconBgClass: 'text-blue-600 border-slate-200/90',
        Icon: FileText,
      };
  }
}

export const StoreProductPreview: React.FC<{
  product: StoreProductRecord;
  categoryId?: string;
  compact?: boolean;
}> = ({ product, categoryId, compact = false }) => {
  const imageUrl = (product.coverImageUrl || '').trim();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  const imgError = Boolean(imageUrl) && failedUrl === imageUrl;
  const imgLoaded = Boolean(imageUrl) && loadedUrl === imageUrl;
  const aspectClass = compact ? 'aspect-[16/10]' : 'aspect-[4/3]';

  if (imageUrl && !imgError) {
    return (
      <div
        className={`w-full ${aspectClass} bg-slate-100 overflow-hidden relative`}
      >
        {!imgLoaded && (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-slate-100 animate-pulse"
          />
        )}
        <img
          key={imageUrl}
          src={imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          loading={compact ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={() => setLoadedUrl(imageUrl)}
          onError={() => setFailedUrl(imageUrl)}
          className={`w-full h-full object-cover transition-all duration-300 ease-out group-hover:scale-[1.03] ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    );
  }

  const theme = getPlaceholderTheme(categoryId || product.categoryId);
  const { Icon } = theme;

  return (
    <div
      aria-hidden="true"
      className={`w-full ${aspectClass} bg-gradient-to-br ${theme.bgClass} border-b border-slate-100 flex items-center justify-center relative overflow-hidden`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(15, 23, 42, 0.14) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div
        className={`relative ${
          compact ? 'w-12 h-12 rounded-xl' : 'w-14 h-14 rounded-2xl'
        } bg-white/95 border ${
          theme.iconBgClass
        } shadow-xs flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}
      >
        <Icon className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
      </div>
    </div>
  );
};
