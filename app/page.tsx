"use client";

import { useState } from "react";
import Link from "next/link";

// Mock — participantes que já enviaram palpites
const participantes = [
  "Carlita Guth",
  "Bruno Vask",
  "Ana Lima",
  "Pedro Souza",
  "Mariana Costa",
  "Rafael Mendes",
  "Juliana Ferreira",
  "Lucas Alves",
  "Beatriz Rocha",
  "Thiago Nunes",
];

// Mock — dados pessoais de um participante
const mockDados = {
  pontos: 134,
  acertos: 20,
  jogosApurados: 30,
  tendencia: "+18 pts nos últimos 3 dias",
  tendenciaPositiva: true,
  historicoRecente: [
    { data: "08/06", pts: 8 },
    { data: "07/06", pts: 5 },
    { data: "06/06", pts: 5 },
    { data: "05/06", pts: 3 },
    { data: "04/06", pts: 6 },
    { data: "03/06", pts: 7 },
    { data: "02/06", pts: 4 },
  ],
  palpites: [
    {
      data: "08/06",
      time1: { nome: "Brasil", bandeira: "🇧🇷", gols: 3 },
      time2: { nome: "Sérvia", bandeira: "🇷🇸", gols: 1 },
      palpite1: 3,
      palpite2: 1,
      pts: 5,
      status: "exato",
    },
    {
      data: "07/06",
      time1: { nome: "Argentina", bandeira: "🇦🇷", gols: 2 },
      time2: { nome: "México", bandeira: "🇲🇽", gols: 2 },
      palpite1: 1,
      palpite2: 1,
      pts: 3,
      status: "vencedor",
    },
    {
      data: "07/06",
      time1: { nome: "França", bandeira: "🇫🇷", gols: 1 },
      time2: { nome: "Polônia", bandeira: "🇵🇱", gols: 0 },
      palpite1: 2,
      palpite2: 0,
      pts: 3,
      status: "vencedor",
    },
    {
      data: "06/06",
      time1: { nome: "Portugal", bandeira: "🇵🇹", gols: 4 },
      time2: { nome: "Marrocos", bandeira: "🇲🇦", gols: 2 },
      palpite1: 1,
      palpite2: 2,
      pts: 0,
      status: "errou",
    },
    {
      data: "05/06",
      time1: { nome: "Alemanha", bandeira: "🇩🇪", gols: 2 },
      time2: { nome: "Japão", bandeira: "🇯🇵", gols: 1 },
      palpite1: 2,
      palpite2: 0,
      pts: 3,
      status: "vencedor",
    },
  ],
};

const statusConfig = {
  exato: { label: "Placar exato!", cor: "bg-green-100 text-green-700", pts: "+5 pts" },
  vencedor: { label: "Vencedor certo", cor: "bg-blue-100 text-blue-700", pts: "+3 pts" },
  errou: { label: "Errou", cor: "bg-slate-100 text-slate-500", pts: "0 pts" },
};

const maxPts = Math.max(...mockDados.historicoRecente.map((d) => d.pts));

export default function MeusPalpitesPage() {
  const [nome, setNome] = useState("");
  const [nomeConfirmado, setNomeConfirmado] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [filtrado, setFiltrado] = useState<string[]>([]);

  const handleInputChange = (v: string) => {
    setInputValue(v);
    if (v.length > 1) {
      setFiltrado(participantes.filter((p) => p.toLowerCase().includes(v.toLowerCase())));
    } else {
      setFiltrado([]);
    }
  };

  const confirmar = (n: string) => {
    setNome(n);
    setNomeConfirmado(n);
    setInputValue(n);
    setFiltrado([]);
  };

  if (nomeConfirmado) {
    return <Dashboard nome={nomeConfirmado} onTrocar={() => { setNome(""); setNomeConfirmado(""); setInputValue(""); }} />;
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
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Ex: Carlita Guth"
            className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          {filtrado.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {filtrado.map((p) => (
                <button
                  key={p}
                  onClick={() => confirmar(p)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-800 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => inputValue.trim() && confirmar(inputValue.trim())}
          disabled={!inputValue.trim()}
          className="w-full mt-3 bg-green-700 hover:bg-green-800 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          Ver meus palpites →
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Ainda não enviou seus palpites?{" "}
        <Link href="/enviar" className="text-green-700 font-medium hover:underline">
          Enviar agora
        </Link>
      </p>
    </div>
  );
}

function Dashboard({ nome, onTrocar }: { nome: string; onTrocar: () => void }) {
  const d = mockDados;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header pessoal */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-slate-400">Seus resultados</p>
          <h2 className="text-xl font-bold text-slate-800">{nome}</h2>
        </div>
        <button
          onClick={onTrocar}
          className="text-xs text-slate-400 hover:text-slate-600 underline"
        >
          Trocar nome
        </button>
      </div>

      {/* Cards de pontos */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-700 text-white rounded-xl p-4 text-center col-span-1">
          <p className="text-3xl font-bold">{d.pontos}</p>
          <p className="text-green-200 text-xs mt-1">pontos</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-slate-800">{d.acertos}</p>
          <p className="text-xs text-slate-500 mt-1">acertos</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-bold text-slate-800">{d.jogosApurados}</p>
          <p className="text-xs text-slate-500 mt-1">jogos</p>
        </div>
      </div>

      {/* Tendência */}
      <div className={`rounded-xl px-4 py-3 mb-5 flex items-center gap-2 ${
        d.tendenciaPositiva ? "bg-green-50 border border-green-100" : "bg-slate-50 border border-slate-100"
      }`}>
        <span className="text-lg">{d.tendenciaPositiva ? "📈" : "📉"}</span>
        <p className="text-sm font-medium text-slate-700">{d.tendencia}</p>
      </div>

      {/* Gráfico de barras simples */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Pontos por dia</h3>
        <div className="flex items-end gap-2 h-20">
          {d.historicoRecente.slice().reverse().map((dia) => (
            <div key={dia.data} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-green-500 rounded-sm"
                style={{ height: `${(dia.pts / maxPts) * 100}%`, minHeight: "4px" }}
              />
              <span className="text-[10px] text-slate-400">{dia.data.slice(0, 5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de palpites */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Palpites recentes</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {d.palpites.map((p, i) => {
            const cfg = statusConfig[p.status as keyof typeof statusConfig];
            return (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-slate-400">{p.data}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cor}`}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {/* Time 1 */}
                  <div className="flex items-center gap-1.5">
                    <span>{p.time1.bandeira}</span>
                    <span className="text-sm font-medium text-slate-700">{p.time1.nome}</span>
                  </div>
                  {/* Placar real vs palpite */}
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-800">
                      {p.time1.gols} × {p.time2.gols}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      palpite: {p.palpite1} × {p.palpite2}
                    </div>
                  </div>
                  {/* Time 2 */}
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-sm font-medium text-slate-700">{p.time2.nome}</span>
                    <span>{p.time2.bandeira}</span>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <span className={`text-xs font-bold ${p.pts > 0 ? "text-green-600" : "text-slate-400"}`}>
                    {cfg.pts}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
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
