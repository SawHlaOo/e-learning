import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Rocket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { courseService } from "../services/courseService";
import { lessonService } from "../services/lessonService";
import { quizService } from "../services/quizService";
import type { Course, Lesson, Quiz, QuizQuestion } from "../types";

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

export function QuizPage() {
  const { quizId = "" } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    setQuiz(null);
    setError("");
    quizService.get(quizId)
      .then((value) => { if (active) setQuiz(value); })
      .catch(() => { if (active) setError("We couldn't load this quiz. Please try again."); });
    return () => { active = false; };
  }, [quizId]);

  const questions = useMemo(() => quiz?.questions ?? [], [quiz]);
  const currentQuestion = questions[currentIndex];
  const progress = started ? ((currentIndex + 1) / Math.max(questions.length, 1)) * 100 : 0;

  function setQuestionAnswer(value: unknown) {
    if (!currentQuestion) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: value }));
  }

  function getQuestionOptions(question: QuizQuestion): string[] {
    if (Array.isArray(question.options)) {
      return question.options.map((option) => String(option));
    }
    if (question.options && typeof question.options === "object" && "choices" in question.options && Array.isArray((question.options as { choices?: unknown[] }).choices)) {
      return (question.options as { choices: unknown[] }).choices.map((option) => String(option));
    }
    return [];
  }

  async function handleSubmit() {
    if (!quiz || !questions.length) return;
    const hasAnswer = (questionId: string) => {
      const value = answers[questionId];
      return Array.isArray(value) ? value.length > 0 : typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
    };
    if (questions.some((question) => !hasAnswer(question.id))) {
      setError("Answer every question before submitting the quiz.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const response = await quizService.submit(quiz.id, answers);
      setResult(response);
    } catch {
      setError("We couldn't submit your quiz. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !quiz) return <div className="page-state"><strong>{error}</strong><button className="button button-light" type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  if (!quiz) return <div className="page-state">Loading quiz…</div>;

  if (result) {
    return <main className="content-page section">
      <Link className="back-link" to="/courses"><ArrowLeft size={16} /> Back to courses</Link>
      <div className="lesson-heading">
        <span className="eyebrow">Quiz complete</span>
        <h1>{quiz.title}</h1>
      </div>
      <div className="panel quiz-results" role="status">
        <h2>Results</h2>
        <p className="quiz-score"><strong>{result.score}%</strong> <span>{result.correctAnswers} / {result.totalQuestions} correct</span></p>
        <p>{result.passed ? "You passed this quiz. Nice work!" : `You need ${quiz.passingPercentage ?? 70}% to pass. Try again to improve.`}</p>
        <button className="button button-dark" type="button" onClick={() => { setStarted(false); setCurrentIndex(0); setAnswers({}); setResult(null); }}>Retry quiz</button>
      </div>
    </main>;
  }

  if (!started) {
    return <main className="content-page section">
      <Link className="back-link" to="/courses"><ArrowLeft size={16} /> Back to lessons</Link>
      <div className="lesson-heading">
        <span className="eyebrow">Quiz</span>
        <h1>{quiz.title}</h1>
        <p>{quiz.description || "Test your understanding with a short quiz."}</p>
      </div>
      <div className="panel quiz-intro">
        <p>{questions.length} questions · {quiz.passingPercentage ?? 70}% pass mark · {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : "No time limit"}</p>
        {quiz.instructions && <p>{quiz.instructions}</p>}
        {questions.length ? <button className="button button-dark" type="button" onClick={() => { setError(""); setStarted(true); }}><Rocket size={16} /> Start quiz</button> : <p className="empty-message">This quiz doesn't have any questions yet.</p>}
      </div>
    </main>;
  }

  if (!currentQuestion) {
    return <div className="page-state">No questions are available for this quiz.</div>;
  }

  const options = getQuestionOptions(currentQuestion);
  const selectedValue = answers[currentQuestion.id];

  return <main className="content-page section quiz-page">
    <div className="lesson-heading">
      <span className="eyebrow">Question {currentIndex + 1} / {questions.length}</span>
      <h1>{quiz.title}</h1>
      <div className="progress-bar" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={currentIndex + 1}><span style={{ width: `${progress}%` }} /></div>
    </div>
    <div className="panel">
      <p className="quiz-prompt">{currentQuestion.prompt}</p>
      {currentQuestion.codeSnippet && <pre className="code-block">{currentQuestion.codeSnippet}</pre>}
      {currentQuestion.mediaUrl && /^https?:\/\//i.test(currentQuestion.mediaUrl) && <img className="quiz-media" src={currentQuestion.mediaUrl} alt="Question illustration" />}
      {currentQuestion.type === "SINGLE_CHOICE" && options.map((option, index) => (
        <label key={`${currentQuestion.id}-${index}`} className={`choice-row${selectedValue === index ? " selected" : ""}`}>
          <input type="radio" name={currentQuestion.id} checked={selectedValue === index} onChange={() => setQuestionAnswer(index)} />
          <span><b>{String.fromCharCode(65 + index)}</b>{option}</span>
        </label>
      ))}
      {currentQuestion.type === "MULTIPLE_CHOICE" && options.map((option, index) => {
        const chosen = Array.isArray(selectedValue) ? selectedValue : [];
        return <label key={`${currentQuestion.id}-${index}`} className={`choice-row${chosen.includes(index) ? " selected" : ""}`}>
          <input type="checkbox" checked={chosen.includes(index)} onChange={() => {
            const values = new Set(Array.isArray(selectedValue) ? selectedValue : []);
            if (values.has(index)) values.delete(index); else values.add(index);
            setQuestionAnswer(Array.from(values));
          }} />
          <span><b>{String.fromCharCode(65 + index)}</b>{option}</span>
        </label>;
      })}
      {currentQuestion.type === "TRUE_FALSE" && [
        { label: "True", value: true },
        { label: "False", value: false },
      ].map((choice) => (
        <label key={String(choice.value)} className={`choice-row${selectedValue === choice.value ? " selected" : ""}`}>
          <input type="radio" name={currentQuestion.id} checked={selectedValue === choice.value} onChange={() => setQuestionAnswer(choice.value)} />
          <span><b>{choice.label === "True" ? "T" : "F"}</b>{choice.label}</span>
        </label>
      ))}
      {currentQuestion.type === "FILL_BLANK" && <input className="text-input" type="text" value={typeof selectedValue === "string" ? selectedValue : ""} onChange={(event) => setQuestionAnswer(event.target.value)} placeholder="Type your answer" />}
      {currentQuestion.type === "CODE" && <textarea className="text-input" value={typeof selectedValue === "string" ? selectedValue : ""} onChange={(event) => setQuestionAnswer(event.target.value)} rows={6} placeholder="Write your answer here" />}
      {currentQuestion.hint && <div className="hint-box"><strong>Hint:</strong> {currentQuestion.hint}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="quiz-actions">
        <button className="button button-light" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}>Previous</button>
        {currentIndex < questions.length - 1 ? <button className="button button-dark" type="button" onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}>Next</button> : <button className="button button-dark" type="button" disabled={submitting} onClick={handleSubmit}>{submitting ? "Submitting…" : "Submit quiz"}</button>}
      </div>
    </div>
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
  return <main className="content-page section"><Link className="back-link" to={`/courses/${lesson.module.courseId}`}><ArrowLeft size={16} /> Back to course</Link><div className="lesson-heading"><span className="eyebrow">{lesson.module.title}</span><h1>{lesson.title}</h1><p>{lesson.durationMinutes ?? 0} minute lesson</p></div>{embedUrl && <div className="lesson-video"><iframe src={embedUrl} title={`${lesson.title} video lesson`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}{lesson.youtubeUrl && <p className="video-fallback"><a href={lesson.youtubeUrl} target="_blank" rel="noreferrer">Open video on YouTube</a></p>}<article className="lesson-content">{lesson.content ? <p>{lesson.content}</p> : <p>Lesson content is being prepared. Come back soon.</p>}</article>{lesson.quizzes?.length ? <section className="quiz-panel"><h2>Lesson practice quiz</h2>{lesson.quizzes.map((quiz) => <div className="panel" key={quiz.id}><h3>{quiz.title}</h3><p>{quiz.description || "Short quiz"}</p><p>{quiz.questions?.length ?? 0} questions · {quiz.passingPercentage ?? 70}% pass mark</p><Link className="button button-dark" to={`/quizzes/${quiz.id}`}>Start quiz</Link></div>)}</section> : null}<div className="page-state">Practice activities and lesson completion tracking are part of the learning roadmap.</div></main>;
}
