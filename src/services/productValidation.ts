import { StoreCurrency, StoreSubcategory } from '../types/store';

export const DEFAULT_MAX_PDF_SIZE_MB = 20;
export const MAX_COVER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function getMaxPdfSizeMb(): number {
  try {
    const raw =
      typeof import.meta !== 'undefined'
        ? import.meta.env?.VITE_MAX_PDF_SIZE_MB
        : undefined;
    if (raw !== undefined && raw !== null) {
      const trimmed = String(raw).trim();
      if (trimmed !== '') {
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // Fallback outside Vite runtime
  }
  return DEFAULT_MAX_PDF_SIZE_MB;
}

export function getMaxPdfSizeBytes(): number {
  return Math.round(getMaxPdfSizeMb() * 1024 * 1024);
}

export function sanitizeSlug(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 160);
  if (cleaned.length >= 2) return cleaned;
  return 'product-item';
}

export function resolveUniqueSlug(
  candidateNameOrSlug: string,
  existingProducts: Array<{ id: string; slug: string }>,
  excludeProductId?: string
): string {
  const baseSlug = sanitizeSlug(candidateNameOrSlug).slice(0, 145);
  const taken = new Set(
    existingProducts
      .filter((p) => p.id !== excludeProductId)
      .map((p) => p.slug.toLowerCase())
  );

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  while (taken.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }
  return `${baseSlug}-${counter}`;
}

export function filterSubcategoriesByCategory(
  subcategories: StoreSubcategory[],
  categoryId: string
): StoreSubcategory[] {
  if (!categoryId) return [];
  return subcategories.filter((sub) => sub.categoryId === categoryId);
}

export function validatePdfFileSync(
  file: { name: string; type: string; size: number },
  maxBytes = getMaxPdfSizeBytes()
): string | null {
  const fileName = (file.name || '').trim();
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    return 'Only PDF files (.pdf extension) are allowed.';
  }
  if (file.type !== 'application/pdf') {
    return `Invalid file type (${file.type || 'unknown'}). Only application/pdf files are accepted.`;
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return 'The selected PDF file appears to be empty (0 bytes).';
  }
  if (file.size > maxBytes) {
    const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    return `PDF file exceeds the maximum allowed size of ${maxMb} MB. Please select a smaller PDF.`;
  }
  return null;
}

export function hasPdfMagicHeader(bytes: Uint8Array): boolean {
  if (!bytes || bytes.length < 5) return false;
  // Standard PDF files begin with "%PDF-" (allow BOM/leading whitespace within first 1024 bytes)
  const limit = Math.min(bytes.length - 4, 1020);
  for (let i = 0; i <= limit; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return true;
    }
  }
  return false;
}

export async function validatePdfFile(
  file: File,
  maxBytes = getMaxPdfSizeBytes()
): Promise<{ valid: boolean; error?: string }> {
  const syncErr = validatePdfFileSync(file, maxBytes);
  if (syncErr) {
    return { valid: false, error: syncErr };
  }

  try {
    const headerBuffer = await file.slice(0, 1024).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);
    if (!hasPdfMagicHeader(headerBytes)) {
      return {
        valid: false,
        error:
          'File content does not have a valid PDF signature (%PDF-). Please upload a genuine PDF file.',
      };
    }
  } catch {
    return {
      valid: false,
      error: 'Unable to read the selected PDF file header for verification.',
    };
  }

  return { valid: true };
}

export function validateCoverImageFile(file: {
  name: string;
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  const allowedMimes = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
  ]);
  const extMatch = /\.(png|jpe?g|webp|gif)$/i.test(file.name || '');

  if (!allowedMimes.has((file.type || '').toLowerCase()) || !extMatch) {
    return {
      valid: false,
      error: 'Cover image must be PNG, JPG, JPEG, WEBP, or GIF.',
    };
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { valid: false, error: 'Selected image file is empty.' };
  }
  if (file.size > MAX_COVER_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Cover image exceeds the maximum size limit of 5 MB.',
    };
  }
  return { valid: true };
}

