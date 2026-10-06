import { Router } from "express";
import { Role } from "@prisma/client";
import { adminController } from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import { studentStatusBodySchema } from "../validators/admin.validator";

const router = Router();
router.use(authenticate, authorize(Role.ADMIN));
router.get("/students", validate("query", paginationQuerySchema), asyncHandler(adminController.students));
router.get("/users", validate("query", paginationQuerySchema), asyncHandler(adminController.users));
router.get("/courses", validate("query", paginationQuerySchema), asyncHandler(adminController.courses));
router.get("/courses/:id", validate("params", idParamsSchema), asyncHandler(adminController.course));
router.get("/analytics", asyncHandler(adminController.analytics));
router.patch("/students/:id/status", validate("params", idParamsSchema), validate("body", studentStatusBodySchema), asyncHandler(adminController.setStudentStatus));

export default router;
