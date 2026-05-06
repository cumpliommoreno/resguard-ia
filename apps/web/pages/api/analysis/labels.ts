import type { NextApiRequest, NextApiResponse } from "next";
import type { MCPLabel } from "@/types";

// Labels que van apareciendo mientras el análisis corre
// El frontend hace polling cada 1.2s y muestra los que han llegado
const ALL_LABELS: MCPLabel[] = [
  { id: "l1", source: "gmail",    risk: "high",     text: "Correo de bienvenida contiene referencia a cesión de datos a terceros",       ts: 0 },
  { id: "l2", source: "drive",    risk: "critical",  text: "Contrato subido: 3 cláusulas con lenguaje ambiguo sobre finalidad del uso",   ts: 0 },
  { id: "l3", source: "gmail",    risk: "medium",    text: "Notificaciones de marketing recibidas sin opt-in explícito documentado",      ts: 0 },
  { id: "l4", source: "calendar", risk: "low",       text: "Sin eventos relacionados con consentimientos firmados en los últimos 90 días", ts: 0 },
  { id: "l5", source: "drive",    risk: "critical",  text: "Cláusula de transferencia internacional detectada — sin país de destino",     ts: 0 },
  { id: "l6", source: "gmail",    risk: "high",      text: "Estado de cuenta contiene RUT, nombre y dirección — enviado sin cifrar",       ts: 0 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse<MCPLabel[]>) {
  // Simula que van llegando progresivamente según el tiempo del servidor
  // En producción: retornar los labels reales acumulados por los MCPs
  const now = Date.now();
  const secondsSinceStart = Math.floor((now % 10000) / 1200);
  const count = Math.min(ALL_LABELS.length, secondsSinceStart + 1);
  res.json(ALL_LABELS.slice(0, count));
}
