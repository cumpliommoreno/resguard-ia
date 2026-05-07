import type { NextApiRequest, NextApiResponse } from "next";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { callMcpTool } from "@/lib/mcpClient";

export const config = { api: { bodyParser: true } };

export type AnalizarStatus =
  | "verified"
  | "not_found"
  | "rut_mismatch"
  | "extraction_failed"
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

  // If no manual input, extract from PDF using Haiku
  if (!nombre || !rut) {
    const { data: analysis } = await supabase
      .from("analyses")
      .select("file_url")
      .eq("id", id)
      .single();

    if (!analysis) return res.status(404).json({ error: "Analysis not found" });

    const pdfRes = await fetch(analysis.file_url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });

    if (!pdfRes.ok) return res.status(500).json({ error: "Failed to download PDF" });

    const pdfBase64 = Buffer.from(await pdfRes.arrayBuffer()).toString("base64");

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const extraction = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
            },
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
      // Haiku couldn't extract or returned invalid JSON
    }
  }

  // Case 3: extraction failed
  if (!nombre && !rut) {
    await supabase.from("analyses").update({ status: "pending" }).eq("id", id);
    return res.json({ status: "extraction_failed" });
  }

  // Call MCP resolve_company
  const mcpResult = await callMcpTool(
    process.env.MCP_SERVER_URL!,
    process.env.MCP_API_KEY!,
    "resolve_company",
    { rut, name: nombre }
  );

  const resultText = mcpResult.content?.[0]?.text ?? "{}";
  const mcpData = JSON.parse(resultText) as {
    success: boolean;
    step?: string;
    message?: string;
    data?: {
      codigo: string;
      nombre: string;
      rut: string;
      paginaWeb: string;
      direccion: string;
      email: string;
    };
  };

  // Case 1: not found in CMF
  if (!mcpData.success && mcpData.step === "name_matching") {
    await supabase
      .from("analyses")
      .update({ status: "alert", result: { status: "not_found", nombre, rut } })
      .eq("id", id);
    return res.json({ status: "not_found", nombre, rut, message: mcpData.message });
  }

  // Case 2: RUT mismatch
  if (!mcpData.success && mcpData.step === "rut_validation") {
    await supabase
      .from("analyses")
      .update({ status: "alert", result: { status: "rut_mismatch", nombre, rut } })
      .eq("id", id);
    return res.json({
      status: "rut_mismatch",
      nombre,
      rut,
      cmfRut: mcpData.message,
    });
  }

  // CMF API error
  if (!mcpData.success) {
    await supabase.from("analyses").update({ status: "pending" }).eq("id", id);
    return res.json({ status: "cmf_error", message: mcpData.message });
  }

  // Success
  await supabase
    .from("analyses")
    .update({
      status: "verified",
      entity_name: mcpData.data!.nombre,
      entity_rut: mcpData.data!.rut,
      result: { status: "verified", company: mcpData.data },
    })
    .eq("id", id);

  return res.json({ status: "verified", nombre, rut, company: mcpData.data });
}
