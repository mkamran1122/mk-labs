import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { isFirebaseConfigured } from '../lib/firebase';
import { fetchStoreSettingsAdmin } from '../services/firestoreStore';
import {
  SupportedCurrencyCode,
  CurrencyMetadata,
  CachedExchangeRates,
  ConvertedPriceResult,
  FX_CACHE_TTL_MS,
  getCurrencyMetadata,
  normalizeSupportedCurrency,
  readStoredCurrencyPreference,
  saveStoredCurrencyPreference,
  readCachedExchangeRates,
  isFxCacheFresh,
  fetchLiveExchangeRates,
  buildConvertedPrice,
  convertCurrencyAmount,
  formatDisplayCurrency,
} from '../services/currency';

interface CurrencyContextType {
  selectedCurrency: SupportedCurrencyCode;
  selectedCurrencyInfo: CurrencyMetadata;
  baseCurrency: SupportedCurrencyCode;
  setSelectedCurrency: (code: SupportedCurrencyCode) => void;
  rates: Record<string, number> | null;
  lastUpdatedAt: number | null;
  ratesProvider: string | null;
  usingCachedRates: boolean;
  isRatesLoading: boolean;
  ratesError: string | null;
  refreshRates: () => Promise<void>;
  convertPrice: (
    amount: number,
    originalCurrency: string
  ) => ConvertedPriceResult;
  convertNumericAmount: (
    amount: number,
    originalCurrency: string
  ) => { amount: number; currency: string; converted: boolean };
  formatCurrency: (amount: number, currencyCode: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [baseCurrency, setBaseCurrency] =
    useState<SupportedCurrencyCode>('USD');
  const [selectedCurrency, setSelectedCurrencyState] =
    useState<SupportedCurrencyCode>(() => {
      return readStoredCurrencyPreference() || 'USD';
    });

  const [fxCache, setFxCache] = useState<CachedExchangeRates | null>(() =>
    readCachedExchangeRates()
  );
  const [usingCachedRates, setUsingCachedRates] = useState<boolean>(() =>
    Boolean(readCachedExchangeRates())
  );
  const [isRatesLoading, setIsRatesLoading] = useState<boolean>(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const loadExchangeRates = useCallback(async (forceRefresh = false) => {
    setIsRatesLoading(true);
    try {
      const result = await fetchLiveExchangeRates({ forceRefresh });
      if (result.data) {
        setFxCache(result.data);
        setUsingCachedRates(result.fromCache);
        setRatesError(result.error || null);
      } else {
        setUsingCachedRates(false);
        setRatesError(
          result.error || 'Exchange rates unavailable; showing original prices.'
        );
      }
    } finally {
      setIsRatesLoading(false);
    }
  }, []);

  // Load store base currency once from public settings doc without overriding saved user preference
  useEffect(() => {
    let active = true;

    async function syncStoreBaseCurrency() {
      if (!isFirebaseConfigured) return;
      try {
        const settings = await fetchStoreSettingsAdmin();
        if (!active || !settings?.defaultCurrency) return;
        const storeBase = normalizeSupportedCurrency(
          settings.defaultCurrency,
          'USD'
        );
        setBaseCurrency(storeBase);
        const storedPref = readStoredCurrencyPreference();
        if (!storedPref) {
          setSelectedCurrencyState(storeBase);
        }
      } catch {
        // Offline or unreachable Firestore: keep fallback USD / stored user preference
      }
    }

    void syncStoreBaseCurrency();
    void loadExchangeRates(false);

    return () => {
      active = false;
    };
  }, [loadExchangeRates]);

  // Periodic refresh + window focus stale check
  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadExchangeRates(true);
    }, FX_CACHE_TTL_MS);

    const handleFocus = () => {
      const current = readCachedExchangeRates();
      if (!isFxCacheFresh(current)) {
        void loadExchangeRates(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadExchangeRates]);

  const setSelectedCurrency = useCallback(
    (code: SupportedCurrencyCode) => {
      const normalized = normalizeSupportedCurrency(code, baseCurrency);
      setSelectedCurrencyState(normalized);
      saveStoredCurrencyPreference(normalized);
      if (!fxCache && !isRatesLoading) {
        void loadExchangeRates(true);
      }
    },
    [baseCurrency, fxCache, isRatesLoading, loadExchangeRates]
  );

  const refreshRates = useCallback(async () => {
    await loadExchangeRates(true);
  }, [loadExchangeRates]);

  const rates = fxCache?.rates || null;

  const convertPrice = useCallback(
    (amount: number, originalCurrency: string): ConvertedPriceResult => {
      return buildConvertedPrice(
        amount,
        originalCurrency,
        selectedCurrency,
        rates
      );
    },
    [selectedCurrency, rates]
  );

  const convertNumericAmount = useCallback(
    (amount: number, originalCurrency: string) => {
      return convertCurrencyAmount(
        amount,
        originalCurrency,
        selectedCurrency,
        rates
      );
    },
    [selectedCurrency, rates]
  );

  const formatCurrency = useCallback(
    (amount: number, currencyCode: string) => {
      return formatDisplayCurrency(amount, currencyCode);
    },
    []
  );

  const selectedCurrencyInfo = useMemo(
    () => getCurrencyMetadata(selectedCurrency),
    [selectedCurrency]
  );

  const value = useMemo<CurrencyContextType>(
    () => ({
      selectedCurrency,
      selectedCurrencyInfo,
      baseCurrency,
      setSelectedCurrency,
      rates,
      lastUpdatedAt: fxCache?.fetchedAt || null,
      ratesProvider: fxCache?.provider || null,
      usingCachedRates,
      isRatesLoading,
      ratesError,
      refreshRates,
      convertPrice,
      convertNumericAmount,
      formatCurrency,
    }),
    [
      selectedCurrency,
      selectedCurrencyInfo,
      baseCurrency,
      setSelectedCurrency,
      rates,
      fxCache?.fetchedAt,
      fxCache?.provider,
      usingCachedRates,
      isRatesLoading,
      ratesError,
      refreshRates,
      convertPrice,
      convertNumericAmount,
      formatCurrency,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
