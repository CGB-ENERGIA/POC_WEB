import { ref, readonly } from "vue";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { clearRoleCache } from "@/lib/role";

const user = ref<User | null>(null);
const loading = ref(true);

supabase.auth.getSession().then(({ data }) => {
  user.value = data.session?.user ?? null;
  loading.value = false;
});

supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null;
});

export function useAuth() {
  async function signOut() {
    await supabase.auth.signOut();
    clearRoleCache();
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    signOut,
  };
}
