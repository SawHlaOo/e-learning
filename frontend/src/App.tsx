import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { AdminPage, AdminStudentsPage, DashboardPage } from "./pages/DashboardPages";
import { AdminCoursesPage } from "./pages/AdminCoursesPage";
import { AdminLearningResourcesPage } from "./pages/AdminLearningResourcesPage";
import { CourseDetailPage, LessonPage } from "./pages/DetailPages";
import { AuthPage } from "./pages/AuthPage";
import { CoursesPage } from "./pages/CoursesPage";
import { HomePage } from "./pages/HomePage";
import { AdminClassesPage } from "./pages/AdminClassesPage";
import { ClassesPage, UpcomingClassesPage, ClassDetailPage } from "./pages/UpcomingClassPages";

function SiteLayout() {
  return <><Navbar /><Routes>
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
  </Routes></>;
}

export default function App() {
  return <BrowserRouter><AuthProvider><SiteLayout /></AuthProvider></BrowserRouter>;
}
