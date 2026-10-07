import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

export const upcomingClassStatusSchema = z.enum([
  "DRAFT",
  "UPCOMING",
  "LIVE",
  "COMPLETED",
  "CANCELLED",
]);

const httpUrlSchema = z.string().trim().pipe(z.url()).refine(
  (value) => /^https?:\/\//i.test(value),
  "URL must use HTTP or HTTPS",
);

const optionalHttpUrlSchema = z.union([z.literal(""), httpUrlSchema]).nullable().optional();
const weekDaySchema = z.enum(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Provide a valid date").refine((value) => {
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Provide a valid date");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Provide a valid time");

const createFields = {
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(1).max(10000),
  thumbnail: optionalHttpUrlSchema,
  instructorName: z.string().trim().min(2).max(160),
  daysOfWeek: z.array(weekDaySchema).min(1).max(7),
  startDate: dateSchema,
  endDate: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  instructorId: z.string().trim().min(1).max(191).optional().nullable(),
  courseId: z.string().trim().min(1).max(191).nullable().optional(),
  meetingUrl: optionalHttpUrlSchema,
  meetingPlatform: z.string().trim().max(80).nullable().optional(),
  maxParticipants: z.number().int().min(1).max(100000).nullable().optional(),
  notes: z.string().trim().max(10000).nullable().optional(),
  status: upcomingClassStatusSchema.optional(),
};

function validateSchedule<T extends { startDate?: string; endDate?: string; startTime?: string; endTime?: string }>(
  value: T,
  context: z.RefinementCtx,
) {
  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after start date" });
  }
  if (value.startDate === value.endDate && value.startTime && value.endTime && value.startTime >= value.endTime) {
    context.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time" });
  }
}

export const createUpcomingClassBodySchema = z.object(createFields).superRefine(validateSchedule);
export const updateUpcomingClassBodySchema = z.object(createFields).partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update")
  .superRefine(validateSchedule);

const optionalDateFilter = z.string().trim().refine(
  (value) => Number.isFinite(Date.parse(value)),
  "Provide a valid date",
).optional();

export const upcomingClassListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(160).optional(),
  status: upcomingClassStatusSchema.optional(),
  from: optionalDateFilter,
  to: optionalDateFilter,
  sort: z.enum(["asc", "desc"]).default("asc"),
}).superRefine((value, context) => {
  if (value.from && value.to && Date.parse(value.from) > Date.parse(value.to)) {
    context.addIssue({ code: "custom", path: ["to"], message: "End date must not be before start date" });
  }
});
