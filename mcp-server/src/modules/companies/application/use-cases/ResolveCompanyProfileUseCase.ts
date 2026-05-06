import type { ICompanyRepository } from "../../domain/repositories/ICompanyRepository.js";
import type { ICompanyProfilePort } from "../../domain/ports/ICompanyProfilePort.js";
import type { ResolveCompanyInput, ResolveCompanyOutput } from "../dtos/ResolveCompanyDto.js";
import { MatchCompanyUseCase } from "./MatchCompanyUseCase.js";

export class ResolveCompanyProfileUseCase {
  private readonly matchCompany: MatchCompanyUseCase;

  constructor(
    private readonly repo: ICompanyRepository,
    private readonly cmfApi: ICompanyProfilePort
  ) {
    this.matchCompany = new MatchCompanyUseCase(repo);
  }

  async execute(input: ResolveCompanyInput): Promise<ResolveCompanyOutput> {
    // Step 1: fuzzy match
    const matchResult = await this.matchCompany.execute(input);

    if (!matchResult.ok) {
      return {
        success: false,
        step: "name_matching",
        message: `Error al buscar la empresa: ${matchResult.error.message}`,
      };
    }

    if (matchResult.value === null || matchResult.value.confidence === "low") {
      return {
        success: false,
        step: "name_matching",
        message: "Institución no está disponible en nuestra plataforma.",
      };
    }

    // Step 2: CMF API
    const { apiCode } = matchResult.value.company;

    try {
      const profile = await this.cmfApi.fetch(apiCode);

      // Step 3: RUT validation
      const normalize = (rut: string) => rut.replace(/\./g, "").toUpperCase();
      if (normalize(profile.rut) !== normalize(input.rut)) {
        return {
          success: false,
          step: "rut_validation",
          message: `El RUT ${input.rut} no corresponde a la institución encontrada.`,
        };
      }

      return {
        success: true,
        data: {
          codigo:    profile.codigo,
          nombre:    profile.nombre,
          rut:       profile.rut,
          paginaWeb: profile.paginaWeb,
          direccion: profile.direccion,
          email:     matchResult.value.company.email,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      return {
        success: false,
        step: "cmf_api",
        message: "Los servicios de CMF presenta intermitencia, vuelve a intentarlo pronto.",
      };
    }
  }
}
