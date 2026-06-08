// Rota de uso único — popula a tabela jogos com o calendário completo da Copa 2026
// Chamar UMA VEZ após criar o banco: GET /api/seed-jogos?secret=SEU_CRON_SECRET

import { NextRequest, NextResponse } from "next/server";
import { buscarJogosIntervalo } from "@/lib/espn";
import { supabaseAdmin } from "@/lib/supabase";

// Copa 2026: 11/06/2026 → 19/07/2026
const INICIO = "20260611";
const FIM    = "20260719";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const db = supabaseAdmin();

  // Verifica se já tem jogos
  const { count } = await db
    .from("jogos")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    return NextResponse.json({
      ok: false,
      msg: `Banco já tem ${count} jogos. Não sobrescreveu.`,
    });
  }

  // Busca calendário completo no ESPN
  let jogos;
  try {
    jogos = await buscarJogosIntervalo(INICIO, FIM);
  } catch (err) {
    return NextResponse.json({ erro: String(err) }, { status: 500 });
  }

  if (!jogos.length) {
    return NextResponse.json({ erro: "ESPN não retornou jogos." }, { status: 502 });
  }

  // Monta registros ordenados por data
  const registros = jogos
    .sort((a, b) => new Date(a.data_jogo).getTime() - new Date(b.data_jogo).getTime())
    .map((j, i) => ({
      numero_jogo: i + 1,
      fase:        j.fase,
      grupo:       j.grupo,
      time1:       j.time1,
      bandeira1:   j.bandeira1,
      time2:       j.time2,
      bandeira2:   j.bandeira2,
      data_jogo:   j.data_jogo,
      apurado:     false,
    }));

  // Insert em lotes de 20
  const BATCH = 20;
  let inseridos = 0;
  for (let i = 0; i < registros.length; i += BATCH) {
    const lote = registros.slice(i, i + BATCH);
    const { error } = await db.from("jogos").insert(lote);
    if (error) {
      return NextResponse.json({
        erro: `Erro no lote ${i / BATCH + 1}: ${error.message}`,
        inseridos,
      }, { status: 500 });
    }
    inseridos += lote.length;
  }

  return NextResponse.json({
    ok: true,
    total_jogos: inseridos,
    primeiro: registros[0],
    ultimo:   registros[registros.length - 1],
  });
}
