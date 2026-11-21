import { StoreCategory, StoreSubcategory } from '../types/store';

export interface CanonicalCategorySeed {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  active: boolean;
}

export interface CanonicalSubcategorySeed {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  displayOrder: number;
  active: boolean;
}

/**
 * Official Phase 1 Category & Subcategory Taxonomy for MK Labs Digital Store.
 * Note: Separate MK Labs portfolio websites (FileBatch, Mekit, ImgKit, Certificate Studio)
 * belong in the website footer and must NOT appear as store inventory.
 */
export const PHASE1_CATEGORIES: CanonicalCategorySeed[] = [
  {
    id: 'educational-knowledge-products',
    name: 'Learning & Education',
    slug: 'educational-knowledge-products',
    description:
      'Clear e-books, online courses, audiobooks, newsletters, and practical study materials.',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'productivity-templates-business-systems',
    name: 'Business & Productivity',
    slug: 'productivity-templates-business-systems',
    description:
      'Notion templates, spreadsheets, pitch decks, resumes, CVs, and digital planners.',
    displayOrder: 2,
    active: true,
  },
  {
    id: 'graphic-design-visual-creative-assets',
    name: 'Design & Creative Assets',
    slug: 'graphic-design-visual-creative-assets',
    description:
      'Stock photos, icons, UI kits, fonts, photo presets, 3D graphics, and printable files.',
    displayOrder: 3,
    active: true,
  },
  {
    id: 'audio-music-entertainment-media',
    name: 'Music & Entertainment',
    slug: 'audio-music-entertainment-media',
    description:
      'Music tracks, beats, sound effect packs, and digital gaming content.',
    displayOrder: 4,
    active: true,
  },
  {
    id: 'software-web-code-products',
    name: 'Software & Digital Tools',
    slug: 'software-web-code-products',
    description:
      'Website themes, plugins, source code scripts, AI prompts, and digital datasets.',
    displayOrder: 5,
    active: true,
  },
  {
    id: 'memberships-communities-digital-access',
    name: 'Memberships & Digital Access',
    slug: 'memberships-communities-digital-access',
    description:
      'Paid communities, memberships, software subscriptions, and digital access passes.',
    displayOrder: 6,
    active: true,
  },
];

