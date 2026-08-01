import type { IUser } from "../../models/User";

export interface PublicAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  reportsFiled?: number;
  reportsResolved?: number;
  createdAt: string;
}

export function serializeAdminUser(
  user: IUser,
  stats?: { reportsFiled: number; reportsResolved: number }
): PublicAdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    reportsFiled: stats?.reportsFiled,
    reportsResolved: stats?.reportsResolved,
    createdAt: user.createdAt.toISOString()
  };
}
