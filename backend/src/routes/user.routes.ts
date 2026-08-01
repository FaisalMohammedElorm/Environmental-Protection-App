import { Router } from "express";
import { updateProfileHandler, changePasswordHandler, uploadAvatarHandler } from "../controllers/user.controller";
import { protect } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { updateProfileSchema, changePasswordSchema } from "../validators/user.validator";
import { uploadAvatarImage, validateAvatarSignature } from "../middleware/upload";

const router = Router();

router.use(protect);

router.patch("/me", validateRequest({ body: updateProfileSchema }), updateProfileHandler);
router.post("/me/change-password", validateRequest({ body: changePasswordSchema }), changePasswordHandler);
router.post("/me/avatar", uploadAvatarImage, validateAvatarSignature, uploadAvatarHandler);

export default router;
