import type { Company } from "../entities/Company.js";

export interface ICompanyRepository {
  findByApiCode(apiCode: string): Promise<Company | null>;
  findAll(): Promise<Company[]>;
}
