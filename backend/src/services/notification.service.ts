import type { Types } from "mongoose";
import { Notification } from "../models/Notification";
import type { NotificationType } from "../types/enums";
import { ApiError } from "../utils/ApiError";
import { paginate, type Paginated } from "../utils/apiResponse";
import { serializeNotification, type PublicNotification } from "../utils/serializers/notification.serializer";

interface CreateNotificationInput {
  user: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  body: string;
  relatedReport?: Types.ObjectId | string;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await Notification.create(input);
}

export async function listNotifications(
  userId: string,
  page: number,
  limit: number
): Promise<Paginated<PublicNotification>> {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: userId })
  ]);

  return paginate(notifications.map(serializeNotification), total, page, limit);
}

export async function markNotificationRead(userId: string, id: string): Promise<PublicNotification> {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound("Notification not found");
  return serializeNotification(notification);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
}
