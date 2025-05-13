/**
 * Utility function to conditionally join class names together
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Utility functions for the application
 */

/**
 * Converts a Firestore timestamp or ISO string to a JavaScript Date
 * @param timestamp Firestore timestamp, ISO string, or Date object
 * @returns JavaScript Date object
 */
export function toDate(timestamp: any): Date {
  if (!timestamp) {
    return new Date();
  }
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Handle Firestore timestamp
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Handle ISO string
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  
  // Default fallback
  return new Date();
}

/**
 * Format a date for display
 * @param date Date or timestamp to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | any, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = toDate(date);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Date(dateObj).toLocaleDateString(undefined, options || defaultOptions);
}

/**
 * Creates a simple unique ID
 * @returns Random string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Truncates text to a specified length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Safely parse JSON without throwing errors
 * @param json JSON string to parse
 * @param fallback Default value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Handle API errors consistently
 * @param error Error object
 * @param defaultMessage Default message to show
 * @returns Error message
 */
export function handleApiError(error: any, defaultMessage = 'An unexpected error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return defaultMessage;
}

export function generateShareableUrl(orgUrl: string, profileId: string): string {
  return `${orgUrl}/profile/${profileId}`;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
} 