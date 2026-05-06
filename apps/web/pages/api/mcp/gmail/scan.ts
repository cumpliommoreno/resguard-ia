import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  // TODO: conectar con MCP Gmail para analizar correos
  res.status(202).json({ message: "Gmail scan enqueued" });
}
