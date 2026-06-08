"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { PalpiteExtraido } from "@/lib/supabase";

type Etapa = "form" | "processando" | "revisao" | "sucesso" | "erro";

type ResultadoIA = {
  upload_id: string;
  participante: string;
  palpites: PalpiteExtraido[];
  total: number;
};

export default function EnviarPage() {
  const [etapa, setEtapa]         = useState<Etapa>("form");
  const [nome, setNome]           = useState("");
  const [arquivo, setArquivo]     = useState<File | null>(null);
  const [dragOver, setDragOver]   = useState(false);
  const [resultado, setResultado] = useState<ResultadoIA | null>(null);
  const [erroMsg, setErroMsg]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    const tipos = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
    if (!tipos.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      alert("Envie uma foto (JPG, PNG, WEBP ou HEIC)");
      return;
    }
    setArquivo(file);
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !arquivo) return;
    setEtapa("processando");

    try {
      const fd = new FormData();
      fd.append("nome", nome.trim());
      fd.append("arquivo", arquivo);

      const res = await fetch("/api/processar-imagem", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.erro ?? "Erro desconhecido");

      setResultado(data as ResultadoIA);
      setEtapa("revisao");
    } catch (err) {
      setErroMsg(String(err));
      setEtapa("erro");
    }
  };

  const handleConfirmar = async (palpitesRevisados: PalpiteExtraido[]) => {
    if (!resultado) return;
    setEtapa("processando");

    try {
      const res = await fetch("/api/confirmar-palpites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upload_id:    resultado.upload_id,
          participante: resultado.participante,
          palpites:     palpitesRevisados,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Erro ao confirmar");
      setEtapa("sucesso");
    } catch (err) {
      setErroMsg(String(err));
      setEtapa("erro");
    }
  };

  // ---- Telas ----

  if (etapa === "processando") return <TelaProcessando />;
  if (etapa === "sucesso")     return <TelaSucesso nome={nome} />;
  if (etapa === "erro")        return <TelaErro msg={erroMsg} onVoltar={() => setEtapa("form")} />;
  if (etapa === "revisao" && resultado)
    return <TelaRevisao resultado={resultado} onConfirmar={handleConfirmar} onVoltar={() => setEtapa("form")} />;

  // ---- Formulário ----
  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Enviar palpites</h2>
        <p className="text-sm text-slate-500 mb-6">
          Tire uma foto do template preenchido. A IA vai ler os palpites pra você revisar.
        </p>

        <form onSubmit={handleEnviar} className="flex flex-col gap-5">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Seu nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlita Guth"
              required
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
          </div>

          {/* Upload de imagem */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Foto do template preenchido
            </label>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0] ?? null);
              }}
              className={`border-2 border-dashed rounded-xl px-4 py-8 text-center cursor-pointer transition-colors ${
                dragOver       ? "border-green-400 bg-green-50" :
                arquivo        ? "border-green-300 bg-green-50" :
                                  "border-slate-200 hover:border-green-300 hover:bg-slate-50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              {arquivo ? (
                <>
                  <p className="text-2xl mb-2">📸</p>
                  <p className="text-sm font-medium text-green-700">{arquivo.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(arquivo.size / 1024).toFixed(0)} KB · Toque pra trocar
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl mb-2">📷</p>
                  <p className="text-sm text-slate-600">
                    Tire uma foto ou <span className="text-green-700 font-medium">selecione da galeria</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP ou HEIC</p>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!nome.trim() || !arquivo}
            className="w-full bg-green-700 hover:bg-green-800 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3 rounded-xl font-medium text-sm transition-colors"
          >
            Enviar para a IA ler →
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Tela de processamento
// ----------------------------------------------------------------
function TelaProcessando() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4 animate-pulse">🤖</div>
      <h2 className="text-lg font-semibold text-slate-800 mb-2">IA lendo seus palpites...</h2>
      <p className="text-sm text-slate-500">Pode levar alguns segundos.</p>
    </div>
  );
}

// ----------------------------------------------------------------
// Tela de revisão — coração do fluxo
// ----------------------------------------------------------------
function TelaRevisao({
  resultado,
  onConfirmar,
  onVoltar,
}: {
  resultado: ResultadoIA;
  onConfirmar: (p: PalpiteExtraido[]) => void;
  onVoltar: () => void;
}) {
  const [palpites, setPalpites] = useState<PalpiteExtraido[]>(resultado.palpites);

  const atualizar = (i: number, campo: "gols1" | "gols2", valor: string) => {
    const n = parseInt(valor, 10);
    if (isNaN(n) || n < 0 || n > 20) return;
    setPalpites((prev) => prev.map((p, idx) => idx === i ? { ...p, [campo]: n } : p));
  };

  const remover = (i: number) => {
    setPalpites((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-green-600 text-lg">✅</span>
          <h2 className="text-lg font-semibold text-slate-800">
            IA identificou {palpites.length} palpites
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          Confira abaixo. Corrija o que estiver errado antes de confirmar.
        </p>
      </div>

      {/* Lista de palpites */}
      <div className="flex flex-col gap-3 mb-5">
        {palpites.map((p, i) => {
          const baixaConfianca = p.confianca < 0.75;
          return (
            <div
              key={i}
              className={`bg-white rounded-xl border shadow-sm px-4 py-4 ${
                baixaConfianca ? "border-amber-200 bg-amber-50" : "border-slate-100"
              }`}
            >
              {baixaConfianca && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-amber-500 text-xs">⚠️</span>
                  <span className="text-xs text-amber-700 font-medium">
                    IA não tinha certeza — verifique este
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Time 1 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-0.5">Time 1</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{p.time1}</p>
                </div>

                {/* Placar editável */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={p.gols1}
                    onChange={(e) => atualizar(i, "gols1", e.target.value)}
                    className="w-12 border border-slate-200 rounded-lg text-center py-1.5 text-base font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <span className="text-slate-400 font-bold">×</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={p.gols2}
                    onChange={(e) => atualizar(i, "gols2", e.target.value)}
                    className="w-12 border border-slate-200 rounded-lg text-center py-1.5 text-base font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>

                {/* Time 2 */}
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs text-slate-400 mb-0.5">Time 2</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{p.time2}</p>
                </div>

                {/* Remover */}
                <button
                  onClick={() => remover(i)}
                  className="text-slate-300 hover:text-red-400 transition-colors text-lg ml-1 shrink-0"
                  title="Remover palpite"
                >
                  ×
                </button>
              </div>

              {/* Indicador de confiança */}
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.confianca >= 0.85 ? "bg-green-400" :
                      p.confianca >= 0.7  ? "bg-amber-400" : "bg-red-400"
                    }`}
                    style={{ width: `${p.confianca * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  {Math.round(p.confianca * 100)}% certo
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {palpites.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Nenhum palpite para confirmar.
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={onVoltar}
          className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-medium text-sm transition-colors"
        >
          ← Reenviar foto
        </button>
        <button
          onClick={() => onConfirmar(palpites)}
          disabled={palpites.length === 0}
          className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3 rounded-xl font-medium text-sm transition-colors"
        >
          Confirmar {palpites.length} palpites ✓
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Tela de sucesso
// ----------------------------------------------------------------
function TelaSucesso({ nome }: { nome: string }) {
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Palpites salvos!</h2>
      <p className="text-slate-500 text-sm mb-6">
        Os palpites de <strong>{nome}</strong> foram registrados. Boa sorte!
      </p>
      <Link
        href="/"
        className="inline-block bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors"
      >
        Ver meus pontos →
      </Link>
    </div>
  );
}

// ----------------------------------------------------------------
// Tela de erro
// ----------------------------------------------------------------
function TelaErro({ msg, onVoltar }: { msg: string; onVoltar: () => void }) {
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="text-5xl mb-4">😬</div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Algo deu errado</h2>
      <p className="text-slate-500 text-sm mb-2">{msg}</p>
      <p className="text-xs text-slate-400 mb-6">Tente tirar uma foto mais clara e bem iluminada.</p>
      <button
        onClick={onVoltar}
        className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors"
      >
        Tentar de novo
      </button>
    </div>
  );
}
