type LogLevel = "info" | "warn" | "error" | "debug";

export const logger = {
  info:  (msg: string, meta?: unknown) => log("info",  msg, meta),
  warn:  (msg: string, meta?: unknown) => log("warn",  msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
  debug: (msg: string, meta?: unknown) => log("debug", msg, meta),
};

function log(level: LogLevel, msg: string, meta?: unknown): void {
  // MCP servers must NOT write to stdout — use stderr for all logs
  process.stderr.write(
    JSON.stringify({ level, ts: new Date().toISOString(), msg, ...(meta !== undefined && { meta }) }) + "\n"
  );
}
