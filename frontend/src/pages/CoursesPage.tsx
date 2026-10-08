import { useEffect, useState } from "react";
import { CourseCard } from "../components/CourseCard";
import { courseService } from "../services/courseService";
import type { Course } from "../types";

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    courseService.listPage(page)
      .then((result) => {
        if (!active) return;
        setCourses(result.items);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "An unexpected error occurred");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);
  return <main className="content-page section">
    <div className="eyebrow">THE COURSE LIBRARY</div><h1>Find your <span>next step.</span></h1><p className="content-intro">Explore courses across subjects and build skills that matter to you.</p>
    {loading ? <div className="page-state" role="status">Loading courses…</div> : error ? <div className="page-state" role="alert"><strong>Courses aren’t available right now.</strong><span>{error}</span></div> : courses.length ? <>
      <div className="course-grid">{courses.map((course, index) => <CourseCard key={course.id} course={course} index={(page - 1) * 20 + index} />)}</div>
      {totalPages > 1 && <nav className="list-pagination" aria-label="Course pages"><button className="button button-light" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="button button-light" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next</button></nav>}
    </> : <div className="empty-courses"><div className="empty-icon">✳</div><div><strong>No published courses yet.</strong><p>Make sure the backend is connected to the database and the development course seed has been run.</p></div></div>}
  </main>;
}
