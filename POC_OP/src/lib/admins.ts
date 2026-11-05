/**
 * Administradores com acesso total (telas administrativas, Aprovações e gestão de usuários).
 * A mesma lista existe na função `create-user` (supabase/functions) e nas regras do banco
 * (migração 20261106030000): a trava de verdade fica lá, esta lista só decide o que o painel mostra.
 */
export const ADMIN_EMAILS: readonly string[] = [
  "italo.fontes@cgbengenharia.com.br",
  "marcus.vinicius@cgbengenharia.com.br",
];

export function ehAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
