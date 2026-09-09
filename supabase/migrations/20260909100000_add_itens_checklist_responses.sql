-- Guarda a condicao individual de cada item quando a pergunta menciona mais de uma coisa
-- (ex: "EPI (capacete, vestimenta, bota de seguranca)"). Formato: [{"nome": "...", "conforme": bool}, ...]
-- null = pergunta nao tem lista de itens, ou registro anterior a esta feature.
ALTER TABLE public.checklist_responses
  ADD COLUMN IF NOT EXISTS itens jsonb;
