import type { MCPSource, MCPStatus } from "@/types";

const MCP_ENDPOINTS: Record<MCPSource, string> = {
  gmail: "/api/mcp/gmail",
  drive: "/api/mcp/drive",
  calendar: "/api/mcp/calendar",
};

export async function fetchMCPStatus(source: MCPSource): Promise<MCPStatus> {
  const res = await fetch(`${MCP_ENDPOINTS[source]}/status`);
  if (!res.ok) throw new Error(`MCP ${source} status failed`);
  return res.json();
}

export async function triggerMCPScan(source: MCPSource): Promise<void> {
  const res = await fetch(`${MCP_ENDPOINTS[source]}/scan`, { method: "POST" });
  if (!res.ok) throw new Error(`MCP ${source} scan failed`);
}

export async function fetchMCPData(
  source: MCPSource,
  endpoint: string,
  params?: Record<string, string>
): Promise<unknown> {
  const url = new URL(`${MCP_ENDPOINTS[source]}/${endpoint}`, "http://localhost");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.pathname + url.search);
  if (!res.ok) throw new Error(`MCP ${source}/${endpoint} failed`);
  return res.json();
}
