import { User, type IUser } from "../src/models/User";
import { signAccessToken } from "../src/utils/jwt";
import type { UserRole } from "../src/types/enums";

interface CreateTestUserOptions {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export async function createTestUser(options: CreateTestUserOptions = {}): Promise<IUser> {
  return User.create({
    name: options.name ?? "Test User",
    email: options.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: options.password ?? "StrongPass1",
    role: options.role ?? "citizen"
  });
}

export function tokenFor(user: IUser): string {
  return signAccessToken({ sub: user.id, role: user.role });
}

export function authHeader(user: IUser): { Authorization: string } {
  return { Authorization: `Bearer ${tokenFor(user)}` };
}
