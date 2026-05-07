import { useEffect, useState } from "react";
import type { MCPLabel } from "@/types";

// Durations in ms for each stage before advancing
const ANALYSIS_STAGES = [
  { icon: "📄", label: "Leyendo el PDF del contrato…",          duration: 5000  },
  { icon: "🏛️", label: "Verificando institución en CMF…",       duration: 8000  },
  { icon: "⚖️", label: "Analizando cláusulas legales…",         duration: 25000 },
  { icon: "✉️", label: "Generando carta ARCO…",                 duration: 10000 },
  { icon: "✅", label: "Finalizando análisis…",                  duration: 99999 },
];

interface Props {
  labels: MCPLabel[];
  error: string | null;
  email: string;
}

export default function StepAnalyzing({ labels, error, email }: Props) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= ANALYSIS_STAGES.length - 1) return;
    const t = setTimeout(() => setStage((s) => s + 1), ANALYSIS_STAGES[stage].duration);
    return () => clearTimeout(t);
  }, [stage]);

  const current = ANALYSIS_STAGES[stage];

  return (
    <div className="flex flex-col items-center w-full py-4">
      {/* Spinner */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-1">Analizando tu contrato</h2>
      <p className="text-slate-500 mb-8 text-sm">{email}</p>

      {/* Progress bar */}
      <div className="w-full mb-2">
        <div className="flex gap-1 mb-4">
          {ANALYSIS_STAGES.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${
                i <= stage ? "bg-emerald-500" : "bg-slate-100"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current stage */}
      <div className="w-full space-y-2">
        {ANALYSIS_STAGES.slice(0, stage + 1).map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              i === stage
                ? "bg-emerald-50 border border-emerald-100"
                : "bg-slate-50 opacity-50"
            }`}
          >
            <span className="text-lg">{s.icon}</span>
            <p className={`text-sm font-medium ${i === stage ? "text-emerald-800" : "text-slate-400"}`}>
              {s.label}
            </p>
            {i < stage && (
              <span className="ml-auto text-emerald-500 text-xs font-bold">✓</span>
            )}
            {i === stage && (
              <span className="ml-auto w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 w-full px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-700 font-medium">Error: {error}</p>
        </div>
      )}
    </div>
  );
}
