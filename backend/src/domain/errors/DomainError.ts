/**
 * Base class for all domain/application errors. Carries a stable string `code`
 * that the HTTP layer maps to a status (keeping the domain ignorant of HTTP).
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Input failed a domain/business rule (not transport-level validation). */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}

export class EmailAlreadyInUseError extends DomainError {
  readonly code = 'EMAIL_ALREADY_IN_USE';
  constructor() {
    super('An account with this email already exists.');
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';
  constructor() {
    super('Invalid email or password.');
  }
}

/** The request is authenticated by a token, but the account it points to no longer
 * exists (e.g. a token left over from a reset database). The client should sign in again. */
export class AuthenticationError extends DomainError {
  readonly code = 'UNAUTHENTICATED';
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
}

/** A confirmed booking already exists for this slot — cannot book again. */
export class SlotUnavailableError extends DomainError {
  readonly code = 'SLOT_UNAVAILABLE';
  constructor() {
    super('This slot has already been booked.');
  }
}

/** Another user currently holds a temporary reservation on this slot. */
export class SlotAlreadyReservedError extends DomainError {
  readonly code = 'SLOT_ALREADY_RESERVED';
  constructor() {
    super('This slot is currently reserved by someone else.');
  }
}

/** The caller's temporary reservation has expired or never existed. */
export class ReservationExpiredError extends DomainError {
  readonly code = 'RESERVATION_EXPIRED';
  constructor() {
    super('Your reservation has expired. Please select the slot again.');
  }
}
