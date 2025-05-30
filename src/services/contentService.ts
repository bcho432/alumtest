import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter, Timestamp, addDoc, updateDoc, deleteDoc, DocumentSnapshot, increment, Query, CollectionReference } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { cache } from 'react';

export interface Content {
  id: string;
  title: string;
  description: string;
  type: 'faq' | 'training' | 'announcement';
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags: string[];
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  helpful: number;
  notHelpful: number;
  lastUpdatedBy?: string;
  lastUpdatedAt?: Date;
  relatedContent?: string[];
  priority?: 'low' | 'medium' | 'high';
  targetAudience?: ('admin' | 'user' | 'all')[];
  requiresAction?: boolean;
  actionDeadline?: Date;
}

export interface ContentQueryParams {
  type?: string;
  status?: string;
  category?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  lastDoc?: DocumentSnapshot;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

// Cache for content queries
const contentCache = new Map<string, { data: Content[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to convert Firestore data to Content type
const convertToContent = (doc: DocumentSnapshot): Content => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data?.createdAt?.toDate() || new Date(),
    updatedAt: data?.updatedAt?.toDate() || new Date(),
    lastUpdatedAt: data?.lastUpdatedAt?.toDate(),
    actionDeadline: data?.actionDeadline?.toDate(),
  } as Content;
};

// Get content by ID with caching
export const getContentById = cache(async (id: string): Promise<Content | null> => {
  const cacheKey = `content-${id}`;
  const cached = contentCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data[0];
  }

  const db = await getDb();
  const contentRef = doc(db, 'content', id);
  const contentDoc = await getDoc(contentRef);
  
  if (!contentDoc.exists()) {
    return null;
  }

  const content = convertToContent(contentDoc);
  contentCache.set(cacheKey, { data: [content], timestamp: Date.now() });
  
  return content;
});

// Get content list with optimized querying and caching
export const getContentList = async (params: ContentQueryParams = {}): Promise<{ content: Content[]; lastDoc: DocumentSnapshot | null }> => {
  const {
    type,
    status,
    category,
    searchTerm,
    page = 1,
    limit: pageLimit = 10,
    lastDoc,
    sortField = 'createdAt',
    sortDirection = 'desc'
  } = params;

  const cacheKey = JSON.stringify({ type, status, category, searchTerm, page, pageLimit, sortField, sortDirection });
  const cached = contentCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { content: cached.data, lastDoc: null };
  }

  const db = await getDb();
  const contentRef = collection(db, 'content');

  // Build query constraints
  const constraints = [];
  
  if (type) {
    constraints.push(where('type', '==', type));
  }
  
  if (status) {
    constraints.push(where('status', '==', status));
  }
  
  if (category) {
    constraints.push(where('category', '==', category));
  }
  
  if (searchTerm) {
    // Note: This is a simple implementation. For better search, consider using Algolia or similar
    constraints.push(where('title', '>=', searchTerm));
    constraints.push(where('title', '<=', searchTerm + '\uf8ff'));
  }

  // Add sorting
  constraints.push(orderBy(sortField, sortDirection));
  
  // Add pagination
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  constraints.push(limit(pageLimit));

  // Execute query
  const q = query(contentRef, ...constraints);
  const snapshot = await getDocs(q);
  
  // Convert to Content type
  const content = snapshot.docs.map(convertToContent);
  
  // Cache results
  contentCache.set(cacheKey, { data: content, timestamp: Date.now() });
  
  return {
    content,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
  };
};

// Create new content
export const createContent = async (content: Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'helpful' | 'notHelpful'>): Promise<Content> => {
  const db = await getDb();
  const contentRef = collection(db, 'content');
  const now = Timestamp.now();
  
  const newContent = {
    ...content,
    createdAt: now,
    updatedAt: now,
    views: 0,
    helpful: 0,
    notHelpful: 0
  };
  
  const docRef = await addDoc(contentRef, newContent);
  const doc = await getDoc(docRef);
  
  // Clear relevant caches
  contentCache.clear();
  
  return convertToContent(doc);
};

// Update content
export const updateContent = async (id: string, content: Partial<Content>): Promise<Content> => {
  const db = await getDb();
  const contentRef = doc(db, 'content', id);
  
  const updateData = {
    ...content,
    updatedAt: Timestamp.now()
  };
  
  await updateDoc(contentRef, updateData);
  
  // Clear relevant caches
  contentCache.clear();
  
  const updatedDoc = await getDoc(contentRef);
  return convertToContent(updatedDoc);
};

// Delete content
export const deleteContent = async (id: string): Promise<void> => {
  const db = await getDb();
  const contentRef = doc(db, 'content', id);
  
  await deleteDoc(contentRef);
  
  // Clear relevant caches
  contentCache.clear();
};

// Increment view count
export const incrementViewCount = async (id: string): Promise<void> => {
  const db = await getDb();
  const contentRef = doc(db, 'content', id);
  
  await updateDoc(contentRef, {
    views: increment(1)
  });
  
  // Clear relevant caches
  contentCache.clear();
};

// Update helpful/not helpful counts
export const updateFeedback = async (id: string, isHelpful: boolean): Promise<void> => {
  const db = await getDb();
  const contentRef = doc(db, 'content', id);
  
  await updateDoc(contentRef, {
    [isHelpful ? 'helpful' : 'notHelpful']: increment(1)
  });
  
  // Clear relevant caches
  contentCache.clear();
}; 