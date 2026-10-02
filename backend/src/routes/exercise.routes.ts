import { Router } from "express";
import { exerciseController } from "../controllers/learning.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import { exerciseSubmissionBodySchema } from "../validators/learning.validator";

const router = Router();
router.get("/", validate("query", paginationQuerySchema), asyncHandler(exerciseController.list));
router.get("/:id", validate("params", idParamsSchema), asyncHandler(exerciseController.get));
router.post("/:id/submit", authenticate, validate("params", idParamsSchema), validate("body", exerciseSubmissionBodySchema), asyncHandler(exerciseController.submit));

export default router;
