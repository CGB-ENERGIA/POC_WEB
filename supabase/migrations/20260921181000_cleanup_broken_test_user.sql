-- A senha do usuário de teste inserida via SQL bruto (crypt/gen_salt) não
-- bateu com o hash que o GoTrue (Supabase Auth) espera — login falhou.
-- Remove essa conta quebrada; o usuário de teste correto deve ser criado
-- pela própria tela "Aprovações de Acesso" (botão "Criar Usuário"), que usa
-- a Admin API oficial do Supabase e sempre gera a senha corretamente.
do $$
declare
  uid uuid;
begin
  select id into uid from auth.users where email = 'membro.teste@cgbengenharia.com.br';
  if uid is not null then
    delete from public.profiles where id = uid;
    delete from auth.identities where user_id = uid;
    delete from auth.users where id = uid;
  end if;
end $$;
