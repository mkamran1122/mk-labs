import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { BlogPostRecord, BlogStatus, SaveBlogInput } from '../types/blog';
import {
  resolveUniqueBlogSlug,
  validateBlogFormInput,
} from './blogValidation';

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date(0).toISOString();
}

function mapBlogDoc(
  id: string,
  data: Record<string, unknown>
): BlogPostRecord {
  const status: BlogStatus =
    data.status === 'published' ? 'published' : 'draft';

  return {
    id,
    title: String(data.title || ''),
    slug: String(data.slug || id),
    shortDescription: String(data.shortDescription || ''),
    content: String(data.content || ''),
    coverImageUrl:
      typeof data.coverImageUrl === 'string' && data.coverImageUrl.trim()
        ? data.coverImageUrl
        : undefined,
    authorName: String(data.authorName || 'MK Labs'),
    category:
      typeof data.category === 'string' && data.category.trim()
        ? data.category
        : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    status,
    publishedAt: data.publishedAt ? timestampToIso(data.publishedAt) : undefined,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    createdBy: String(data.createdBy || ''),
  };
}

function sortBlogsNewestFirst(posts: BlogPostRecord[]): BlogPostRecord[] {
  return [...posts].sort((a, b) => {
    const aTime = new Date(a.publishedAt || a.createdAt).getTime();
    const bTime = new Date(b.publishedAt || b.createdAt).getTime();
    return bTime - aTime;
  });
}

// =============================================================================
// Public Blog Firestore Queries (Rule-enforced: status == 'published')
// =============================================================================

export async function fetchPublishedBlogs(): Promise<BlogPostRecord[]> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing.');
  }
  const path = 'blogs';
  try {
    const q = query(collection(db, path), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return sortBlogsNewestFirst(
      snap.docs.map((d) =>
        mapBlogDoc(d.id, d.data() as Record<string, unknown>)
      )
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPublishedBlogBySlug(
  slug: string
): Promise<BlogPostRecord | null> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing.');
  }
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return null;

  const path = 'blogs';
  try {
    const q = query(
      collection(db, path),
      where('status', '==', 'published'),
      where('slug', '==', cleanSlug)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return mapBlogDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// =============================================================================
// Admin Blog Management Firestore Operations
// =============================================================================

export function generateNewBlogId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `blog_${Date.now()}_${rand}`;
}

export async function fetchAllBlogsAdmin(): Promise<BlogPostRecord[]> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing.');
  }
  const path = 'blogs';
  try {
    const snap = await getDocs(collection(db, path));
    return [...snap.docs]
      .map((d) => mapBlogDoc(d.id, d.data() as Record<string, unknown>))
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchBlogByIdAdmin(
  blogId: string
): Promise<BlogPostRecord | null> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing.');
  }
  const path = `blogs/${blogId}`;
  try {
    const snap = await getDoc(doc(db, 'blogs', blogId));
    if (!snap.exists()) return null;
    return mapBlogDoc(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveBlogAdmin(
  input: SaveBlogInput,
  isUpdate: boolean
): Promise<BlogPostRecord> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    throw new Error(
      'Authenticated, email-verified admin session is required to save blog posts.'
    );
  }

  const validation = validateBlogFormInput(input);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid blog post input.');
  }

  const allBlogs = await fetchAllBlogsAdmin();
  const existingRecord = isUpdate
    ? allBlogs.find((b) => b.id === input.id) || null
    : null;

  const uniqueSlug = resolveUniqueBlogSlug(
    input.slug?.trim() || input.title,
    allBlogs,
    isUpdate ? input.id : undefined
  );

  const path = `blogs/${input.id}`;
  const docRef = doc(db, 'blogs', input.id);

  const cleanTags = (input.tags || [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);

  const basePayload: Record<string, unknown> = {
    title: input.title.trim().slice(0, 180),
    slug: uniqueSlug,
    shortDescription: input.shortDescription.trim().slice(0, 400),
    content: input.content.trim().slice(0, 50000),
    authorName: (input.authorName?.trim() || 'MK Labs').slice(0, 120),
    status: input.status,
    updatedAt: serverTimestamp(),
  };

  if (input.coverImageUrl?.trim()) {
    basePayload.coverImageUrl = input.coverImageUrl.trim().slice(0, 1000);
  } else if (isUpdate) {
    basePayload.coverImageUrl = deleteField();
  }

  if (input.category?.trim()) {
    basePayload.category = input.category.trim().slice(0, 100);
  } else if (isUpdate) {
    basePayload.category = deleteField();
  }

  if (cleanTags.length > 0) {
    basePayload.tags = cleanTags;
  } else if (isUpdate) {
    basePayload.tags = deleteField();
  }

  if (input.status === 'published') {
    if (!isUpdate || existingRecord?.status !== 'published') {
      basePayload.publishedAt = serverTimestamp();
    }
  }

  try {
    if (isUpdate) {
      await updateDoc(docRef, basePayload);
    } else {
      await setDoc(docRef, {
        ...basePayload,
        id: input.id,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
      });
    }

    const saved = await fetchBlogByIdAdmin(input.id);
    if (!saved) {
      throw new Error('Saved blog post could not be read back from Firestore.');
    }
    return saved;
  } catch (error) {
    handleFirestoreError(
      error,
      isUpdate ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function updateBlogStatusAdmin(
  blogId: string,
  targetStatus: BlogStatus
): Promise<BlogPostRecord> {
  const existing = await fetchBlogByIdAdmin(blogId);
  if (!existing) {
    throw new Error('Blog post not found.');
  }

  const path = `blogs/${blogId}`;
  const payload: Record<string, unknown> = {
    status: targetStatus,
    updatedAt: serverTimestamp(),
  };

  if (targetStatus === 'published' && existing.status !== 'published') {
    payload.publishedAt = serverTimestamp();
  }

  try {
    await updateDoc(doc(db, 'blogs', blogId), payload);
    const updated = await fetchBlogByIdAdmin(blogId);
    if (!updated) {
      throw new Error('Updated blog post could not be retrieved.');
    }
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBlogAdmin(blogId: string): Promise<void> {
  const path = `blogs/${blogId}`;
  try {
    await deleteDoc(doc(db, 'blogs', blogId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
