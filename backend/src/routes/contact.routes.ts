import { Router } from "express";
import { validateRequest } from "../middleware/validateRequest";
import { contactSchema } from "../validators/contact.validator";
import { authRateLimiter } from "../middleware/rateLimiter";
import { contactHandler } from "../controllers/contact.controller";

const router = Router();

router.post("/", authRateLimiter, validateRequest({ body: contactSchema }), contactHandler);

export default router;

