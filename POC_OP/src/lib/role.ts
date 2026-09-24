import { supabase } from "@/lib/supabase";

export type Role = "admin" | "member";

interface ProfileCache {
  userId: string;
  role: Role | null;
  mustChangePassword: boolean;
}

let cache: ProfileCache | null = null;

export async function getProfile(userId: string): Promise<ProfileCache> {
  if (cache && cache.userId === userId) return cache;
  const { data } = await supabase
    .from("profiles")
    .select("role, must_change_password")
    .eq("id", userId)
    .maybeSingle();
  const role = (data?.role as Role | undefined) ?? null;
  const mustChangePassword = data?.must_change_password ?? false;
  cache = { userId, role, mustChangePassword };
  return cache;
}

export async function getRole(userId: string): Promise<Role | null> {
  return (await getProfile(userId)).role;
}

export async function clearMustChangePassword(userId: string): Promise<void> {
  await supabase.from("profiles").update({ must_change_password: false }).eq("id", userId);
  if (cache && cache.userId === userId) cache.mustChangePassword = false;
}

export function clearRoleCache() {
  cache = null;
}
