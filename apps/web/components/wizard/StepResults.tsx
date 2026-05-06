import { useState, useRef } from "react";
import type { ContractAnalysis, FindingStatus, DataSharingOption } from "@/types";

// ─── Finding card ────────────────────────────────────────────────────────────

const FINDING_CONFIG: Record<FindingStatus, {
  border: string; bg: string; badgeBg: string; badgeText: string; icon: string; label: string;
}> = {
  excede_ley: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    icon: "🚨",
    label: "Excede la ley",
  },
  revisa: {
    border: "border-l-amber-500",
    bg: "bg-amber-50",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    icon: "⚠️",
    label: "Revisa esto",
  },
  conforme: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    icon: "✓",
    label: "Conforme",
  },
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
        <span className="text-slate-500">"{finding.quote}"</span>
        {" — "}
        {finding.explanation}
      </p>
      <p className="text-xs text-slate-400 mt-2 font-medium">{finding.law}</p>
    </div>
  );
}

// ─── Data sharing card ───────────────────────────────────────────────────────

function DataCard({
  option,
  selected,
  onToggle,
}: {
  option: DataSharingOption;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left bg-white rounded-2xl p-5 border-2 transition-all duration-200 cursor-pointer
        ${selected ? "border-emerald-500 shadow-md shadow-emerald-100" : "border-slate-200 hover:border-slate-300"}`}
    >
      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl mb-3">
        {option.icon}
      </div>
      <p className="font-bold text-slate-900 mb-1">{option.title}</p>
      <p className="text-sm text-slate-500 mb-4 leading-snug">{option.description}</p>
      <span
        className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors
          ${option.hasExtra
            ? selected
              ? "bg-emerald-500 text-white"
              : "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-500"
          }`}
      >
        {option.benefit}
      </span>
    </button>
  );
}

// ─── Law badge ───────────────────────────────────────────────────────────────

function LawRow({ law }: { law: ContractAnalysis["laws"][0] }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
        ${law.complies ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
      >
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
  );
}

// ─── Scroll arrow ────────────────────────────────────────────────────────────

