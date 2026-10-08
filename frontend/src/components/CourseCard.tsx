import { ArrowUpRight, BookOpen, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Course } from "../types";

const colors = ["mint", "violet", "peach"];

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  return (
    <Link className="course-card" to={`/courses/${course.id}`}>
      <div className={`course-art ${colors[index % colors.length]}${course.thumbnail ? " has-course-image" : ""}`}>
        {course.thumbnail && <img className="course-art-image" src={course.thumbnail} alt={`${course.title} thumbnail`} loading="lazy" decoding="async" onError={(event) => {
          event.currentTarget.hidden = true;
          event.currentTarget.parentElement?.classList.remove("has-course-image");
        }} />}
        <span className="course-art-label">LEARNING PATH · {course.level}</span>
        <span className="course-art-mark"><BookOpen size={48} strokeWidth={1.5} aria-hidden="true" /></span>
        <span className="course-art-grid" />
        <span className="course-art-arrow"><ArrowUpRight size={18} /></span>
      </div>
      <div className="course-card-body">
        <div className="eyebrow">COURSE</div>
        <h3>{course.title}</h3>
        <p>{course.summary || course.description}</p>
        <div className="course-meta">
          <span><BookOpen size={15} /> {course._count?.modules ?? 0} modules</span>
          <span><Clock3 size={15} /> {course.estimatedHours ?? 0} hours</span>
        </div>
      </div>
    </Link>
  );
}
