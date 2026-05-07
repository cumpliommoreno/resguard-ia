import { useState, useCallback, useRef } from "react";
import type { WizardStep, MCPLabel, ContractAnalysis, AlertData, CompanyProfile } from "@/types";
import type { AnalizarResult } from "@/pages/api/analizar";
import type { ClausulasResult } from "@/pages/api/clausulas";

interface WizardState {
  step: WizardStep;
  email: string;
  nombre: string;
  rut: string;
  file: File | null;
  analysisId: string | null;
  labels: MCPLabel[];
  result: ContractAnalysis | null;
  company: CompanyProfile | null;
  alert: AlertData | null;
  error: string | null;
  manualLoading: boolean;
}

const INIT: WizardState = {
  step: "email",
  email: "",
  nombre: "",
  rut: "",
  file: null,
  analysisId: null,
  labels: [],
  result: null,
  company: null,
  alert: null,
  error: null,
  manualLoading: false,
};

export function useWizard() {
  const [state, setState] = useState<WizardState>(INIT);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setEmail  = useCallback((email: string)  => setState((s) => ({ ...s, email })), []);
  const setNombre = useCallback((nombre: string) => setState((s) => ({ ...s, nombre })), []);
  const setRut    = useCallback((rut: string)    => setState((s) => ({ ...s, rut })), []);
  const setFile   = useCallback((file: File | null) => setState((s) => ({ ...s, file })), []);
  const goToUpload = useCallback(() => setState((s) => ({ ...s, step: "upload" })), []);
  const goToEmail = useCallback(() => setState((s) => ({ ...s, step: "email" })), []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState(INIT);
  }, []);

  const runAnalysis = useCallback(async (id: string, nombre?: string, rut?: string) => {
    setState((s) => ({ ...s, step: "analyzing", labels: [], error: null, manualLoading: false }));

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
      const res = await fetch("/api/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nombre, rut }),
      });

      if (!res.ok) throw new Error("Error en el análisis");
      const data: AnalizarResult = await res.json();

      done = true;
      if (intervalRef.current) clearInterval(intervalRef.current);

      if (data.status === "verified" && data.company) {
        setState((s) => ({ ...s, company: data.company! }));

        // Step 2: analyze clauses in separate call
        try {
          const clausulasRes = await fetch("/api/clausulas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          const clausulasData: ClausulasResult = await clausulasRes.json();

          done = true;
          if (intervalRef.current) clearInterval(intervalRef.current);
          setState((s) => ({
            ...s,
            step: "results",
            company: data.company!,
            result: clausulasData.analysis ?? null,
          }));
        } catch {
          done = true;
          if (intervalRef.current) clearInterval(intervalRef.current);
          setState((s) => ({ ...s, step: "results", company: data.company! }));
        }
        return;
      }

      if (data.status === "not_found") {
        setState((s) => ({
          ...s,
          step: "alert",
          alert: { type: "not_found", nombre: data.nombre, contractRut: data.rut },
        }));
        return;
      }

      if (data.status === "rut_mismatch") {
        setState((s) => ({
          ...s,
          step: "alert",
          alert: { type: "rut_mismatch", nombre: data.nombre, contractRut: data.rut, cmfRut: data.cmfRut },
        }));
        return;
      }

      if (data.status === "not_a_contract") {
        setState((s) => ({
          ...s,
          step: "alert",
          alert: { type: "not_a_contract" },
        }));
        return;
      }

      if (data.status === "extraction_failed") {
        setState((s) => ({ ...s, step: "manual_input" }));
        return;
      }

      // cmf_error or unknown
      setState((s) => ({
        ...s,
        step: "alert",
        alert: { type: "cmf_error", message: data.message },
      }));
    } catch (e) {
      done = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setState((s) => ({ ...s, error: (e as Error).message }));
    }
  }, []);

  const startAnalysis = useCallback(async () => {
    setState((s) => ({ ...s, step: "analyzing", labels: [], error: null }));

    try {
      const formData = new FormData();
      formData.append("email", state.email);
      formData.append("titular_nombre", state.nombre);
      formData.append("titular_rut", state.rut);
      if (state.file) formData.append("contract", state.file);

      const uploadRes = await fetch("/api/analysis/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Error subiendo el archivo");
      const { id } = (await uploadRes.json()) as { id: string };

      setState((s) => ({ ...s, analysisId: id }));
      await runAnalysis(id);
    } catch (e) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setState((s) => ({ ...s, error: (e as Error).message }));
    }
  }, [state.email, state.file, runAnalysis]);

  const retryWithManual = useCallback(
    async (nombre: string, rut: string) => {
      if (!state.analysisId) return;
      setState((s) => ({ ...s, manualLoading: true }));
      await runAnalysis(state.analysisId, nombre, rut);
    },
    [state.analysisId, runAnalysis]
  );

  return {
    state,
    setEmail,
    setNombre,
    setRut,
    setFile,
    goToUpload,
    goToEmail,
    startAnalysis,
    retryWithManual,
    reset,
  };
}
