import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ResolveCompanyProfileUseCase } from "../../application/use-cases/ResolveCompanyProfileUseCase.js";

export const resolveCompanyToolDefinition: Tool = {
  name: "resolve_company",
  description: "Recibe el rut y nombre de una empresa, la busca en el listado de instituciones disponibles y retorna su perfil completo desde CMF.",
  inputSchema: {
    type: "object",
    properties: {
      rut:  { type: "string", description: "RUT de la empresa" },
      name: { type: "string", description: "Nombre de la empresa a buscar" },
    },
    required: ["rut", "name"],
  },
};

export function createResolveCompanyHandler(useCase: ResolveCompanyProfileUseCase) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const rut  = String(args["rut"]  ?? "");
    const name = String(args["name"] ?? "");

    const result = await useCase.execute({ rut, name });

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  };
}
