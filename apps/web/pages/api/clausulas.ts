import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { callMcpTool } from "@/lib/mcpClient";
import type { ContractAnalysis } from "@/types";

export const config = { api: { bodyParser: true }, maxDuration: 60 };

export interface ClausulasResult {
  status: "completed" | "failed";
  analysis?: ContractAnalysis;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClausulasResult | { error: string }>
) {
  if (req.method !== "POST") return res.status(405).end();

  const { id } = req.body as { id: string };
  if (!id) return res.status(400).json({ error: "id is required" });

  const { data: analysis } = await supabase
    .from("analyses")
    .select("file_url, titular_nombre, titular_rut, entity_name, entity_rut, result")
    .eq("id", id)
    .single();

  if (!analysis) return res.status(404).json({ error: "Analysis not found" });

  // Get company data saved from /api/analizar
  const savedResult = analysis.result as { company?: { codigo: string; nombre: string; rut: string; paginaWeb: string; direccion: string; email: string } } | null;
  const company = savedResult?.company ?? {
    codigo: "",
    nombre: analysis.entity_name ?? "",
    rut:    analysis.entity_rut  ?? "",
    paginaWeb: "",
    direccion: "",
    email: "",
  };

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

    if (clausulasData.error) {
      return res.json({ status: "failed" });
    }

    await supabase
      .from("analyses")
      .update({
        status: "completed",
        result: { company, analysis: clausulasData },
      })
      .eq("id", id);

    return res.json({ status: "completed", analysis: clausulasData });
  } catch {
    return res.json({ status: "failed" });
  }
}
