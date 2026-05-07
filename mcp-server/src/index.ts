import express from "express";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";

import { InMemoryCompanyRepository } from "./modules/companies/infrastructure/repositories/InMemoryCompanyRepository.js";
import { CmfApiAdapter } from "./modules/companies/infrastructure/adapters/CmfApiAdapter.js";
import { ResolveCompanyProfileUseCase } from "./modules/companies/application/use-cases/ResolveCompanyProfileUseCase.js";
import { resolveCompanyToolDefinition, createResolveCompanyHandler } from "./modules/companies/presentation/tools/resolveCompanyTool.js";
import { AnalizarClausulasUseCase } from "./modules/contracts/application/use-cases/AnalizarClausulasUseCase.js";
import { analizarClausulasToolDefinition, createAnalizarClausulasHandler } from "./modules/contracts/presentation/tools/analizarClausulasTool.js";
import { lawFileIds } from "./shared/state/lawFiles.js";
import { logger } from "./shared/utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MCP_API_KEY      = process.env["MCP_API_KEY"] ?? "";
const CMF_API_KEY      = process.env["CMF_API_KEY"] ?? "";
const ANTHROPIC_API_KEY = process.env["ANTHROPIC_API_KEY"] ?? "";
const PORT             = parseInt(process.env["PORT"] ?? "3001");

// ─── Use cases ───────────────────────────────────────────────────────────────

const repository          = new InMemoryCompanyRepository();
const cmfApi              = new CmfApiAdapter(CMF_API_KEY);
const resolveCompanyUC    = new ResolveCompanyProfileUseCase(repository, cmfApi);
const analizarClausulasUC = new AnalizarClausulasUseCase(ANTHROPIC_API_KEY);

const resolveCompanyHandler    = createResolveCompanyHandler(resolveCompanyUC);
const analizarClausulasHandler = createAnalizarClausulasHandler(analizarClausulasUC);

// ─── MCP server ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: "resguard-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [resolveCompanyToolDefinition, analizarClausulasToolDefinition],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  if (name === "resolve_company")    return resolveCompanyHandler(args);
  if (name === "analizar_clausulas") return analizarClausulasHandler(args);
  return { content: [{ type: "text", text: `Tool desconocido: ${name}` }], isError: true };
});

// ─── Law PDF upload ───────────────────────────────────────────────────────────

async function uploadLawPdfs(): Promise<void> {
  if (!ANTHROPIC_API_KEY) {
    logger.warn("ANTHROPIC_API_KEY not set — skipping law PDF upload");
    return;
  }

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const [buf19628, buf21521] = [
      readFileSync(resolve(__dirname, "../assets/ley-19628.pdf")),
      readFileSync(resolve(__dirname, "../assets/ley-21521.pdf")),
    ];

    const [f1, f2] = await Promise.all([
      anthropic.beta.files.upload(
        { file: new File([buf19628], "ley-19628.pdf", { type: "application/pdf" }) },
        { headers: { "anthropic-beta": "files-api-2025-04-14" } }
      ),
      anthropic.beta.files.upload(
        { file: new File([buf21521], "ley-21521.pdf", { type: "application/pdf" }) },
        { headers: { "anthropic-beta": "files-api-2025-04-14" } }
      ),
    ]);

    lawFileIds.ley19628 = f1.id;
    lawFileIds.ley21521 = f2.id;
    logger.info("Law PDFs uploaded", { ley19628: f1.id, ley21521: f2.id });
  } catch (error) {
    logger.warn("Failed to upload law PDFs — Claude will use training knowledge", { error });
  }
}

// ─── Express ─────────────────────────────────────────────────────────────────

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

  const keepalive = setInterval(() => { res.write(": ping\n\n"); }, 25000);

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
  // Pass req.body explicitly since express.json() already consumed the stream
  await transport.handlePostMessage(req, res, req.body);
});

app.listen(PORT, async () => {
  logger.info(`resguard-mcp-server listening on port ${PORT}`);
  await uploadLawPdfs();
});
