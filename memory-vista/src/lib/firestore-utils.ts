import { DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { toDate } from '@/lib/utils';

/**
 * Normalize a document from Firestore by handling common conversions
 * @param doc Document data from Firestore
 * @param id Document ID
 * @returns Normalized document with proper date objects
 */
export function normalizeDocument<T extends DocumentData>(doc: DocumentData, id: string): T {
  const data = { ...doc, id } as Record<string, any>;
  
  // Convert timestamp fields to Date objects
  for (const [key, value] of Object.entries(data)) {
    // Handle date fields which are commonly named with 'At', 'Date', or 'time' in their name
    if (
      value && 
      (
        (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') || 
        typeof value === 'string'
      ) &&
      (key.endsWith('At') || key.includes('Date') || key.includes('time') || key === 'createdAt' || key === 'updatedAt')
    ) {
      data[key] = toDate(value);
    }
  }
  
  return data as T;
}

/**
 * Convert a Firestore document snapshot to a typed object
 * @param snapshot Firestore document snapshot
 * @returns Typed document data with ID
 */
export function convertDocSnapshot<T extends DocumentData>(snapshot: DocumentSnapshot): T | null {
  if (!snapshot.exists()) {
    return null;
  }
  
  return normalizeDocument<T>(snapshot.data(), snapshot.id);
}

/**
 * Prepare a document for Firestore by handling common conversions
 * @param data Data to prepare for Firestore
 * @returns Prepared data for Firestore
 */
export function prepareDocumentForFirestore(data: Record<string, any>): Record<string, any> {
  const preparedData = { ...data };
  
  // Remove id field as Firestore handles IDs separately
  if ('id' in preparedData) {
    delete preparedData.id;
  }
  
  // Convert Date objects to ISO strings for consistent storage
  for (const [key, value] of Object.entries(preparedData)) {
    if (value instanceof Date) {
      preparedData[key] = value.toISOString();
    }
  }
  
  return preparedData;
}

/**
 * Handle fetch errors from Firestore consistently
 * @param error Error from Firestore
 * @param operation Description of the operation that failed
 * @param defaultMessage Default message to return
 * @returns Formatted error message
 */
export function handleFirestoreError(
  error: unknown, 
  operation = 'database operation', 
  defaultMessage = 'Failed to perform operation'
): string {
  console.error(`Error in ${operation}:`, error);
  
  if (error instanceof Error) {
    return `${defaultMessage}: ${error.message}`;
  }
  
  return defaultMessage;
} 