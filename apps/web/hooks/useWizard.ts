import { useState, useCallback, useRef } from "react";
import type { WizardStep, MCPLabel, ContractAnalysis } from "@/types";

interface WizardState {
  step: WizardStep;
  email: string;
  file: File | null;
  labels: MCPLabel[];
  result: ContractAnalysis | null;
  error: string | null;
}

const INIT: WizardState = {
  step: "email",
  email: "",
  file: null,
  labels: [],
  result: null,
  error: null,
};

export function useWizard() {
  const [state, setState] = useState<WizardState>(INIT);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setEmail = useCallback((email: string) => {
    setState((s) => ({ ...s, email }));
  }, []);

  const setFile = useCallback((file: File | null) => {
    setState((s) => ({ ...s, file }));
  }, []);

  const startAnalysis = useCallback(async () => {
    setState((s) => ({ ...s, step: "analyzing", labels: [], error: null }));

    let done = false;
    intervalRef.current = setInterval(async () => {
      if (done) return;
      try {
        const res = await fetch("/api/analysis/labels");
        const data: MCPLabel[] = await res.json();
        setState((s) => ({ ...s, labels: data }));
      } catch {
        // keep polling
      }
    }, 1200);

    try {
      const formData = new FormData();
      formData.append("email", state.email);
      if (state.file) formData.append("contract", state.file);

      const uploadRes = await fetch("/api/analysis/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Error subiendo el archivo");
      const { id } = (await uploadRes.json()) as { id: string };

      const runRes = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!runRes.ok) throw new Error("Error en el análisis");
      const result: ContractAnalysis = await runRes.json();

      done = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setState((s) => ({ ...s, step: "results", result }));
    } catch (e) {
      done = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setState((s) => ({ ...s, error: (e as Error).message }));
    }
  }, [state.email, state.file]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState(INIT);
  }, []);

  const goToUpload = useCallback(() => setState((s) => ({ ...s, step: "upload" })), []);
  const goToEmail = useCallback(() => setState((s) => ({ ...s, step: "email" })), []);

  return { state, setEmail, setFile, goToUpload, goToEmail, startAnalysis, reset };
}
