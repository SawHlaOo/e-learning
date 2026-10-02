import { Router } from "express";
import { Role } from "@prisma/client";
import { moduleController } from "../controllers/learning.controller";
import { authenticate, authorize } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { idParamsSchema } from "../validators/common.validator";
import { createModuleBodySchema, updateModuleBodySchema } from "../validators/learning.validator";

const router = Router();
router.get("/:id", validate("params", idParamsSchema), asyncHandler(moduleController.get));
router.post("/", authenticate, authorize(Role.ADMIN, Role.INSTRUCTOR), validate("body", createModuleBodySchema), asyncHandler(moduleController.create));
router.put("/:id", authenticate, authorize(Role.ADMIN, Role.INSTRUCTOR), validate("params", idParamsSchema), validate("body", updateModuleBodySchema), asyncHandler(moduleController.update));
router.delete("/:id", authenticate, authorize(Role.ADMIN, Role.INSTRUCTOR), validate("params", idParamsSchema), asyncHandler(moduleController.delete));

export default router;
