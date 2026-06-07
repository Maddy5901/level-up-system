/**
 * Authentication Validation Schemas
 * Zod validators for signup, login, and input validation
 * All validation rules defined here (single source of truth)
 */

import { z } from "zod";

/**
 * Email validation regex
 * RFC 5321 compliant pattern (simplified, not perfect but good enough for UX)
 * Requires: local@domain.extension
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Username validation regex
 * Allows: alphanumeric, underscore, hyphen
 * Prevents: special characters, spaces, leading/trailing _ -
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Signup input validation schema
 * Validates email format, password strength, username format
 */
export const SignupSchema = z.object({
  email: z
    .string("Email is required")
    .min(1, "Email cannot be empty")
    .email("Invalid email format") // Zod built-in email check
    .regex(EMAIL_REGEX, "Invalid email format")
    .max(254, "Email too long (max 254 characters)")
    .toLowerCase(), // Normalize to lowercase

  password: z
    .string("Password is required")
    .min(1, "Password cannot be empty")
    .min(8, "Password must be at least 8 characters")
    .refine((pwd) => /[A-Z]/.test(pwd), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((pwd) => /[0-9]/.test(pwd), {
      message: "Password must contain at least one number",
    })
    .refine((pwd) => !/\s/.test(pwd), {
      message: "Password cannot contain whitespace",
    }),

  username: z
    .string("Username is required")
    .min(1, "Username cannot be empty")
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(USERNAME_REGEX, "Username can only contain alphanumeric, _, and -")
    .refine(
      (username) => !/^[_-]|[_-]$/.test(username),
      "Username cannot start or end with _ or -"
    ),
});

export type SignupInput = z.infer<typeof SignupSchema>;

/**
 * Login input validation schema
 * Validates email format and password presence (no strength check)
 */
export const LoginSchema = z.object({
  email: z
    .string("Email is required")
    .min(1, "Email cannot be empty")
    .email("Invalid email format")
    .regex(EMAIL_REGEX, "Invalid email format")
    .toLowerCase(),

  password: z
    .string("Password is required")
    .min(1, "Password cannot be empty"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Validates signup input
 * Returns validation result with errors array if invalid
 */
export function validateSignupInput(
  input: unknown
): { valid: boolean; errors: string[] } {
  try {
    SignupSchema.parse(input);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e) => e.message);
      return { valid: false, errors };
    }
    return { valid: false, errors: ["Validation failed"] };
  }
}

/**
 * Validates login input
 * Returns validation result with errors array if invalid
 */
export function validateLoginInput(
  input: unknown
): { valid: boolean; errors: string[] } {
  try {
    LoginSchema.parse(input);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e) => e.message);
      return { valid: false, errors };
    }
    return { valid: false, errors: ["Validation failed"] };
  }
}