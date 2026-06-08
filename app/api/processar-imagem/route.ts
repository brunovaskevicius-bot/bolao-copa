import { NextRequest, NextResponse } from "next/server";
import { extrairPalpitesDeImagem } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60; // Gemini pode demorar alguns segundos

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const arquivo   = formData.get("arquivo")   as File   | null;
    const nomeParam = formData.get("nome")       as string | null;

    if (!arquivo || !nomeParam) {
      return NextResponse.json(
        { erro: "Campos obrigatórios: arquivo, nome" },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();

    // 1. Garante que o participante existe (cria se não)
    let { data: participante, error: errPart } = await db
      .from("participantes")
      .select("id")
      .eq("nome", nomeParam)
      .maybeSingle();

    if (errPart) throw errPart;

    if (!participante) {
      const { data: novo, error: errNovo } = await db
        .from("participantes")
        .insert({ nome: nomeParam })
        .select("id")
        .single();
      if (errNovo) throw errNovo;
      participante = novo;
    }

    // 2. Faz upload da imagem para o Supabase Storage
    const bytes     = await arquivo.arrayBuffer();
    const buffer    = Buffer.from(bytes);
    const ext       = arquivo.name.split(".").pop() ?? "jpg";
    const storePath = `uploads/${participante.id}/${Date.now()}.${ext}`;

    const { error: errStorage } = await db.storage
      .from("uploads")
      .upload(storePath, buffer, {
        contentType: arquivo.type,
        upsert: false,
      });

    if (errStorage) throw errStorage;

    // 3. Cria registro de upload como "processando"
    const { data: upload, error: errUpload } = await db
      .from("uploads")
      .insert({
        participante_id: participante.id,
        storage_path: storePath,
        status: "processando",
      })
      .select("id")
      .single();

    if (errUpload) throw errUpload;

    // 4. Chama Gemini Vision
    const base64    = buffer.toString("base64");
    const mimeType  = arquivo.type || "image/jpeg";

    let resultado;
    try {
      resultado = await extrairPalpitesDeImagem(base64, mimeType);
    } catch (errGemini) {
      // Marca upload como erro e propaga
      await db
        .from("uploads")
        .update({ status: "erro", erro_msg: String(errGemini) })
        .eq("id", upload.id);
      throw errGemini;
    }

    // 5. Salva extração e muda status para "revisao" (aguarda confirmação do usuário)
    await db
      .from("uploads")
      .update({
        status: "revisao",
        ai_extracao: resultado.palpites,
      })
      .eq("id", upload.id);

    // 6. Retorna para o frontend revisar
    return NextResponse.json({
      upload_id:   upload.id,
      participante: nomeParam,
      palpites:    resultado.palpites,
      total:       resultado.palpites.length,
    });
  } catch (err) {
    console.error("[processar-imagem]", err);
    return NextResponse.json(
      { erro: "Erro interno ao processar imagem", detalhe: String(err) },
      { status: 500 }
    );
  }
}
