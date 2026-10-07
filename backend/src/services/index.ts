import { adminRepository } from "../repositories/admin.repository";
import { certificateRepository } from "../repositories/certificate.repository";
import { courseRepository } from "../repositories/course.repository";
import { learningResourceRepository } from "../repositories/learning-resource.repository";
import {
  exerciseRepository,
  lessonRepository,
  progressRepository,
} from "../repositories/learning.repository";
import { moduleRepository } from "../repositories/module.repository";
import { userRepository } from "../repositories/user.repository";
import { youTubeRepository } from "../repositories/youtube.repository";
import { upcomingClassRepository } from "../repositories/upcoming-class.repository";
import { AdminService } from "./admin.service";
import { AuthService } from "./auth.service";
import { CertificateService } from "./certificate.service";
import { CourseService } from "./course.service";
import { LearningResourceService } from "./learning-resource.service";
import {
  ExerciseService,
  LessonService,
  ProgressService,
} from "./learning.service";
import { ModuleService } from "./module.service";
import { YouTubeService } from "./youtube.service";
import { UserService } from "./user.service";
import { UpcomingClassService } from "./upcoming-class.service";

export const authService = new AuthService(userRepository);
export const userService = new UserService(userRepository);
export const courseService = new CourseService(courseRepository);
export const lessonService = new LessonService(lessonRepository);
export const learningResourceService = new LearningResourceService(learningResourceRepository);
export const moduleService = new ModuleService(moduleRepository);
export const exerciseService = new ExerciseService(exerciseRepository);
export const progressService = new ProgressService(progressRepository);
export const youTubeService = new YouTubeService(youTubeRepository);
export const adminService = new AdminService(adminRepository);
export const certificateService = new CertificateService(certificateRepository);
export const upcomingClassService = new UpcomingClassService(upcomingClassRepository);
