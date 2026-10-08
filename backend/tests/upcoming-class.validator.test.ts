import assert from "node:assert/strict";
import test from "node:test";
import {
  createUpcomingClassBodySchema,
  upcomingClassListQuerySchema,
  updateUpcomingClassBodySchema,
} from "../src/validators/upcoming-class.validator";
import { effectiveClassStatus } from "../src/services/upcoming-class.service";

const validClass = {
  title: "Weekly Python workshop",
  description: "Practice Python with an instructor.",
  instructorName: "Ada Instructor",
  daysOfWeek: ["SUNDAY"],
  startDate: "2026-11-01",
  endDate: "2026-11-29",
  startTime: "09:00",
  endTime: "10:00",
  status: "UPCOMING",
};

test("upcoming class accepts valid schedules and HTTP(S) meeting links", () => {
  assert.equal(createUpcomingClassBodySchema.safeParse({
    ...validClass,
    meetingUrl: "https://meet.example.com/class",
  }).success, true);
  assert.equal(createUpcomingClassBodySchema.safeParse({
    ...validClass,
    meetingUrl: "javascript:alert(1)",
  }).success, false);
});

test("upcoming class rejects invalid time ranges and participant limits", () => {
  assert.equal(createUpcomingClassBodySchema.safeParse({
    ...validClass,
    endTime: validClass.startTime,
  }).success, false);
  assert.equal(createUpcomingClassBodySchema.safeParse({
    ...validClass,
    maxParticipants: 0,
  }).success, false);
});

test("upcoming class validates optional MMK fees and supports clearing a fee", () => {
  assert.equal(createUpcomingClassBodySchema.safeParse({ ...validClass, feeAmount: 0 }).success, true);
  assert.equal(createUpcomingClassBodySchema.safeParse({ ...validClass, feeAmount: 25000 }).success, true);
  assert.equal(createUpcomingClassBodySchema.safeParse({ ...validClass, feeAmount: 1.5 }).success, false);
  assert.equal(createUpcomingClassBodySchema.safeParse({ ...validClass, feeAmount: -1 }).success, false);
  assert.equal(updateUpcomingClassBodySchema.safeParse({ feeAmount: null }).success, true);
});

test("upcoming class updates require a field and accept valid status changes", () => {
  assert.equal(updateUpcomingClassBodySchema.safeParse({}).success, false);
  assert.equal(updateUpcomingClassBodySchema.safeParse({ status: "CANCELLED" }).success, true);
  assert.equal(updateUpcomingClassBodySchema.safeParse({ status: "PUBLISHED" }).success, false);
});

test("class filters validate dates and sort direction", () => {
  assert.equal(upcomingClassListQuerySchema.safeParse({ from: "2026-11-02", to: "2026-11-01" }).success, false);
  assert.equal(upcomingClassListQuerySchema.safeParse({ status: "LIVE", sort: "desc" }).success, true);
  assert.equal(upcomingClassListQuerySchema.safeParse({ sort: "random" }).success, false);
});

test("class status follows its schedule while preserving explicit draft, live, completed, and cancelled states", () => {
  const now = new Date("2026-11-01T09:30:00.000Z");
  const schedule = {
    startsAt: new Date("2026-11-01T09:00:00.000Z"),
    endsAt: new Date("2026-11-01T10:00:00.000Z"),
    startDate: new Date("2026-11-01T00:00:00.000Z"),
    endDate: new Date("2026-11-29T00:00:00.000Z"),
    startTime: "09:00",
    endTime: "10:00",
    daysOfWeek: ["SUNDAY"],
  };
  assert.equal(effectiveClassStatus({ ...schedule, status: "UPCOMING" }, now), "LIVE");
  assert.equal(effectiveClassStatus({
    startsAt: new Date("2026-11-01T08:00:00.000Z"),
    endsAt: new Date("2026-11-01T09:00:00.000Z"),
    startDate: new Date("2026-10-01T00:00:00.000Z"),
    endDate: new Date("2026-10-25T00:00:00.000Z"),
    startTime: "08:00",
    endTime: "09:00",
    daysOfWeek: ["SUNDAY"],
    status: "UPCOMING",
  }, now), "COMPLETED");
  assert.equal(effectiveClassStatus({ ...schedule, status: "DRAFT" }, now), "DRAFT");
  assert.equal(effectiveClassStatus({
    ...schedule,
    startsAt: new Date("2026-11-01T10:00:00.000Z"),
    endsAt: new Date("2026-11-01T11:00:00.000Z"),
    startTime: "10:00",
    endTime: "11:00",
    status: "LIVE",
  }, now), "LIVE");
  assert.equal(effectiveClassStatus({ ...schedule, status: "COMPLETED" }, now), "COMPLETED");
  assert.equal(effectiveClassStatus({ ...schedule, status: "CANCELLED" }, now), "CANCELLED");
});
