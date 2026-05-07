import type { NextApiRequest, NextApiResponse } from "next";
import type { ContractAnalysis } from "@/types";
import { supabase } from "@/lib/supabase";

export const config = { api: { bodyParser: true } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContractAnalysis | { error: string }>
) {
  if (req.method !== "POST") return res.status(405).end();

  const { id } = req.body as { id: string };
  if (!id) return res.status(400).json({ error: "id is required" });

  await supabase.from("analyses").update({ status: "processing" }).eq("id", id);

  // TODO: análisis real con Claude + MCP
  await new Promise((r) => setTimeout(r, 4000));

  const result: ContractAnalysis = {
    entityName: "Banco de Chile",
    entityType: "Institución financiera",
    findings: [],
    dataSharing: [],
    laws: [],
    emailAction: {
      to: "privacidad@bancochile.cl",
      entityName: "Banco de Chile",
      subject: "Ejercicio de derechos ARCO — Ley 19.628",
      body: "",
    },
  };

  await supabase
    .from("analyses")
    .update({ status: "completed", result })
    .eq("id", id);

  res.json(result);
}
