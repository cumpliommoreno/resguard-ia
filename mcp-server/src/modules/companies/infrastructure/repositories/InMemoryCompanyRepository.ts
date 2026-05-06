import { Company } from "../../domain/entities/Company.js";
import type { ICompanyRepository } from "../../domain/repositories/ICompanyRepository.js";

const SEED: { apiCode: string; name: string; email: string }[] = [
  { apiCode: "001", name: "Banco de Chile",                             email: "contacto@bancochile.cl" },
  { apiCode: "009", name: "Banco de Crédito e Inversiones (BCI)",       email: "contacto@bci.cl" },
  { apiCode: "012", name: "Banco del Estado de Chile",                  email: "contacto@bancoestado.cl" },
  { apiCode: "014", name: "Scotiabank Chile",                           email: "contacto@scotiabank.cl" },
  { apiCode: "016", name: "Banco de Crédito e Inversiones (sucursal)",  email: "sucursal@bci.cl" },
  { apiCode: "028", name: "Banco Bice",                                 email: "contacto@bice.cl" },
  { apiCode: "031", name: "HSBC Bank Chile",                            email: "contacto@hsbc.cl" },
  { apiCode: "037", name: "Banco Santander-Chile",                      email: "contacto@santander.cl" },
  { apiCode: "039", name: "Itaú Corpbanca",                             email: "contacto@itau.cl" },
  { apiCode: "049", name: "Banco Security",                             email: "contacto@security.cl" },
  { apiCode: "051", name: "Banco Falabella",                            email: "contacto@bancofalabella.cl" },
  { apiCode: "053", name: "Banco Ripley",                               email: "contacto@bancoripley.cl" },
  { apiCode: "055", name: "Banco Consorcio",                            email: "contacto@bancoconsorcio.cl" },
  { apiCode: "057", name: "Scotiabank Azul",                            email: "contacto@scotiabankzul.cl" },
  { apiCode: "059", name: "Banco BTG Pactual Chile",                    email: "contacto@btgpactual.cl" },
  { apiCode: "061", name: "Bank of China, Agencia en Chile",            email: "contacto@bankofchina.cl" },
  { apiCode: "062", name: "Banco Internacional",                        email: "contacto@bancointernacional.cl" },
];

export class InMemoryCompanyRepository implements ICompanyRepository {
  private store = new Map<string, Company>(
    SEED.map((s) => [s.apiCode, Company.create(s)])
  );

  async findByApiCode(apiCode: string): Promise<Company | null> {
    return this.store.get(apiCode) ?? null;
  }

  async findAll(): Promise<Company[]> {
    return Array.from(this.store.values());
  }
}
