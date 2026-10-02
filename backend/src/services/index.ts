import { adminRepository } from "../repositories/admin.repository";
import { certificateRepository } from "../repositories/certificate.repository";
import { courseRepository } from "../repositories/course.repository";
import {
  exerciseRepository,
  lessonRepository,
  progressRepository,
  quizRepository,
} from "../repositories/learning.repository";
import { moduleRepository } from "../repositories/module.repository";
import { userRepository } from "../repositories/user.repository";
import { youTubeRepository } from "../repositories/youtube.repository";
import { AdminService } from "./admin.service";
import { AuthService } from "./auth.service";
import { CertificateService } from "./certificate.service";
import { CourseService } from "./course.service";
import {
  ExerciseService,
  LessonService,
  ProgressService,
  QuizService,
} from "./learning.service";
import { ModuleService } from "./module.service";
import { YouTubeService } from "./youtube.service";
import { UserService } from "./user.service";

export const authService = new AuthService(userRepository);
export const userService = new UserService(userRepository);
export const courseService = new CourseService(courseRepository);
export const lessonService = new LessonService(lessonRepository);
export const moduleService = new ModuleService(moduleRepository);
export const exerciseService = new ExerciseService(exerciseRepository);
export const quizService = new QuizService(quizRepository);
export const progressService = new ProgressService(progressRepository);
export const youTubeService = new YouTubeService(youTubeRepository);
export const adminService = new AdminService(adminRepository);
export const certificateService = new CertificateService(certificateRepository);
