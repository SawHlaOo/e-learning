import { UpcomingClassStatus, type Prisma } from "@prisma/client";
import { NotFoundError, ValidationError } from "../errors/app-error";
import type { UpcomingClassFilters } from "../repositories/upcoming-class.repository";
import type { UpcomingClassRepository } from "../repositories/upcoming-class.repository";
import { paginationResult, type PageInput } from "../utils/pagination";

export interface UpcomingClassInput {
  title: string;
  description: string;
  thumbnail?: string | null;
  instructorName: string;
  daysOfWeek: string[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  instructorId?: string | null;
  courseId?: string | null;
  meetingUrl?: string | null;
  meetingPlatform?: string | null;
  maxParticipants?: number | null;
  notes?: string | null;
  status?: UpcomingClassStatus;
}

export function effectiveClassStatus(
  item: { status: UpcomingClassStatus; startsAt: Date; endsAt: Date; daysOfWeek?: string[]; startDate?: Date | null; endDate?: Date | null; startTime?: string | null; endTime?: string | null },
  now = new Date(),
) {
  if (item.status === UpcomingClassStatus.DRAFT || item.status === UpcomingClassStatus.CANCELLED) {
    return item.status;
  }
  if (item.startDate && item.endDate && item.startTime && item.endTime && item.daysOfWeek?.length) {
    const today = dateKey(now);
    const startDate = dateKey(item.startDate);
    const endDate = dateKey(item.endDate);
    if (today > endDate || (today === endDate && currentTime(now) > item.endTime)) return UpcomingClassStatus.COMPLETED;
    if (today < startDate || (today === startDate && currentTime(now) < item.startTime)) return UpcomingClassStatus.UPCOMING;
    if (today >= startDate && today <= endDate && item.daysOfWeek.includes(dayName(now))) {
      if (currentTime(now) >= item.startTime && currentTime(now) < item.endTime) return UpcomingClassStatus.LIVE;
    }
    return UpcomingClassStatus.UPCOMING;
  }
  if (item.endsAt <= now) return UpcomingClassStatus.COMPLETED;
  if (item.startsAt <= now) return UpcomingClassStatus.LIVE;
  return UpcomingClassStatus.UPCOMING;
}

function present(item: Awaited<ReturnType<UpcomingClassRepository["findById"]>>, now = new Date()) {
  return item ? { ...item, status: effectiveClassStatus(item, now) } : null;
}

export class UpcomingClassService {
  constructor(private readonly classes: UpcomingClassRepository) {}

  async list(filters: UpcomingClassFilters) {
    const result = await this.classes.findMany(filters);
    return {
      items: result.items,
      pagination: paginationResult({ page: filters.page, limit: filters.limit }, result.total),
    };
  }

  async upcoming(page: PageInput) {
    const result = await this.classes.findUpcoming(new Date(), page);
    return {
      items: result.items.map((item) => ({ ...item, meetingUrl: null, status: effectiveClassStatus(item) })),
      pagination: paginationResult(page, result.total),
    };
  }

  async publicClasses(page: PageInput) {
    const result = await this.classes.findClasses(page);
    return {
      items: result.items.map((item) => ({ ...item, meetingUrl: null, status: effectiveClassStatus(item) })),
      pagination: paginationResult(page, result.total),
    };
  }

  async get(id: string, admin = false) {
    const now = new Date();
    const item = admin
      ? await this.classes.findById(id)
      : await this.classes.findPublicById(id);
    if (!item) throw new NotFoundError("Class not found");
    if (admin) return item;
    const result = present(item, now);
    if (!admin && result && result.status !== UpcomingClassStatus.LIVE) {
      return { ...result, meetingUrl: null };
    }
    return result;
  }

