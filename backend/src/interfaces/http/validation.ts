import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(200),
});

export const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const reserveSlotSchema = z.object({
  pitchId: z.string().uuid('Invalid pitch id'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startHour: z.number().int().min(0).max(23),
});

export const confirmBookingSchema = reserveSlotSchema;

// Used by GET /slots query params (strings → coerced where needed).
export const slotsQuerySchema = z.object({
  pitchId: z.string().uuid('Invalid pitch id'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});
