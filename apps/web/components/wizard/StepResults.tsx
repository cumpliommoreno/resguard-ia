import { useState } from "react";
import type { ContractAnalysis, FindingStatus } from "@/types";
import { HACKATHON_LABEL } from "@/lib/constants";

const FINDING_CONFIG: Record<FindingStatus, {
  border: string; bg: string; badgeBg: string; badgeText: string; icon: string; label: string;
}> = {
  excede_ley: { border: "border-l-red-500", bg: "bg-red-50", badgeBg: "bg-red-100", badgeText: "text-red-700", icon: "🚨", label: "Excede la ley" },
  revisa:     { border: "border-l-amber-500", bg: "bg-amber-50", badgeBg: "bg-amber-100", badgeText: "text-amber-700", icon: "⚠️", label: "Revisa esto" },
  conforme:   { border: "border-l-emerald-500", bg: "bg-emerald-50", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700", icon: "✓", label: "Conforme" },
};

function FindingCard({ finding }: { finding: ContractAnalysis["findings"][0] }) {
  const cfg = FINDING_CONFIG[finding.status];
  return (
    <div className={`border-l-4 ${cfg.border} ${cfg.bg} rounded-r-2xl p-5`}>
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badgeBg} ${cfg.badgeText} mb-3`}>
        {cfg.icon} {cfg.label}
      </span>
      <h3 className="font-bold text-slate-900 text-base mb-2">{finding.title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        <span className="text-slate-500 italic">"{finding.quote}"</span>
        {" — "}
        {finding.explanation}
      </p>
      <p className="text-xs text-slate-400 mt-2 font-medium">{finding.law}</p>
    </div>
  );
}

interface Props {
  result: ContractAnalysis;
  email: string;
  onReset: () => void;
}

export default function StepResults({ result, email, onReset }: Props) {
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showConformes, setShowConformes] = useState(false);

  const violations = result.findings.filter((f) => f.status === "excede_ley");
  const warnings   = result.findings.filter((f) => f.status === "revisa");
  const conformes  = result.findings.filter((f) => f.status === "conforme");
  const issues     = [...violations, ...warnings];
  const lawsFailing = result.laws.filter((l) => !l.complies).length;

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-[#f5f0e8]/90 backdrop-blur-sm border-b border-[#e8e0d0] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-base">ResGuard AI</span>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-500 hidden sm:block">{email}</span>
        </div>
        <button onClick={onReset} className="text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium">
          ← Nuevo análisis
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-10 pb-20 space-y-8">

        {/* ── Bloque 1: Veredicto + findings ─────────────────────────────── */}
        <section>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Análisis del contrato</p>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-1">{result.entityName}</h1>
          <p className="text-slate-500 text-sm mb-6">{result.entityType}</p>

          {/* Veredicto rápido */}
          <div className={`rounded-2xl p-5 mb-6 ${violations.length > 0 ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"}`}>
            <p className={`text-2xl font-extrabold ${violations.length > 0 ? "text-red-700" : "text-emerald-700"}`}>
              {violations.length > 0
                ? `${violations.length + warnings.length} cláusula${violations.length + warnings.length !== 1 ? "s" : ""} problemática${violations.length + warnings.length !== 1 ? "s" : ""}`
                : "Contrato conforme"}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {violations.length > 0
                ? `${violations.length} exceden la ley · ${warnings.length} a revisar · ${conformes.length} conformes`
                : "No se encontraron cláusulas que excedan la legislación chilena"}
            </p>
          </div>

          {/* Findings problemáticos */}
          {issues.length > 0 && (
            <div className="space-y-4">
              {issues.map((f) => <FindingCard key={f.id} finding={f} />)}
            </div>
          )}

          {/* Conformes colapsados */}
          {conformes.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowConformes((v) => !v)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">✓</span>
                {conformes.length} cláusula{conformes.length !== 1 ? "s" : ""} conforme{conformes.length !== 1 ? "s" : ""}
                <svg className={`w-4 h-4 transition-transform ${showConformes ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showConformes && (
                <div className="mt-3 space-y-3">
                  {conformes.map((f) => <FindingCard key={f.id} finding={f} />)}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Bloque 2: Cumplimiento legal + acción ───────────────────────── */}
        <section className="space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acciones disponibles</p>

          {/* Leyes */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Cumplimiento legal</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${lawsFailing > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                {lawsFailing > 0 ? `${lawsFailing} incumplimiento${lawsFailing !== 1 ? "s" : ""}` : "Todo conforme"}
              </span>
            </div>
            <div>
              {result.laws.map((law, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${law.complies ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                    {law.complies ? "✓" : "✕"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm">{law.law}</span>
                      <span className="text-xs text-slate-400">{law.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{law.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carta ARCO */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl shrink-0">📧</div>
              <div>
                <h3 className="font-bold text-slate-900">Enviar carta ARCO</h3>
                <p className="text-sm text-slate-500">{result.emailAction.entityName} · {result.emailAction.to}</p>
              </div>
            </div>

            {showEmailPreview && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4 text-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Asunto</p>
                <p className="text-slate-700 mb-3 font-medium">{result.emailAction.subject}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cuerpo</p>
                <pre className="text-slate-600 whitespace-pre-wrap font-sans text-xs leading-relaxed max-h-48 overflow-y-auto">
                  {result.emailAction.body || "— Sin infracciones que reclamar —"}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailPreview((v) => !v)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                {showEmailPreview ? "Ocultar" : "Ver borrador"}
              </button>
              <button
                onClick={() => {
                  const mailto = `mailto:${result.emailAction.to}?subject=${encodeURIComponent(result.emailAction.subject)}&body=${encodeURIComponent(result.emailAction.body)}`;
                  window.open(mailto, "_blank");
                  setEmailSent(true);
                }}
                disabled={!result.emailAction.body}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  emailSent ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : result.emailAction.body ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {emailSent ? "✓ Enviado" : "Enviar reclamo →"}
              </button>
            </div>
          </div>

          {/* SERNAC */}
          {violations.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">⚖️</div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-0.5">Denunciar ante SERNAC</h3>
                  <p className="text-sm text-slate-500 mb-3">{violations.length} cláusula{violations.length !== 1 ? "s" : ""} que puede{violations.length !== 1 ? "n" : ""} violar la Ley Pro Consumidor.</p>
                  <a href="https://www.sernac.cl/portal/604/w3-propertyvalue-59891.html" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors">
                    Ir a SERNAC →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* CMF */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl shrink-0">🏛️</div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-0.5">Reclamo ante la CMF</h3>
                <p className="text-sm text-slate-500 mb-3">{result.entityName} está regulada por la CMF. Plazo de respuesta: 10 días hábiles.</p>
                <a href="https://www.cmfchile.cl/portal/principal/606/w3-propertyvalue-25625.html" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
                  Ir a CMF →
                </a>
              </div>
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-slate-400">
          ResGuard AI · {HACKATHON_LABEL} · Análisis basado en legislación chilena vigente
        </p>
      </div>
    </div>
  );
}
