export interface CompanyProfileData {
  codigo: string;
  nombre: string;
  rut: string;
  paginaWeb: string;
  direccion: string;
}

export interface ICompanyProfilePort {
  fetch(apiCode: string): Promise<CompanyProfileData>;
}
