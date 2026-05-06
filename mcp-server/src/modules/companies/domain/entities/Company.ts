export interface CompanyProps {
  apiCode: string;
  name: string;
  email: string;
}

export class Company {
  readonly apiCode: string;
  readonly name: string;
  readonly email: string;

  private constructor(props: CompanyProps) {
    this.apiCode = props.apiCode;
    this.name    = props.name;
    this.email   = props.email;
  }

  static create(props: CompanyProps): Company {
    if (!/^\d+$/.test(props.apiCode)) throw new Error("apiCode must contain only digits");
    if (!props.name.trim()) throw new Error("name cannot be empty");
    if (!props.email.includes("@")) throw new Error("invalid email");
    return new Company(props);
  }
}
