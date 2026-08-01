import * as authService from "../../src/services/auth.service";
import { User } from "../../src/models/User";
import { ApiError } from "../../src/utils/ApiError";

describe("auth.service", () => {
  describe("register", () => {
    it("creates a user with a hashed password and returns tokens", async () => {
      const result = await authService.register({
        name: "Ama Owusu",
        email: "ama@example.com",
        password: "StrongPass1"
      });

      expect(result.user.email).toBe("ama@example.com");
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));

      const stored = await User.findOne({ email: "ama@example.com" }).select("+password");
      expect(stored?.password).not.toBe("StrongPass1");
    });

    it("rejects registration with a duplicate email", async () => {
      await authService.register({ name: "First", email: "dupe@example.com", password: "StrongPass1" });

      await expect(
        authService.register({ name: "Second", email: "dupe@example.com", password: "StrongPass1" })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await authService.register({ name: "Kwesi", email: "kwesi@example.com", password: "StrongPass1" });
    });

    it("logs in with correct credentials", async () => {
      const result = await authService.login({ email: "kwesi@example.com", password: "StrongPass1" });
      expect(result.user.email).toBe("kwesi@example.com");
    });

    it("rejects an incorrect password", async () => {
      await expect(
        authService.login({ email: "kwesi@example.com", password: "WrongPassword1" })
      ).rejects.toThrow(ApiError);
    });

    it("rejects a suspended account", async () => {
      await User.findOneAndUpdate({ email: "kwesi@example.com" }, { isActive: false });

      await expect(
        authService.login({ email: "kwesi@example.com", password: "StrongPass1" })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("refreshAccessToken", () => {
    it("issues a new access token and rotates the refresh token", async () => {
      const { refreshToken } = await authService.register({
        name: "Grace",
        email: "grace@example.com",
        password: "StrongPass1"
      });

      const result = await authService.refreshAccessToken(refreshToken);
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).not.toBe(refreshToken);

      // The original (single-use) refresh token should no longer be valid.
      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow(ApiError);
    });
  });

  describe("forgotPassword / resetPassword", () => {
    it("resets the password with a valid token and invalidates it after use", async () => {
      await authService.register({ name: "Yaw", email: "yaw@example.com", password: "StrongPass1" });

      // forgotPassword doesn't return the token directly (it's emailed), so we issue one
      // the same way the service does, to test resetPassword in isolation.
      const user = await User.findOne({ email: "yaw@example.com" });
      const { issueToken } = await import("../../src/services/token.service");
      const rawToken = await issueToken(user!.id, "password_reset");

      await authService.resetPassword(rawToken, "NewStrongPass1");

      const loginResult = await authService.login({ email: "yaw@example.com", password: "NewStrongPass1" });
      expect(loginResult.user.email).toBe("yaw@example.com");

      await expect(authService.resetPassword(rawToken, "AnotherPass1")).rejects.toThrow(ApiError);
    });
  });
});
