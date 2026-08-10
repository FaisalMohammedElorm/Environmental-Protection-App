import { Router } from "express";
import { updateProfileHandler, uploadAvatarHandler } from "../controllers/user.controller";
import { protect } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { updateProfileSchema } from "../validators/user.validator";
import { uploadAvatarImage, validateAvatarSignature } from "../middleware/upload";

const router = Router();

router.use(protect);

// Email changes and password changes now go through Supabase Auth directly
// from the frontend (supabase.auth.updateUser) — Express no longer owns
// credentials, so there's nothing for it to validate or store here.
router.patch("/me", validateRequest({ body: updateProfileSchema }), updateProfileHandler);
router.post("/me/avatar", uploadAvatarImage, validateAvatarSignature, uploadAvatarHandler);

export default router;
