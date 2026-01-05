# Typed Error Handling in TypeScript

This reference describes a pattern for exhaustive, type-safe error handling in TypeScript, as popularized by the `ts-typed-errors` library. This approach is an alternative to the standard `try/catch` block which treats all errors as `unknown`.

## The Problem with `try/catch`

In TypeScript, `catch(error)` types the error as `unknown`. This forces developers to use verbose and error-prone `instanceof` checks or type guards to handle specific error cases.

```typescript
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof NetworkError) {
    // ...
  } else if (error instanceof ValidationError) {
    // ...
  } else {
    // What if we missed a case? No compile-time safety.
    handleUnknownError(error);
  }
}
```

## The Solution: `ts-typed-errors`

The `ts-typed-errors` library (or implementing a similar pattern) introduces compile-time exhaustiveness checks for error handling. It uses discriminated unions and a fluent API to ensure all possible error cases are handled.

### Key Concepts

1.  **`defineError`**: Creates strongly-typed error classes with specific data payloads.
2.  **`wrap`**: Wraps async functions to return a `Result` type (or similar structure) instead of throwing, or captures thrown errors into a union.
3.  **`matchErrorOf`**: A fluent API to pattern match against specific error types.
4.  **`exhaustive`**: A terminal method that fails compilation if any error type in the union remains unhandled.

### Example Usage

```typescript
import { defineError, matchErrorOf, wrap } from 'ts-typed-errors';

// 1. Define custom error types
const NetworkError = defineError('NetworkError')<{ status: number; url: string }>();
const ValidationError = defineError('ValidationError')<{ field: string; value: any }>();
const DatabaseError = defineError('DatabaseError')<{ table: string; operation: string }>();

// Define a union of possible errors for your application or specific operation
type AppError = 
  | InstanceType<typeof NetworkError> 
  | InstanceType<typeof ValidationError> 
  | InstanceType<typeof DatabaseError>;

// 2. Wrap a throwing function
const safeOperation = wrap(async () => {
  // Your risky operation that might throw one of the above errors
});

// 3. Handle errors exhaustively
const result = await safeOperation();

if (!result.ok) {
  return matchErrorOf<AppError>(result.error)
    .with(NetworkError, e => `Network error: ${e.data.status}`)
    .with(ValidationError, e => `Invalid ${e.data.field}`)
    .with(DatabaseError, e => `DB error on ${e.data.table}`)
    .exhaustive(); // ✅ Compile-time error if any case is missing
}

console.log(result.value);
```

### Benefits

*   **Exhaustiveness**: You cannot forget to handle an error case. Adding a new error type to the union will cause a compile error in all handlers that use that union until they are updated.
*   **Type Safety**: In the `.with()` callback, the error is fully typed (e.g., `e.data.status` is known).
*   **Readability**: Replaces nested `if/else` chains with a clean, declarative pattern.

## Installation

```bash
npm install ts-typed-errors
```

This pattern is highly recommended for complex business logic where specific error handling strategies are required for different failure modes.
