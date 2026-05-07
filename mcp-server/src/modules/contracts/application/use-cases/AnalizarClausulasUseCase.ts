import Anthropic from "@anthropic-ai/sdk";
import { lawFileIds } from "../../../../shared/state/lawFiles.js";

export interface CompanyInput {
  nombre: string;
  rut: string;
  email: string;
  direccion: string;
  paginaWeb: string;
}

export interface AnalizarClausulasInput {
  file_url?: string;
  pdf_base64?: string;
  company: CompanyInput;
  titular?: { nombre: string; rut: string };
}

export interface ContractFinding {
  id: string;
  status: "excede_ley" | "revisa" | "conforme";
  title: string;
  quote: string;
  explanation: string;
  law: string;
}

export interface LawItem {
  law: string;
  title: string;
  complies: boolean;
  detail: string;
}

export interface AnalizarClausulasOutput {
  entityName: string;
  entityType: string;
  findings: ContractFinding[];
  dataSharing: never[];
  laws: LawItem[];
  emailAction: {
    to: string;
    entityName: string;
    subject: string;
    body: string;
  };
}

export class AnalizarClausulasUseCase {
  private readonly anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async execute(input: AnalizarClausulasInput): Promise<AnalizarClausulasOutput> {
    // Use pre-downloaded base64 PDF (sent by Vercel which has blob auth)
    // or fall back to downloading from URL
    let pdfBase64: string;
    if (input.pdf_base64) {
      pdfBase64 = input.pdf_base64;
    } else {
      const pdfRes = await fetch(input.file_url!);
      if (!pdfRes.ok) throw new Error("download_failed");
      pdfBase64 = Buffer.from(await pdfRes.arrayBuffer()).toString("base64");
    }

    // Build content — contract PDF + prompt
    // Law context comes from Claude's training knowledge (simpler, no Files API)
    type AnyContent = Record<string, unknown>;
    const content: AnyContent[] = [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
      },
      { type: "text", text: this.buildPrompt(input) },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await (this.anthropic.messages.create as any)(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content }],
      },
      { headers: { "anthropic-beta": "pdfs-2024-09-25" } }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks = raw.content as any[];
    console.log("[AnalizarClausulas] response blocks:", blocks.map((b: any) => b.type).join(", "));
    const textBlock = blocks.find((b: any) => b.type === "text");
    if (!textBlock) {
      console.error("[AnalizarClausulas] no text block. stop_reason:", raw.stop_reason, "| usage:", JSON.stringify(raw.usage));
      throw new Error("no_content");
    }

    const rawText: string = textBlock.text;

    // Extract JSON: find first { and last } to handle markdown wrapping or extra text
    const jsonStart = rawText.indexOf("{");
    const jsonEnd   = rawText.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("[AnalizarClausulas] no JSON found in response:", rawText.slice(0, 300));
      throw new Error("no_json_found");
    }
    const jsonText = rawText.slice(jsonStart, jsonEnd + 1);

    let parsed: AnalizarClausulasOutput;
    try {
      parsed = JSON.parse(jsonText) as AnalizarClausulasOutput;
    } catch (e) {
      console.error("[AnalizarClausulas] parse_error:", (e as Error).message, "| text:", jsonText.slice(0, 300));
      throw new Error("parse_error");
    }

    if (!parsed.findings) parsed.findings = [];
    if (!parsed.laws) parsed.laws = [];
    if (!parsed.dataSharing) parsed.dataSharing = [];

    return parsed;
  }

  private buildPrompt(input: AnalizarClausulasInput): string {
    const { company, titular } = input;
    const lawCtx = lawFileIds.ley19628
      ? "Las leyes están adjuntas como documentos — cita artículos exactos."
      : "Usa tu conocimiento de entrenamiento sobre la Ley 19.628 y Ley 21.521.";

    const titularNombre = titular?.nombre || "[Nombre del titular]";
    const titularRut    = titular?.rut    || "[RUT del titular]";

    return `Eres un experto en protección de datos personales y legislación chilena.

Analiza el contrato financiero adjunto en busca de cláusulas problemáticas contra la Ley 19.628 y la Ley 21.521. ${lawCtx}

Institución: ${company.nombre} (RUT: ${company.rut})
Titular del contrato: ${titularNombre} (RUT: ${titularRut})

Clasifica cada cláusula relevante:
- "excede_ley": viola o excede lo permitido. Cita el artículo exacto.
- "revisa": ambigua o potencialmente problemática.
- "conforme": cumple con la ley.

Para la carta ARCO determina automáticamente el derecho más apropiado según los hallazgos:
- Cesión de datos a terceros sin consentimiento → Oposición (Art. 6 Ley 19.628)
- Datos que ya no son necesarios → Cancelación (Art. 12 Ley 19.628)
- Datos incorrectos o desproporcionados → Rectificación (Art. 13 Ley 19.628)
- Sin infracciones graves → Acceso (Art. 12 Ley 19.628)

Responde SOLO con JSON válido sin markdown:
{
  "entityName": "${company.nombre}",
  "entityType": "Banco",
  "findings": [
    {
      "id": "f1",
      "status": "excede_ley",
      "title": "Título breve (máx 8 palabras)",
      "quote": "Cita textual del contrato (máx 25 palabras)",
      "explanation": "Explicación con artículo exacto citado",
      "law": "Art. X Ley 19.628"
    }
  ],
  "dataSharing": [],
  "laws": [
    { "law": "Ley 19.628", "title": "Protección de la vida privada", "complies": false, "detail": "Resumen en 1-2 oraciones" },
    { "law": "Ley 21.521", "title": "Ley Fintech", "complies": true, "detail": "Resumen en 1-2 oraciones" }
  ],
  "emailAction": {
    "to": "${company.email}",
    "entityName": "${company.nombre}",
    "subject": "Ejercicio de derechos ARCO — Ley 19.628",
    "body": "Carta ARCO formal en español. Debe incluir:\\n- Nombre y RUT del titular: ${titularNombre}, ${titularRut}\\n- Nombre y RUT del banco: ${company.nombre}, ${company.rut}\\n- Derecho ARCO ejercido con fundamento legal exacto\\n- Lista de cláusulas problemáticas detectadas\\n- Plazo legal: 2 días hábiles acuse, 5 días respuesta\\n- Tono formal y directo\\nString vacío si todo está conforme."
  }
}`;
  }
}
