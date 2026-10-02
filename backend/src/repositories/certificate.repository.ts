import { prisma } from "../config/database";

export class CertificateRepository {
  findForUser(userId: string) {
    return prisma.certificate.findMany({
      where: { userId },
      select: {
        id: true, code: true, issuedAt: true,
        course: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  verify(code: string) {
    return prisma.certificate.findUnique({
      where: { code },
      select: {
        code: true, issuedAt: true,
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
    });
  }
}

export const certificateRepository = new CertificateRepository();
