import type { UserRole } from "@/types/auth";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  reportsFiled?: number;
  reportsResolved?: number;
  createdAt: string;
}

export interface AdminUserListParams {
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
}
