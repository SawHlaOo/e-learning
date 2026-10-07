import { ArrowLeft, ArrowRight, CalendarDays, ExternalLink, UserRound } from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { UpcomingClassCard } from "../components/UpcomingClassCard";
import { upcomingClassService } from "../services/upcomingClassService";
import type { UpcomingClass } from "../types";
import { formatClassSchedule, getClassStatus } from "../utils/upcomingClass";

function BackLink({ fallback = "/classes" }: { fallback?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  return <button className="class-back-button" type="button" onClick={() => { if (location.key === "default") navigate(fallback); else navigate(-1); }}><ArrowLeft size={17} /> Back</button>;
}

export function ClassesPage() {
  const [classes, setClasses] = useState<UpcomingClass[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    upcomingClassService.upcoming(1, 12)
      .then((result) => {
        if (!active) return;
        setClasses(result.items);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Classes could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    setError("");
    try {
      const result = await upcomingClassService.upcoming(page + 1, 12);
      setClasses((current) => [...current, ...result.items]);
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "More classes could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }

  return <main className="classes-page section">
    <BackLink fallback="/" />
    <div className="classes-page-heading"><span className="eyebrow">LEARN TOGETHER</span><h1>Upcoming <span>classes.</span></h1><p>Join a live class and learn alongside your community.</p></div>
    {loading ? <div className="page-state" role="status">Loading classes…</div>
      : error && !classes.length ? <div className="class-page-state" role="alert"><strong>Classes aren’t available right now.</strong><span>{error}</span><button className="button button-dark" onClick={() => window.location.reload()}>Try again</button></div>
        : classes.length ? <>
          <div className="upcoming-classes-grid">{classes.map((item) => <UpcomingClassCard key={item.id} upcomingClass={item} />)}</div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {page < totalPages && <button className="button button-light classes-load-more" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Loading…" : "Load more classes"} <ArrowRight size={16} /></button>}
        </> : <div className="upcoming-classes-empty"><CalendarDays size={24} /><strong>No upcoming classes at the moment.</strong><span>Check back soon for new classes.</span></div>}
  </main>;
}

export function ClassDetailPage() {
  const { id = "" } = useParams();
  const [upcomingClass, setUpcomingClass] = useState<UpcomingClass | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setNotFound(false);
    upcomingClassService.get(id)
      .then((item) => { if (active) setUpcomingClass(item); })
      .catch((cause: unknown) => {
        if (!active) return;
        if (axios.isAxiosError(cause) && cause.response?.status === 404) setNotFound(true);
        else setError(cause instanceof Error ? cause.message : "This class could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [id, retry]);

  if (loading) return <main className="class-detail-page section"><BackLink /><div className="page-state" role="status">Loading class…</div></main>;
  if (notFound) return <main className="class-detail-page section"><BackLink /><div className="class-page-state"><strong>Class not found.</strong><span>This class may have been removed or is not available.</span><Link className="button button-dark" to="/classes">Browse classes</Link></div></main>;
  if (error || !upcomingClass) return <main className="class-detail-page section"><BackLink /><div className="class-page-state" role="alert"><strong>We couldn’t load this class.</strong><span>{error || "Please try again later."}</span><button className="button button-dark" onClick={() => setRetry((count) => count + 1)}>Try again</button></div></main>;

  const status = getClassStatus(upcomingClass, now);
  const canJoin = status === "LIVE" && Boolean(upcomingClass.meetingUrl);

  return <main className="class-detail-page section">
    <BackLink />
    <article className="class-detail-card">
      {upcomingClass.thumbnail && <img className="class-detail-image" src={upcomingClass.thumbnail} alt="" />}
      <div className="class-detail-content">
        <div className="class-detail-kicker"><span className={`upcoming-class-status status-${status.toLowerCase()}`}>{status.toLowerCase()}</span>{upcomingClass.course && <span>{upcomingClass.course.title}</span>}</div>
        <h1>{upcomingClass.title}</h1>
        <p className="class-detail-description">{upcomingClass.description}</p>
        <div className="class-detail-meta">
          <span><CalendarDays size={18} /><span><strong>Weekly schedule</strong><small>{formatClassSchedule(upcomingClass.daysOfWeek, upcomingClass.startDate, upcomingClass.endDate, upcomingClass.startTime, upcomingClass.endTime)}</small></span></span>
          <span><UserRound size={18} /><span><strong>{upcomingClass.instructorName}</strong><small>Instructor</small></span></span>
        </div>
        {upcomingClass.notes && <div className="class-detail-notes"><h2>Before you join</h2><p>{upcomingClass.notes}</p></div>}
        {status === "CANCELLED" && <p className="class-cancelled-message" role="status">This class has been cancelled.</p>}
        {status === "COMPLETED" && <p className="class-completed-message" role="status">This class has ended.</p>}
        {status === "LIVE" && !upcomingClass.meetingUrl && <p className="class-completed-message" role="status">The instructor hasn’t added a meeting link yet.</p>}
        {canJoin && <a className="button button-dark class-join-button" href={upcomingClass.meetingUrl ?? undefined} target="_blank" rel="noopener noreferrer">Join live class <ExternalLink size={17} /></a>}
      </div>
    </article>
  </main>;
}
