import Head from "next/head";
import type { WizardStep, AlertType } from "@/types";
import { useWizard } from "@/hooks/useWizard";
import { HACKATHON_LABEL } from "@/lib/constants";
import StepIndicator from "@/components/wizard/StepIndicator";
import StepEmail from "@/components/wizard/StepEmail";
import StepUpload from "@/components/wizard/StepUpload";
import StepAnalyzing from "@/components/wizard/StepAnalyzing";
import StepResults from "@/components/wizard/StepResults";
import StepAlert from "@/components/wizard/StepAlert";
import StepManualInput from "@/components/wizard/StepManualInput";

// ── Left side content per step ───────────────────────────────────────────────

interface LeftContent {
  badge?: string;
  title: string;
  subtitle: string;
  bullets: { icon: string; text: string }[];
}

function getLeftContent(step: WizardStep, alertType?: AlertType): LeftContent {
  if (step === "email") return {
    badge: "Privacidad · Transparencia · Control",
    title: "¿Tus datos están realmente seguros?",
    subtitle: "Sube tu contrato bancario y te decimos exactamente cómo están usando tus datos — y qué hacer al respecto.",
    bullets: [
      { icon: "🔒", text: "Tus documentos no se almacenan" },
      { icon: "⚡", text: "Análisis en menos de 60 segundos" },
      { icon: "⚖️", text: "Basado en Ley 19.628 y Ley 21.521" },
    ],
  };

  if (step === "upload") return {
    title: "Sube tu contrato",
    subtitle: "Necesitamos el PDF de tu contrato bancario, de tarjeta de crédito o cualquier producto financiero.",
    bullets: [
      { icon: "📄", text: "Solo archivos PDF" },
      { icon: "🏦", text: "Contratos de bancos, financieras o cooperativas" },
      { icon: "🔐", text: "El archivo se elimina al terminar el análisis" },
    ],
  };

  if (step === "analyzing") return {
    title: "Analizando tu contrato",
    subtitle: "Estamos revisando cada cláusula contra la legislación chilena de protección de datos.",
    bullets: [
      { icon: "🏛️", text: "Verificamos la institución en CMF" },
      { icon: "⚖️", text: "Detectamos cláusulas que exceden la Ley 19.628" },
      { icon: "✉️", text: "Generamos tu carta ARCO lista para enviar" },
    ],
  };

  if (step === "alert") {
    if (alertType === "not_a_contract") return {
      title: "Archivo no válido",
      subtitle: "El documento que subiste no corresponde a un contrato financiero.",
      bullets: [
        { icon: "📄", text: "Debe ser un contrato de banco, tarjeta o crédito" },
        { icon: "🔍", text: "Busca el contrato firmado con tu institución" },
        { icon: "↩️", text: "Puedes intentarlo con otro archivo" },
      ],
    };
    if (alertType === "rut_mismatch") return {
      title: "Posible suplantación",
      subtitle: "El RUT del contrato no coincide con el registrado oficialmente en la CMF.",
      bullets: [
        { icon: "🚨", text: "Señal de alerta de fraude bancario" },
        { icon: "🏛️", text: "Verifica la identidad de la institución" },
        { icon: "📋", text: "Denuncia en CMF si tienes dudas" },
      ],
    };
    return {
      title: "Institución no encontrada",
      subtitle: "No encontramos esta empresa en el registro oficial de la CMF.",
      bullets: [
        { icon: "🏛️", text: "Solo instituciones reguladas por CMF" },
        { icon: "⚠️", text: "Podría ser una empresa no autorizada" },
        { icon: "🔗", text: "Consulta el registro oficial de alertas" },
      ],
    };
  }

  if (step === "manual_input") return {
    title: "Ingresa los datos manualmente",
    subtitle: "No pudimos identificar automáticamente el banco en el PDF. Ingrésalo tú para continuar.",
    bullets: [
      { icon: "🔍", text: "Busca el nombre completo en el encabezado del contrato" },
      { icon: "🔢", text: "El RUT aparece generalmente en la primera página" },
      { icon: "✅", text: "Lo verificaremos contra el registro CMF" },
    ],
  };

  // results step (null result = failed/timeout)
  return {
    title: "Análisis completado",
    subtitle: "Revisamos tu contrato contra la legislación chilena de protección de datos.",
    bullets: [
      { icon: "⚖️", text: "Ley 19.628 — Protección de datos personales" },
      { icon: "🏦", text: "Ley 21.521 — Marco Fintech" },
      { icon: "📧", text: "Carta ARCO lista para enviar" },
    ],
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { state, setEmail, setNombre, setRut, setFile, goToUpload, goToEmail, startAnalysis, retryWithManual, reset } = useWizard();
  const { step, email, nombre, rut, file, labels, result, alert, manualLoading, error } = state;

  if (step === "results" && result) {
    return (
      <>
        <Head>
          <title>Análisis completado — ResGuard AI</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <StepResults result={result} email={email} onReset={reset} />
      </>
    );
  }

  const left = getLeftContent(step, alert?.type);

  return (
    <>
      <Head>
        <title>ResGuard AI — Protege tus datos</title>
        <meta name="description" content="Analiza tu privacidad en contratos financieros chilenos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex flex-col">
        {/* Navbar */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/70 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-base tracking-tight">ResGuard AI</span>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">{HACKATHON_LABEL}</span>
        </header>

        {/* Contenido — siempre dos columnas en md+ */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center px-6 py-8">
            <div className="w-full max-w-5xl flex items-start gap-16">

              {/* Izquierda — texto contextual, alineado al contenido del form */}
              <div className="flex-1 hidden md:flex flex-col pt-[128px]">
                {left.badge && (
                  <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mb-6 w-fit">
                    {left.badge}
                  </span>
                )}
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
                  {left.title}
                </h1>
                <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-sm">
                  {left.subtitle}
                </p>
                <div className="flex flex-col gap-3">
                  {left.bullets.map(({ icon, text }) => (
                    <span key={text} className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="text-lg">{icon}</span>
                      {text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Derecha — wizard card */}
              <div className="w-full md:w-[420px] flex-shrink-0">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 px-8 py-8">
                  <StepIndicator current={step} />

                  {step === "email" && (
                    <StepEmail
                      email={email}
                      nombre={nombre}
                      rut={rut}
                      onChangeEmail={setEmail}
                      onChangeNombre={setNombre}
                      onChangeRut={setRut}
                      onNext={goToUpload}
                    />
                  )}
                  {step === "upload" && (
                    <StepUpload file={file} onFile={setFile} onNext={startAnalysis} onBack={goToEmail} />
                  )}
                  {step === "analyzing" && (
                    <StepAnalyzing labels={labels} error={error} email={email} />
                  )}
                  {step === "alert" && alert && (
                    <StepAlert alert={alert} onReset={reset} />
                  )}
                  {step === "manual_input" && (
                    <StepManualInput onSubmit={retryWithManual} loading={manualLoading} />
                  )}
                  {step === "results" && !result && (
                    <div className="pt-6 text-center space-y-4">
                      <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-3xl mx-auto">⚠️</div>
                      <div>
                        <p className="font-bold text-slate-900 text-base">El análisis no pudo completarse</p>
                        <p className="text-sm text-slate-500 mt-1">Hubo un problema al procesar tu contrato. Puedes intentarlo nuevamente.</p>
                      </div>
                      <button
                        onClick={reset}
                        className="w-full py-3 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-700 transition-colors"
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}
