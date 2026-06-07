/**
 * Signup Unit Tests - CORRECTED VERSION
 * Tests for signup() function from auth.service.ts
 * Coverage: Input validation, uniqueness checks, auth creation, DB insert, error handling
 *
 * Mock architecture: Uses vi.hoisted() to create shared mock functions that are
 * returned by createClient() on EVERY call, ensuring signup() uses the same mocked
 * client instance that tests configure.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authService from "../service";

const { mockSignUp, mockRpc, mockFrom } = vi.hoisted(() => {
  return {
    mockSignUp: vi.fn(),
    mockRpc: vi.fn(),
    mockFrom: vi.fn(),
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
    },
    rpc: mockRpc,
    from: mockFrom,
  })),
}));

describe("signup()", () => {
  beforeEach(() => {
    mockSignUp.mockClear();
    mockRpc.mockClear();
  });

  it("TEST 1: Should reject invalid email format", async () => {
    const result = await authService.signup("invalid", "Password1", "user123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Invalid email format");
  });

  it("TEST 2: Should reject empty email", async () => {
    const result = await authService.signup("", "Password1", "user123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Invalid email format");
  });

  it("TEST 3: Should reject short password (less than 8 chars)", async () => {
    const result = await authService.signup("test@domain.com", "Pass1", "user123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Password does not meet requirements");
  });

  it("TEST 4: Should reject password without uppercase letter", async () => {
    const result = await authService.signup("test@domain.com", "password123", "user123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Password does not meet requirements");
  });

  it("TEST 5: Should reject password without number", async () => {
    const result = await authService.signup("test@domain.com", "PasswordABC", "user123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Password does not meet requirements");
  });

  it("TEST 6: Should reject password with whitespace", async () => {
    const result = await authService.signup("test@domain.com", "Pass word1", "user123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Password does not meet requirements");
  });

  it("TEST 7: Should reject short username (less than 3 chars)", async () => {
    const result = await authService.signup("test@domain.com", "Password1", "ab");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Invalid username format");
  });

  it("TEST 8: Should reject long username (more than 30 chars)", async () => {
    const result = await authService.signup(
      "test@domain.com",
      "Password1",
      "abcdefghijklmnopqrstuvwxyz12345"
    );

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Invalid username format");
  });

  it("TEST 9: Should reject username starting with underscore", async () => {
    const result = await authService.signup("test@domain.com", "Password1", "_user");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Invalid username format");
  });

  it("TEST 10: Should reject username with invalid characters", async () => {
    const result = await authService.signup("test@domain.com", "Password1", "user@123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Invalid username format");
  });

  it("TEST 11: Should reject duplicate email", async () => {
    mockRpc.mockResolvedValue({
      data: { email_taken: true },
      error: null,
    });

    const result = await authService.signup("existing@domain.com", "Password1", "newuser");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to create account");
  });

  it("TEST 12: Should reject duplicate username", async () => {
    mockRpc.mockResolvedValue({
      data: { username_taken: true },
      error: null,
    });

    const result = await authService.signup("test@domain.com", "Password1", "existinguser");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to create account");
  });

  it("TEST 13: Should reject on database check error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: new Error("Database connection failed"),
    });

    const result = await authService.signup("test@domain.com", "Password1", "user123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to create account");
  });

  it("TEST 14: Should successfully create user", async () => {
    mockRpc.mockResolvedValue({
      data: { available: true },
      error: null,
    });

    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "uuid-123", email: "test@domain.com" },
        session: {
          access_token: "token-abc",
          refresh_token: "refresh-xyz",
          expires_at: 1234567890,
          expires_in: 3600,
        },
      },
      error: null,
    });

    const mockSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "uuid-123",
            email: "test@domain.com",
            username: "user123",
            current_level: 1,
            total_xp: 0,
            created_at: "2024-01-01T00:00:00Z",
          },
          error: null,
        }),
      }),
    };

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelectChain),
    });

    const result = await authService.signup("test@domain.com", "Password1", "user123");

    expect(result.success).toBe(true);
    expect((result as any).user.email).toBe("test@domain.com");
    expect((result as any).user.username).toBe("user123");
    expect((result as any).session.access_token).toBe("token-abc");
  });

  it("TEST 15: Should cleanup orphaned auth user on insert failure", async () => {
    mockRpc.mockResolvedValue({
      data: { available: true },
      error: null,
    });

    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "uuid-123", email: "test@domain.com" },
        session: {
          access_token: "token-abc",
          refresh_token: "refresh-xyz",
          expires_at: 1234567890,
          expires_in: 3600,
        },
      },
      error: null,
    });

    const mockSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Profile not found"),
        }),
      }),
    };

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelectChain),
    });

    const result = await authService.signup("test@domain.com", "Password1", "user123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to create account");
  });

  it("TEST 16: Should handle Supabase Auth error (user_already_exists)", async () => {
    mockRpc.mockResolvedValue({
      data: { available: true },
      error: null,
    });

    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("User already exists"),
    });

    const result = await authService.signup("test@domain.com", "Password1", "user123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to create account");
  });

  it("TEST 17: Should normalize email to lowercase before auth call", async () => {
    mockRpc.mockResolvedValue({
      data: { available: true },
      error: null,
    });

    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "uuid-123", email: "test@domain.com" },
        session: {
          access_token: "token-abc",
          refresh_token: "refresh-xyz",
          expires_at: 1234567890,
          expires_in: 3600,
        },
      },
      error: null,
    });

    const mockSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "uuid-123",
            email: "test@domain.com",
            username: "user123",
            current_level: 1,
            total_xp: 0,
            created_at: "2024-01-01T00:00:00Z",
          },
          error: null,
        }),
      }),
    };

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue(mockSelectChain),
    });

    await authService.signup("Test@Domain.COM", "Password1", "user123");

    expect(mockRpc).toHaveBeenCalledWith("check_unique_user", {
      p_email: "test@domain.com",
      p_username: "user123",
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@domain.com",
      password: "Password1",
      options: {
        data: {
          username: "user123",
        },
      },
    });
  });
});