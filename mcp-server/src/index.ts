import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { InMemoryCompanyRepository } from "./modules/companies/infrastructure/repositories/InMemoryCompanyRepository.js";
import { CmfApiAdapter } from "./modules/companies/infrastructure/adapters/CmfApiAdapter.js";
import { ResolveCompanyProfileUseCase } from "./modules/companies/application/use-cases/ResolveCompanyProfileUseCase.js";
import { resolveCompanyToolDefinition, createResolveCompanyHandler } from "./modules/companies/presentation/tools/resolveCompanyTool.js";
import { logger } from "./shared/utils/logger.js";

const apiKey = process.env["CMF_API_KEY"] ?? "";

const repository = new InMemoryCompanyRepository();
const cmfApi     = new CmfApiAdapter(apiKey);
const resolveCompanyUseCase = new ResolveCompanyProfileUseCase(repository, cmfApi);

const resolveCompanyHandler = createResolveCompanyHandler(resolveCompanyUseCase);

const server = new Server(
  { name: "resguard-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [resolveCompanyToolDefinition],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === "resolve_company") {
    return resolveCompanyHandler(args);
  }

  return {
    content: [{ type: "text", text: `Tool desconocido: ${name}` }],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("resguard-mcp-server started");
}

main().catch((err) => {
  logger.error("Fatal error", err);
  process.exit(1);
});
