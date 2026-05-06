import type { NextApiRequest, NextApiResponse } from "next";
import type { MCPStatus } from "@/types";

export default function handler(_req: NextApiRequest, res: NextApiResponse<MCPStatus>) {
  res.json({ source: "drive", connected: true, lastSync: new Date().toISOString(), error: null });
}
