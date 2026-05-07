import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export const config = { api: { bodyParser: true } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ status: string } | { error: string }>
) {
  if (req.method !== "POST") return res.status(405).end();

  const { id } = req.body as { id: string };
  if (!id) return res.status(400).json({ error: "id is required" });

  await supabase.from("analyses").update({ status: "processing" }).eq("id", id);

  // TODO: análisis real con Claude + MCP
  res.status(202).json({ status: "processing" });
}
