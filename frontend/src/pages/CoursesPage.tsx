import { useEffect, useState } from "react";
import { CourseCard } from "../components/CourseCard";
import { courseService } from "../services/courseService";
import type { Course } from "../types";

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    courseService.list()
      .then(setCourses)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "An unexpected error occurred"))
      .finally(() => setLoading(false));
  }, []);
  return <main className="content-page section">
    <div className="eyebrow">THE COURSE LIBRARY</div><h1>Find your <span>next step.</span></h1><p className="content-intro">Practical paths designed to help you learn Python from the ground up.</p>
    {loading ? <div className="page-state">Loading courses…</div> : error ? <div className="page-state"><strong>Courses aren’t available right now.</strong><span>{error}</span></div> : courses.length ? <div className="course-grid">{courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}</div> : <div className="empty-courses"><div className="empty-icon">✳</div><div><strong>No published courses yet.</strong><p>Make sure the backend is connected to the database and the development course seed has been run.</p></div></div>}
  </main>;
}
