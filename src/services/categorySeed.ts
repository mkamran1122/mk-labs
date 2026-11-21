import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  db,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  PHASE1_CATEGORIES,
  PHASE1_SUBCATEGORIES,
  LEGACY_CATEGORY_METADATA,
  LEGACY_SUBCATEGORY_NAMES,
} from '../config/storeCatalog';

export interface CategoryInitSummary {
  categoriesCreated: number;
  categoriesUpdated: number;
  categoriesSkipped: number;
  subcategoriesCreated: number;
  subcategoriesUpdated: number;
  subcategoriesSkipped: number;
}

/**
 * Safe, repeatable (idempotent) category and subcategory initializer/syncer for Firestore.
 * - Creates any missing canonical categories or subcategories with deterministic IDs.
 * - Updates existing documents ONLY when their stored name still matches the legacy Phase-1 name,
 *   preserving document IDs, slugs, active status, display order, createdAt, and product references.
 * - Never overwrites custom admin-edited names or creates duplicates.
 */
export async function initializeCategoriesInFirestore(): Promise<CategoryInitSummary> {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase configuration is missing. Configure your Firebase credentials before initializing categories.'
    );
  }

  let categoriesCreated = 0;
  let categoriesUpdated = 0;
  let categoriesSkipped = 0;
  let subcategoriesCreated = 0;
  let subcategoriesUpdated = 0;
  let subcategoriesSkipped = 0;

  for (const cat of PHASE1_CATEGORIES) {
    const catPath = `categories/${cat.id}`;
    const catRef = doc(db, 'categories', cat.id);

    let snap;
    try {
      snap = await getDoc(catRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, catPath);
    }

    if (snap.exists()) {
      const existingData = snap.data() as Record<string, unknown>;
      const legacy = LEGACY_CATEGORY_METADATA[cat.id];
      const needsNameUpdate =
        legacy && String(existingData.name || '') === legacy.oldName;
      const needsDescUpdate =
        legacy &&
        String(existingData.description || '') === legacy.oldDescription;

      if (needsNameUpdate || needsDescUpdate) {
        try {
          const patch: Record<string, unknown> = {
            updatedAt: serverTimestamp(),
          };
          if (needsNameUpdate) patch.name = cat.name;
          if (needsDescUpdate) patch.description = cat.description;
          await updateDoc(catRef, patch);
          categoriesUpdated += 1;
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, catPath);
        }
      } else {
        categoriesSkipped += 1;
      }
      continue;
    }

    try {
      await setDoc(catRef, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: cat.displayOrder,
        active: cat.active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      categoriesCreated += 1;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, catPath);
    }
  }

  for (const sub of PHASE1_SUBCATEGORIES) {
    const subPath = `subcategories/${sub.id}`;
    const subRef = doc(db, 'subcategories', sub.id);

    let snap;
    try {
      snap = await getDoc(subRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, subPath);
    }

    if (snap.exists()) {
      const existingData = snap.data() as Record<string, unknown>;
      const legacyName = LEGACY_SUBCATEGORY_NAMES[sub.id];
      if (legacyName && String(existingData.name || '') === legacyName) {
        try {
          await updateDoc(subRef, {
            name: sub.name,
            updatedAt: serverTimestamp(),
          });
          subcategoriesUpdated += 1;
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, subPath);
        }
      } else {
        subcategoriesSkipped += 1;
      }
      continue;
    }

    try {
      await setDoc(subRef, {
        id: sub.id,
        categoryId: sub.categoryId,
        name: sub.name,
        slug: sub.slug,
        displayOrder: sub.displayOrder,
        active: sub.active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      subcategoriesCreated += 1;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, subPath);
    }
  }

  return {
    categoriesCreated,
    categoriesUpdated,
    categoriesSkipped,
    subcategoriesCreated,
    subcategoriesUpdated,
    subcategoriesSkipped,
  };
}

let sessionSyncAttempted = false;

/**
 * Safely runs an automatic, non-blocking one-time sync when a verified admin enters Admin Portal,
 * migrating legacy category/subcategory names in Firestore without duplicating records.
 */
export async function syncCategoryNamesOncePerSession(): Promise<CategoryInitSummary | null> {
  if (sessionSyncAttempted || !isFirebaseConfigured) return null;
  sessionSyncAttempted = true;
  try {
    return await initializeCategoriesInFirestore();
  } catch {
    sessionSyncAttempted = false;
    return null;
  }
}
