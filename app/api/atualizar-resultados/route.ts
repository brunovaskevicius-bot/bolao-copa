// Agente diário — busca resultados da Copa no ESPN e atualiza o banco
// Chamado pelo Vercel Cron às 2h BRT (5h UTC) — captura todos os jogos do dia anterior

import { NextRequest, NextResponse } from "next/server";
import { buscarJogosDoDia } from "@/lib/espn";
import { supabaseAdmin } from "@/lib/supabase";

// Protege a rota: só executa com o header correto (Vercel injeta automaticamente)
// ou com CRON_SECRET no header Authorization
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const db = supabaseAdmin();

  // Datas a verificar: hoje e ontem (margem pra jogos que terminaram tarde)
  const hoje   = formatarData(new Date());
  const ontem  = formatarData(new Date(Date.now() - 86_400_000));
  const datas  = [...new Set([ontem, hoje])];

  const resumo = {
    processados: 0,
    atualizados: 0,
    pontos_calculados: 0,
    erros: [] as string[],
  };

  for (const data of datas) {
    let jogosESPN;
    try {
      jogosESPN = await buscarJogosDoDia(data);
    } catch (err) {
      resumo.erros.push(`Erro ao buscar ESPN ${data}: ${err}`);
      continue;
    }

    const finalizados = jogosESPN.filter((j) => j.status === "final" && j.gols1 !== null);
    resumo.processados += finalizados.length;

    for (const jogoESPN of finalizados) {
      try {
        // Busca o jogo no banco pelos nomes dos times
        const { data: jogos } = await db
          .from("jogos")
          .select("id, apurado")
          .or(
            `and(time1.ilike.%${jogoESPN.time1}%,time2.ilike.%${jogoESPN.time2}%),` +
            `and(time1.ilike.%${jogoESPN.time2}%,time2.ilike.%${jogoESPN.time1}%)`
          )
          .eq("apurado", false)
          .limit(1);

        if (!jogos || jogos.length === 0) continue; // Já apurado ou não cadastrado

        const jogoId   = jogos[0].id;
        const invertido =
          (await db.from("jogos").select("time1").eq("id", jogoId).single())
            .data?.time1.toLowerCase().includes(jogoESPN.time2.toLowerCase());

        const gols1Real = invertido ? jogoESPN.gols2 : jogoESPN.gols1;
        const gols2Real = invertido ? jogoESPN.gols1 : jogoESPN.gols2;

        // Salva o resultado real
        await db
          .from("jogos")
          .update({ gols1_real: gols1Real, gols2_real: gols2Real })
          .eq("id", jogoId);

        // Calcula pontos de todos os palpites deste jogo
        await db.rpc("calcular_pontos_jogo", { p_jogo_id: jogoId });

        resumo.atualizados++;
        resumo.pontos_calculados++;

        console.log(
          `✓ ${jogoESPN.time1} ${gols1Real}×${gols2Real} ${jogoESPN.time2}`
        );
      } catch (err) {
        resumo.erros.push(
          `Erro ao processar ${jogoESPN.time1} x ${jogoESPN.time2}: ${err}`
        );
      }
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    ...resumo,
  });
}

function formatarData(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}
