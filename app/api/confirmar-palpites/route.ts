import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { PalpiteExtraido } from "@/lib/supabase";

type Body = {
  upload_id:    string;
  participante: string;
  palpites:     PalpiteExtraido[]; // já revisados/corrigidos pelo usuário
};

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();
    const { upload_id, participante: nomePart, palpites } = body;

    if (!upload_id || !nomePart || !Array.isArray(palpites)) {
      return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });
    }

    const db = supabaseAdmin();

    // Busca participante
    const { data: part } = await db
      .from("participantes")
      .select("id")
      .eq("nome", nomePart)
      .maybeSingle();

    if (!part) {
      return NextResponse.json({ erro: "Participante não encontrado" }, { status: 404 });
    }

    // Para cada palpite, tenta encontrar o jogo pelo nome dos times
    let salvos = 0;
    const erros: string[] = [];

    for (const p of palpites) {
      // Busca jogo pelos nomes dos times (case-insensitive, parcial)
      const { data: jogos } = await db
        .from("jogos")
        .select("id")
        .or(
          `and(time1.ilike.%${p.time1}%,time2.ilike.%${p.time2}%),` +
          `and(time1.ilike.%${p.time2}%,time2.ilike.%${p.time1}%)`
        )
        .limit(1);

      if (!jogos || jogos.length === 0) {
        // Tenta por número do jogo se disponível
        if (p.numero_jogo) {
          const { data: jogoNum } = await db
            .from("jogos")
            .select("id")
            .eq("numero_jogo", p.numero_jogo)
            .maybeSingle();

          if (jogoNum) {
            await upsertPalpite(db, part.id, jogoNum.id, p);
            salvos++;
            continue;
          }
        }
        erros.push(`Jogo não encontrado: ${p.time1} x ${p.time2}`);
        continue;
      }

      const jogoId = jogos[0].id;

      // Verifica se os times estão na ordem certa
      const { data: jogo } = await db
        .from("jogos")
        .select("time1, time2")
        .eq("id", jogoId)
        .single();

      // Se os times estão invertidos em relação ao template, inverte o palpite
      const invertido =
        jogo &&
        jogo.time1.toLowerCase().includes(p.time2.toLowerCase()) &&
        jogo.time2.toLowerCase().includes(p.time1.toLowerCase());

      const palpite1 = invertido ? p.gols2 : p.gols1;
      const palpite2 = invertido ? p.gols1 : p.gols2;

      await upsertPalpite(db, part.id, jogoId, { ...p, gols1: palpite1, gols2: palpite2 });
      salvos++;
    }

    // Marca upload como confirmado
    await db
      .from("uploads")
      .update({ status: "confirmado" })
      .eq("id", upload_id);

    return NextResponse.json({
      salvos,
      erros,
      mensagem: `${salvos} palpite(s) salvos com sucesso.`,
    });
  } catch (err) {
    console.error("[confirmar-palpites]", err);
    return NextResponse.json({ erro: String(err) }, { status: 500 });
  }
}

async function upsertPalpite(
  db: ReturnType<typeof supabaseAdmin>,
  participanteId: string,
  jogoId: string,
  p: PalpiteExtraido
) {
  await db.from("palpites").upsert(
    {
      participante_id: participanteId,
      jogo_id: jogoId,
      palpite1: p.gols1,
      palpite2: p.gols2,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participante_id,jogo_id" }
  );
}