export const PHASE1_SUBCATEGORIES: CanonicalSubcategorySeed[] = [
  // 1. Learning & Education
  {
    id: 'ebooks-digital-guides',
    categoryId: 'educational-knowledge-products',
    name: 'E-books & Digital Guides',
    slug: 'ebooks-digital-guides',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'online-courses-video-bootcamps',
    categoryId: 'educational-knowledge-products',
    name: 'Online Courses & Video Training',
    slug: 'online-courses-video-bootcamps',
    displayOrder: 2,
    active: true,
  },
  {
    id: 'audiobooks-paid-podcasts',
    categoryId: 'educational-knowledge-products',
    name: 'Audiobooks & Podcasts',
    slug: 'audiobooks-paid-podcasts',
    displayOrder: 3,
    active: true,
  },
  {
    id: 'paid-newsletters-research-reports',
    categoryId: 'educational-knowledge-products',
    name: 'Newsletters & Research Reports',
    slug: 'paid-newsletters-research-reports',
    displayOrder: 4,
    active: true,
  },
  {
    id: 'worksheets-flashcards-printables',
    categoryId: 'educational-knowledge-products',
    name: 'Worksheets & Study Materials',
    slug: 'worksheets-flashcards-printables',
    displayOrder: 5,
    active: true,
  },

  // 2. Business & Productivity
  {
    id: 'workspace-second-brain-templates',
    categoryId: 'productivity-templates-business-systems',
    name: 'Notion & Workspace Templates',
    slug: 'workspace-second-brain-templates',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'spreadsheets-financial-models',
    categoryId: 'productivity-templates-business-systems',
    name: 'Spreadsheets & Financial Templates',
    slug: 'spreadsheets-financial-models',
    displayOrder: 2,
    active: true,
  },
  {
    id: 'presentation-pitch-decks',
    categoryId: 'productivity-templates-business-systems',
    name: 'Presentations & Pitch Decks',
    slug: 'presentation-pitch-decks',
    displayOrder: 3,
    active: true,
  },
  {
    id: 'resumes-cvs-legal-contract-packs',
    categoryId: 'productivity-templates-business-systems',
    name: 'CVs, Resumes & Documents',
    slug: 'resumes-cvs-legal-contract-packs',
    displayOrder: 4,
    active: true,
  },
  {
    id: 'digital-planners-journals',
    categoryId: 'productivity-templates-business-systems',
    name: 'Digital Planners & Journals',
    slug: 'digital-planners-journals',
    displayOrder: 5,
    active: true,
  },

  // 3. Design & Creative Assets
  {
    id: 'stock-photography-video-footage',
    categoryId: 'graphic-design-visual-creative-assets',
    name: 'Stock Photos & Videos',
    slug: 'stock-photography-video-footage',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'vector-illustrations-icons-ui-kits',
    categoryId: 'graphic-design-visual-creative-assets',
    name: 'Icons, Illustrations & UI Kits',
    slug: 'vector-illustrations-icons-ui-kits',
    displayOrder: 2,
    active: true,
  },
  {
    id: 'typography-custom-fonts',
    categoryId: 'graphic-design-visual-creative-assets',
    name: 'Fonts & Typography',
    slug: 'typography-custom-fonts',
    displayOrder: 3,
    active: true,
  },
  {
    id: 'photo-presets-luts-brushes',
    categoryId: 'graphic-design-visual-creative-assets',
    name: 'Photo Presets & Editing Tools',
    slug: 'photo-presets-luts-brushes',
    displayOrder: 4,
    active: true,
  },
  {
    id: '3d-models-textures-motion-graphics',
    categoryId: 'graphic-design-visual-creative-assets',
    name: '3D Models & Graphics',
    slug: '3d-models-textures-motion-graphics',
    displayOrder: 5,
    active: true,
  },
  {
    id: 'print-on-demand-crafting-files',
    categoryId: 'graphic-design-visual-creative-assets',
    name: 'Printable & Craft Files',
    slug: 'print-on-demand-crafting-files',
    displayOrder: 6,
    active: true,
  },

  // 4. Music & Entertainment
  {
    id: 'royalty-free-music-beats',
    categoryId: 'audio-music-entertainment-media',
    name: 'Music & Beats',
    slug: 'royalty-free-music-beats',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'sound-effects-sfx-sample-packs',
    categoryId: 'audio-music-entertainment-media',
    name: 'Sound Effects & Audio Packs',
    slug: 'sound-effects-sfx-sample-packs',
    displayOrder: 2,
    active: true,
  },
  {
    id: 'digital-games-mods-in-game-items',
    categoryId: 'audio-music-entertainment-media',
    name: 'Games & Gaming Content',
    slug: 'digital-games-mods-in-game-items',
    displayOrder: 3,
    active: true,
  },

  // 5. Software & Digital Tools
  {
    id: 'website-e-commerce-themes',
    categoryId: 'software-web-code-products',
    name: 'Website & E-commerce Themes',
    slug: 'website-e-commerce-themes',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'plugins-extensions-widgets',
    categoryId: 'software-web-code-products',
    name: 'Plugins & Extensions',
    slug: 'plugins-extensions-widgets',
    displayOrder: 2,
    active: true,
  },
  {
    id: 'source-code-boilerplates-scripts',
    categoryId: 'software-web-code-products',
    name: 'Source Code & Scripts',
    slug: 'source-code-boilerplates-scripts',
    displayOrder: 3,
    active: true,
  },
  {
    id: 'ai-prompts-custom-gpts-datasets',
    categoryId: 'software-web-code-products',
    name: 'AI Prompts & Digital Datasets',
    slug: 'ai-prompts-custom-gpts-datasets',
    displayOrder: 4,
    active: true,
  },

  // 6. Memberships & Digital Access
  {
    id: 'paid-communities-masterminds',
    categoryId: 'memberships-communities-digital-access',
    name: 'Paid Communities & Memberships',
    slug: 'paid-communities-masterminds',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'saas-licenses-digital-tickets',
    categoryId: 'memberships-communities-digital-access',
    name: 'Software Subscriptions & Digital Access',
    slug: 'saas-licenses-digital-tickets',
    displayOrder: 2,
    active: true,
  },
];

