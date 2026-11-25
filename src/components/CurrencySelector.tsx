import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown,
  Check,
  Search,
  RefreshCw,
  AlertCircle,
  ArrowLeftRight,
} from 'lucide-react';
import {
  SUPPORTED_CURRENCIES,
  SupportedCurrencyCode,
} from '../services/currency';
import { useCurrency } from '../context/CurrencyContext';

interface CurrencySelectorProps {
  compact?: boolean;
  align?: 'left' | 'right';
}

function formatUpdatedTimestamp(timestampMs: number | null): string {
  if (!timestampMs) return 'Not synced yet';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestampMs));
  } catch {
    return new Date(timestampMs).toLocaleTimeString();
  }
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  compact = false,
  align = 'right',
}) => {
  const {
    selectedCurrency,
    selectedCurrencyInfo,
    setSelectedCurrency,
    lastUpdatedAt,
    usingCachedRates,
    isRatesLoading,
    rates,
    ratesError,
    refreshRates,
  } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      return;
    }

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 20);

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredCurrencies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return SUPPORTED_CURRENCIES;
    return SUPPORTED_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const handleSelect = (code: SupportedCurrencyCode) => {
    setSelectedCurrency(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Change currency (current: ${selectedCurrencyInfo.code})`}
        title={`Change currency (${selectedCurrencyInfo.code} — ${selectedCurrencyInfo.name})`}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          compact
            ? 'w-10 h-10 md:w-auto md:px-2.5 text-xs'
            : 'h-9 px-2.5 text-xs'
        }`}
      >
        {compact ? (
          <>
            <ArrowLeftRight
              className="w-4 h-4 text-slate-700 shrink-0 md:hidden"
              aria-hidden="true"
            />
            <span
              aria-hidden="true"
              className="hidden md:inline text-sm leading-none shrink-0"
            >
              {selectedCurrencyInfo.flag}
            </span>
            <span className="hidden md:inline tabular-nums tracking-tight text-slate-900 leading-none">
              {selectedCurrencyInfo.code}
            </span>
            <ChevronDown
              className={`hidden md:inline w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-sm leading-none shrink-0">
              {selectedCurrencyInfo.flag}
            </span>
            <span className="tabular-nums tracking-tight text-slate-900 leading-none">
              {selectedCurrencyInfo.code}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'left'
              ? 'left-0'
              : compact
              ? '-right-11 md:right-0'
              : 'right-0'
          } mt-2 w-[272px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white shadow-xl z-[70] overflow-hidden`}
        >
          {/* Search Input */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search currency or code..."
                aria-label="Search currency"
                className="w-full min-h-[38px] sm:min-h-[34px] pl-8 pr-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-sm sm:text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Currency List */}
          <ul
            role="listbox"
            aria-label="Select display currency"
            className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50"
          >
            {filteredCurrencies.length === 0 ? (
              <li className="px-3.5 py-5 text-center text-xs text-slate-500">
                No matching currency found.
              </li>
            ) : (
              filteredCurrencies.map((item) => {
                const isSelected = item.code === selectedCurrency;
                return (
                  <li key={item.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(item.code)}
                      className={`w-full px-3 py-2.5 min-h-[42px] sm:min-h-[38px] flex items-center justify-between gap-2 text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/90 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          aria-hidden="true"
                          className="text-base leading-none shrink-0"
                        >
                          {item.flag}
                        </span>
                        <span className="min-w-0">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {item.code}
                          </span>{' '}
                          <span className="text-slate-500 font-normal truncate">
                            – {item.name}
                          </span>
                        </span>
                      </span>

                      <span className="flex items-center gap-1.5 shrink-0">
                        <span
                          dir="ltr"
                          className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded tabular-nums"
                        >
                          {item.symbol}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {/* Rate Status Footer */}
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="min-w-0 truncate">
              {rates ? (
                <span title={lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : undefined}>
                  {usingCachedRates ? 'Cached rates' : 'Live rates'} ·{' '}
                  {formatUpdatedTimestamp(lastUpdatedAt)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {ratesError ? 'Offline · Original prices' : 'Original prices'}
                  </span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => void refreshRates()}
              disabled={isRatesLoading}
              aria-label="Refresh exchange rates"
              title="Refresh exchange rates"
              className="p-1.5 rounded hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRatesLoading ? 'animate-spin text-blue-600' : ''}`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
