/**
 * Standard Schema types and utilities
 * This allows the library to work with any Standard Schema compliant validation library
 * (Zod, Valibot, ArkType, etc.)
 */

import type { StandardSchemaV1 } from '@standard-schema/spec';

// Import official Standard Schema types

/**
 * Type-safe helper to validate data using any Standard Schema compliant validator
 */
export async function validateStandardSchema<T extends StandardSchemaV1>(
  schema: T,
  input: unknown,
): Promise<StandardSchemaV1.InferOutput<T>> {
  let result = schema['~standard'].validate(input);
  if (result instanceof Promise) result = await result;

  // if the `issues` field exists, the validation failed
  if (result.issues) {
    const errorMessage = result.issues
      .map((issue) => {
        const path =
          issue.path
            ?.map((p) => (typeof p === 'object' ? p.key : p))
            .join('.') ?? 'root';

        return `${path}: ${issue.message}`;
      })
      .join(', ');

    throw new Error(`Validation failed: ${errorMessage}`);
  }

  return result.value;
}

/**
 * Synchronous validation helper that throws if schema uses async validation
 */
export function validateStandardSchemaSync<T extends StandardSchemaV1>(
  schema: T,
  input: unknown,
): StandardSchemaV1.InferOutput<T> {
  const result = schema['~standard'].validate(input);

  if (result instanceof Promise) {
    throw new TypeError('Schema validation must be synchronous');
  }

  // if the `issues` field exists, the validation failed
  if (result.issues) {
    const errorMessage = result.issues
      .map((issue) => {
        const path =
          issue.path
            ?.map((p) => (typeof p === 'object' ? p.key : p))
            .join('.') ?? 'root';

        return `${path}: ${issue.message}`;
      })
      .join(', ');

    throw new Error(`Validation failed: ${errorMessage}`);
  }

  return result.value;
}
