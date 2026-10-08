import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

const AdminPage = lazy(() => import("./pages/DashboardPages").then((page) => ({ default: page.AdminPage })));
const AdminStudentsPage = lazy(() => import("./pages/DashboardPages").then((page) => ({ default: page.AdminStudentsPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPages").then((page) => ({ default: page.DashboardPage })));
const AdminCoursesPage = lazy(() => import("./pages/AdminCoursesPage").then((page) => ({ default: page.AdminCoursesPage })));
const AdminLearningResourcesPage = lazy(() => import("./pages/AdminLearningResourcesPage").then((page) => ({ default: page.AdminLearningResourcesPage })));
const CourseDetailPage = lazy(() => import("./pages/DetailPages").then((page) => ({ default: page.CourseDetailPage })));
const LessonPage = lazy(() => import("./pages/DetailPages").then((page) => ({ default: page.LessonPage })));
const AuthPage = lazy(() => import("./pages/AuthPage").then((page) => ({ default: page.AuthPage })));
const CoursesPage = lazy(() => import("./pages/CoursesPage").then((page) => ({ default: page.CoursesPage })));
const HomePage = lazy(() => import("./pages/HomePage").then((page) => ({ default: page.HomePage })));
const AdminClassesPage = lazy(() => import("./pages/AdminClassesPage").then((page) => ({ default: page.AdminClassesPage })));
const ClassesPage = lazy(() => import("./pages/UpcomingClassPages").then((page) => ({ default: page.ClassesPage })));
const UpcomingClassesPage = lazy(() => import("./pages/UpcomingClassPages").then((page) => ({ default: page.UpcomingClassesPage })));
const ClassDetailPage = lazy(() => import("./pages/UpcomingClassPages").then((page) => ({ default: page.ClassDetailPage })));

function SiteLayout() {
  return <><Navbar /><Suspense fallback={<main className="page-state" role="status">Loading page…</main>}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/courses" element={<CoursesPage />} />
    <Route path="/classes" element={<ClassesPage />} />
    <Route path="/classes/:id" element={<ClassDetailPage />} />
    <Route path="/upcoming-classes" element={<UpcomingClassesPage />} />
    <Route path="/upcoming-classes/:id" element={<ClassDetailPage />} />
    <Route path="/courses/:courseId" element={<CourseDetailPage />} />
    <Route path="/lessons/:lessonId" element={<LessonPage />} />
    <Route path="/login" element={<AuthPage />} />
    <Route path="/register" element={<AuthPage register />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
    </Route>
    <Route element={<ProtectedRoute admin />}>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/courses" element={<AdminCoursesPage />} />
      <Route path="/admin/classes" element={<AdminClassesPage />} />
      <Route path="/admin/upcoming-classes" element={<AdminClassesPage />} />
      <Route path="/admin/learning-resources" element={<AdminLearningResourcesPage />} />
      <Route path="/admin/students" element={<AdminStudentsPage />} />
      <Route path="/admin/*" element={<AdminPage />} />
    </Route>
    <Route path="*" element={<main className="page-state"><strong>404 · Page not found</strong><a href="/">Back home</a></main>} />
  </Routes></Suspense></>;
}

export default function App() {
  return <BrowserRouter><AuthProvider><SiteLayout /></AuthProvider></BrowserRouter>;
}
