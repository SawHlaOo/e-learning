import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { AdminPage, AdminStudentsPage, DashboardPage } from "./pages/DashboardPages";
import { AdminCoursesPage } from "./pages/AdminCoursesPage";
import { AdminQuizzesPage } from "./pages/AdminQuizzesPage";
import { CourseDetailPage, LessonPage, QuizPage } from "./pages/DetailPages";
import { AuthPage } from "./pages/AuthPage";
import { CoursesPage } from "./pages/CoursesPage";
import { HomePage } from "./pages/HomePage";

function SiteLayout() {
  return <><Navbar /><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/courses" element={<CoursesPage />} />
    <Route path="/courses/:courseId" element={<CourseDetailPage />} />
    <Route path="/lessons/:lessonId" element={<LessonPage />} />
    <Route path="/quizzes/:quizId" element={<QuizPage />} />
    <Route path="/login" element={<AuthPage />} />
    <Route path="/register" element={<AuthPage register />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
    </Route>
    <Route element={<ProtectedRoute admin />}>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/courses" element={<AdminCoursesPage />} />
      <Route path="/admin/quizzes" element={<AdminQuizzesPage />} />
      <Route path="/admin/students" element={<AdminStudentsPage />} />
      <Route path="/admin/*" element={<AdminPage />} />
    </Route>
    <Route path="*" element={<main className="page-state"><strong>404 · Page not found</strong><a href="/">Back home</a></main>} />
  </Routes></>;
}

export default function App() {
  return <BrowserRouter><AuthProvider><SiteLayout /></AuthProvider></BrowserRouter>;
}
