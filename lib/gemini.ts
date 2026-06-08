import { GoogleGenAI } from "@google/genai";
import type { PalpiteExtraido } from "./supabase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const PROMPT = `
Você está analisando uma foto ou scan de um template de bolão da Copa do Mundo 2026.
O template foi preenchido à mão pelo participante.

Sua tarefa: extrair TODOS os palpites preenchidos.

Para cada jogo identificado, retorne:
- time1: nome do primeiro time (como está no template)
- time2: nome do segundo time
- gols1: número de gols que o participante apostou para o time 1
- gols2: número de gols que o participante apostou para o time 2
- confianca: de 0.0 a 1.0 — quão legível estava a escrita (0.9+ = muito claro, abaixo de 0.7 = difícil de ler)

Regras importantes:
- Se um campo não estiver preenchido, OMITA o jogo (não inclua com null)
- Interprete variações de escrita: "2x1", "2 x 1", "2 - 1", "2/1" são todos o mesmo formato
- Se houver número do jogo no template, inclua em "numero_jogo"
- Não invente palpites — só extraia o que estiver visível
- Retorne APENAS JSON válido, sem texto antes ou depois

Formato de saída:
{
  "participante": "nome se visível no template, senão null",
  "palpites": [
    {
      "numero_jogo": 1,
      "time1": "Brasil",
      "time2": "México",
      "gols1": 2,
      "gols2": 1,
      "confianca": 0.95
    }
  ]
}
`.trim();

export type GeminiResultado = {
  participante: string | null;
  palpites: PalpiteExtraido[];
};

/**
 * Envia uma imagem (base64) para o Gemini Vision e retorna os palpites extraídos.
 * @param imageBase64 - imagem codificada em base64
 * @param mimeType    - ex: "image/jpeg", "image/png", "image/webp"
 */
export async function extrairPalpitesDeImagem(
  imageBase64: string,
  mimeType: string
): Promise<GeminiResultado> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          { text: PROMPT },
        ],
      },
    ],
    config: {
      temperature: 0.1, // baixo: queremos precisão, não criatividade
      responseMimeType: "application/json",
    },
  });

  const raw = response.text ?? "";

  // Extrai JSON mesmo que o modelo coloque ```json ... ``` ao redor
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Gemini não retornou JSON válido: ${raw.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeminiResultado;

  // Garante que palpites seja sempre um array
  if (!Array.isArray(parsed.palpites)) {
    parsed.palpites = [];
  }

  return parsed;
}
