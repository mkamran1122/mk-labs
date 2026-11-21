import { sanitizeSlug } from './productValidation';

export function isValidBlogHttpUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  if (trimmed.length > 1000) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function resolveUniqueBlogSlug(
  baseText: string,
  existingBlogs: { id: string; slug: string }[],
  currentBlogId?: string
): string {
  const baseSlug = sanitizeSlug(baseText) || 'blog-post';
  const taken = new Set(
    existingBlogs
      .filter((b) => b.id !== currentBlogId)
      .map((b) => b.slug.toLowerCase())
  );

  if (!taken.has(baseSlug.toLowerCase())) {
    return baseSlug.slice(0, 180);
  }

  let suffix = 2;
  while (taken.has(`${baseSlug}-${suffix}`.toLowerCase())) {
    suffix += 1;
  }
  return `${baseSlug}-${suffix}`.slice(0, 180);
}

export interface BlogValidationResult {
  valid: boolean;
  error?: string;
}

export function validateBlogFormInput(input: {
  title: string;
  slug?: string;
  shortDescription: string;
  content: string;
  coverImageUrl?: string;
  authorName?: string;
  category?: string;
}): BlogValidationResult {
  const title = (input.title || '').trim();
  if (title.length < 2 || title.length > 180) {
    return {
      valid: false,
      error: 'Blog title must be between 2 and 180 characters.',
    };
  }

  const shortDescription = (input.shortDescription || '').trim();
  if (shortDescription.length < 1 || shortDescription.length > 400) {
    return {
      valid: false,
      error: 'Short description must be between 1 and 400 characters.',
    };
  }

  const content = (input.content || '').trim();
  if (content.length < 1 || content.length > 50000) {
    return {
      valid: false,
      error: 'Article content is required (maximum 50,000 characters).',
    };
  }

  if (input.slug && input.slug.trim()) {
    const cleaned = sanitizeSlug(input.slug);
    if (cleaned.length < 2) {
      return {
        valid: false,
        error: 'Slug must contain at least 2 valid alphanumeric characters.',
      };
    }
  }

  if (input.coverImageUrl && input.coverImageUrl.trim()) {
    if (!isValidBlogHttpUrl(input.coverImageUrl)) {
      return {
        valid: false,
        error: 'Cover Image URL must be a valid https:// or http:// URL.',
      };
    }
  }

  const authorName = (input.authorName || 'MK Labs').trim();
  if (authorName.length > 120) {
    return {
      valid: false,
      error: 'Author name must be 120 characters or fewer.',
    };
  }

  if (input.category && input.category.trim().length > 100) {
    return {
      valid: false,
      error: 'Category must be 100 characters or fewer.',
    };
  }

  return { valid: true };
}

export function formatBlogDate(isoDate?: string): string {
  if (!isoDate) return '';
  const ts = new Date(isoDate).getTime();
  if (!ts || Number.isNaN(ts) || ts <= 0) return '';
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
