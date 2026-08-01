import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "../auth";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({ email: "ama@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "ama@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = {
    name: "Ama Owusu",
    email: "ama@example.com",
    password: "StrongPass1",
    confirmPassword: "StrongPass1",
    agreeToTerms: true as const
  };

  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "Different1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password without an uppercase letter", () => {
    const result = registerSchema.safeParse({ ...base, password: "weakpass1", confirmPassword: "weakpass1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a number", () => {
    const result = registerSchema.safeParse({ ...base, password: "WeakPassword", confirmPassword: "WeakPassword" });
    expect(result.success).toBe(false);
  });

  it("requires the terms checkbox to be checked", () => {
    const result = registerSchema.safeParse({ ...base, agreeToTerms: false });
    expect(result.success).toBe(false);
  });
});
