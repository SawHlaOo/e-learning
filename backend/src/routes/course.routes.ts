import { Router } from "express";
import { Role } from "@prisma/client";
import { courseController } from "../controllers/course.controller";
import { authenticate, authorize } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import { createCourseBodySchema, updateCourseBodySchema } from "../validators/course.validator";

const router = Router();

router.get("/", validate("query", paginationQuerySchema), asyncHandler(courseController.list));
router.get("/:id", validate("params", idParamsSchema), asyncHandler(courseController.get));
router.post(
  "/:id/enroll",
  authenticate,
  authorize(Role.STUDENT),
  validate("params", idParamsSchema),
  asyncHandler(courseController.enroll),
);
router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.INSTRUCTOR),
  validate("body", createCourseBodySchema),
  asyncHandler(courseController.create),
);
router.put(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.INSTRUCTOR),
  validate("params", idParamsSchema),
  validate("body", updateCourseBodySchema),
  asyncHandler(courseController.update),
);
router.delete(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.INSTRUCTOR),
  validate("params", idParamsSchema),
  asyncHandler(courseController.delete),
);

export default router;
