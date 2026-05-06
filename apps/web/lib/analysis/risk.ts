import type { MCPLabel, RiskLevel } from "@/types";

const RISK_ORDER: RiskLevel[] = ["critical", "high", "medium", "low", "safe"];

export function highestRisk(labels: MCPLabel[]): RiskLevel {
  for (const level of RISK_ORDER) {
    if (labels.some((l) => l.risk === level)) return level;
  }
  return "safe";
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
  safe: "#22c55e",
};
