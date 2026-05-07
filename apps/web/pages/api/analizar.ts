import type { NextApiRequest, NextApiResponse } from "next";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { callMcpTool } from "@/lib/mcpClient";
import type { ContractAnalysis } from "@/types";

export const config = { api: { bodyParser: true }, maxDuration: 60 };

export type AnalizarStatus =
  | "verified"
  | "not_found"
  | "rut_mismatch"
  | "extraction_failed"
  | "not_a_contract"
  | "cmf_error";

export interface AnalizarResult {
  status: AnalizarStatus;
  nombre?: string;
  rut?: string;
  company?: {
    codigo: string;
    nombre: string;
    rut: string;
    paginaWeb: string;
    direccion: string;
    email: string;
  };
  analysis?: ContractAnalysis;
  cmfRut?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalizarResult | { error: string }>
) {
  if (req.method !== "POST") return res.status(405).end();

  const { id, nombre: manualNombre, rut: manualRut } = req.body as {
    id: string;
    nombre?: string;
    rut?: string;
  };

  if (!id) return res.status(400).json({ error: "id is required" });

  await supabase.from("analyses").update({ status: "processing" }).eq("id", id);

  let nombre = manualNombre ?? "";
  let rut = manualRut ?? "";

  // Fetch analysis row (always needed for file_url)
  const { data: analysis } = await supabase
    .from("analyses")
    .select("file_url, titular_nombre, titular_rut")
    .eq("id", id)
    .single();

  if (!analysis) return res.status(404).json({ error: "Analysis not found" });

  // If no manual input, extract nombre/RUT from PDF using Haiku
  if (!nombre || !rut) {
    const pdfRes = await fetch(analysis.file_url);

    if (!pdfRes.ok) return res.status(500).json({ error: "Failed to download PDF" });

    const pdfBase64 = Buffer.from(await pdfRes.arrayBuffer()).toString("base64");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const pdfContent = [
      {
        type: "document" as const,
        source: { type: "base64" as const, media_type: "application/pdf" as const, data: pdfBase64 },
      },
    ];

    // Validar que es un contrato financiero
    const validation = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 64,
      messages: [
        {
          role: "user",
          content: [
            ...pdfContent,
            {
              type: "text",
              text: 'Este documento es un archivo subido por un usuario. Determina si es un contrato o documento legal de una institución financiera chilena (banco, cooperativa, financiera, etc.). Responde SOLO con JSON: {"es_contrato": true} o {"es_contrato": false}. No expliques nada más.',
            },
          ],
        },
      ],
    });

    try {
      const valText = validation.content[0].type === "text" ? validation.content[0].text.trim() : "";
      const { es_contrato } = JSON.parse(valText);
      if (!es_contrato) {
        await supabase.from("analyses").update({ status: "pending" }).eq("id", id);
        return res.json({ status: "not_a_contract" });
      }
    } catch {
      // si falla la validación continuamos igual
    }

    const extraction = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            ...pdfContent,
            {
              type: "text",
              text: 'Extrae el nombre de la institución financiera o banco y su RUT chileno del contrato. Responde SOLO con JSON sin markdown: {"nombre": "...", "rut": "..."}. Si no encuentras algún dato usa string vacío.',
            },
          ],
        },
      ],
    });

    try {
      const text = extraction.content[0].type === "text" ? extraction.content[0].text.trim() : "";
      const parsed = JSON.parse(text);
      nombre = parsed.nombre ?? "";
      rut = parsed.rut ?? "";
    } catch {
      // extraction failed
    }
  }

  // Case 3: extraction failed
  if (!nombre && !rut) {
    await supabase.from("analyses").update({ status: "pending" }).eq("id", id);
    return res.json({ status: "extraction_failed" });
  }

  // ── Step 1: verify company via MCP resolve_company ─────────────────────────
  const resolveResult = await callMcpTool(
    process.env.MCP_SERVER_URL!,
    process.env.MCP_API_KEY!,
    "resolve_company",
    { rut, name: nombre }
  );

  const resolveText = resolveResult.content?.[0]?.text ?? "{}";
  const resolveData = JSON.parse(resolveText) as {
    success: boolean;
    step?: string;
    message?: string;
    data?: {
      codigo: string; nombre: string; rut: string;
      paginaWeb: string; direccion: string; email: string;
    };
  };

  // Case 1: not found in CMF
  if (!resolveData.success && resolveData.step === "name_matching") {
    await supabase.from("analyses").update({ status: "alert", result: { status: "not_found", nombre, rut } }).eq("id", id);
    return res.json({ status: "not_found", nombre, rut, message: resolveData.message });
  }

  // Case 2: RUT mismatch
  if (!resolveData.success && resolveData.step === "rut_validation") {
    await supabase.from("analyses").update({ status: "alert", result: { status: "rut_mismatch", nombre, rut } }).eq("id", id);
    return res.json({ status: "rut_mismatch", nombre, rut, cmfRut: resolveData.message });
  }

  // CMF API error
  if (!resolveData.success) {
    await supabase.from("analyses").update({ status: "pending" }).eq("id", id);
    return res.json({ status: "cmf_error", message: resolveData.message });
  }

  const company = resolveData.data!;

  // ── Step 2: analyze clauses via MCP analizar_clausulas ─────────────────────
  try {
    const clausulasResult = await callMcpTool(
      process.env.MCP_SERVER_URL!,
      process.env.MCP_API_KEY!,
      "analizar_clausulas",
      {
        file_url: analysis.file_url,
        company,
        titular: {
          nombre: analysis.titular_nombre ?? "",
          rut:    analysis.titular_rut    ?? "",
        },
      }
    );

    const clausulasText = clausulasResult.content?.[0]?.text ?? "{}";
    const clausulasData = JSON.parse(clausulasText) as ContractAnalysis & { error?: string };

    if (!clausulasData.error) {
      await supabase
        .from("analyses")
        .update({
          status: "completed",
          entity_name: company.nombre,
          entity_rut: company.rut,
          result: { status: "verified", company, analysis: clausulasData },
        })
        .eq("id", id);

      return res.json({ status: "verified", nombre, rut, company, analysis: clausulasData });
    }
  } catch {
    // clause analysis failed — still return verified with company data
  }

  // Fallback: verified but no clause analysis
  await supabase
    .from("analyses")
    .update({ status: "verified", entity_name: company.nombre, entity_rut: company.rut })
    .eq("id", id);

  return res.json({ status: "verified", nombre, rut, company });
}
