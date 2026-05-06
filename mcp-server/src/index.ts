import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { InMemoryCompanyRepository } from "./modules/companies/infrastructure/repositories/InMemoryCompanyRepository.js";
import { CmfApiAdapter } from "./modules/companies/infrastructure/adapters/CmfApiAdapter.js";
import { ResolveCompanyProfileUseCase } from "./modules/companies/application/use-cases/ResolveCompanyProfileUseCase.js";
import { resolveCompanyToolDefinition, createResolveCompanyHandler } from "./modules/companies/presentation/tools/resolveCompanyTool.js";
import { logger } from "./shared/utils/logger.js";

const MCP_API_KEY = process.env["MCP_API_KEY"] ?? "";
const CMF_API_KEY = process.env["CMF_API_KEY"] ?? "";
const PORT = parseInt(process.env["PORT"] ?? "3001");

const repository = new InMemoryCompanyRepository();
const cmfApi = new CmfApiAdapter(CMF_API_KEY);
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
  if (name === "resolve_company") return resolveCompanyHandler(args);
  return { content: [{ type: "text", text: `Tool desconocido: ${name}` }], isError: true };
});

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const key = req.headers["x-api-key"];
  if (!MCP_API_KEY || key !== MCP_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

const transports = new Map<string, SSEServerTransport>();

app.get("/sse", async (_req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);

  // Keepalive: ping cada 25 segundos para mantener la conexión viva en Railway
  const keepalive = setInterval(() => {
    res.write(": ping\n\n");
  }, 25000);

  res.on("close", () => {
    clearInterval(keepalive);
    transports.delete(transport.sessionId);
  });

  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query["sessionId"] as string;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.listen(PORT, () => {
  logger.info(`resguard-mcp-server listening on port ${PORT}`);
});
