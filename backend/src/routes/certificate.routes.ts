import { Router } from "express";
import { certificateController } from "../controllers/certificate.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { certificateCodeParamsSchema } from "../validators/admin.validator";

const router = Router();
router.get("/verify/:code", validate("params", certificateCodeParamsSchema), asyncHandler(certificateController.verify));
router.get("/", authenticate, asyncHandler(certificateController.list));

export default router;
