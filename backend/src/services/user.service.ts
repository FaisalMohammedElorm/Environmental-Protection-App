import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { serializeUser, type PublicUser } from "../utils/serializers/user.serializer";
import { uploadImageBuffer } from "./upload.service";

interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string;
}

export async function updateProfile(userId: string, updates: UpdateProfileInput): Promise<PublicUser> {
  if (updates.email) {
    const existing = await User.findOne({ email: updates.email, _id: { $ne: userId } });
    if (existing) throw ApiError.conflict("That email is already in use");
  }

  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound("User not found");
  return serializeUser(user);
}

export async function updateAvatar(userId: string, file: Express.Multer.File): Promise<PublicUser> {
  const avatarUrl = await uploadImageBuffer(file.buffer, "ecoalert/avatars");

  const user = await User.findByIdAndUpdate(userId, { avatarUrl }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return serializeUser(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await User.findById(userId).select("+password");
  if (!user) throw ApiError.notFound("User not found");

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) throw ApiError.unauthorized("Current password is incorrect");

  user.password = newPassword;
  await user.save();
}