export const LEGACY_CATEGORY_METADATA: Record<
  string,
  { oldName: string; oldDescription: string }
> = {
  'educational-knowledge-products': {
    oldName: 'Educational & Knowledge Products',
    oldDescription:
      'In-depth e-books, digital courses, research reports, audiobooks, and practical study materials.',
  },
  'productivity-templates-business-systems': {
    oldName: 'Productivity Templates & Business Systems',
    oldDescription:
      'Workspace systems, financial models, pitch decks, resumes, contract packs, and digital planners.',
  },
  'graphic-design-visual-creative-assets': {
    oldName: 'Graphic Design, Visual & Creative Assets',
    oldDescription:
      'Stock photography, icons, UI kits, typography, color presets, 3D assets, and print-ready files.',
  },
  'audio-music-entertainment-media': {
    oldName: 'Audio, Music & Entertainment Media',
    oldDescription:
      'Royalty-free music tracks, sound effect libraries, sample packs, and digital interactive media.',
  },
  'software-web-code-products': {
    oldName: 'Software, Web & Code Products',
    oldDescription:
      'Website themes, extensions, source code boilerplates, developer scripts, AI prompts, and datasets.',
  },
  'memberships-communities-digital-access': {
    oldName: 'Memberships, Communities & Digital Access',
    oldDescription:
      'Private digital communities, mastermind memberships, SaaS access keys, and event tickets.',
  },
};

export const LEGACY_SUBCATEGORY_NAMES: Record<string, string> = {
  'online-courses-video-bootcamps': 'Online Courses & Video Bootcamps',
  'audiobooks-paid-podcasts': 'Audiobooks & Paid Podcasts',
  'paid-newsletters-research-reports': 'Paid Newsletters & Research Reports',
  'worksheets-flashcards-printables': 'Worksheets, Flashcards & Printables',
  'workspace-second-brain-templates': 'Workspace & Second-Brain Templates',
  'spreadsheets-financial-models': 'Spreadsheets & Financial Models',
  'presentation-pitch-decks': 'Presentation & Pitch Decks',
  'resumes-cvs-legal-contract-packs': 'Resumes, CVs & Legal Contract Packs',
  'stock-photography-video-footage': 'Stock Photography & Video Footage',
  'vector-illustrations-icons-ui-kits': 'Vector Illustrations, Icons & UI Kits',
  'typography-custom-fonts': 'Typography & Custom Fonts',
  'photo-presets-luts-brushes': 'Photo Presets, LUTs & Brushes',
  '3d-models-textures-motion-graphics': '3D Models, Textures & Motion Graphics',
  'print-on-demand-crafting-files': 'Print-on-Demand & Crafting Files',
  'royalty-free-music-beats': 'Royalty-Free Music & Beats',
  'sound-effects-sfx-sample-packs': 'Sound Effects (SFX) & Sample Packs',
  'digital-games-mods-in-game-items': 'Digital Games, Mods & In-Game Items',
  'website-e-commerce-themes': 'Website & E-Commerce Themes',
  'plugins-extensions-widgets': 'Plugins, Extensions & Widgets',
  'source-code-boilerplates-scripts': 'Source Code, Boilerplates & Scripts',
  'ai-prompts-custom-gpts-datasets': 'AI Prompts, Custom GPTs & Datasets',
  'paid-communities-masterminds': 'Paid Communities & Masterminds',
  'saas-licenses-digital-tickets': 'SaaS Licenses & Digital Tickets',
};

const CANONICAL_CAT_BY_ID = new Map(
  PHASE1_CATEGORIES.map((c) => [c.id, c])
);
const CANONICAL_SUB_BY_ID = new Map(
  PHASE1_SUBCATEGORIES.map((s) => [s.id, s])
);

export function resolveCanonicalCategoryDisplay(
  id: string,
  currentName: string,
  currentDescription: string
): { name: string; description: string } {
  const legacy = LEGACY_CATEGORY_METADATA[id];
  const canonical = CANONICAL_CAT_BY_ID.get(id);
  if (!legacy || !canonical) {
    return { name: currentName, description: currentDescription };
  }
  const name =
    currentName === legacy.oldName ? canonical.name : currentName;
  const description =
    currentDescription === legacy.oldDescription
      ? canonical.description
      : currentDescription;
  return { name, description };
}

