import type { WizardStep } from "@/types";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "email", label: "Tu correo" },
  { id: "upload", label: "Contrato" },
  { id: "analyzing", label: "Análisis" },
  { id: "results", label: "Resultados" },
];

const ORDER: WizardStep[] = ["email", "upload", "analyzing", "results"];

export default function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = ORDER.indexOf(current);

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                  active ? "text-emerald-600" : done ? "text-slate-500" : "text-slate-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-16 h-0.5 mb-5 mx-1 transition-all duration-500 ${
                  i < currentIdx ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
