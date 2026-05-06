import type { ICompanyProfilePort, CompanyProfileData } from "../../domain/ports/ICompanyProfilePort.js";

const BASE_URL = "https://api.cmfchile.cl/api-sbifv3/recursos_api/perfil/instituciones";
const PERIOD = "2026/02";

interface CmfPerfilRaw {
  Perfil?: {
    nombre?: string;
    rut?: string;
    direccionPrincipal?: string;
    direccionWeb?: string;
  };
  Institucion?: {
    CodigoInstitucion?: string;
  };
}

interface CmfResponse {
  Perfiles?: CmfPerfilRaw[];
}

export class CmfApiAdapter implements ICompanyProfilePort {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("CMF_API_KEY is required");
    this.apiKey = apiKey;
  }

  async fetch(apiCode: string): Promise<CompanyProfileData> {
    const url = `${BASE_URL}/${apiCode}/${PERIOD}?apikey=${this.apiKey}&formato=json`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CMF API responded with status ${response.status}`);
    }

    const json = (await response.json()) as CmfResponse;
    const perfil = json.Perfiles?.[0];

    if (!perfil) {
      throw new Error(`CMF API returned no profile data for apiCode ${apiCode}`);
    }

    return {
      codigo:    perfil.Institucion?.CodigoInstitucion ?? "",
      nombre:    perfil.Perfil?.nombre                ?? "",
      rut:       perfil.Perfil?.rut                   ?? "",
      paginaWeb: perfil.Perfil?.direccionWeb           ?? "",
      direccion: perfil.Perfil?.direccionPrincipal     ?? "",
    };
  }
}
