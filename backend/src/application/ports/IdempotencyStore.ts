export interface StoredResponse {
  status: number;
  body: unknown;
}

export type ClaimResult =
  | { kind: 'claimed' } // first time — caller should process and then save()
  | { kind: 'pending' } // an identical request is still in flight
  | { kind: 'replay'; response: StoredResponse }; // we have the prior result

/**
 * Deduplicates retried writes (e.g. a confirm-booking resent after a network blip).
 * Keyed by a client-supplied Idempotency-Key scoped to the user.
 */
export interface IdempotencyStore {
  claim(key: string, pendingTtlSeconds: number): Promise<ClaimResult>;
  save(key: string, response: StoredResponse, ttlSeconds: number): Promise<void>;
  discard(key: string): Promise<void>;
}
