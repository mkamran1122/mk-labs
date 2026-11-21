import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import {
  StoreProductRecord,
  getEffectiveProductPrice,
  formatProductPrice,
} from '../../types/store';

export { getEffectiveProductPrice, formatProductPrice };

export const StoreProductPreview: React.FC<{
  product: StoreProductRecord;
  compact?: boolean;
}> = ({ product, compact = false }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [product.coverImageUrl]);

  if (product.coverImageUrl && !imgError) {
    return (
      <div
        className={`w-full ${
          compact ? 'h-32 min-[375px]:h-36 sm:h-44' : 'h-52 sm:h-72'
        } bg-slate-100 flex items-center justify-center overflow-hidden relative`}
      >
        <img
          src={product.coverImageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full ${
        compact ? 'h-32 min-[375px]:h-36 sm:h-44' : 'h-52 sm:h-72'
      } bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center ${
        compact ? 'px-3 sm:px-6' : 'px-6'
      } text-center relative overflow-hidden`}
    >
      <div
        className={`${
          compact ? 'w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3' : 'w-12 h-12 mb-3'
        } rounded-xl border border-slate-200 bg-white flex items-center justify-center shadow-2xs text-blue-600`}
      >
        <FileText className={compact ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6'} />
      </div>
      <span
        className={`${
          compact ? 'text-xs sm:text-sm' : 'text-sm'
        } font-bold text-slate-900 line-clamp-1`}
      >
        {product.name}
      </span>
      <div className="mt-1.5 sm:mt-2.5 inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-slate-500 bg-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded border border-slate-200">
        <FileText className="w-3 h-3 text-blue-600 shrink-0" />
        <span className="truncate">Digital PDF Product</span>
      </div>
    </div>
  );
};
