/**
 * Utility functions for the server
 */
import { ZodError } from 'zod';

/**
 * Convert a camelCase string to snake_case
 * @param str String in camelCase format
 * @returns String in snake_case format
 */
export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert an object's keys from camelCase to snake_case
 * @param obj Object with camelCase keys
 * @returns Object with snake_case keys
 */
export function convertObjectKeysToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnakeCase(key);
    result[snakeKey] = value;
  }
  
  return result;
}

/**
 * Format Zod validation errors into a more user-friendly format
 * @param error The ZodError object
 * @returns A formatted error object
 */
export function formatZodError(error: ZodError) {
  return {
    message: 'Validation failed',
    errors: error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  };
}