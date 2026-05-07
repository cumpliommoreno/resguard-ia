interface McpToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export async function callMcpTool(
  serverUrl: string,
  apiKey: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<McpToolResult> {
  const base = serverUrl.endsWith("/") ? serverUrl : serverUrl + "/";
  const headers: Record<string, string> = { "x-api-key": apiKey };

  return new Promise((resolve, reject) => {
    fetch(`${base}sse`, { headers: { ...headers, Accept: "text/event-stream" } })
      .then(async (sseRes) => {
        if (!sseRes.ok) {
          reject(new Error(`MCP SSE connection failed: ${sseRes.status}`));
          return;
        }

        const reader = sseRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";
        let messagesEndpoint = "";
        let initialized = false;
        const INIT_ID = 1;
        const TOOL_ID = 2;

        const post = (msg: object) =>
          fetch(messagesEndpoint, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify(msg),
          });

        const onLine = async (line: string) => {
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            const data = line.slice(5).trim();

            if (currentEvent === "endpoint") {
              messagesEndpoint = data.startsWith("http")
                ? data
                : `${base}${data.replace(/^\//, "")}`;

              await post({
                jsonrpc: "2.0",
                id: INIT_ID,
                method: "initialize",
                params: {
                  protocolVersion: "2024-11-05",
                  capabilities: {},
                  clientInfo: { name: "resguard-web", version: "1.0.0" },
                },
              });
            } else if (currentEvent === "message" && data) {
              try {
                const msg = JSON.parse(data);

                if (!initialized && msg.id === INIT_ID && msg.result) {
                  initialized = true;
                  await post({ jsonrpc: "2.0", method: "notifications/initialized" });
                  await post({
                    jsonrpc: "2.0",
                    id: TOOL_ID,
                    method: "tools/call",
                    params: { name: toolName, arguments: args },
                  });
                } else if (msg.id === TOOL_ID) {
                  reader.cancel();
                  if (msg.error) reject(new Error(msg.error.message));
                  else resolve(msg.result as McpToolResult);
                }
              } catch {
                // skip non-JSON SSE lines
              }
            }
            currentEvent = "";
          }
        };

        const pump = async () => {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) await onLine(line);
          }
        };

        pump().catch(reject);
      })
      .catch(reject);
  });
}
