// Endpoint temporário de diagnóstico — remover após resolver
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();

  // Checa env vars (sem expor os valores completos)
  const envStatus = {
    SUPABASE_URL:          !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY:     !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SERVICE_ROLE_KEY:      !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_KEY:            !!process.env.GEMINI_API_KEY,
    SERVICE_KEY_PREVIEW:   process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) ?? "NOT SET",
  };

  // Tenta buscar jogos
  const { data, error, count } = await db
    .from("jogos")
    .select("*", { count: "exact" })
    .limit(2);

  return NextResponse.json({
    env: envStatus,
    jogos_count: count,
    jogos_sample: data,
    db_error: error?.message ?? null,
  });
}
