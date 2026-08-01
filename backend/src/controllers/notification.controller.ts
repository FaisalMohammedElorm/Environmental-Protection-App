import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as notificationService from "../services/notification.service";

export const listNotificationsHandler = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await notificationService.listNotifications(req.user!.id, page, limit);
  res.status(200).json(result);
});

export const markNotificationReadHandler = catchAsync(async (req: Request, res: Response) => {
  const notification = await notificationService.markNotificationRead(req.user!.id, req.params.id as string);
  res.status(200).json(notification);
});

export const markAllNotificationsReadHandler = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAllNotificationsRead(req.user!.id);
  res.status(200).json({ message: "All notifications marked as read" });
});
