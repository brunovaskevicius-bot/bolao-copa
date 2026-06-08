import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/meus-palpites?nome=carlita
export async function GET(req: NextRequest) {
  const nome = req.nextUrl.searchParams.get("nome") ?? "";
  if (!nome) return NextResponse.json({ erro: "Nome obrigatório" }, { status: 400 });

  const db = supabaseAdmin();

  const { data: participantes } = await db
    .from("participantes")
    .select("id, nome")
    .ilike("nome", `%${nome}%`)
    .limit(1);

  if (!participantes || participantes.length === 0) {
    return NextResponse.json({ erro: "Participante não encontrado" }, { status: 404 });
  }

  const part = participantes[0];

  const { data: palpites } = await db
    .from("palpites")
    .select(`
      id, palpite1, palpite2, pontos,
      jogos (
        id, time1, time2, bandeira1, bandeira2,
        data_jogo, gols1_real, gols2_real, apurado
      )
    `)
    .eq("participante_id", part.id)
    .order("created_at", { ascending: false });

  const lista = palpites ?? [];
  const apurados    = lista.filter((p: any) => p.jogos?.apurado);
  const pontos      = apurados.reduce((s: number, p: any) => s + (p.pontos ?? 0), 0);
  const acertos     = apurados.filter((p: any) => (p.pontos ?? 0) > 0).length;

  // Histórico por dia
  const porDia: Record<string, number> = {};
  for (const p of apurados as any[]) {
    if (!p.jogos?.data_jogo) continue;
    const dia = new Date(p.jogos.data_jogo).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",
    });
    porDia[dia] = (porDia[dia] ?? 0) + (p.pontos ?? 0);
  }
  const historico = Object.entries(porDia)
    .slice(-7)
    .map(([dia, pts]) => ({ dia, pontos: pts }));

  return NextResponse.json({
    nome: part.nome,
    participanteId: part.id,
    pontos,
    acertos,
    jogosApurados: apurados.length,
    palpites: lista,
    historico,
  });
}
