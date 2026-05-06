import type { MCPStatus } from "@/types";

const SOURCE_LABELS: Record<string, string> = {
  gmail: "Gmail",
  drive: "Google Drive",
  calendar: "Google Calendar",
};

export default function MCPStatusCard({ status }: { status: MCPStatus }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: status.connected ? "#22c55e" : "#ef4444",
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontWeight: 600, color: "#0f172a" }}>{SOURCE_LABELS[status.source]}</div>
        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
          {status.connected
            ? `Sincronizado: ${status.lastSync ? new Date(status.lastSync).toLocaleString() : "—"}`
            : status.error ?? "Desconectado"}
        </div>
      </div>
    </div>
  );
}
