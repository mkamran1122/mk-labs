import { formatProductPrice } from '../types/store';

export type SupportedCurrencyCode =
  | 'USD'
  | 'PKR'
  | 'GBP'
  | 'EUR'
  | 'AED'
  | 'SAR'
  | 'TRY'
  | 'CAD'
  | 'AUD'
  | 'INR'
  | 'CNY'
  | 'JPY';

export interface CurrencyMetadata {
  code: SupportedCurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: readonly CurrencyMetadata[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', flag: '🇵🇰', decimals: 0 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪', decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', flag: '🇸🇦', decimals: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', decimals: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimals: 0 },
] as const;

export const CURRENCY_STORAGE_KEY = 'mk_labs_display_currency_v1';
export const FX_CACHE_STORAGE_KEY = 'mk_labs_fx_rates_v1';
export const FX_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export const PRIMARY_FX_API_URL = 'https://open.er-api.com/v6/latest/USD';
export const FALLBACK_FX_API_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';

export type ExchangeRatesMap = Record<string, number>;

export interface CachedExchangeRates {
  base: 'USD';
  rates: ExchangeRatesMap;
  fetchedAt: number;
  providerUpdatedAt?: number;
  provider: string;
}

export interface ExchangeRateFetchResult {
  data: CachedExchangeRates | null;
  fromCache: boolean;
  error?: string;
}

export interface ConvertedPriceResult {
  amount: number;
  currency: string;
  formatted: string;
  isConverted: boolean;
  originalAmount: number;
  originalCurrency: string;
  originalFormatted: string;
}

const CURRENCY_MAP = new Map<string, CurrencyMetadata>(
  SUPPORTED_CURRENCIES.map((item) => [item.code, item])
);

export function isSupportedCurrency(
  code: string | null | undefined
): code is SupportedCurrencyCode {
  if (!code) return false;
  return CURRENCY_MAP.has(code.trim().toUpperCase());
}

export function normalizeSupportedCurrency(
  code: string | null | undefined,
  fallback: SupportedCurrencyCode = 'USD'
): SupportedCurrencyCode {
  const upper = (code || '').trim().toUpperCase();
  if (CURRENCY_MAP.has(upper)) {
    return upper as SupportedCurrencyCode;
  }
  return fallback;
}

export function getCurrencyMetadata(
  code: string | null | undefined
): CurrencyMetadata {
  const normalized = normalizeSupportedCurrency(code, 'USD');
  return CURRENCY_MAP.get(normalized)!;
}

export function normalizeSourceCurrency(code: string | null | undefined): string {
  const upper = (code || 'USD').trim().toUpperCase();
  return upper || 'USD';
}

/**
 * Pure conversion calculation across any source currency and target currency
 * using a USD-based FX rates map.
 * Never fabricates rates: if either rate is missing/invalid, retains the original
 * amount and original currency with `converted: false`.
 */
export function convertCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRatesMap | null | undefined
): { amount: number; currency: string; converted: boolean } {
  const source = normalizeSourceCurrency(fromCurrency);
  const target = normalizeSourceCurrency(toCurrency);

  if (!Number.isFinite(amount) || amount < 0) {
    return { amount, currency: source, converted: false };
  }

  if (amount === 0) {
    return { amount: 0, currency: target, converted: source !== target };
  }

  if (source === target) {
    return { amount, currency: source, converted: false };
  }

  if (!rates) {
    return { amount, currency: source, converted: false };
  }

  const fromRate = source === 'USD' ? 1 : rates[source];
  const toRate = target === 'USD' ? 1 : rates[target];

  if (
    typeof fromRate !== 'number' ||
    typeof toRate !== 'number' ||
    !Number.isFinite(fromRate) ||
    !Number.isFinite(toRate) ||
    fromRate <= 0 ||
    toRate <= 0
  ) {
    return { amount, currency: source, converted: false };
  }

  const convertedRaw = (amount / fromRate) * toRate;
  const meta = CURRENCY_MAP.get(target);
  const decimals = meta ? meta.decimals : 2;
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(convertedRaw * factor) / factor;

  return {
    amount: rounded,
    currency: target,
    converted: true,
  };
}

/**
 * Formats an amount in any supported currency cleanly with unambiguous symbols
 * and tabular numeric formatting. Preserves exact MK Labs original formatting
 * when currency is USD or PKR and unconverted.
 */
