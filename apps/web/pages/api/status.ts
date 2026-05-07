import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import type { ContractAnalysis } from "@/types";

export interface StatusResult {
  status: string;
  analysis?: ContractAnalysis;
  company?: {
    codigo: string; nombre: string; rut: string;
    paginaWeb: string; direccion: string; email: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResult | { error: string }>
) {
  if (req.method !== "GET") return res.status(405).end();

  const { id } = req.query as { id: string };
  if (!id) return res.status(400).json({ error: "id is required" });

  const { data } = await supabase
    .from("analyses")
    .select("status, result")
    .eq("id", id)
    .single();

  if (!data) return res.status(404).json({ error: "Not found" });

  const result = data.result as { company?: StatusResult["company"]; analysis?: ContractAnalysis } | null;

  return res.json({
    status: data.status,
    company:  result?.company,
    analysis: result?.analysis,
  });
}
