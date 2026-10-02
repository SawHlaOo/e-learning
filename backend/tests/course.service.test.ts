import assert from "node:assert/strict";
import { test } from "node:test";
import { Role } from "@prisma/client";
import { CourseService } from "../src/services/course.service";
import type { CourseRepository } from "../src/repositories/course.repository";

test("instructors cannot update or delete another instructor's course", async () => {
  const repository = {
    findById: async () => ({ id: "course-1", authorId: "owner-1" }),
    update: async () => { throw new Error("Should not update"); },
    delete: async () => { throw new Error("Should not delete"); },
  } as unknown as CourseRepository;
  const service = new CourseService(repository);

  await assert.rejects(
    service.update("course-1", {}, "other-instructor", Role.INSTRUCTOR),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "FORBIDDEN",
  );
  await assert.rejects(
    service.delete("course-1", "other-instructor", Role.INSTRUCTOR),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "FORBIDDEN",
  );
});

test("administrators can update another instructor's course", async () => {
  let updatedId = "";
  const repository = {
    findById: async () => ({ id: "course-1", authorId: "owner-1" }),
    update: async (id: string) => { updatedId = id; return { id }; },
  } as unknown as CourseRepository;
  const service = new CourseService(repository);

  await service.update("course-1", {}, "admin-1", Role.ADMIN);
  assert.equal(updatedId, "course-1");
});

test("repeated enrollment requests return the same active enrollment", async () => {
  const existingEnrollment = { id: "enrollment-1", userId: "student-1", courseId: "course-1" };
  let enrollment = existingEnrollment;
  const repository = {
    enroll: async () => enrollment,
  } as unknown as CourseRepository;
  const service = new CourseService(repository);

  const first = await service.enroll("student-1", "course-1");
  const second = await service.enroll("student-1", "course-1");
  assert.equal(first.id, second.id);
  assert.equal(enrollment.id, "enrollment-1");
});
