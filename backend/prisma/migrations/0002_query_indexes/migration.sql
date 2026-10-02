CREATE INDEX "User_role_createdAt_idx" ON "User"("role", "createdAt");

DROP INDEX "Course_published_featured_idx";
CREATE INDEX "Course_published_featured_createdAt_idx"
ON "Course"("published", "featured", "createdAt");

CREATE INDEX "Exercise_published_createdAt_idx"
ON "Exercise"("published", "createdAt");

CREATE INDEX "Quiz_published_createdAt_idx"
ON "Quiz"("published", "createdAt");
