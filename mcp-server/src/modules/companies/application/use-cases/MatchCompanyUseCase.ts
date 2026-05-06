import Fuse from "fuse.js";
import type { ICompanyRepository } from "../../domain/repositories/ICompanyRepository.js";
import type { MatchCompanyInput, MatchCompanyOutput } from "../dtos/MatchCompanyDto.js";
import { ok, err, type Result } from "../../../../shared/domain/Result.js";
import type { Company } from "../../domain/entities/Company.js";

const FUSE_THRESHOLD = 0.4;

function tokenMatch(query: string, company: Company): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const target = company.name.toLowerCase();
  return tokens.every((token) => target.includes(token));
}

export class MatchCompanyUseCase {
  constructor(private readonly repo: ICompanyRepository) {}

  async execute(input: MatchCompanyInput): Promise<Result<MatchCompanyOutput | null>> {
    if (!input.rut.trim()) return err(new Error("rut cannot be empty"));
    if (!input.name.trim()) return err(new Error("name cannot be empty"));

    const companies = await this.repo.findAll();

    // Token match: todos los tokens del input deben aparecer en el nombre
    const tokenMatched = companies.find((c) => tokenMatch(input.name, c));
    if (tokenMatched) {
      return ok({
        rut: input.rut,
        company: { apiCode: tokenMatched.apiCode, name: tokenMatched.name, email: tokenMatched.email },
        score: 0,
        confidence: "high",
      });
    }

    // Fallback: fuzzy match para typos y variaciones menores
    const fuse = new Fuse(companies, {
      keys: ["name"],
      includeScore: true,
      threshold: FUSE_THRESHOLD,
      ignoreLocation: true,
    });

    const results = fuse.search(input.name);
    if (results.length === 0) return ok(null);

    const best = results[0]!;
    const score = best.score ?? 1;

    return ok({
      rut: input.rut,
      company: { apiCode: best.item.apiCode, name: best.item.name, email: best.item.email },
      score,
      confidence: score <= 0.3 ? "high" : "low",
    });
  }
}
