export type MCPSource = "gmail" | "drive" | "calendar";
export type RiskLevel = "critical" | "high" | "medium" | "low" | "safe";
export type WizardStep = "email" | "upload" | "analyzing" | "results" | "alert" | "manual_input";
export type FindingStatus = "excede_ley" | "revisa" | "conforme";

export interface MCPLabel {
  id: string;
  source: MCPSource;
  text: string;
  risk: RiskLevel;
  ts: number;
}

export interface ContractFinding {
  id: string;
  status: FindingStatus;
  title: string;
  quote: string;
  explanation: string;
  law: string;
}

export interface DataSharingOption {
  id: string;
  icon: string;
  title: string;
  description: string;
  benefit: string;
  hasExtra: boolean;
}

export interface LawItem {
  law: string;
  title: string;
  complies: boolean;
  detail: string;
}

export interface EmailAction {
  to: string;
  entityName: string;
  subject: string;
  body: string;
}

export interface ContractAnalysis {
  entityName: string;
  entityType: string;
  findings: ContractFinding[];
  dataSharing: DataSharingOption[];
  laws: LawItem[];
  emailAction: EmailAction;
}

export interface CompanyProfile {
  codigo: string;
  nombre: string;
  rut: string;
  paginaWeb: string;
  direccion: string;
  email: string;
}

export type AlertType = "not_found" | "rut_mismatch" | "cmf_error";

export interface AlertData {
  type: AlertType;
  nombre?: string;
  contractRut?: string;
  cmfRut?: string;
  message?: string;
}

export interface MCPStatus {
  source: MCPSource;
  connected: boolean;
  lastSync: string | null;
  error: string | null;
}
