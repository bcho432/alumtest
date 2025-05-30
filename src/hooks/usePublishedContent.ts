import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Content } from '@/services/contentService';

export function usePublishedContent(type: 'faq' | 'training' | 'announcement') {
  return useQuery({
    queryKey: ['publishedContent', type],
    queryFn: async () => {
      const db = await getDb();
      const contentRef = collection(db, 'content');
      const q = query(
        contentRef,
        where('type', '==', type),
        where('status', '==', 'published')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Content[];
    }
  });
} 