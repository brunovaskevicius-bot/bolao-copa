import { supabaseAdmin } from "@/lib/supabase";

// Força renderização dinâmica — busca dados frescos a cada request
export const dynamic = "force-dynamic";

const supabase = supabaseAdmin();

type Jogo = {
  id: string;
  numero_jogo: number;
  fase: string;
  time1: string;
  time2: string;
  bandeira1: string | null;
  bandeira2: string | null;
  data_jogo: string;
  gols1_real: number | null;
  gols2_real: number | null;
  apurado: boolean;
};

function formatarData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatarHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function faseLabel(fase: string) {
  const map: Record<string, string> = {
    grupos:   "Fase de Grupos",
    oitavas:  "Oitavas de Final",
    quartas:  "Quartas de Final",
    semi:     "Semifinal",
    terceiro: "3º Lugar",
    final:    "Final",
  };
  return map[fase] ?? fase;
}

export default async function ResultadosPage() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Busca jogos apurados (últimos 10) + próximos 10 jogos
  const [{ data: apurados }, { data: proximos }] = await Promise.all([
    supabase
      .from("jogos")
      .select("*")
      .eq("apurado", true)
      .order("data_jogo", { ascending: false })
      .limit(10),
    supabase
      .from("jogos")
      .select("*")
      .eq("apurado", false)
      .gte("data_jogo", hoje.toISOString())
      .order("data_jogo", { ascending: true })
      .limit(10),
  ]);

  const semResultados = !apurados || apurados.length === 0;
  const semProximos   = !proximos  || proximos.length  === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Resultados recentes */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Resultados recentes
          </h2>
        </div>

        {semResultados ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-8 text-center">
            <p className="text-3xl mb-2">⏳</p>
            <p className="text-sm text-slate-500">
              Nenhum jogo apurado ainda. A Copa começa em 11/06!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(apurados as Jogo[]).map((j) => (
              <JogoCard key={j.id} jogo={j} apurado />
            ))}
          </div>
        )}
      </section>

      {/* Próximos jogos */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Próximos jogos
          </h2>
        </div>

        {semProximos ? (
          <p className="text-sm text-slate-400 text-center py-4">
            Nenhum jogo agendado.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {(proximos as Jogo[]).map((j) => (
              <JogoCard key={j.id} jogo={j} apurado={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function JogoCard({ jogo, apurado }: { jogo: Jogo; apurado: boolean }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm px-5 py-4 ${
      apurado ? "border-slate-100" : "border-slate-100 opacity-80"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">
          {formatarData(jogo.data_jogo)} · {formatarHora(jogo.data_jogo)} · {faseLabel(jogo.fase)}
        </span>
        {apurado && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            Encerrado
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Time 1 */}
        <div className="flex items-center gap-2 flex-1">
          {jogo.bandeira1 && <span className="text-2xl">{jogo.bandeira1}</span>}
          <span className="font-semibold text-slate-800 text-sm">{jogo.time1}</span>
        </div>

        {/* Placar ou horário */}
        {apurado ? (
          <div className="flex items-center gap-2 text-xl font-bold shrink-0">
            <span className={jogo.gols1_real! > jogo.gols2_real! ? "text-green-700" : "text-slate-400"}>
              {jogo.gols1_real}
            </span>
            <span className="text-slate-300 text-base">×</span>
            <span className={jogo.gols2_real! > jogo.gols1_real! ? "text-green-700" : "text-slate-400"}>
              {jogo.gols2_real}
            </span>
          </div>
        ) : (
          <div className="text-sm font-semibold text-slate-400 shrink-0">
            {formatarHora(jogo.data_jogo)}
          </div>
        )}

        {/* Time 2 */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-semibold text-slate-800 text-sm">{jogo.time2}</span>
          {jogo.bandeira2 && <span className="text-2xl">{jogo.bandeira2}</span>}
        </div>
      </div>
    </div>
  );
}
