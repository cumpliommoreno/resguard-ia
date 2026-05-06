import { useRef, useState } from "react";

interface Props {
  file: File | null;
  onFile: (f: File | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepUpload({ file, onFile, onNext, onBack }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  const fmtSize = (b: number) => b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${(b / 1e3).toFixed(0)} KB`;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Sube tu contrato</h2>
      <p className="text-slate-500 mb-8 text-sm max-w-xs">
        Analizaremos las cláusulas de privacidad y los datos personales solicitados.
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-full max-w-sm cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-all
          ${dragging ? "border-emerald-400 bg-emerald-50" : file ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40"}`}
      >
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800 text-sm">{file.name}</p>
            <p className="text-xs text-slate-400">{fmtSize(file.size)}</p>
            <button
              onClick={(e) => { e.stopPropagation(); onFile(null); }}
              className="text-xs text-red-400 hover:text-red-600 mt-1"
            >
              Quitar archivo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-slate-600">Arrastra o haz clic para subir</p>
            <p className="text-xs">PDF, DOCX · Máx 10 MB</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </div>

      <div className="flex gap-3 mt-6 w-full max-w-sm">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
        >
          ← Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!file}
          className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Analizar →
        </button>
      </div>
    </div>
  );
}
