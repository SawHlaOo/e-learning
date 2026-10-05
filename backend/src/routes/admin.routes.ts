import { Router } from "express";
import { Role } from "@prisma/client";
import { adminController } from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/async-handler";
import { idParamsSchema, paginationQuerySchema } from "../validators/common.validator";
import { createQuizBodySchema, createQuizQuestionBodySchema, studentStatusBodySchema, updateQuizBodySchema, updateQuizQuestionBodySchema } from "../validators/admin.validator";

const router = Router();
router.use(authenticate, authorize(Role.ADMIN));
router.get("/students", validate("query", paginationQuerySchema), asyncHandler(adminController.students));
router.get("/users", validate("query", paginationQuerySchema), asyncHandler(adminController.users));
router.get("/courses", validate("query", paginationQuerySchema), asyncHandler(adminController.courses));
router.get("/courses/:id", validate("params", idParamsSchema), asyncHandler(adminController.course));
router.get("/analytics", asyncHandler(adminController.analytics));
router.patch("/students/:id/status", validate("params", idParamsSchema), validate("body", studentStatusBodySchema), asyncHandler(adminController.setStudentStatus));
router.get("/quizzes", asyncHandler(adminController.quizzes));
router.post("/quizzes", validate("body", createQuizBodySchema), asyncHandler(adminController.createQuiz));
router.get("/quizzes/:id", validate("params", idParamsSchema), asyncHandler(adminController.quiz));
router.put("/quizzes/:id", validate("params", idParamsSchema), validate("body", updateQuizBodySchema), asyncHandler(adminController.updateQuiz));
router.delete("/quizzes/:id", validate("params", idParamsSchema), asyncHandler(adminController.deleteQuiz));
router.post("/quizzes/:id/questions", validate("params", idParamsSchema), validate("body", createQuizQuestionBodySchema), asyncHandler(adminController.createQuizQuestion));
router.put("/quiz-questions/:id", validate("params", idParamsSchema), validate("body", updateQuizQuestionBodySchema), asyncHandler(adminController.updateQuizQuestion));
router.delete("/quiz-questions/:id", validate("params", idParamsSchema), asyncHandler(adminController.deleteQuizQuestion));

export default router;
