import { Router } from "express";
import { Role } from "@prisma/client";
import { learningResourceController } from "../controllers/learning-resource.controller";
import { authenticate, authorize } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { idParamsSchema } from "../validators/common.validator";
import {
  createLearningResourceBodySchema,
  learningResourceListQuerySchema,
  updateLearningResourceBodySchema,
} from "../validators/learning-resource.validator";

const router = Router();
router.use(authenticate, authorize(Role.ADMIN));
router.get("/", validate("query", learningResourceListQuerySchema), asyncHandler(learningResourceController.list));
router.get("/:id", validate("params", idParamsSchema), asyncHandler(learningResourceController.get));
router.post("/", validate("body", createLearningResourceBodySchema), asyncHandler(learningResourceController.create));
router.put("/:id", validate("params", idParamsSchema), validate("body", updateLearningResourceBodySchema), asyncHandler(learningResourceController.update));
router.delete("/:id", validate("params", idParamsSchema), asyncHandler(learningResourceController.delete));

export default router;
