import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { isValidImageBuffer } from "../utils/fileSignature";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILES = 8;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.memoryStorage();

const imageFileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  // This only checks the client-declared Content-Type of the part, which is spoofable —
  // real content validation happens in the validate*Signature(s) middleware below, once
  // multer has actually buffered the bytes. This first check is just a cheap early rejection.
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest("Only JPEG, PNG, or WEBP images are allowed"));
    return;
  }
  cb(null, true);
};

export const uploadReportImages = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: MAX_FILES },
  fileFilter: imageFileFilter
}).array("images", MAX_FILES);

export const uploadAvatarImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: imageFileFilter
}).single("avatar");

/**
 * Verifies each uploaded file's actual byte signature matches a real image format,
 * rejecting anything whose content doesn't match what it claimed to be (e.g. a script or
 * executable renamed with a .jpg extension and a spoofed Content-Type).
 */
export function validateImageSignatures(req: Request, res: Response, next: NextFunction): void {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  const invalidFile = files.find((file) => !isValidImageBuffer(file.buffer));
  if (invalidFile) {
    next(ApiError.badRequest(`"${invalidFile.originalname}" is not a valid image file`));
    return;
  }

  next();
}

export function validateAvatarSignature(req: Request, res: Response, next: NextFunction): void {
  const file = req.file as Express.Multer.File | undefined;

  if (file && !isValidImageBuffer(file.buffer)) {
    next(ApiError.badRequest(`"${file.originalname}" is not a valid image file`));
    return;
  }

  next();
}
