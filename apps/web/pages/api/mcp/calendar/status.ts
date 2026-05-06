import type { NextApiRequest, NextApiResponse } from "next";
import type { MCPStatus } from "@/types";

export default function handler(_req: NextApiRequest, res: NextApiResponse<MCPStatus>) {
  res.json({ source: "calendar", connected: false, lastSync: null, error: "Token expirado" });
}
