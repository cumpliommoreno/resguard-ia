import { useEffect, useRef } from "react";
import type { MCPLabel, RiskLevel } from "@/types";

const RISK_CONFIG: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500" },
  high:     { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  medium:   { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  low:      { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500" },
  safe:     { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
};

const SOURCE_ICON: Record<string, string> = {
  gmail:    "📧",
  drive:    "📁",
  calendar: "📅",
};

const ANALYSIS_STAGES = [
  { icon: "📄", label: "Subiendo contrato al servidor…" },
  { icon: "🔍", label: "Leyendo el PDF del contrato…" },
  { icon: "🏛️", label: "Verificando institución en CMF…" },
  { icon: "⚖️", label: "Analizando cláusulas contra Ley 19.628…" },
  { icon: "✉️", label: "Generando carta ARCO…" },
];

interface Props {
  labels: MCPLabel[];
  error: string | null;
  email: string;
}

export default function StepAnalyzing({ labels, error, email }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [labels]);

  const activeStage = Math.min(labels.length, ANALYSIS_STAGES.length - 1);
  const stage = ANALYSIS_STAGES[activeStage];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Spinner */}
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
        <div className="w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-1">Analizando tu contrato</h2>
      <p className="text-slate-500 mb-6 text-sm">{email}</p>

      {/* Stage progress bar */}
      <div className="w-full max-w-md mb-6">
        <div className="flex gap-1 mb-3">
          {ANALYSIS_STAGES.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${
                i <= activeStage ? "bg-emerald-500" : "bg-slate-100"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-base">{stage.icon}</span>
          <p className="text-xs text-slate-500 font-medium">{stage.label}</p>
        </div>
      </div>

      {/* Live labels stream */}
      <div className="w-full max-w-md space-y-2 max-h-64 overflow-y-auto pr-1">
        {labels.length === 0 && !error && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 rounded-xl bg-slate-100 animate-pulse"
                style={{ opacity: 1 - i * 0.2 }}
              />
            ))}
          </div>
        )}
        {labels.map((label, i) => {
          const cfg = RISK_CONFIG[label.risk];
          return (
            <div
              key={label.id}
              className={`flex items-start gap-3 px-4 py-2.5 rounded-xl ${cfg.bg} animate-fadeIn`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="text-base leading-none mt-0.5">{SOURCE_ICON[label.source] ?? "📌"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${cfg.text} leading-snug`}>{label.text}</p>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">{label.source}</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${cfg.dot} mt-1.5 shrink-0`} />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mt-4 w-full max-w-md px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-700 font-medium">Error: {error}</p>
        </div>
      )}
    </div>
  );
}
