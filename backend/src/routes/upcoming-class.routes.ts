import { Router } from "express";
import { Role } from "@prisma/client";
import { upcomingClassController } from "../controllers/upcoming-class.controller";
import { authenticate, authorize } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { idParamsSchema } from "../validators/common.validator";
import {
  createUpcomingClassBodySchema,
  upcomingClassListQuerySchema,
  updateUpcomingClassBodySchema,
} from "../validators/upcoming-class.validator";

export const publicUpcomingClassRouter = Router();
publicUpcomingClassRouter.get(
  "/",
  validate("query", upcomingClassListQuerySchema),
  asyncHandler(upcomingClassController.listClasses),
);
publicUpcomingClassRouter.get(
  "/upcoming",
  validate("query", upcomingClassListQuerySchema),
  asyncHandler(upcomingClassController.listUpcoming),
);
publicUpcomingClassRouter.get(
  "/:id",
  validate("params", idParamsSchema),
  asyncHandler(upcomingClassController.get),
);

const adminUpcomingClassRouter = Router();
adminUpcomingClassRouter.use(authenticate, authorize(Role.ADMIN));
adminUpcomingClassRouter.get(
  "/",
  validate("query", upcomingClassListQuerySchema),
  asyncHandler(upcomingClassController.listAdmin),
);
adminUpcomingClassRouter.get(
  "/:id",
  validate("params", idParamsSchema),
  asyncHandler(upcomingClassController.getAdmin),
);
adminUpcomingClassRouter.post(
  "/",
  validate("body", createUpcomingClassBodySchema),
  asyncHandler(upcomingClassController.create),
);
adminUpcomingClassRouter.put(
  "/:id",
  validate("params", idParamsSchema),
  validate("body", updateUpcomingClassBodySchema),
  asyncHandler(upcomingClassController.update),
);
adminUpcomingClassRouter.delete(
  "/:id",
  validate("params", idParamsSchema),
  asyncHandler(upcomingClassController.delete),
);

export default adminUpcomingClassRouter;
