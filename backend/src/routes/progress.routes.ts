import { Router } from "express";
import { progressController } from "../controllers/learning.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { paginationQuerySchema } from "../validators/common.validator";
import { lessonProgressBodySchema } from "../validators/learning.validator";

const router = Router();
router.get("/", authenticate, validate("query", paginationQuerySchema), asyncHandler(progressController.get));
router.post("/lesson", authenticate, validate("body", lessonProgressBodySchema), asyncHandler(progressController.updateLesson));

export default router;