  async create(input: UpcomingClassInput) {
    if (input.instructorId) await this.assertRelations(input.instructorId, input.courseId);
    else if (input.courseId && !await this.classes.findCourse(input.courseId)) {
      throw new NotFoundError("Course not found");
    }
    const data: Prisma.UpcomingClassUncheckedCreateInput = {
      title: input.title.trim(),
      description: input.description.trim(),
      thumbnail: input.thumbnail?.trim() || null,
      instructorName: input.instructorName.trim(),
      daysOfWeek: input.daysOfWeek,
      startDate: new Date(`${input.startDate}T00:00:00.000Z`),
      endDate: new Date(`${input.endDate}T00:00:00.000Z`),
      startTime: input.startTime,
      endTime: input.endTime,
      startsAt: boundaryDate(input.startDate, input.startTime),
      endsAt: boundaryDate(input.endDate, input.endTime),
      instructorId: input.instructorId || null,
      courseId: input.courseId || null,
      meetingUrl: input.meetingUrl?.trim() || null,
      meetingPlatform: input.meetingPlatform?.trim() || null,
      maxParticipants: input.maxParticipants ?? null,
      notes: input.notes?.trim() || null,
      status: input.status ?? UpcomingClassStatus.DRAFT,
    };
    return this.classes.create(data);
  }

  async update(id: string, input: Partial<UpcomingClassInput>) {
    await this.get(id, true);
    const current = await this.classes.findById(id);
    if (!current) throw new NotFoundError("Class not found");
    if (input.instructorId !== undefined || input.courseId !== undefined) {
      if (input.instructorId) await this.assertRelations(input.instructorId, input.courseId ?? current.courseId);
      if (input.courseId && !await this.classes.findCourse(input.courseId)) {
        throw new NotFoundError("Course not found");
      }
    }
    const schedule = {
      startDate: input.startDate ?? dateKey(current.startDate ?? current.startsAt),
      endDate: input.endDate ?? dateKey(current.endDate ?? current.endsAt),
      startTime: input.startTime ?? current.startTime ?? timeKey(current.startsAt),
      endTime: input.endTime ?? current.endTime ?? timeKey(current.endsAt),
    };
    const scheduleErrors: Record<string, string[]> = {};
    if (schedule.endDate < schedule.startDate) scheduleErrors.endDate = ["End date must be on or after start date"];
    if (schedule.endTime <= schedule.startTime) {
      scheduleErrors.endTime = ["End time must be after start time"];
    }
    if (Object.keys(scheduleErrors).length) throw new ValidationError("Invalid class schedule", scheduleErrors);
    const data: Prisma.UpcomingClassUncheckedUpdateInput = {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.thumbnail?.trim() ? { thumbnail: input.thumbnail.trim() } : {}),
      ...(input.instructorName !== undefined ? { instructorName: input.instructorName.trim() } : {}),
      ...(input.daysOfWeek !== undefined ? { daysOfWeek: input.daysOfWeek } : {}),
      ...((input.startDate !== undefined || input.endDate !== undefined || input.startTime !== undefined || input.endTime !== undefined)
        ? { startDate: new Date(`${schedule.startDate}T00:00:00.000Z`), endDate: new Date(`${schedule.endDate}T00:00:00.000Z`), startTime: schedule.startTime, endTime: schedule.endTime, startsAt: boundaryDate(schedule.startDate, schedule.startTime), endsAt: boundaryDate(schedule.endDate, schedule.endTime) }
        : {}),
      ...(input.instructorId?.trim() ? { instructorId: input.instructorId.trim() } : {}),
      ...(input.courseId?.trim() ? { courseId: input.courseId.trim() } : {}),
      ...(input.meetingUrl?.trim() ? { meetingUrl: input.meetingUrl.trim() } : {}),
      ...(input.meetingPlatform?.trim() ? { meetingPlatform: input.meetingPlatform.trim() } : {}),
      ...(input.maxParticipants !== undefined && input.maxParticipants !== null ? { maxParticipants: input.maxParticipants } : {}),
      ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    };
    return this.classes.update(id, data);
  }

  async delete(id: string) {
    await this.get(id, true);
    return this.classes.delete(id);
  }

  private async assertRelations(instructorId: string, courseId?: string | null) {
    if (!await this.classes.findInstructor(instructorId)) {
      throw new NotFoundError("Active instructor not found");
    }
    if (courseId && !await this.classes.findCourse(courseId)) {
      throw new NotFoundError("Course not found");
    }
  }
}

function boundaryDate(date: string, time: string) {
  return new Date(`${date}T${time}:00.000Z`);
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function timeKey(value: Date) {
  return value.toISOString().slice(11, 16);
}

function currentTime(value: Date) {
  return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
}

function dayName(value: Date) {
  return ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][value.getUTCDay()];
}
