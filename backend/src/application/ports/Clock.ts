/** Abstracts the current time so use cases stay deterministic and testable. */
export interface Clock {
  now(): number; // epoch milliseconds
}