export function formatDisplayCurrency(
  amount: number,
  currencyCode: string
): string {
  if (!Number.isFinite(amount) || amount < 0) return '—';
  if (amount === 0) return 'Free';

  const code = normalizeSourceCurrency(currencyCode);
  if (code === 'PKR') {
    const formatted = Number.isInteger(amount)
      ? amount.toLocaleString('en-US')
      : amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
    return `PKR ${formatted}`;
  }

  if (code === 'USD') {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  }

  const meta = CURRENCY_MAP.get(code);
  if (!meta) {
    return `${code} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const formattedNum = amount.toLocaleString('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });

  if (code === 'AED' || code === 'SAR') {
    return `${code} ${formattedNum}`;
  }

  return `${meta.symbol}${formattedNum} ${code}`;
}

export function buildConvertedPrice(
  amount: number,
  originalCurrency: string,
  targetCurrency: SupportedCurrencyCode,
  rates: ExchangeRatesMap | null | undefined
): ConvertedPriceResult {
  const source = normalizeSourceCurrency(originalCurrency);
  const originalFormatted = formatProductPrice(amount, source);
  const conversion = convertCurrencyAmount(
    amount,
    source,
    targetCurrency,
    rates
  );

  const formatted = conversion.converted
    ? formatDisplayCurrency(conversion.amount, conversion.currency)
    : originalFormatted;

  return {
    amount: conversion.amount,
    currency: conversion.currency,
    formatted,
    isConverted: conversion.converted,
    originalAmount: amount,
    originalCurrency: source,
    originalFormatted,
  };
}

// =============================================================================
// Storage Persistence Helpers
// =============================================================================

export function readStoredCurrencyPreference(
  storage?: Pick<Storage, 'getItem'>
): SupportedCurrencyCode | null {
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!store) return null;
    const raw = store.getItem(CURRENCY_STORAGE_KEY);
    return isSupportedCurrency(raw) ? (raw.trim().toUpperCase() as SupportedCurrencyCode) : null;
  } catch {
    return null;
  }
}

export function saveStoredCurrencyPreference(
  currency: SupportedCurrencyCode,
  storage?: Pick<Storage, 'setItem'>
): void {
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!store) return;
    store.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch {
    // Ignore storage quota or private-mode restriction
  }
}

function sanitizeRatesObject(rawRates: unknown): ExchangeRatesMap | null {
  if (!rawRates || typeof rawRates !== 'object' || Array.isArray(rawRates)) {
    return null;
  }

  const sanitized: ExchangeRatesMap = { USD: 1 };
  let supportedCount = 0;

  for (const [rawKey, rawVal] of Object.entries(
    rawRates as Record<string, unknown>
  )) {
    const code = rawKey.trim().toUpperCase();
    if (!CURRENCY_MAP.has(code)) continue;
    const num = typeof rawVal === 'number' ? rawVal : Number(rawVal);
    if (Number.isFinite(num) && num > 0) {
      sanitized[code] = code === 'USD' ? 1 : num;
      supportedCount += 1;
    }
  }

  // Require at least half of our supported currencies so corrupt payloads are rejected
  if (supportedCount < 6) {
    return null;
  }

  return sanitized;
}

export function readCachedExchangeRates(
  storage?: Pick<Storage, 'getItem'>
): CachedExchangeRates | null {
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!store) return null;
    const raw = store.getItem(FX_CACHE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedExchangeRates>;
    if (!parsed || parsed.base !== 'USD') return null;

    const rates = sanitizeRatesObject(parsed.rates);
    if (!rates) return null;

    const fetchedAt =
      typeof parsed.fetchedAt === 'number' && Number.isFinite(parsed.fetchedAt)
        ? parsed.fetchedAt
        : 0;
    if (fetchedAt <= 0) return null;

    return {
      base: 'USD',
      rates,
      fetchedAt,
      providerUpdatedAt:
        typeof parsed.providerUpdatedAt === 'number' &&
        Number.isFinite(parsed.providerUpdatedAt)
          ? parsed.providerUpdatedAt
          : undefined,
      provider: String(parsed.provider || 'cached'),
    };
  } catch {
    return null;
  }
}

export function saveCachedExchangeRates(
  entry: CachedExchangeRates,
  storage?: Pick<Storage, 'setItem'>
): void {
  try {
    const store =
      storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!store) return;
    store.setItem(FX_CACHE_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage errors
  }
}

export function isFxCacheFresh(
  cached: CachedExchangeRates | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!cached) return false;
  return nowMs - cached.fetchedAt < FX_CACHE_TTL_MS;
}

// =============================================================================
// Live Exchange Rate Fetching (Keyless Public APIs + Graceful Offline Fallback)
// =============================================================================

async function fetchJsonWithTimeout(
  url: string,
  fetchFn: typeof fetch,
  timeoutMs: number = 8000
): Promise<unknown> {
  const controller =
    typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer =
    controller !== null
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

  try {
    const response = await fetchFn(url, {
      method: 'GET',
      signal: controller?.signal,
    });
    if (!response.ok) {
      throw new Error(`FX API HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    if (timer !== null) {
      clearTimeout(timer);
    }
  }
}

