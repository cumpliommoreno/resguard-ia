import type { RiskLevel } from "@/types";
import { RISK_COLORS } from "@/lib/analysis/risk";

interface Props {
  level: RiskLevel;
}

export default function RiskBadge({ level }: Props) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#fff",
        background: RISK_COLORS[level],
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {level}
    </span>
  );
}
