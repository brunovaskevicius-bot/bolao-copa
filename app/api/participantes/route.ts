import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/participantes?q=carlita
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const db = supabaseAdmin();
  const { data } = await db
    .from("participantes")
    .select("nome")
    .ilike("nome", `%${q}%`)
    .limit(5);

  return NextResponse.json((data ?? []).map((p: { nome: string }) => p.nome));
}
