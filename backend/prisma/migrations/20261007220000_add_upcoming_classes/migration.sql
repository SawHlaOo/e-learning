CREATE TYPE "UpcomingClassStatus" AS ENUM (
  'DRAFT',
  'UPCOMING',
  'LIVE',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE "UpcomingClass" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "thumbnail" TEXT,
  "startsAt" TIMESTAMPTZ(3) NOT NULL,
  "endsAt" TIMESTAMPTZ(3) NOT NULL,
  "instructorId" TEXT NOT NULL,
  "courseId" TEXT,
  "meetingUrl" TEXT,
  "meetingPlatform" TEXT,
  "maxParticipants" INTEGER,
  "notes" TEXT,
  "status" "UpcomingClassStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UpcomingClass_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UpcomingClass_status_startsAt_endsAt_idx"
  ON "UpcomingClass"("status", "startsAt", "endsAt");
CREATE INDEX "UpcomingClass_instructorId_idx"
  ON "UpcomingClass"("instructorId");
CREATE INDEX "UpcomingClass_courseId_idx"
  ON "UpcomingClass"("courseId");

ALTER TABLE "UpcomingClass"
  ADD CONSTRAINT "UpcomingClass_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UpcomingClass"
  ADD CONSTRAINT "UpcomingClass_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
