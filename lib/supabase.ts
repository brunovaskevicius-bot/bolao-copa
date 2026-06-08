import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente público (browser) — usa a anon key
export const supabase = createClient(url, anon);

// Cliente server-side com service role (para mutations seguras em API routes)
export function supabaseAdmin() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---- Tipos ----

export type Participante = {
  id: string;
  nome: string;
  created_at: string;
};

export type Jogo = {
  id: string;
  numero_jogo: number;
  fase: string;
  grupo: string | null;
  time1: string;
  bandeira1: string | null;
  time2: string;
  bandeira2: string | null;
  data_jogo: string | null;
  gols1_real: number | null;
  gols2_real: number | null;
  apurado: boolean;
};

export type Palpite = {
  id: string;
  participante_id: string;
  jogo_id: string;
  palpite1: number;
  palpite2: number;
  pontos: number | null;
};

export type Upload = {
  id: string;
  participante_id: string;
  storage_path: string | null;
  status: "pendente" | "processando" | "revisao" | "confirmado" | "erro";
  ai_extracao: PalpiteExtraido[] | null;
  erro_msg: string | null;
};

// ---- Tipo retornado pelo Gemini ----

export type PalpiteExtraido = {
  numero_jogo?: number;     // se o template tiver numeração
  time1: string;
  time2: string;
  gols1: number;
  gols2: number;
  confianca: number;        // 0.0 – 1.0
};
