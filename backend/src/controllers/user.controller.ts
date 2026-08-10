import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import * as userService from "../services/user.service";

export const updateProfileHandler = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.user!.id, req.body);
  res.status(200).json(user);
});

export const uploadAvatarHandler = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    throw ApiError.badRequest("No image file was provided");
  }
  const user = await userService.updateAvatar(req.user!.id, file);
  res.status(200).json(user);
});
