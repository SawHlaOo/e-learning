import { Activity, ArrowRight, BookOpen, GraduationCap, Link2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminService, type Analytics } from "../services/adminService";
import { progressService } from "../services/progressService";
import { UpcomingClassesSection } from "../components/UpcomingClassesSection";

export function DashboardPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<{ enrollments: unknown[]; lessonProgress: unknown[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { progressService.get().then(setProgress).catch((cause: Error) => setError(cause.message)); }, []);
  return <main className="content-page section dashboard-page"><div className="eyebrow">YOUR LEARNING SPACE</div><h1>Welcome back, <span>{user?.name.split(" ")[0]}.</span></h1><p className="content-intro">Every lesson is progress. Keep your learning momentum going.</p>{error && <div className="form-error">{error}</div>}<div className="dashboard-stats"><div><BookOpen /><strong>{progress?.enrollments.length ?? "—"}</strong><span>Enrolled courses</span></div><div><Activity /><strong>{progress?.lessonProgress.filter((item) => (item as { completed?: boolean }).completed).length ?? "—"}</strong><span>Lessons completed</span></div></div><section className="dashboard-panel"><div><h2>Keep the momentum</h2><p>Your next lesson is one click away.</p></div><Link className="button button-dark" to="/courses">Explore courses <ArrowRight size={17} /></Link></section><UpcomingClassesSection compact /></main>;
}

export function AdminPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { adminService.analytics().then(setAnalytics).catch((cause: Error) => setError(cause.message)); }, []);
  const items = [["Total students", analytics?.totalStudents, Users], ["Active students", analytics?.activeStudents, Activity], ["Courses", analytics?.totalCourses, BookOpen], ["Lessons", analytics?.totalLessons, GraduationCap]] as const;
  return <main className="content-page section dashboard-page"><div className="eyebrow">PYPATH ADMINISTRATION</div><h1>Platform <span>overview.</span></h1><p className="content-intro">A clear view of your learning community.</p>{error && <div className="form-error">{error}</div>}<div className="dashboard-stats">{items.map(([label, value, Icon]) => <div key={label}><Icon /><strong>{value ?? "—"}</strong><span>{label}</span></div>)}</div><section className="dashboard-panel"><div><h2>Manage courses</h2><p>Create and edit courses, modules, lessons, and video links.</p></div><Link className="button button-dark" to="/admin/courses">Course studio <ArrowRight size={17} /></Link></section><section className="dashboard-panel"><div><h2>Classes</h2><p>Create, schedule, and manage all classes across every status.</p></div><Link className="button button-dark" to="/admin/classes">Manage classes <ArrowRight size={17} /></Link></section><section className="dashboard-panel"><div><h2>Learning resources</h2><p>Curate published links, documentation, videos, and other material for lessons.</p></div><Link className="button button-dark" to="/admin/learning-resources">Manage resources <Link2 size={17} /></Link></section><section className="dashboard-panel"><div><h2>Manage your students</h2><p>View accounts and enrollment activity.</p></div><Link className="button button-dark" to="/admin/students">View students <ArrowRight size={17} /></Link></section></main>;
}

export function AdminStudentsPage() {
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string; isActive: boolean; createdAt: string; _count: { enrollments: number; lessonProgress: number } }>>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    adminService.students(page)
      .then((result) => {
        if (!active) return;
        setStudents(result.items);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((cause: Error) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);
  async function toggleStatus(id: string, currentStatus: boolean) {
    try { const updated = await adminService.setStudentStatus(id, !currentStatus); setStudents((rows) => rows.map((student) => student.id === updated.id ? { ...student, isActive: updated.isActive } : student)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update student"); }
  }
  return <main className="content-page section dashboard-page"><div className="eyebrow">PYPATH ADMINISTRATION</div><h1>Your <span>students.</span></h1><p className="content-intro">Manage student accounts and follow learning activity.</p>{error && <div className="form-error" role="alert">{error}</div>}<div className="students-table-wrap"><table className="students-table"><thead><tr><th>Name</th><th>Email</th><th>Courses</th><th>Lessons</th><th>Status</th><th>Joined</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={7}>Loading students…</td></tr> : students.map((student) => <tr key={student.id}><td>{student.name}</td><td>{student.email}</td><td>{student._count.enrollments}</td><td>{student._count.lessonProgress}</td><td><span className={student.isActive ? "status-active" : "status-inactive"}>{student.isActive ? "Active" : "Suspended"}</span></td><td>{new Date(student.createdAt).toLocaleDateString()}</td><td><button className="table-action" onClick={() => void toggleStatus(student.id, student.isActive)}>{student.isActive ? "Suspend" : "Activate"}</button></td></tr>)}{!loading && !error && !students.length && <tr><td colSpan={7}>No students yet.</td></tr>}</tbody></table></div>{totalPages > 1 && <nav className="list-pagination" aria-label="Student pages"><button className="button button-light" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="button button-light" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next</button></nav>}</main>;
}
