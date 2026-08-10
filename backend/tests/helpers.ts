import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../src/config/supabaseAdmin";
import { sql } from "../src/config/db";
import type { UserRole } from "../src/types/enums";

// A plain anon-key client, exactly like the frontend uses, to mint real
// sessions for test users via password grant — this project signs access
// tokens with an asymmetric key (ES256), so there's no shared secret to
// forge tokens with locally; a real sign-in is the only way to get one.
const anonClient = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

interface CreateTestUserOptions {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

const DEFAULT_PASSWORD = "StrongPass1";

// Tracked so setupAfterEnv.ts can delete every user a test file created,
// once, in that file's afterAll — see resetCreatedUserIds()/getCreatedUserIds().
let createdUserIds: string[] = [];

export function resetCreatedUserIds(): void {
  createdUserIds = [];
}

export function getCreatedUserIds(): string[] {
  return createdUserIds;
}

export async function createTestUser(options: CreateTestUserOptions = {}): Promise<TestUser> {
  const email = options.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = options.password ?? DEFAULT_PASSWORD;
  const name = options.name ?? "Test User";
  const role = options.role ?? "citizen";

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });
  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message ?? "unknown error"}`);
  }

  createdUserIds.push(data.user.id);

  if (role !== "citizen") {
    // handle_new_user always creates the profile as 'citizen' — promote it.
    await sql`update public.profiles set role = ${role} where id = ${data.user.id}`;
  }

  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
  if (signInError || !signInData.session) {
    throw new Error(`Failed to sign in test user: ${signInError?.message ?? "unknown error"}`);
  }

  return { id: data.user.id, name, email, role, token: signInData.session.access_token };
}

export function authHeader(user: TestUser): { Authorization: string } {
  return { Authorization: `Bearer ${user.token}` };
}
