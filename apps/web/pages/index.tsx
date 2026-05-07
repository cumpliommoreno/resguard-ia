import Head from "next/head";
import { useWizard } from "@/hooks/useWizard";
import { HACKATHON_LABEL } from "@/lib/constants";
import StepIndicator from "@/components/wizard/StepIndicator";
import StepEmail from "@/components/wizard/StepEmail";
import StepUpload from "@/components/wizard/StepUpload";
import StepAnalyzing from "@/components/wizard/StepAnalyzing";
import StepResults from "@/components/wizard/StepResults";
import StepAlert from "@/components/wizard/StepAlert";
import StepManualInput from "@/components/wizard/StepManualInput";

export default function Home() {
  const { state, setEmail, setNombre, setRut, setFile, goToUpload, goToEmail, startAnalysis, retryWithManual, reset } = useWizard();
  const { step, email, nombre, rut, file, labels, result, alert, manualLoading, error } = state;

  // Results take over the full page
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

  return (
    <>
      <Head>
        <title>ResGuard AI — Protege tus datos</title>
        <meta name="description" content="Analiza tu privacidad en Gmail, Drive y Calendar" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex flex-col">
        {/* Navbar — fijo */}
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

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center px-6 py-8">

            {/* Paso 1 — layout dos columnas */}
            {step === "email" && (
              <div className="w-full max-w-5xl flex items-center gap-16">
                {/* Izquierda — hero */}
                <div className="flex-1 hidden md:flex flex-col">
                  <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mb-6 w-fit">
                    Privacidad · Transparencia · Control
                  </span>
                  <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
                    ¿Tus datos están<br />
                    <span className="text-emerald-600">realmente seguros?</span>
                  </h1>
                  <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-sm">
                    Sube tu contrato bancario y te decimos exactamente cómo están usando tus datos — y qué hacer al respecto.
                  </p>
                  <div className="flex flex-col gap-3 text-sm text-slate-500">
                    {[
                      { icon: "🔒", text: "Tus documentos no se almacenan" },
                      { icon: "⚡", text: "Análisis en menos de 60 segundos" },
                      { icon: "⚖️", text: "Basado en Ley 19.628 y Ley 21.521" },
                    ].map(({ icon, text }) => (
                      <span key={text} className="flex items-center gap-3">
                        <span className="text-lg">{icon}</span>
                        {text}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Derecha — wizard */}
                <div className="w-full md:w-[420px] flex-shrink-0">
                  <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 px-8 py-8">
                    <StepIndicator current={step} />
                    <StepEmail
                      email={email}
                      nombre={nombre}
                      rut={rut}
                      onChangeEmail={setEmail}
                      onChangeNombre={setNombre}
                      onChangeRut={setRut}
                      onNext={goToUpload}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pasos 2, 3, 4 — columna centrada */}
            {step !== "email" && (
              <div className="w-full max-w-lg">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 px-8 py-8">
                  <StepIndicator current={step} />
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
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