function ScrollArrow({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={onClick}
        className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  result: ContractAnalysis;
  email: string;
  onReset: () => void;
}

type Section = "findings" | "share" | "actions";

export default function StepResults({ result, email, onReset }: Props) {
  const [activeSection, setActiveSection] = useState<Section>("findings");
  const [selectedData, setSelectedData] = useState<Set<string>>(new Set(["ds1"]));
  const [emailSent, setEmailSent] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const shareRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, section: Section) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(section);
  };

  const toggleData = (id: string) => {
    setSelectedData((prev) => {
      const next = new Set(prev);
      if (id === "ds4") {
        // "Nada, gracias" deselecciona todo
        return new Set(["ds4"]);
      }
      next.delete("ds4");
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const violations = result.findings.filter((f) => f.status === "excede_ley").length;
  const warnings = result.findings.filter((f) => f.status === "revisa").length;
  const conformes = result.findings.filter((f) => f.status === "conforme").length;
  const lawsFailing = result.laws.filter((l) => !l.complies).length;

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-[#f5f0e8]/90 backdrop-blur-sm border-b border-[#e8e0d0] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-sm">ResGuard AI</span>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-500 hidden sm:block">{email}</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          ← Nuevo análisis
        </button>
      </header>

      {/* ── SECTION 1: Findings ─────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-5 pt-10 pb-4">
        {/* Heading */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Análisis del contrato</p>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-1">
            {result.entityName}
          </h1>
          <p className="text-slate-500 text-sm">{result.entityType}</p>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
            🚨 {violations} exceden la ley
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
            ⚠️ {warnings} a revisar
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
            ✓ {conformes} conformes
          </span>
        </div>

        {/* Finding cards */}
        <div className="space-y-4">
          {result.findings.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>

        <ScrollArrow onClick={() => scrollTo(shareRef, "share")} />
      </section>

      {/* ── SECTION 2: Data sharing ─────────────────────────────────────────── */}
      <section ref={shareRef} className="max-w-2xl mx-auto px-5 pt-14 pb-4">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-emerald-600 tracking-widest uppercase mb-3">PASO 4 · DECIDE</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
            ¿Qué quieres compartir?
          </h2>
          <p className="text-slate-500 text-base max-w-md mx-auto">
            Tus datos tienen valor. Decide tú con quién, para qué y por cuánto tiempo — a cambio de beneficios concretos.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {result.dataSharing.slice(0, 3).map((opt) => (
            <DataCard
              key={opt.id}
              option={opt}
              selected={selectedData.has(opt.id)}
              onToggle={() => toggleData(opt.id)}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {result.dataSharing.slice(3).map((opt) => (
            <DataCard
              key={opt.id}
              option={opt}
              selected={selectedData.has(opt.id)}
              onToggle={() => toggleData(opt.id)}
            />
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Consentimiento revocable en cualquier momento · Ley 21.719 ready
        </p>

        <ScrollArrow onClick={() => scrollTo(actionsRef, "actions")} />
      </section>

      {/* ── SECTION 3: Actions ──────────────────────────────────────────────── */}
      <section ref={actionsRef} className="max-w-2xl mx-auto px-5 pt-14 pb-20">
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Acciones disponibles</p>
          <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
            Ejerce tus derechos
          </h2>
        </div>

        {/* Law compliance table */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900">Cumplimiento legal en Chile</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              lawsFailing > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {lawsFailing > 0 ? `${lawsFailing} incumplimientos` : "Todo conforme"}
            </span>
          </div>
          <div>
            {result.laws.map((law, i) => (
              <LawRow key={i} law={law} />
            ))}
          </div>
        </div>

        {/* Email action */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl shrink-0">📧</div>
            <div>
              <h3 className="font-bold text-slate-900">Enviar reclamo formal</h3>
              <p className="text-sm text-slate-500">
                Correo preconfigurado para {result.emailAction.entityName} — {result.emailAction.to}
              </p>
            </div>
          </div>

          {showEmailPreview && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4 text-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Para</p>
              <p className="text-slate-700 mb-3">{result.emailAction.to}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Asunto</p>
              <p className="text-slate-700 mb-3 font-medium">{result.emailAction.subject}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cuerpo</p>
              <pre className="text-slate-600 whitespace-pre-wrap font-sans text-xs leading-relaxed max-h-48 overflow-y-auto">
                {result.emailAction.body}
              </pre>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowEmailPreview((v) => !v)}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              {showEmailPreview ? "Ocultar vista previa" : "Ver borrador"}
            </button>
            <button
              onClick={() => {
                const mailto = `mailto:${result.emailAction.to}?subject=${encodeURIComponent(result.emailAction.subject)}&body=${encodeURIComponent(result.emailAction.body)}`;
                window.open(mailto, "_blank");
                setEmailSent(true);
              }}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
                emailSent
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {emailSent ? "✓ Correo enviado" : "Enviar reclamo →"}
            </button>
          </div>
        </div>

        {/* SERNAC shortcut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">⚖️</div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-0.5">Denunciar ante SERNAC</h3>
              <p className="text-sm text-slate-500 mb-3">
                {violations} cláusulas detectadas violan la Ley Pro Consumidor (21.398). Puedes denunciar directamente.
              </p>
              <a
                href="https://www.sernac.cl/portal/604/w3-propertyvalue-59891.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
              >
                Ir a SERNAC →
              </a>
            </div>
          </div>
        </div>

        {/* CMF shortcut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl shrink-0">🏛️</div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-0.5">Reclamo ante la CMF</h3>
              <p className="text-sm text-slate-500 mb-3">
                Como institución financiera, {result.entityName} está regulada por la CMF. Plazo de respuesta: 10 días hábiles.
              </p>
              <a
                href="https://www.cmfchile.cl/portal/principal/606/w3-propertyvalue-25625.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
              >
                Ir a CMF →
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          ResGuard AI · Hackathon 2025 · Análisis basado en legislación chilena vigente
        </p>
      </section>
    </div>
  );
}
