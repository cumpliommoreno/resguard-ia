import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { AnalizarClausulasUseCase } from "../../application/use-cases/AnalizarClausulasUseCase.js";

export const analizarClausulasToolDefinition: Tool = {
  name: "analizar_clausulas",
  description: "Analiza las cláusulas de un contrato financiero chileno contra la Ley 19.628 y Ley 21.521. Devuelve hallazgos, cumplimiento legal y carta ARCO.",
  inputSchema: {
    type: "object",
    properties: {
      file_url:   { type: "string", description: "URL del PDF del contrato (Vercel Blob)" },
      pdf_base64: { type: "string", description: "PDF del contrato en base64 (alternativa a file_url)" },
      company: {
        type: "object",
        properties: {
          nombre:    { type: "string" },
          rut:       { type: "string" },
          email:     { type: "string" },
          direccion: { type: "string" },
          paginaWeb: { type: "string" },
        },
        required: ["nombre", "rut", "email"],
      },
      titular: {
        type: "object",
        properties: {
          nombre: { type: "string", description: "Nombre completo del titular" },
          rut:    { type: "string", description: "RUT del titular" },
        },
      },
    },
    required: ["company"],
  },
};

export function createAnalizarClausulasHandler(useCase: AnalizarClausulasUseCase) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    try {
      const result = await useCase.execute({
        file_url:   args["file_url"]   ? String(args["file_url"])   : undefined,
        pdf_base64: args["pdf_base64"] ? String(args["pdf_base64"]) : undefined,
        company: args["company"] as {
          nombre: string; rut: string; email: string;
          direccion: string; paginaWeb: string;
        },
        ...(args["titular"] ? { titular: args["titular"] as { nombre: string; rut: string } } : {}),
      });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  };
}
