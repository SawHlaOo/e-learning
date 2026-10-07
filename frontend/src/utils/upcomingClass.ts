import type { UpcomingClass, UpcomingClassStatus } from "../types";

export function getClassStatus(
  upcomingClass: Pick<UpcomingClass, "status" | "startsAt" | "endsAt">,
  now = new Date(),
): UpcomingClassStatus {
  if (upcomingClass.status === "DRAFT" || upcomingClass.status === "CANCELLED") {
    return upcomingClass.status;
  }
  const recurring = upcomingClass as UpcomingClass;
  if (recurring.startDate && recurring.endDate && recurring.startTime && recurring.endTime && recurring.daysOfWeek.length) {
    const date = now.toISOString().slice(0, 10);
    if (date > recurring.endDate || (date === recurring.endDate && now.toTimeString().slice(0, 5) > recurring.endTime)) return "COMPLETED";
    if (date < recurring.startDate || (date === recurring.startDate && now.toTimeString().slice(0, 5) < recurring.startTime)) return "UPCOMING";
    const day = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][now.getDay()];
    if (recurring.daysOfWeek.includes(day) && now.toTimeString().slice(0, 5) >= recurring.startTime && now.toTimeString().slice(0, 5) < recurring.endTime) return "LIVE";
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
  const labels: Record<string, string> = { SUNDAY: "Sun", MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat" };
  const dayText = days.map((day) => labels[day] ?? day).join(", ");
  if (!startDate || !endDate || !startTime || !endTime) return `${dayText} · Schedule unavailable`;
  return `${dayText} · ${startDate} to ${endDate} · ${startTime}–${endTime}`;
}
