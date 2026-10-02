import { NotFoundError } from "../errors/app-error";
import type { CertificateRepository } from "../repositories/certificate.repository";

export class CertificateService {
  constructor(private readonly certificates: CertificateRepository) {}

  listForUser(userId: string) {
    return this.certificates.findForUser(userId);
  }

  async verify(code: string) {
    const certificate = await this.certificates.verify(code);
    if (!certificate) throw new NotFoundError("Certificate not found");
    return certificate;
  }
}
