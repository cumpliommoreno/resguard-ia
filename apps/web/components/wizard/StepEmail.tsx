import { useState } from "react";

interface Props {
  email: string;
  nombre: string;
  rut: string;
  onChangeEmail: (v: string) => void;
  onChangeNombre: (v: string) => void;
  onChangeRut: (v: string) => void;
  onNext: () => void;
}

function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted}-${dv}`;
}

export default function StepEmail({ email, nombre, rut, onChangeEmail, onChangeNombre, onChangeRut, onNext }: Props) {
  const [touched, setTouched] = useState(false);

  const validEmail  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validNombre = nombre.trim().length > 2;
  const validRut    = /^[\d.]+\-[\dkK]$/.test(rut) && rut.replace(/[^0-9kK]/g, "").length >= 7;
  const allValid    = validEmail && validNombre && validRut;

  const handleNext = () => {
    setTouched(true);
    if (allValid) onNext();
  };

  const handleRutChange = (v: string) => {
    onChangeRut(formatRut(v));
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-7">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Tus datos personales</h2>
        <p className="text-slate-500 text-sm max-w-xs">
          Los usaremos para redactar tu carta ARCO y conectar tu cuenta de Google.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {/* Nombre */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre completo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => onChangeNombre(e.target.value)}
            placeholder="Juan Pérez González"
            className={`w-full px-4 py-3 rounded-xl border text-slate-900 placeholder-slate-400 text-sm outline-none transition-all
              ${touched && !validNombre
                ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                : "border-slate-200 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              }`}
          />
          {touched && !validNombre && (
            <p className="mt-1 text-xs text-red-500">Ingresa tu nombre completo</p>
          )}
        </div>

        {/* RUT */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">RUT</label>
          <input
            type="text"
            value={rut}
            onChange={(e) => handleRutChange(e.target.value)}
            placeholder="12.345.678-9"
            maxLength={12}
            className={`w-full px-4 py-3 rounded-xl border text-slate-900 placeholder-slate-400 text-sm outline-none transition-all
              ${touched && !validRut
                ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                : "border-slate-200 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              }`}
          />
          {touched && !validRut && (
            <p className="mt-1 text-xs text-red-500">Ingresa un RUT válido (ej: 12.345.678-9)</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChangeEmail(e.target.value)}
            placeholder="tucorreo@gmail.com"
            className={`w-full px-4 py-3 rounded-xl border text-slate-900 placeholder-slate-400 text-sm outline-none transition-all
              ${touched && !validEmail
                ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                : "border-slate-200 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              }`}
          />
          {touched && !validEmail && (
            <p className="mt-1 text-xs text-red-500">Ingresa un correo válido</p>
          )}
        </div>
      </div>

      <button
        onClick={handleNext}
        className="mt-6 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
      >
        Continuar →
      </button>

      <p className="mt-4 text-xs text-slate-400 text-center">
        Tus datos solo se usan para redactar la carta ARCO. No los almacenamos.
      </p>
    </div>
  );
}
