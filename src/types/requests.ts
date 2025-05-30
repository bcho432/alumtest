import { Timestamp } from 'firebase/firestore';

export interface EditorRequest {
  id: string;
  userId: string;
  userEmail: string;
  profileId: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  requestedAt: Timestamp;
  updatedAt: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
}

export interface EditorRequestStats {
  userId: string;
  totalRequests: number;
  pendingRequests: number;
  lastRequestAt: Timestamp;
  cooldownUntil?: Timestamp;
}

export const EDITOR_REQUEST_LIMITS = {
  MAX_PENDING_REQUESTS: 3,
  COOLDOWN_PERIOD_DAYS: 7,
  MAX_REQUESTS_PER_MONTH: 5
} as const; 