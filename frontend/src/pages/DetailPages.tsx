import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { courseService } from "../services/courseService";
import { lessonService } from "../services/lessonService";
import type { Course, Lesson } from "../types";

function getTelegramEnrollUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["t.me", "www.t.me", "telegram.me", "www.telegram.me"].includes(url.hostname)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function CourseDetailPage() {
  const { courseId = "" } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const telegramEnrollUrl = getTelegramEnrollUrl(import.meta.env.VITE_TELEGRAM_ENROLL_URL);
  useEffect(() => { courseService.get(courseId).then(setCourse).catch((cause: Error) => setError(cause.message)); }, [courseId]);
  if (error) return <div className="page-state">{error}</div>;
  if (!course) return <div className="page-state">Loading course…</div>;
  return <main className="content-page section">
    <Link className="back-link" to="/courses"><ArrowLeft size={16} /> All courses</Link>
    <div className="course-detail-header"><div className="eyebrow">{course.level} PATH · {course.estimatedHours} HOURS</div><h1>{course.title}</h1><p>{course.description}</p>{course.telegramEnrollmentEnabled === false ? <button className="button button-dark enrollment-disabled" type="button" disabled aria-disabled="true">Free</button> : telegramEnrollUrl ? <a className="button button-dark" href={telegramEnrollUrl} target="_blank" rel="noopener noreferrer">Go to Telegram to enroll <ArrowRight size={17} /></a> : <><button className="button button-dark enrollment-disabled" type="button" disabled aria-disabled="true">Go to Telegram to enroll <ArrowRight size={17} /></button><p role="status">Telegram enrollment is not configured yet.</p></>}</div>
    <div className="curriculum"><h2><BookOpen size={20} /> Course curriculum</h2>{course.modules?.map((module, index) => <section className="module-panel" key={module.id}><h3><span>{String(module.order ?? index + 1).padStart(2, "0")}</span>{module.title}</h3>{module.description && <p className="module-description">{module.description}</p>}{module.lessons?.length ? module.lessons.map((lesson) => <Link key={lesson.id} className="lesson-row" to={`/lessons/${lesson.id}`}><span><CheckCircle2 size={17} />{lesson.title}</span><ArrowRight size={16} /></Link>) : <p className="muted">Lessons coming soon.</p>}</section>)}</div>
  </main>;
}

export function LessonPage() {
  const { lessonId = "" } = useParams();
  const [lesson, setLesson] = useState<Lesson & { module: { title: string; courseId: string } } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { lessonService.get(lessonId).then(setLesson).catch((cause: Error) => setError(cause.message)); }, [lessonId]);
  function youtubeEmbedUrl(value: string) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      const videoId = host === "youtu.be" || host === "www.youtu.be"
        ? url.pathname.slice(1).split("/")[0]
        : url.pathname === "/watch"
          ? url.searchParams.get("v")
          : /^\/(?:embed|shorts|live)\/([^/]+)/.exec(url.pathname)?.[1];
      if (!videoId || !/^[a-zA-Z0-9_-]+$/.test(videoId)) return null;
      if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"].includes(host)) return null;
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    } catch {
      return null;
    }
  }
  if (error) return <div className="page-state">{error}</div>;
  if (!lesson) return <div className="page-state">Loading lesson…</div>;
  const embedUrl = lesson.youtubeUrl ? youtubeEmbedUrl(lesson.youtubeUrl) : null;
  return <main className="content-page section"><Link className="back-link" to={`/courses/${lesson.module.courseId}`}><ArrowLeft size={16} /> Back to course</Link><div className="lesson-heading"><span className="eyebrow">{lesson.module.title}</span><h1>{lesson.title}</h1><p>{lesson.durationMinutes ?? 0} minute lesson</p></div>{embedUrl && <div className="lesson-video"><iframe src={embedUrl} title={`${lesson.title} video lesson`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}{lesson.youtubeUrl && <p className="video-fallback"><a href={lesson.youtubeUrl} target="_blank" rel="noreferrer">Open video on YouTube</a></p>}<article className="lesson-content">{lesson.content ? <p>{lesson.content}</p> : <p>Lesson content is being prepared. Come back soon.</p>}</article><div className="page-state">Practice activities and lesson completion tracking are part of the learning roadmap.</div></main>;
}
