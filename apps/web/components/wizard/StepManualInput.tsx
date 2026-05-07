import { useState } from "react";

interface Props {
  onSubmit: (nombre: string, rut: string) => void;
  loading: boolean;
}

export default function StepManualInput({ onSubmit, loading }: Props) {
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");

  const valid = nombre.trim().length > 2 && rut.trim().length > 5;

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900">No pudimos leer el PDF</h2>
        <p className="text-sm text-slate-500 max-w-xs">
          Ingresa el nombre del banco y RUT del contrato para continuar el análisis.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Nombre del banco o institución
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Banco de Chile"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            RUT de la institución
          </label>
          <input
            type="text"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="Ej: 97.004.000-5"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
      </div>

      <button
        onClick={() => onSubmit(nombre.trim(), rut.trim())}
        disabled={!valid || loading}
        className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Verificando…" : "Verificar con CMF"}
      </button>
    </div>
  );
}
