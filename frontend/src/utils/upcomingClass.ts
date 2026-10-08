import type { UpcomingClass, UpcomingClassStatus } from "../types";

export function getClassStatus(
  upcomingClass: Pick<UpcomingClass, "status" | "startsAt" | "endsAt">,
  now = new Date(),
): UpcomingClassStatus {
  if (
    upcomingClass.status === "DRAFT"
    || upcomingClass.status === "LIVE"
    || upcomingClass.status === "COMPLETED"
    || upcomingClass.status === "CANCELLED"
  ) {
    return upcomingClass.status;
  }
  const recurring = upcomingClass as UpcomingClass;
  if (recurring.startDate && recurring.endDate && recurring.startTime && recurring.endTime && recurring.daysOfWeek.length) {
    const date = now.toISOString().slice(0, 10);
    const time = now.toISOString().slice(11, 16);
    if (date > recurring.endDate || (date === recurring.endDate && time > recurring.endTime)) return "COMPLETED";
    if (date < recurring.startDate || (date === recurring.startDate && time < recurring.startTime)) return "UPCOMING";
    const utcDay = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][now.getUTCDay()];
    if (recurring.daysOfWeek.includes(utcDay) && time >= recurring.startTime && time < recurring.endTime) return "LIVE";
    return "UPCOMING";
  }
  const start = new Date(upcomingClass.startsAt);
  const end = new Date(upcomingClass.endsAt);
  if (end <= now) return "COMPLETED";
  if (start <= now) return "LIVE";
  return "UPCOMING";
}

export function formatClassDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export function formatClassTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getClassDuration(startsAt: string, endsAt: string) {
  const minutes = Math.max(0, Math.round((Date.parse(endsAt) - Date.parse(startsAt)) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

export function toLocalDateTime(value: string) {
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatClassSchedule(days: string[], startDate: string | null, endDate: string | null, startTime: string | null, endTime: string | null) {
  const labels: Record<string, string> = {
    SUNDAY: "Sunday",
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
    SATURDAY: "Saturday",
  };
  const dayText = days.map((day) => labels[day] ?? day).join(", ");
  if (!startDate || !endDate || !startTime || !endTime) return `${dayText} · Schedule unavailable`;

  const timeRange = `${formatScheduleTime(startTime)} – ${formatScheduleTime(endTime)}`;
  const duration = `${formatScheduleDate(startDate)} – ${formatScheduleDate(endDate)}`;
  return `${dayText}, ${timeRange} · Duration: ${duration}`;
}

function formatScheduleDate(value: string) {
  const datePart = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatScheduleTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  const minute = match[2];
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}
