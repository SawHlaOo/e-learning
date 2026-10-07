CREATE TYPE "LearningResourceType" AS ENUM (
  'GITHUB',
  'YOUTUBE',
  'DOCUMENTATION',
  'ARTICLE',
  'WEBSITE',
  'COURSE',
  'PDF',
  'OTHER'
);

CREATE TABLE "LearningResource" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "url" TEXT NOT NULL,
  "type" "LearningResourceType" NOT NULL,
  "thumbnail" TEXT,
  "order" INTEGER NOT NULL DEFAULT 1,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "lessonId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LearningResource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LearningResource_lessonId_isPublished_order_idx"
  ON "LearningResource"("lessonId", "isPublished", "order");
CREATE INDEX "LearningResource_type_isPublished_idx"
  ON "LearningResource"("type", "isPublished");

ALTER TABLE "LearningResource"
  ADD CONSTRAINT "LearningResource_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
