import { Timestamp } from 'firebase/firestore';

/**
 * Converts a date value to a Firestore Timestamp
 * @param date - The date to convert (Date, Timestamp, or undefined)
 * @returns A Firestore Timestamp or undefined
 */
export const toTimestamp = (date: Date | Timestamp | undefined): Timestamp | undefined => {
  if (!date) return undefined;
  if (date instanceof Timestamp) return date;
  return Timestamp.fromDate(date);
};

/**
 * Formats a date for display in a date input field
 * @param date - The date to format (Date, Timestamp, or undefined)
 * @returns A string in YYYY-MM-DD format or empty string
 */
export const formatDateForInput = (date: Date | Timestamp | undefined): string => {
  if (!date) return '';
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Validates a date range
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns true if the date range is valid
 */
export const isValidDateRange = (startDate: Date | Timestamp | undefined, endDate: Date | Timestamp | undefined): boolean => {
  if (!startDate || !endDate) return true;
  
  const start = startDate instanceof Timestamp ? startDate.toDate() : startDate;
  const end = endDate instanceof Timestamp ? endDate.toDate() : endDate;
  
  return end >= start;
};

/**
 * Validates if a date is in the past
 * @param date - The date to validate
 * @returns true if the date is in the past
 */
export const isDateInPast = (date: Date | Timestamp | undefined): boolean => {
  if (!date) return false;
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return dateObj < new Date();
}; 