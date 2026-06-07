import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authService from "../service";

const { mockSignInWithPassword, mockFrom } = vi.hoisted(() => {
  return {
    mockSignInWithPassword: vi.fn(),
    mockFrom: vi.fn(),
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
    from: mockFrom,
  })),
}));

describe("login()", () => {
  beforeEach(() => {
    mockSignInWithPassword.mockClear();
    mockFrom.mockClear();
  });

  it("TEST 1: Should reject invalid email format", async () => {
    const result = await authService.login("invalid", "SomePass123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to log in.");
  });

  it("TEST 2: Should reject empty email", async () => {
    const result = await authService.login("", "SomePass123");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to log in.");
  });

  it("TEST 3: Should reject empty password", async () => {
    const result = await authService.login("test@domain.com", "");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to log in.");
  });

  it("TEST 4: Should reject wrong password (invalid credentials)", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("Invalid login credentials"),
    });

    const result = await authService.login("test@domain.com", "WrongPass1");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to log in.");
  });

  it("TEST 5: Should reject unverified email", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("Email not confirmed"),
    });

    const result = await authService.login("test@domain.com", "ValidPass1");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to log in.");
  });

  it("TEST 6: Should reject on rate limiting (too many attempts)", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("Too many requests"),
    });

    const result = await authService.login("test@domain.com", "ValidPass1");

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("Unable to log in.");
  });

  it("TEST 7: Should successfully login user", async () => {
    mockSignInWithPassword.mockResolvedValue({
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

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "uuid-123",
              email: "test@domain.com",
              username: "testuser",
              current_level: 2,
              total_xp: 150,
              created_at: "2024-01-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      }),
    });

    const result = await authService.login("test@domain.com", "ValidPass1");

    expect(result.success).toBe(true);
    expect((result as any).user.email).toBe("test@domain.com");
    expect((result as any).user.username).toBe("testuser");
    expect((result as any).session.access_token).toBe("token-abc");
  });

  it("TEST 8: Should handle missing user record after auth success", async () => {
    mockSignInWithPassword.mockResolvedValue({
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

    const mockSelect = vi.fn();
    const mockEq = vi.fn();
    const mockUpsert = vi.fn();
    const mockInsertSelect = vi.fn();
    const mockInsertSingle = vi.fn();

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        // First call: fetch existing profile
        return {
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error("No rows returned"),
              }),
            }),
          }),
          // Second call: upsert new profile
          upsert: mockUpsert.mockReturnValue({
            select: mockInsertSelect.mockReturnValue({
              single: mockInsertSingle.mockResolvedValue({
                data: {
                  id: "uuid-123",
                  email: "test@domain.com",
                  username: "test",
                  current_level: 1,
                  total_xp: 0,
                  created_at: "2024-01-01T00:00:00Z",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await authService.login("test@domain.com", "ValidPass1");

    expect(result.success).toBe(true);
    expect((result as any).user.email).toBe("test@domain.com");
  });

  it("TEST 9: Should normalize email to lowercase before auth call", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: "uuid-123" },
        session: { access_token: "token", refresh_token: "refresh" },
      },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "uuid-123",
              email: "test@domain.com",
              username: "testuser",
              current_level: 1,
              total_xp: 0,
              created_at: "2024-01-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      }),
    });

    await authService.login("Test@Domain.COM", "ValidPass1");

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@domain.com",
      password: "ValidPass1",
    });
  });
});