import type { NextApiRequest, NextApiResponse } from "next";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { callMcpTool } from "@/lib/mcpClient";

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

  const { data: analysis } = await supabase
    .from("analyses")
    .select("file_url, titular_nombre, titular_rut")
    .eq("id", id)
    .single();

  if (!analysis) return res.status(404).json({ error: "Analysis not found" });

  // Extract nombre/RUT from PDF using Haiku
  if (!nombre || !rut) {
    const pdfRes = await fetch(analysis.file_url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });

    if (!pdfRes.ok) return res.status(500).json({ error: "Failed to download PDF" });

    const pdfBase64 = Buffer.from(await pdfRes.arrayBuffer()).toString("base64");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const pdfContent = [
      {
        type: "document" as const,
        source: { type: "base64" as const, media_type: "application/pdf" as const, data: pdfBase64 },
      },
    ];

    // Validate it's a financial contract
    const validation = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 64,
      messages: [{
        role: "user",
        content: [
          ...pdfContent,
          { type: "text", text: 'Determina si este documento es un contrato o documento legal de una institución financiera chilena. Responde SOLO con JSON: {"es_contrato": true} o {"es_contrato": false}' },
        ],
      }],
    });

    try {
      const valText = validation.content[0].type === "text" ? validation.content[0].text.trim() : "";
      const cleaned = valText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const { es_contrato } = JSON.parse(cleaned);
      if (!es_contrato) {
        await supabase.from("analyses").update({ status: "pending" }).eq("id", id);
        return res.json({ status: "not_a_contract" });
      }
    } catch {
      // continue if validation parse fails
    }

    // Extract bank name and RUT
    const extraction = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: [
          ...pdfContent,
          { type: "text", text: 'Extrae el nombre de la institución financiera o banco y su RUT chileno del contrato. Responde SOLO con JSON sin markdown: {"nombre": "...", "rut": "..."}' },
        ],
      }],
    });

    try {
      const text = extraction.content[0].type === "text" ? extraction.content[0].text.trim() : "";
      const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      nombre = parsed.nombre ?? "";
      rut = parsed.rut ?? "";
    } catch {
      // extraction failed
    }
  }

  if (!nombre && !rut) {
    await supabase.from("analyses").update({ status: "pending" }).eq("id", id);
    return res.json({ status: "extraction_failed" });
  }

  // Verify company via MCP resolve_company
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
    data?: { codigo: string; nombre: string; rut: string; paginaWeb: string; direccion: string; email: string };
  };

  if (!resolveData.success && resolveData.step === "name_matching") {
    await supabase.from("analyses").update({ status: "alert", result: { status: "not_found", nombre, rut } }).eq("id", id);
    return res.json({ status: "not_found", nombre, rut, message: resolveData.message });
  }

  if (!resolveData.success && resolveData.step === "rut_validation") {
    await supabase.from("analyses").update({ status: "alert", result: { status: "rut_mismatch", nombre, rut } }).eq("id", id);
    return res.json({ status: "rut_mismatch", nombre, rut, cmfRut: resolveData.message });
  }

  if (!resolveData.success) {
    await supabase.from("analyses").update({ status: "pending" }).eq("id", id);
    return res.json({ status: "cmf_error", message: resolveData.message });
  }

  const company = resolveData.data!;

  // Save verified company data — clause analysis happens in /api/clausulas
  await supabase
    .from("analyses")
    .update({ status: "verified", entity_name: company.nombre, entity_rut: company.rut })
    .eq("id", id);

  return res.json({ status: "verified", nombre, rut, company });
}
