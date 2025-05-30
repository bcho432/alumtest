/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a phone number format (basic validation)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates a URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes an object by applying sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validates required fields in an object
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: (keyof T)[] } {
  const missingFields = requiredFields.filter(
    field => !obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())
  );

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

// Example usage:
// const sanitizedInput = sanitizeString(userInput);
// const isValid = isValidEmail(email);
// const sanitizedData = sanitizeObject(formData);
// const { isValid, missingFields } = validateRequiredFields(formData, ['name', 'email']); 