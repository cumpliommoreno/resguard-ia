import type { AlertData } from "@/types";

interface Props {
  alert: AlertData;
  onReset: () => void;
}

export default function StepAlert({ alert, onReset }: Props) {
  const isCritical = alert.type === "rut_mismatch";

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isCritical ? "bg-red-100" : "bg-amber-100"}`}>
        <svg className={`w-8 h-8 ${isCritical ? "text-red-600" : "text-amber-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      {/* Title */}
      <div>
        <h2 className={`text-xl font-bold mb-1 ${isCritical ? "text-red-700" : "text-amber-700"}`}>
          {isCritical ? "Posible suplantación de identidad" : "Empresa no encontrada en CMF"}
        </h2>

        {alert.type === "not_found" && (
          <p className="text-slate-600 text-sm max-w-xs mx-auto">
            <strong>{alert.nombre}</strong> no aparece en ningún registro de la CMF. Podría ser una empresa no regulada o un nombre incorrecto en el contrato.
          </p>
        )}

        {alert.type === "rut_mismatch" && (
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-slate-600 max-w-xs mx-auto">
              El RUT del contrato no coincide con el RUT oficial registrado en CMF para <strong>{alert.nombre}</strong>.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left space-y-2 mt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">RUT en el contrato</span>
                <span className="font-mono font-semibold text-red-700">{alert.contractRut || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">RUT real en CMF</span>
                <span className="font-mono font-semibold text-emerald-700">{alert.cmfRut || "—"}</span>
              </div>
            </div>
          </div>
        )}

        {alert.type === "cmf_error" && (
          <p className="text-slate-600 text-sm max-w-xs mx-auto">
            Los servicios de CMF presentan intermitencia. Intenta nuevamente en unos minutos.
          </p>
        )}
      </div>

      {/* CMF link — only for not_found */}
      {alert.type === "not_found" && (
        <a
          href="https://www.cmfchile.cl/portal/alertas"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Ver alertas CMF
        </a>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
      >
        Analizar otro contrato
      </button>
    </div>
  );
}
