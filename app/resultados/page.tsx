const mockResultados = [
  {
    data: "08/06",
    fase: "Grupos — Fase 3",
    time1: { nome: "Brasil", bandeira: "🇧🇷", gols: 3 },
    time2: { nome: "Sérvia", bandeira: "🇷🇸", gols: 1 },
  },
  {
    data: "07/06",
    fase: "Grupos — Fase 3",
    time1: { nome: "Argentina", bandeira: "🇦🇷", gols: 2 },
    time2: { nome: "México", bandeira: "🇲🇽", gols: 2 },
  },
  {
    data: "07/06",
    fase: "Grupos — Fase 3",
    time1: { nome: "França", bandeira: "🇫🇷", gols: 1 },
    time2: { nome: "Polônia", bandeira: "🇵🇱", gols: 0 },
  },
  {
    data: "06/06",
    fase: "Grupos — Fase 3",
    time1: { nome: "Portugal", bandeira: "🇵🇹", gols: 4 },
    time2: { nome: "Marrocos", bandeira: "🇲🇦", gols: 2 },
  },
  {
    data: "05/06",
    fase: "Grupos — Fase 3",
    time1: { nome: "Alemanha", bandeira: "🇩🇪", gols: 2 },
    time2: { nome: "Japão", bandeira: "🇯🇵", gols: 1 },
  },
  {
    data: "04/06",
    fase: "Grupos — Fase 2",
    time1: { nome: "Inglaterra", bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", gols: 3 },
    time2: { nome: "EUA", bandeira: "🇺🇸", gols: 0 },
  },
];

function Placar({ gols1, gols2 }: { gols1: number; gols2: number }) {
  const empate = gols1 === gols2;
  const vitoria1 = gols1 > gols2;
  return (
    <div className="flex items-center gap-2 text-xl font-bold">
      <span className={vitoria1 ? "text-green-700" : empate ? "text-slate-500" : "text-slate-400"}>
        {gols1}
      </span>
      <span className="text-slate-300 text-base">×</span>
      <span className={!vitoria1 && !empate ? "text-green-700" : empate ? "text-slate-500" : "text-slate-400"}>
        {gols2}
      </span>
    </div>
  );
}

export default function ResultadosPage() {
  const hoje = mockResultados.filter((r) => r.data === "08/06");
  const anteriores = mockResultados.filter((r) => r.data !== "08/06");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Hoje */}
      {hoje.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Hoje</h2>
          </div>
          <div className="flex flex-col gap-3">
            {hoje.map((jogo, i) => (
              <JogoCard key={i} jogo={jogo} destaque />
            ))}
          </div>
        </div>
      )}

      {/* Anteriores */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Jogos anteriores
        </h2>
        <div className="flex flex-col gap-3">
          {anteriores.map((jogo, i) => (
            <JogoCard key={i} jogo={jogo} />
          ))}
        </div>
      </div>
    </div>
  );
}

type Jogo = (typeof mockResultados)[0];

function JogoCard({ jogo, destaque = false }: { jogo: Jogo; destaque?: boolean }) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm px-5 py-4 ${
        destaque ? "border-green-200 ring-1 ring-green-100" : "border-slate-100"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">{jogo.data} · {jogo.fase}</span>
        {destaque && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            Apurado hoje
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        {/* Time 1 */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{jogo.time1.bandeira}</span>
          <span className="font-semibold text-slate-800 text-sm">{jogo.time1.nome}</span>
        </div>
        {/* Placar */}
        <Placar gols1={jogo.time1.gols} gols2={jogo.time2.gols} />
        {/* Time 2 */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-semibold text-slate-800 text-sm">{jogo.time2.nome}</span>
          <span className="text-2xl">{jogo.time2.bandeira}</span>
        </div>
      </div>
    </div>
  );
}
