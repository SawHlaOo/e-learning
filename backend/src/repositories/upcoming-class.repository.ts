import { Prisma, Role, UpcomingClassStatus } from "@prisma/client";
import { prisma } from "../config/database";
import type { PageInput } from "../utils/pagination";

export interface UpcomingClassFilters extends PageInput {
  search?: string;
  status?: UpcomingClassStatus;
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
}

const classSelection = {
  id: true,
  title: true,
  description: true,
  thumbnail: true,
  instructorName: true,
  daysOfWeek: true,
  startDate: true,
  endDate: true,
  startTime: true,
  endTime: true,
  startsAt: true,
  endsAt: true,
  instructorId: true,
  courseId: true,
  meetingUrl: true,
  meetingPlatform: true,
  maxParticipants: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  instructor: { select: { id: true, name: true } },
  course: { select: { id: true, title: true, thumbnail: true } },
} satisfies Prisma.UpcomingClassSelect;
const publicUpcomingSelection = { ...classSelection, meetingUrl: false } satisfies Prisma.UpcomingClassSelect;

export class UpcomingClassRepository {
  async findMany(filters: UpcomingClassFilters) {
    const now = new Date();
    const where: Prisma.UpcomingClassWhereInput = {
      ...(filters.status ? { AND: [statusFilter(filters.status, now)] } : {}),
      ...(filters.search ? {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { instructorName: { contains: filters.search, mode: "insensitive" } },
          { instructor: { name: { contains: filters.search, mode: "insensitive" } } },
        ],
      } : {}),
      ...(filters.from || filters.to ? {
        startsAt: {
          ...(filters.from ? { gte: new Date(filters.from) } : {}),
          ...(filters.to ? { lte: endOfFilterDay(filters.to) } : {}),
        },
      } : {}),
    };
    const direction = filters.sort ?? "asc";
    const [items, total] = await Promise.all([
      prisma.upcomingClass.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: classSelection,
        orderBy: [{ startsAt: direction }, { endsAt: direction }],
      }),
      prisma.upcomingClass.count({ where }),
    ]);
    return { items, total };
  }

  findUpcoming(now: Date, page: PageInput) {
    const where: Prisma.UpcomingClassWhereInput = {
      status: { notIn: [UpcomingClassStatus.DRAFT, UpcomingClassStatus.CANCELLED] },
      endsAt: { gte: now },
    };
    return prisma.$transaction([
      prisma.upcomingClass.findMany({
        where,
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        select: publicUpcomingSelection,
        orderBy: [{ startsAt: "asc" }, { endsAt: "asc" }],
      }),
      prisma.upcomingClass.count({ where }),
    ]).then(([items, total]) => ({ items, total }));
  }

  findById(id: string) {
    return prisma.upcomingClass.findUnique({ where: { id }, select: classSelection });
  }

  findPublishedById(id: string) {
    return prisma.upcomingClass.findFirst({
      where: {
        id,
        status: { not: UpcomingClassStatus.DRAFT },
      },
      select: classSelection,
    });
  }

  findInstructor(id: string) {
    return prisma.user.findFirst({
      where: { id, role: Role.INSTRUCTOR, isActive: true },
      select: { id: true },
    });
  }

  findCourse(id: string) {
    return prisma.course.findUnique({ where: { id }, select: { id: true } });
  }

  create(data: Prisma.UpcomingClassUncheckedCreateInput) {
    return prisma.upcomingClass.create({ data, select: classSelection });
  }

  update(id: string, data: Prisma.UpcomingClassUncheckedUpdateInput) {
    return prisma.upcomingClass.update({ where: { id }, data, select: classSelection });
  }

  delete(id: string) {
    return prisma.upcomingClass.delete({ where: { id }, select: { id: true } });
  }
}

function statusFilter(status: UpcomingClassStatus, now: Date): Prisma.UpcomingClassWhereInput {
  if (status === UpcomingClassStatus.DRAFT || status === UpcomingClassStatus.CANCELLED) {
    return { status };
  }
  const activeStatuses = { notIn: [UpcomingClassStatus.DRAFT, UpcomingClassStatus.CANCELLED] };
  if (status === UpcomingClassStatus.UPCOMING) {
    return { status: activeStatuses, startsAt: { gt: now }, endsAt: { gt: now } };
  }
  if (status === UpcomingClassStatus.LIVE) {
    return { status: activeStatuses, startsAt: { lte: now }, endsAt: { gt: now } };
  }
  return { status: activeStatuses, endsAt: { lte: now } };
}

function endOfFilterDay(value: string) {
  const date = new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) date.setHours(23, 59, 59, 999);
  return date;
}

export const upcomingClassRepository = new UpcomingClassRepository();