export function parseOpenErApiResponse(
  payload: unknown,
  nowMs: number = Date.now()
): CachedExchangeRates | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;
  if (data.result !== 'success') return null;

  const rates = sanitizeRatesObject(data.rates);
  if (!rates) return null;

  const unixSec = Number(data.time_last_update_unix);
  const providerUpdatedAt =
    Number.isFinite(unixSec) && unixSec > 0 ? unixSec * 1000 : undefined;

  return {
    base: 'USD',
    rates,
    fetchedAt: nowMs,
    providerUpdatedAt,
    provider: 'open.er-api.com',
  };
}

export function parseFawazCurrencyApiResponse(
  payload: unknown,
  nowMs: number = Date.now()
): CachedExchangeRates | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;
  const rates = sanitizeRatesObject(data.usd);
  if (!rates) return null;

  const dateStr = typeof data.date === 'string' ? Date.parse(data.date) : NaN;
  const providerUpdatedAt = Number.isFinite(dateStr) ? dateStr : undefined;

  return {
    base: 'USD',
    rates,
    fetchedAt: nowMs,
    providerUpdatedAt,
    provider: 'fawazahmed0/currency-api',
  };
}

export async function fetchLiveExchangeRates(options?: {
  fetchFn?: typeof fetch;
  storage?: Storage;
  forceRefresh?: boolean;
  nowMs?: number;
}): Promise<ExchangeRateFetchResult> {
  const nowMs = options?.nowMs ?? Date.now();
  const cached = readCachedExchangeRates(options?.storage);

  if (!options?.forceRefresh && cached && isFxCacheFresh(cached, nowMs)) {
    return {
      data: cached,
      fromCache: true,
    };
  }

  const fetchFn =
    options?.fetchFn ??
    (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);

  if (!fetchFn) {
    return {
      data: cached,
      fromCache: Boolean(cached),
      error: cached ? undefined : 'Fetch API unavailable.',
    };
  }

  let primaryError: string | undefined;

  try {
    const raw = await fetchJsonWithTimeout(PRIMARY_FX_API_URL, fetchFn);
    const parsed = parseOpenErApiResponse(raw, nowMs);
    if (parsed) {
      saveCachedExchangeRates(parsed, options?.storage);
      return { data: parsed, fromCache: false };
    }
    primaryError = 'Invalid primary exchange rate response.';
  } catch (err) {
    primaryError =
      err instanceof Error ? err.message : 'Primary FX request failed.';
  }

  try {
    const rawFallback = await fetchJsonWithTimeout(FALLBACK_FX_API_URL, fetchFn);
    const parsedFallback = parseFawazCurrencyApiResponse(rawFallback, nowMs);
    if (parsedFallback) {
      saveCachedExchangeRates(parsedFallback, options?.storage);
      return { data: parsedFallback, fromCache: false };
    }
  } catch (err) {
    const fallbackErr =
      err instanceof Error ? err.message : 'Fallback FX request failed.';
    primaryError = primaryError || fallbackErr;
  }

  // Graceful fallback to previously cached rates if both network providers fail
  if (cached) {
    return {
      data: cached,
      fromCache: true,
      error: primaryError,
    };
  }

  return {
    data: null,
    fromCache: false,
    error: primaryError || 'Live exchange rates are currently unavailable.',
  };
}
