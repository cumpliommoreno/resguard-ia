export type FlowStep = "name_matching" | "cmf_api" | "rut_validation";

export interface ResolveCompanyInput {
  rut: string;
  name: string;
}

export interface ResolveCompanySuccess {
  success: true;
  data: {
    codigo: string;
    nombre: string;
    rut: string;
    paginaWeb: string;
    direccion: string;
    email: string;
  };
}

export interface ResolveCompanyFailure {
  success: false;
  step: FlowStep;
  message: string;
}

export type ResolveCompanyOutput = ResolveCompanySuccess | ResolveCompanyFailure;
