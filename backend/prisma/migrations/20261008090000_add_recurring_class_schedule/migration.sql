ALTER TABLE "UpcomingClass"
  ADD COLUMN "instructorName" TEXT,
  ADD COLUMN "daysOfWeek" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "startDate" DATE,
  ADD COLUMN "endDate" DATE,
  ADD COLUMN "startTime" TEXT,
  ADD COLUMN "endTime" TEXT;

UPDATE "UpcomingClass" AS c
SET
  "instructorName" = COALESCE(u."name", 'Instructor to be announced'),
  "daysOfWeek" = ARRAY[upper(trim(to_char(c."startsAt", 'Day')))],
  "startDate" = c."startsAt"::date,
  "endDate" = c."endsAt"::date,
  "startTime" = to_char(c."startsAt", 'HH24:MI'),
  "endTime" = to_char(c."endsAt", 'HH24:MI')
FROM "User" AS u
WHERE c."instructorId" = u."id";

UPDATE "UpcomingClass"
SET
  "instructorName" = COALESCE("instructorName", 'Instructor to be announced'),
  "daysOfWeek" = CASE WHEN cardinality("daysOfWeek") = 0 THEN ARRAY['MONDAY']::TEXT[] ELSE "daysOfWeek" END,
  "startDate" = COALESCE("startDate", "startsAt"::date),
  "endDate" = COALESCE("endDate", "endsAt"::date),
  "startTime" = COALESCE("startTime", to_char("startsAt", 'HH24:MI')),
  "endTime" = COALESCE("endTime", to_char("endsAt", 'HH24:MI'));

ALTER TABLE "UpcomingClass"
  ALTER COLUMN "instructorName" SET NOT NULL;