export function validateCoverImageUrl(rawUrl?: string): {
  valid: boolean;
  cleaned?: string;
  error?: string;
} {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { valid: true, cleaned: undefined };
  }
  if (trimmed.length > 1000) {
    return {
      valid: false,
      error: 'Cover image URL cannot exceed 1,000 characters.',
    };
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return { valid: true, cleaned: trimmed };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        valid: false,
        error: 'Cover image URL must begin with https://, http://, or /.',
      };
    }
    return { valid: true, cleaned: trimmed };
  } catch {
    return {
      valid: false,
      error: 'Cover image URL must be a valid https://, http://, or relative / URL.',
    };
  }
}

export interface ProductFormValidationInput {
  name: string;
  shortDescription: string;
  description?: string;
  categoryId: string;
  subcategoryId: string;
  subcategories: StoreSubcategory[];
  coverImageUrl?: string;
  pdfStoragePath?: string;
  originalFileName?: string;
  fileSize?: number;
  currency: StoreCurrency;
  regularPriceInput: string;
  salePriceInput: string;
  license?: string;
  version?: string;
}

export function validateProductFormInput(
  input: ProductFormValidationInput
): {
  valid: boolean;
  error?: string;
  regularPrice?: number;
  salePrice?: number;
} {
  const name = (input.name || '').trim();
  if (name.length < 2 || name.length > 160) {
    return {
      valid: false,
      error: 'Product name is required and must be between 2 and 160 characters.',
    };
  }

  const shortDesc = (input.shortDescription || '').trim();
  if (shortDesc.length < 1 || shortDesc.length > 400) {
    return {
      valid: false,
      error: 'Short description is required (1 to 400 characters).',
    };
  }

  if ((input.description || '').trim().length > 10000) {
    return {
      valid: false,
      error: 'Full description cannot exceed 10,000 characters.',
    };
  }

  if (!(input.categoryId || '').trim()) {
    return { valid: false, error: 'Main category is required.' };
  }

  if (!(input.subcategoryId || '').trim()) {
    return { valid: false, error: 'Subcategory is required.' };
  }

  const validSub = input.subcategories.find(
    (s) => s.id === input.subcategoryId && s.categoryId === input.categoryId
  );
  if (input.subcategories.length > 0 && !validSub) {
    return {
      valid: false,
      error: 'Selected subcategory does not belong to the selected category.',
    };
  }

  const coverCheck = validateCoverImageUrl(input.coverImageUrl);
  if (!coverCheck.valid) {
    return { valid: false, error: coverCheck.error };
  }

  if (input.originalFileName && input.originalFileName.trim().length > 255) {
    return {
      valid: false,
      error: 'Local PDF filename reference cannot exceed 255 characters.',
    };
  }

  if (
    typeof input.fileSize === 'number' &&
    input.fileSize > getMaxPdfSizeBytes()
  ) {
    return {
      valid: false,
      error: `PDF file exceeds the maximum allowed size of ${getMaxPdfSizeMb()} MB.`,
    };
  }

  if (input.currency !== 'PKR' && input.currency !== 'USD') {
    return { valid: false, error: 'Currency must be either PKR or USD.' };
  }

  const rawRegular = (input.regularPriceInput || '').trim();
  if (rawRegular === '') {
    return {
      valid: false,
      error: 'Regular price is required.',
    };
  }

  const regularPrice = Number(rawRegular);
  if (!Number.isFinite(regularPrice) || regularPrice < 0) {
    return {
      valid: false,
      error: 'Regular price must be a valid non-negative number.',
    };
  }

  let salePrice: number | undefined;
  const rawSale = (input.salePriceInput || '').trim();
  if (rawSale !== '') {
    const parsedSale = Number(rawSale);
    if (!Number.isFinite(parsedSale) || parsedSale < 0) {
      return {
        valid: false,
        error: 'Sale price must be a valid non-negative number.',
      };
    }
    if (parsedSale >= regularPrice) {
      return {
        valid: false,
        error: 'Sale price must be strictly lower than the regular price.',
      };
    }
    salePrice = parsedSale;
  }

  if ((input.license || '').trim().length > 1000) {
    return {
      valid: false,
      error: 'License information cannot exceed 1,000 characters.',
    };
  }

  if ((input.version || '').trim().length > 64) {
    return {
      valid: false,
      error: 'Version string cannot exceed 64 characters.',
    };
  }

  return {
    valid: true,
    regularPrice,
    salePrice,
  };
}
