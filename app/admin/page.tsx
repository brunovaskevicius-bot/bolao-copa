"use client";

import { useState } from "react";

const jogos = [
  { id: 1, time1: "🇧🇷 Brasil", time2: "🇨🇦 Canadá", data: "12/06" },
  { id: 2, time1: "🇦🇷 Argentina", time2: "🇵🇪 Peru", data: "12/06" },
  { id: 3, time1: "🇫🇷 França", time2: "🇧🇪 Bélgica", data: "13/06" },
  { id: 4, time1: "🇩🇪 Alemanha", time2: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escócia", data: "13/06" },
];

type Resultado = { gols1: string; gols2: string };

export default function AdminPage() {
  const [senha, setSenha] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [resultados, setResultados] = useState<Record<number, Resultado>>({});
  const [saved, setSaved] = useState<number[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha === "carlita2026") {
      setAutenticado(true);
    } else {
      alert("Senha incorreta");
    }
  };

  const handleSave = async (id: number) => {
    const r = resultados[id];
    if (!r || r.gols1 === "" || r.gols2 === "") return;
    // Aqui vai salvar no Supabase
    await new Promise((res) => setTimeout(res, 600));
    setSaved((prev) => [...prev, id]);
  };

  if (!autenticado) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Admin</h2>
          <p className="text-sm text-slate-500 mb-5">Apenas Carlita acessa aqui.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-800">Inserir resultados</h2>
        <button
          onClick={() => setAutenticado(false)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Sair
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {jogos.map((jogo) => {
          const r = resultados[jogo.id] ?? { gols1: "", gols2: "" };
          const isSaved = saved.includes(jogo.id);
          return (
            <div
              key={jogo.id}
              className={`bg-white rounded-xl border shadow-sm px-5 py-4 ${
                isSaved ? "border-green-200" : "border-slate-100"
              }`}
            >
              <p className="text-xs text-slate-400 mb-3">{jogo.data}</p>
              <div className="flex items-center gap-3">
                {/* Time 1 */}
                <span className="flex-1 text-sm font-medium text-slate-700">{jogo.time1}</span>
                {/* Gols */}
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={r.gols1}
                  onChange={(e) =>
                    setResultados((prev) => ({
                      ...prev,
                      [jogo.id]: { ...r, gols1: e.target.value },
                    }))
                  }
                  className="w-12 border border-slate-200 rounded-lg text-center py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="0"
                  disabled={isSaved}
                />
                <span className="text-slate-300 font-bold">×</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={r.gols2}
                  onChange={(e) =>
                    setResultados((prev) => ({
                      ...prev,
                      [jogo.id]: { ...r, gols2: e.target.value },
                    }))
                  }
                  className="w-12 border border-slate-200 rounded-lg text-center py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="0"
                  disabled={isSaved}
                />
                {/* Time 2 */}
                <span className="flex-1 text-sm font-medium text-slate-700 text-right">{jogo.time2}</span>
                {/* Salvar */}
                <button
                  onClick={() => handleSave(jogo.id)}
                  disabled={isSaved || r.gols1 === "" || r.gols2 === ""}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSaved
                      ? "bg-green-100 text-green-700"
                      : "bg-green-700 hover:bg-green-800 text-white disabled:bg-slate-100 disabled:text-slate-400"
                  }`}
                >
                  {isSaved ? "✓ Salvo" : "Salvar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center mt-6">
        Ao salvar, o ranking é recalculado automaticamente.
      </p>
    </div>
  );
}
