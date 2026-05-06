import { useState } from "react";

interface Props {
  email: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

export default function StepEmail({ email, onChange, onNext }: Props) {
  const [touched, setTouched] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showError = touched && !valid;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">¿Cuál es tu correo de Google?</h2>
      <p className="text-slate-500 mb-8 text-sm max-w-xs">
        Lo usaremos para conectarnos a Gmail, Drive y Calendar y revisar posibles exposiciones de tus datos.
      </p>

      <div className="w-full max-w-sm">
        <input
          type="email"
          value={email}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="tucorreo@gmail.com"
          className={`w-full px-4 py-3.5 rounded-xl border text-slate-900 placeholder-slate-400 text-sm outline-none transition-all
            ${showError
              ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
              : "border-slate-200 bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            }`}
        />
        {showError && (
          <p className="mt-1.5 text-xs text-red-500 text-left">Ingresa un correo válido</p>
        )}

        <button
          onClick={() => { setTouched(true); if (valid) onNext(); }}
          className="mt-4 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors disabled:opacity-40"
        >
          Continuar →
        </button>
      </div>

      <p className="mt-6 text-xs text-slate-400 max-w-xs">
        Nunca almacenamos tus correos ni archivos. El análisis es temporal y solo existe en esta sesión.
      </p>
    </div>
  );
}
