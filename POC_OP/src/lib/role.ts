import { supabase } from "@/lib/supabase";

export type Role = "admin" | "member";

let cache: { userId: string; role: Role | null } | null = null;

// Ausência de linha em `profiles` (cache role === null) significa acesso
// total — o mesmo comportamento de hoje para todas as contas existentes.
// Só role === "member" restringe a navegação.
export async function getRole(userId: string): Promise<Role | null> {
  if (cache && cache.userId === userId) return cache.role;
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const role = (data?.role as Role | undefined) ?? null;
  cache = { userId, role };
  return role;
}

export function clearRoleCache() {
  cache = null;
}