export function resolveCanonicalSubcategoryDisplay(
  id: string,
  currentName: string
): string {
  const legacyName = LEGACY_SUBCATEGORY_NAMES[id];
  const canonical = CANONICAL_SUB_BY_ID.get(id);
  if (!legacyName || !canonical) return currentName;
  return currentName === legacyName ? canonical.name : currentName;
}

export const toCategoryPlaceholderList = (): StoreCategory[] =>
  PHASE1_CATEGORIES.map((c) => ({ ...c, createdAt: '' }));

export const toSubcategoryPlaceholderList = (): StoreSubcategory[] =>
  PHASE1_SUBCATEGORIES.map((s) => ({ ...s, createdAt: '' }));

export interface CategoryGroupBadge {
  label: string;
  badgeClass: string;
  activeBadgeClass: string;
  dotClass: string;
  iconAccentClass: string;
}

const CANONICAL_CATEGORY_BADGES: Record<string, CategoryGroupBadge> = {
  'educational-knowledge-products': {
    label: 'Education',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeBadgeClass: 'bg-white text-indigo-700 border-white/90',
    dotClass: 'bg-indigo-500',
    iconAccentClass: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  },
  'productivity-templates-business-systems': {
    label: 'Business',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeBadgeClass: 'bg-white text-emerald-700 border-white/90',
    dotClass: 'bg-emerald-500',
    iconAccentClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  'graphic-design-visual-creative-assets': {
    label: 'Creative',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    activeBadgeClass: 'bg-white text-violet-700 border-white/90',
    dotClass: 'bg-violet-500',
    iconAccentClass: 'bg-violet-50 text-violet-600 border-violet-200',
  },
  'audio-music-entertainment-media': {
    label: 'Media',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    activeBadgeClass: 'bg-white text-amber-800 border-white/90',
    dotClass: 'bg-amber-500',
    iconAccentClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'software-web-code-products': {
    label: 'Software',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    activeBadgeClass: 'bg-white text-sky-700 border-white/90',
    dotClass: 'bg-sky-500',
    iconAccentClass: 'bg-sky-50 text-sky-600 border-sky-200',
  },
  'memberships-communities-digital-access': {
    label: 'Access',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    activeBadgeClass: 'bg-white text-rose-700 border-white/90',
    dotClass: 'bg-rose-500',
    iconAccentClass: 'bg-rose-50 text-rose-600 border-rose-200',
  },
};

const FALLBACK_BADGE_STYLES: Omit<CategoryGroupBadge, 'label'>[] = [
  {
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    activeBadgeClass: 'bg-white text-teal-700 border-white/90',
    dotClass: 'bg-teal-500',
    iconAccentClass: 'bg-teal-50 text-teal-600 border-teal-200',
  },
  {
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    activeBadgeClass: 'bg-white text-cyan-700 border-white/90',
    dotClass: 'bg-cyan-500',
    iconAccentClass: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  },
  {
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    activeBadgeClass: 'bg-white text-orange-700 border-white/90',
    dotClass: 'bg-orange-500',
    iconAccentClass: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  {
    badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    activeBadgeClass: 'bg-white text-fuchsia-700 border-white/90',
    dotClass: 'bg-fuchsia-500',
    iconAccentClass: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
  },
];

export function getCategoryGroupBadge(category: {
  id: string;
  slug?: string;
  name: string;
}): CategoryGroupBadge {
  const byId = CANONICAL_CATEGORY_BADGES[category.id];
  if (byId) return byId;
  if (category.slug && CANONICAL_CATEGORY_BADGES[category.slug]) {
    return CANONICAL_CATEGORY_BADGES[category.slug];
  }

  const key = category.id || category.slug || category.name;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const palette =
    FALLBACK_BADGE_STYLES[Math.abs(hash) % FALLBACK_BADGE_STYLES.length];
  const shortLabel =
    category.name
      .trim()
      .split(/[\s&/,-]+/)
      .find(Boolean) || 'Store';

  return {
    label: shortLabel,
    ...palette,
  };
}

