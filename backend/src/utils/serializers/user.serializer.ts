export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export function serializeUser(row: ProfileRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString()
  };
}
