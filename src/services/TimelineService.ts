import { getDb } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { AppError } from '../utils/errors';
import { TimelineEvent, TimelineEventCreateDTO, TimelineEventUpdateDTO, TimelineEventFilters, timelineEventSchema } from '../types/profile';
import { PermissionService } from './PermissionService';
import { TimelineEntry } from '@/types/profile';
import { getFirestore } from 'firebase/firestore';

export class TimelineService {
  private permissionService: PermissionService;

  constructor() {
    this.permissionService = PermissionService.getInstance();
  }

  async getTimelineEvents(profileId: string, filters?: TimelineEventFilters): Promise<TimelineEvent[]> {
    try {
      const db = await getDb();
      const eventsRef = collection(db, 'profiles', profileId, 'timeline');
      let q = query(eventsRef, orderBy('startDate', 'desc'));

      if (filters?.eventTypes?.length) {
        q = query(q, where('type', 'in', filters.eventTypes));
      }

      if (filters?.dateRange?.start) {
        q = query(q, where('startDate', '>=', filters.dateRange.start));
      }

      if (filters?.dateRange?.end) {
        q = query(q, where('startDate', '<=', filters.dateRange.end));
      }

      const snapshot = await getDocs(q);
      let events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimelineEvent[];

      // Apply additional filters in memory
      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        events = events.filter(event => 
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower) ||
          (event.type === 'education' && event.metadata?.institution?.toLowerCase().includes(searchLower)) ||
          (event.type === 'job' && event.metadata?.company?.toLowerCase().includes(searchLower)) ||
          event.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filters?.tags?.length) {
        events = events.filter(event => 
          event.metadata?.tags?.some(tag => filters.tags?.includes(tag))
        );
      }

      if (filters?.importance) {
        events = events.filter(event => 
          event.metadata?.importance === filters.importance
        );
      }

      if (filters?.visibility) {
        events = events.filter(event => 
          event.metadata?.visibility === filters.visibility
        );
      }

      return events;
    } catch (error) {
      throw AppError.fromFirebaseError(error as any);
    }
  }

  async createTimelineEvent(data: TimelineEventCreateDTO): Promise<TimelineEvent> {
    try {
      // Validate permissions
      const canEdit = await this.permissionService.canEditProfile(data.profileId);
      if (!canEdit) {
        throw new AppError('PERMISSION_DENIED', 'You do not have permission to create timeline events', 403);
      }

      // Validate data
      const validatedData = timelineEventSchema.parse({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const db = await getDb();
      const eventsRef = collection(db, 'profiles', data.profileId, 'timeline');
      const docRef = await addDoc(eventsRef, validatedData);

      return {
        ...validatedData,
        id: docRef.id,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.fromFirebaseError(error as any);
    }
  }

  async updateTimelineEvent(data: TimelineEventUpdateDTO & { id: string }): Promise<TimelineEvent> {
    try {
      // Validate permissions
      const canEdit = await this.permissionService.canEditProfile(data.profileId);
      if (!canEdit) {
        throw new AppError('PERMISSION_DENIED', 'You do not have permission to update timeline events', 403);
      }

      const db = await getDb();
      const eventRef = doc(db, 'profiles', data.profileId, 'timeline', data.id);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new AppError('NOT_FOUND', 'Timeline event not found', 404);
      }

      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      // Validate data
      const validatedData = timelineEventSchema.parse({
        ...eventDoc.data(),
        ...updateData,
      });

      await updateDoc(eventRef, validatedData);

      return {
        ...validatedData,
        id: data.id,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.fromFirebaseError(error as any);
    }
  }

  async deleteTimelineEvent(profileId: string, eventId: string): Promise<void> {
    try {
      // Validate permissions
      const canEdit = await this.permissionService.canEditProfile(profileId);
      if (!canEdit) {
        throw new AppError('PERMISSION_DENIED', 'You do not have permission to delete timeline events', 403);
      }

      const db = await getDb();
      const eventRef = doc(db, 'profiles', profileId, 'timeline', eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.fromFirebaseError(error as any);
    }
  }

  async reorderTimelineEvents(profileId: string, eventIds: string[]): Promise<void> {
    try {
      // Validate permissions
      const canEdit = await this.permissionService.canEditProfile(profileId);
      if (!canEdit) {
        throw new AppError('PERMISSION_DENIED', 'You do not have permission to reorder timeline events', 403);
      }

      const db = await getDb();
      // Update each event with its new order
      const batch = writeBatch(db);
      eventIds.forEach((eventId, index) => {
        const eventRef = doc(db, 'profiles', profileId, 'timeline', eventId);
        batch.update(eventRef, { order: index });
      });

      await batch.commit();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.fromFirebaseError(error as any);
    }
  }
} 