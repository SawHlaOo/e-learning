import { ArrowLeft, CalendarDays, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { adminService, type CourseAdminSummary } from "../services/adminService";
import { upcomingClassService, type UpcomingClassFilters, type UpcomingClassInput } from "../services/upcomingClassService";
import type { UpcomingClass, UpcomingClassStatus } from "../types";
import { formatClassSchedule } from "../utils/upcomingClass";

type ClassDraft = UpcomingClassInput & { startDate: string; endDate: string };
const weekDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const blankDraft: ClassDraft = {
  title: "",
  description: "",
  thumbnail: "",
  instructorName: "",
  daysOfWeek: [],
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  courseId: "",
  meetingUrl: "",
  meetingPlatform: "",
  maxParticipants: null,
  notes: "",
  status: "DRAFT",
};
const statuses: UpcomingClassStatus[] = ["DRAFT", "UPCOMING", "LIVE", "COMPLETED", "CANCELLED"];
const messageFor = (cause: unknown) => cause instanceof Error ? cause.message : "The class request failed.";

export function AdminClassesPage() {
  const [classes, setClasses] = useState<UpcomingClass[]>([]);
  const [courses, setCourses] = useState<CourseAdminSummary[]>([]);
  const [draft, setDraft] = useState<ClassDraft>(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UpcomingClassStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadClasses(filters: UpcomingClassFilters = {}) {
    const result = await upcomingClassService.list({ ...filters, page });
    setClasses(result.items);
    setTotalPages(result.pagination.totalPages);
  }

  useEffect(() => {
    adminService.courses()
      .then((courseItems) => setCourses(courseItems))
      .catch((cause: unknown) => setError(messageFor(cause)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    upcomingClassService.list({ search: search.trim() || undefined, status: statusFilter || undefined, from: from || undefined, to: to || undefined, sort, page })
      .then((result) => {
        if (!active) return;
        setClasses(result.items);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((cause: unknown) => { if (active) setError(messageFor(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, statusFilter, from, to, sort, page]);

  function startNew() {
    setEditingId(null);
    setDraft({ ...blankDraft });
    setError("");
    setNotice("");
  }

  function editClass(item: UpcomingClass) {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      description: item.description,
      thumbnail: item.thumbnail ?? "",
      instructorName: item.instructorName,
      daysOfWeek: item.daysOfWeek,
      startDate: item.startDate ?? "",
      endDate: item.endDate ?? "",
      startTime: item.startTime ?? "",
      endTime: item.endTime ?? "",
      courseId: item.courseId ?? "",
      meetingUrl: item.meetingUrl ?? "",
      meetingPlatform: item.meetingPlatform ?? "",
      maxParticipants: item.maxParticipants,
      notes: item.notes ?? "",
      status: item.status,
    });
    setError("");
    setNotice("");
    document.getElementById("class-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const input: UpcomingClassInput = {
        ...draft,
        thumbnail: draft.thumbnail?.trim() || null,
        courseId: draft.courseId || null,
        meetingUrl: draft.meetingUrl?.trim() || null,
        meetingPlatform: draft.meetingPlatform?.trim() || null,
        maxParticipants: draft.maxParticipants ? Number(draft.maxParticipants) : null,
        notes: draft.notes?.trim() || null,
      };
      if (editingId) await upcomingClassService.update(editingId, input);
      else await upcomingClassService.create(input);
      setNotice(editingId ? "Class updated." : "Class created.");
      startNew();
      await loadClasses({ search: search.trim() || undefined, status: statusFilter || undefined, from: from || undefined, to: to || undefined, sort });
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setSaving(false);
    }
  }

  async function removeClass(item: UpcomingClass) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      await upcomingClassService.delete(item.id);
      if (editingId === item.id) startNew();
      setNotice("Class deleted.");
      await loadClasses({ search: search.trim() || undefined, status: statusFilter || undefined, from: from || undefined, to: to || undefined, sort });
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  const change = <K extends keyof ClassDraft>(key: K, value: ClassDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return <main className="content-page section dashboard-page admin-classes-page">
    <Link className="class-back-button" to="/admin"><ArrowLeft size={17} /> Admin dashboard</Link>
    <div className="eyebrow">PYPATH ADMINISTRATION</div><h1>Upcoming <span>classes.</span></h1><p className="content-intro">Schedule and manage instructor-led classes for learners.</p>
    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="admin-notice" role="status">{notice}</div>}
    <section className="admin-editor-card class-filter-card" aria-label="Filter classes">
      <div className="class-filter-grid">
        <label className="admin-field">Search<input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Class, description, instructor" /></label>
        <label className="admin-field">Status<select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value as UpcomingClassStatus | ""); }}><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="admin-field">From date<input type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value); }} /></label>
        <label className="admin-field">To date<input type="date" value={to} onChange={(event) => { setPage(1); setTo(event.target.value); }} /></label>
        <label className="admin-field">Sort by date<select value={sort} onChange={(event) => setSort(event.target.value as "asc" | "desc")}><option value="asc">Earliest first</option><option value="desc">Latest first</option></select></label>
      </div>
    </section>
    <div className="admin-course-layout upcoming-admin-layout">
      <section className="admin-course-list">
        <div className="admin-course-list-heading"><h2>Classes</h2><button className="button button-dark" onClick={startNew}><Plus size={16} /> New class</button></div>
        {loading ? <div className="page-state">Loading classes…</div> : classes.length ? classes.map((item) => <article className="upcoming-admin-row" key={item.id}>
          <div><span className={`upcoming-class-status status-${item.status.toLowerCase()}`}>{item.status.toLowerCase()}</span><strong>{item.title}</strong><small><CalendarDays size={13} /> {formatClassSchedule(item.daysOfWeek, item.startDate, item.endDate, item.startTime, item.endTime)}</small></div>
          <div className="admin-row-actions"><button className="icon-action" aria-label={`Edit ${item.title}`} onClick={() => editClass(item)}><Pencil size={15} /></button><button className="icon-action danger-action" aria-label={`Delete ${item.title}`} onClick={() => void removeClass(item)}><Trash2 size={15} /></button></div>
        </article>) : <p className="muted">No classes match these filters.</p>}
        <div className="class-pagination"><button className="button button-light" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="button button-light" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
      </section>
      <form className="admin-editor-card admin-course-editor" id="class-editor" onSubmit={(event) => void saveClass(event)}>
        <div className="admin-editor-title"><CalendarDays size={19} /><h2>{editingId ? "Edit class" : "Create a class"}</h2>{editingId && <button className="icon-action" type="button" aria-label="Cancel editing" onClick={startNew}><X size={15} /></button>}</div>
        <div className="admin-form-grid">
          <label className="admin-field full-field">Title<input required maxLength={140} value={draft.title} onChange={(event) => change("title", event.target.value)} /></label>
          <label className="admin-field full-field">Description<textarea required rows={3} maxLength={5000} value={draft.description} onChange={(event) => change("description", event.target.value)} /></label>
          <label className="admin-field">Instructor<input required maxLength={160} value={draft.instructorName} onChange={(event) => change("instructorName", event.target.value)} placeholder="Instructor name" /></label>
          <fieldset className="admin-field full-field"><legend>Teaching days</legend><div className="admin-checkboxes">{weekDays.map((day) => <label key={day}><input type="checkbox" checked={draft.daysOfWeek.includes(day)} onChange={(event) => change("daysOfWeek", event.target.checked ? [...draft.daysOfWeek, day] : draft.daysOfWeek.filter((value) => value !== day))} /> {day[0] + day.slice(1).toLowerCase()}</label>)}</div></fieldset>
          <label className="admin-field">From date<input required type="date" value={draft.startDate} onChange={(event) => change("startDate", event.target.value)} /></label>
          <label className="admin-field">To date<input required type="date" value={draft.endDate} onChange={(event) => change("endDate", event.target.value)} /></label>
          <label className="admin-field">From time<input required type="time" value={draft.startTime} onChange={(event) => change("startTime", event.target.value)} /></label>
          <label className="admin-field">To time<input required type="time" value={draft.endTime} onChange={(event) => change("endTime", event.target.value)} /></label>
          <label className="admin-field">Related course<select value={draft.courseId ?? ""} onChange={(event) => change("courseId", event.target.value)}><option value="">No course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <label className="admin-field">Status<select value={draft.status} onChange={(event) => change("status", event.target.value as UpcomingClassStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="admin-field">Maximum participants<input type="number" min="1" value={draft.maxParticipants ?? ""} onChange={(event) => change("maxParticipants", event.target.value ? Number(event.target.value) : null)} /></label>
          <label className="admin-field full-field">Thumbnail URL<input type="url" value={draft.thumbnail ?? ""} onChange={(event) => change("thumbnail", event.target.value)} /></label>
          <label className="admin-field">Meeting platform<input maxLength={60} value={draft.meetingPlatform ?? ""} onChange={(event) => change("meetingPlatform", event.target.value)} placeholder="Zoom, Google Meet…" /></label>
          <label className="admin-field">Meeting URL<input type="url" value={draft.meetingUrl ?? ""} onChange={(event) => change("meetingUrl", event.target.value)} /></label>
          <label className="admin-field full-field">Learner notes<textarea rows={3} value={draft.notes ?? ""} onChange={(event) => change("notes", event.target.value)} /></label>
        </div>
        <div className="class-editor-actions"><button className="button button-dark" type="submit" disabled={saving}><Save size={16} /> {saving ? "Saving…" : editingId ? "Save changes" : "Create class"}</button><button className="button button-light" type="button" onClick={startNew}>Clear</button></div>
      </form>
    </div>
  </main>;
}
