export type BlogStatus = 'draft' | 'published';

export interface BlogPostRecord {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  coverImageUrl?: string;
  authorName: string;
  category?: string;
  tags?: string[];
  status: BlogStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SaveBlogInput {
  id: string;
  title: string;
  slug?: string;
  shortDescription: string;
  content: string;
  coverImageUrl?: string;
  authorName?: string;
  category?: string;
  tags?: string[];
  status: BlogStatus;
}
