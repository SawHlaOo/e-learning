import { Router } from "express";
import { Role } from "@prisma/client";
import { lessonController } from "../controllers/learning.controller";
import { authenticate, authorize } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { idParamsSchema } from "../validators/common.validator";
import { createLessonBodySchema, updateLessonBodySchema } from "../validators/learning.validator";

const router = Router();
router.get("/:id", validate("params", idParamsSchema), asyncHandler(lessonController.get));
router.post("/", authenticate, authorize(Role.ADMIN, Role.INSTRUCTOR), validate("body", createLessonBodySchema), asyncHandler(lessonController.create));
router.put("/:id", authenticate, authorize(Role.ADMIN, Role.INSTRUCTOR), validate("params", idParamsSchema), validate("body", updateLessonBodySchema), asyncHandler(lessonController.update));
router.delete("/:id", authenticate, authorize(Role.ADMIN, Role.INSTRUCTOR), validate("params", idParamsSchema), asyncHandler(lessonController.delete));

export default router;
