import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { rateLimitSetting } from "../utils/rate-limit";
import { loginBodySchema, registerBodySchema } from "../validators/auth.validator";
import { authenticate } from "../middleware/authenticate";

const router = Router();
const authRateLimit = rateLimit({
  windowMs: rateLimitSetting("AUTH_RATE_WINDOW_MS"),
  limit: rateLimitSetting("AUTH_RATE_LIMIT"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication requests; try again later", code: "RATE_LIMITED" },
});

router.post(
  "/register",
  authRateLimit,
  validate("body", registerBodySchema),
  asyncHandler(authController.register),
);
router.post(
  "/login",
  authRateLimit,
  validate("body", loginBodySchema),
  asyncHandler(authController.login),
);
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", authenticate, asyncHandler(authController.me));

export default router;
