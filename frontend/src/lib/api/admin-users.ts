import { supabase } from "@/lib/supabase/client";
import type { AdminUser, AdminUserListParams } from "@/types/admin-user";
import type { PaginatedResponse } from "@/types/report";

// Reads go through the admin_list_users RPC (supabase/migrations/0011_client_direct_access.sql)
// rather than a plain client SELECT — profiles_select_staff (needed so officers can see
// reporter names on reports they triage) is broader than "admin only", so this RPC
// reproduces the old Express route's narrower admin-only guarantee for user management.
interface AdminListUsersRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  reports_filed: number | null;
  reports_resolved: number | null;
  total_count: number;
}

export async function getUsers(params: AdminUserListParams): Promise<PaginatedResponse<AdminUser>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;

  const { data, error } = await supabase.rpc("admin_list_users", {
    p_role: params.role ?? null,
    p_search: params.search ?? null,
    p_page: page,
    p_limit: limit
  });
  if (error) throw error;

  const rows = (data ?? []) as AdminListUsersRow[];
  const total = rows[0]?.total_count ?? 0;

  const items: AdminUser[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as AdminUser["role"],
    isActive: row.is_active,
    reportsFiled: row.reports_filed ?? undefined,
    reportsResolved: row.reports_resolved ?? undefined,
    createdAt: row.created_at
  }));

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

const ADMIN_USER_SELECT = "id, name, email, role, is_active, created_at";

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

function serialize(row: ProfileRow): AdminUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role as AdminUser["role"], isActive: row.is_active, createdAt: row.created_at };
}

// Mutations go straight to profiles — RLS's profiles_update_admin (admin-only)
// already enforces the same authorization the Express route used to.
export async function setUserActive(id: string, isActive: boolean): Promise<AdminUser> {
  const { data, error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", id).select(ADMIN_USER_SELECT).single();
  if (error || !data) throw error ?? new Error("Could not update user");
  return serialize(data as unknown as ProfileRow);
}

export async function setUserRole(id: string, role: string): Promise<AdminUser> {
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", id).select(ADMIN_USER_SELECT).single();
  if (error || !data) throw error ?? new Error("Could not update user");
  return serialize(data as unknown as ProfileRow);
}
