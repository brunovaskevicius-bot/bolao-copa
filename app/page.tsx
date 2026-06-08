"use client";

import { useState } from "react";
import Link from "next/link";

type PalpiteComJogo = {
  id: string;
  palpite1: number;
  palpite2: number;
  pontos: number | null;
  jogos: {
    id: string;
    time1: string;
    time2: string;
    bandeira1: string | null;
    bandeira2: string | null;
    data_jogo: string;
    gols1_real: number | null;
    gols2_real: number | null;
    apurado: boolean;
  };
};

type DadosDashboard = {
  participanteId: string;
  pontos: number;
  acertos: number;
  jogosApurados: number;
  palpites: PalpiteComJogo[];
  historico: { dia: string; pontos: number }[];
};

async function buscarDados(nome: string): Promise<DadosDashboard | null> {
  const res = await fetch(`/api/meus-palpites?nome=${encodeURIComponent(nome)}`);
  if (!res.ok) return null;
  return res.json();
}

async function buscarNomes(termo: string): Promise<string[]> {
  const res = await fetch(`/api/participantes?q=${encodeURIComponent(termo)}`);
  if (!res.ok) return [];
  return res.json();
}

// ---- Página principal ----

export default function MeusPalpitesPage() {
  const [inputValue, setInputValue]         = useState("");
  const [sugestoes, setSugestoes]           = useState<string[]>([]);
  const [nomeConfirmado, setNomeConfirmado] = useState("");
  const [dados, setDados]                   = useState<DadosDashboard | null>(null);
  const [carregando, setCarregando]         = useState(false);
  const [naoEncontrado, setNaoEncontrado]   = useState(false);

  const handleInput = async (v: string) => {
    setInputValue(v);
    setNaoEncontrado(false);
    if (v.length > 1) {
      const nomes = await buscarNomes(v);
      setSugestoes(nomes);
    } else {
      setSugestoes([]);
    }
  };

  const confirmar = async (nome: string) => {
    setInputValue(nome);
    setSugestoes([]);
    setCarregando(true);
    setNaoEncontrado(false);
    const d = await buscarDados(nome);
    setCarregando(false);
    if (!d) {
      setNaoEncontrado(true);
      return;
    }
    setNomeConfirmado(nome);
    setDados(d);
  };

  const voltar = () => {
    setNomeConfirmado("");
    setDados(null);
    setInputValue("");
  };

  if (nomeConfirmado && dados) {
    return <Dashboard nome={nomeConfirmado} dados={dados} onTrocar={voltar} />;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <p className="text-4xl mb-3">⭐</p>
        <h2 className="text-xl font-bold text-slate-800">Meus Palpites</h2>
        <p className="text-slate-500 text-sm mt-1">
          Digite seu nome pra ver seus pontos e palpites
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Qual é o seu nome?
        </label>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && inputValue.trim() && confirmar(inputValue.trim())}
            placeholder="Ex: Carlita Guth"
            className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          {sugestoes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {sugestoes.map((n) => (
                <button
                  key={n}
                  onClick={() => confirmar(n)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-800 transition-colors"
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        {naoEncontrado && (
          <p className="text-xs text-red-500 mt-2">
            Nome não encontrado. Já enviou seus palpites?
          </p>
        )}

        <button
          onClick={() => inputValue.trim() && confirmar(inputValue.trim())}
          disabled={!inputValue.trim() || carregando}
          className="w-full mt-3 bg-green-700 hover:bg-green-800 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          {carregando ? "Buscando..." : "Ver meus palpites →"}
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Ainda não enviou?{" "}
        <Link href="/enviar" className="text-green-700 font-medium hover:underline">
          Enviar agora
        </Link>
      </p>
    </div>
  );
}

// ---- Dashboard pessoal ----

const statusConfig = {
  exato:    { label: "Placar exato!", cor: "bg-green-100 text-green-700",   pts: "+5 pts" },
  vencedor: { label: "Vencedor certo", cor: "bg-blue-100 text-blue-700",   pts: "+3 pts" },
  errou:    { label: "Errou",          cor: "bg-slate-100 text-slate-500", pts: "0 pts"  },
};

function calcularStatus(palpite1: number, palpite2: number, gols1: number, gols2: number) {
  if (palpite1 === gols1 && palpite2 === gols2) return "exato";
  const acertouVencedor =
    (palpite1 > palpite2 && gols1 > gols2) ||
    (palpite1 < palpite2 && gols1 < gols2) ||
    (palpite1 === palpite2 && gols1 === gols2);
  return acertouVencedor ? "vencedor" : "errou";
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",
  });
}

function Dashboard({ nome, dados, onTrocar }: {
  nome: string;
  dados: DadosDashboard;
  onTrocar: () => void;
}) {
  const maxPts = Math.max(1, ...dados.historico.map((d) => d.pontos));
  const tendencia = dados.historico.slice(-3).reduce((s, d) => s + d.pontos, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-slate-400">Seus resultados</p>
          <h2 className="text-xl font-bold text-slate-800">{nome}</h2>
        </div>
        <button onClick={onTrocar} className="text-xs text-slate-400 hover:text-slate-600 underline">
          Trocar nome
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-700 text-white rounded-xl p-4 text-center">
          <p className="text-3xl font-bold">{dados.pontos}</p>
          <p className="text-green-200 text-xs mt-1">pontos</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-slate-800">{dados.acertos}</p>
          <p className="text-xs text-slate-500 mt-1">acertos</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-slate-800">{dados.jogosApurados}</p>
          <p className="text-xs text-slate-500 mt-1">apurados</p>
        </div>
      </div>

      {/* Tendência */}
      {tendencia > 0 && (
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2 bg-green-50 border border-green-100">
          <span className="text-lg">📈</span>
          <p className="text-sm font-medium text-slate-700">
            +{tendencia} pts nos últimos 3 dias
          </p>
        </div>
      )}

      {/* Gráfico */}
      {dados.historico.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Pontos por dia</h3>
          <div className="flex items-end gap-2 h-20">
            {dados.historico.map((dia) => (
              <div key={dia.dia} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-green-500 rounded-sm"
                  style={{ height: `${(dia.pontos / maxPts) * 100}%`, minHeight: "4px" }}
                />
                <span className="text-[10px] text-slate-400">{dia.dia}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Palpites */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Meus palpites</h3>
          <span className="text-xs text-slate-400">{dados.palpites.length} enviados</span>
        </div>

        {dados.palpites.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-slate-400 text-sm">Nenhum palpite enviado ainda.</p>
            <Link href="/enviar" className="text-green-700 text-sm font-medium mt-2 inline-block hover:underline">
              Enviar agora →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {dados.palpites.map((p) => {
              const jogo   = p.jogos;
              const status = jogo?.apurado
                ? calcularStatus(p.palpite1, p.palpite2, jogo.gols1_real!, jogo.gols2_real!)
                : null;
              const cfg = status ? statusConfig[status] : null;

              return (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs text-slate-400">
                      {jogo?.data_jogo ? formatarData(jogo.data_jogo) : "—"}
                    </span>
                    {cfg ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cor}`}>
                        {cfg.label}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                        Aguardando
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {jogo?.bandeira1 && <span>{jogo.bandeira1}</span>}
                      <span className="text-sm font-medium text-slate-700">{jogo?.time1}</span>
                    </div>
                    <div className="text-center">
                      {jogo?.apurado ? (
                        <>
                          <div className="text-sm font-bold text-slate-800">
                            {jogo.gols1_real} × {jogo.gols2_real}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            palpite: {p.palpite1} × {p.palpite2}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm font-semibold text-slate-400">
                          {p.palpite1} × {p.palpite2}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-sm font-medium text-slate-700">{jogo?.time2}</span>
                      {jogo?.bandeira2 && <span>{jogo.bandeira2}</span>}
                    </div>
                  </div>

                  {cfg && (
                    <div className="mt-1.5 text-right">
                      <span className={`text-xs font-bold ${(p.pontos ?? 0) > 0 ? "text-green-600" : "text-slate-400"}`}>
                        {cfg.pts}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link
          href="/enviar"
          className="block w-full bg-green-700 hover:bg-green-800 text-white text-center py-3 rounded-xl font-medium text-sm transition-colors"
        >
          📤 Atualizar meus palpites
        </Link>
      </div>
    </div>
  );
}
