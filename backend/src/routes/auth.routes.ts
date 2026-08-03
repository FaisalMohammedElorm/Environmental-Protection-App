import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  logoutAllHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyEmailHandler,
  getMeHandler
} from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validateRequest";
import { protect } from "../middleware/auth";
import { verifyCsrfToken } from "../middleware/csrf";
import { authRateLimiter } from "../middleware/rateLimiter";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from "../validators/auth.validator";

const router = Router();

router.post("/register", authRateLimiter, validateRequest({ body: registerSchema }), registerHandler);
router.post("/login", authRateLimiter, validateRequest({ body: loginSchema }), loginHandler);
router.post("/refresh-token", verifyCsrfToken, refreshTokenHandler);
router.post("/logout", verifyCsrfToken, logoutHandler);
router.post("/logout-all", protect, verifyCsrfToken, logoutAllHandler);
router.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  forgotPasswordHandler
);
router.post("/reset-password", authRateLimiter, validateRequest({ body: resetPasswordSchema }), resetPasswordHandler);
router.post("/verify-email", validateRequest({ body: verifyEmailSchema }), verifyEmailHandler);
router.get("/me", protect, getMeHandler);

export default router;
