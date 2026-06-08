-- =============================================================
-- BOLÃO DA COPA 2026 — Schema Supabase
-- Roda no SQL Editor do Supabase (https://supabase.com/dashboard)
-- =============================================================

-- Participantes
create table if not exists participantes (
  id         uuid default gen_random_uuid() primary key,
  nome       text not null,
  created_at timestamptz default now()
);

-- Jogos (preenchido pelo admin antes do torneio)
create table if not exists jogos (
  id          uuid default gen_random_uuid() primary key,
  numero_jogo int  not null unique,
  fase        text not null, -- 'grupos' | 'oitavas' | 'quartas' | 'semi' | 'terceiro' | 'final'
  grupo       text,          -- 'A'–'L' (null para fase eliminatória)
  time1       text not null,
  bandeira1   text,          -- código emoji ex: '🇧🇷'
  time2       text not null,
  bandeira2   text,
  data_jogo   timestamptz,
  -- Resultado real (preenchido pelo admin depois)
  gols1_real  int,
  gols2_real  int,
  apurado     boolean default false,
  created_at  timestamptz default now()
);

-- Palpites (um por participante por jogo)
create table if not exists palpites (
  id              uuid default gen_random_uuid() primary key,
  participante_id uuid references participantes(id) on delete cascade,
  jogo_id         uuid references jogos(id)         on delete cascade,
  palpite1        int  not null,
  palpite2        int  not null,
  -- Pontuação calculada após apuração
  -- 5 pts = placar exato | 3 pts = vencedor/empate certo | 0 = errou
  pontos          int,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(participante_id, jogo_id)
);

-- Uploads (rastreia cada envio de imagem)
create table if not exists uploads (
  id              uuid default gen_random_uuid() primary key,
  participante_id uuid references participantes(id) on delete cascade,
  storage_path    text,   -- caminho no Supabase Storage
  status          text default 'pendente',
  -- status: 'pendente' | 'processando' | 'revisao' | 'confirmado' | 'erro'
  ai_extracao     jsonb,  -- JSON bruto retornado pelo Gemini
  erro_msg        text,   -- mensagem de erro se houver
  created_at      timestamptz default now()
);

-- =============================================================
-- Views úteis
-- =============================================================

-- Pontuação total por participante (para o ranking final)
create or replace view ranking as
select
  p.id,
  p.nome,
  coalesce(sum(pal.pontos), 0)                          as pontos_total,
  count(pal.id) filter (where pal.pontos > 0)           as acertos,
  count(pal.id) filter (where pal.pontos is not null)   as jogos_apurados
from participantes p
left join palpites pal on pal.participante_id = p.id
group by p.id, p.nome
order by pontos_total desc;

-- Pontos por dia por participante (para o gráfico de evolução)
create or replace view pontos_por_dia as
select
  pal.participante_id,
  p.nome,
  date(j.data_jogo at time zone 'America/Sao_Paulo') as dia,
  sum(pal.pontos)                                     as pontos_dia
from palpites pal
join participantes p on p.id = pal.participante_id
join jogos j         on j.id = pal.jogo_id
where pal.pontos is not null
group by pal.participante_id, p.nome, dia
order by dia;

-- =============================================================
-- Função: calcular pontos de um jogo após apuração
-- Chamada pelo admin ao salvar resultado real
-- =============================================================
create or replace function calcular_pontos_jogo(p_jogo_id uuid)
returns void as $$
declare
  v_gols1 int;
  v_gols2 int;
begin
  select gols1_real, gols2_real into v_gols1, v_gols2
  from jogos where id = p_jogo_id;

  update palpites
  set
    pontos = case
      -- Placar exato
      when palpite1 = v_gols1 and palpite2 = v_gols2 then 5
      -- Acertou vencedor (time1 ganhou)
      when palpite1 > palpite2 and v_gols1 > v_gols2   then 3
      -- Acertou vencedor (time2 ganhou)
      when palpite1 < palpite2 and v_gols1 < v_gols2   then 3
      -- Acertou empate
      when palpite1 = palpite2 and v_gols1 = v_gols2   then 3
      -- Errou
      else 0
    end,
    updated_at = now()
  where jogo_id = p_jogo_id;

  update jogos set apurado = true where id = p_jogo_id;
end;
$$ language plpgsql;

-- =============================================================
-- Storage bucket (rodar separado ou via dashboard)
-- create bucket "uploads" with public = false;
-- =============================================================
