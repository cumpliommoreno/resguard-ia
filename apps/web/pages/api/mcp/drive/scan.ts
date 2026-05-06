import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  // TODO: conectar con MCP Drive para analizar archivos y permisos
  res.status(202).json({ message: "Drive scan enqueued" });
}
