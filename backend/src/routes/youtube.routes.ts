import { Router } from "express";
import { Role } from "@prisma/client";
import { youTubeController } from "../controllers/youtube.controller";
import { authenticate, authorize } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import { createVideoBodySchema, updateVideoBodySchema } from "../validators/youtube.validator";

const router = Router();
router.get("/", validate("query", paginationQuerySchema), asyncHandler(youTubeController.list));
router.post("/", authenticate, authorize(Role.ADMIN, Role.INSTRUCTOR), validate("body", createVideoBodySchema), asyncHandler(youTubeController.create));
router.put("/:id", authenticate, authorize(Role.ADMIN, Role.INSTRUCTOR), validate("params", idParamsSchema), validate("body", updateVideoBodySchema), asyncHandler(youTubeController.update));
router.delete("/:id", authenticate, authorize(Role.ADMIN, Role.INSTRUCTOR), validate("params", idParamsSchema), asyncHandler(youTubeController.delete));

export default router;
