// Rota escondida — só liberada no fim do bolão

const mockRanking = [
  { nome: "Carlita Guth", pontos: 148, acertos: 22, jogos: 30 },
  { nome: "Bruno Vask", pontos: 134, acertos: 20, jogos: 30 },
  { nome: "Ana Lima", pontos: 121, acertos: 18, jogos: 28 },
  { nome: "Pedro Souza", pontos: 115, acertos: 17, jogos: 30 },
  { nome: "Mariana Costa", pontos: 108, acertos: 16, jogos: 27 },
  { nome: "Rafael Mendes", pontos: 97, acertos: 14, jogos: 29 },
  { nome: "Juliana Ferreira", pontos: 89, acertos: 13, jogos: 25 },
  { nome: "Lucas Alves", pontos: 76, acertos: 11, jogos: 28 },
  { nome: "Beatriz Rocha", pontos: 64, acertos: 9, jogos: 22 },
  { nome: "Thiago Nunes", pontos: 51, acertos: 7, jogos: 20 },
];

const medals = ["🥇", "🥈", "🥉"];

export default function RankingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <p className="text-5xl mb-3">🏆</p>
        <h2 className="text-2xl font-bold text-slate-800">Ranking Final</h2>
        <p className="text-slate-500 text-sm mt-1">Bolão da Copa 2026 · Resultado final</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-50">
          {mockRanking.map((p, i) => {
            const isTop3 = i < 3;
            return (
              <div
                key={p.nome}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i === 0 ? "bg-amber-50" : ""
                }`}
              >
                <div className="w-8 text-center shrink-0">
                  {isTop3 ? (
                    <span className="text-xl">{medals[i]}</span>
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${i === 0 ? "text-amber-800" : "text-slate-800"}`}>
                    {p.nome}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {p.acertos} acertos em {p.jogos} jogos
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-lg font-bold ${i === 0 ? "text-amber-700" : "text-green-700"}`}>
                    {p.pontos}
                  </p>
                  <p className="text-xs text-slate-400">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
