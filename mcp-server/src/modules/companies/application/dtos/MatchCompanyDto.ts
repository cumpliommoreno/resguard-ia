import type { CompanyDto } from "./CompanyDto.js";

export interface MatchCompanyInput {
  rut: string;
  name: string;
}

export interface MatchCompanyOutput {
  rut: string;
  company: CompanyDto;
  score: number;
  confidence: "high" | "low";
}
