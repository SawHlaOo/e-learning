import { Router } from "express";
import rateLimit from "express-rate-limit";
import { quizController } from "../controllers/learning.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { rateLimitSetting } from "../utils/rate-limit";
import { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import { quizAttemptBodySchema } from "../validators/learning.validator";

const router = Router();
const quizAttemptLimit = rateLimit({
  windowMs: rateLimitSetting("QUIZ_RATE_WINDOW_MS"),
  limit: rateLimitSetting("QUIZ_RATE_LIMIT"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many quiz submissions; try again later", code: "RATE_LIMITED" },
});

router.get("/", validate("query", paginationQuerySchema), asyncHandler(quizController.list));
router.post(
  "/:id/attempts",
  authenticate,
  quizAttemptLimit,
  validate("params", idParamsSchema),
  validate("body", quizAttemptBodySchema),
  asyncHandler(quizController.submit),
);

export default router;
