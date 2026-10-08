import { ArrowLeft, CalendarDays, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { adminService, type CourseAdminSummary } from "../services/adminService";
import { upcomingClassService, type UpcomingClassFilters, type UpcomingClassInput } from "../services/upcomingClassService";
import type { UpcomingClass, UpcomingClassStatus } from "../types";
import { classStatusLabel, formatClassSchedule } from "../utils/upcomingClass";

type ClassDraft = UpcomingClassInput & { startDate: string; endDate: string };
type ClassField = keyof ClassDraft;
type FieldErrors = Partial<Record<ClassField, string>>;
const weekDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const optionalFields: ClassField[] = ["instructorId", "thumbnail", "courseId", "meetingUrl", "meetingPlatform", "maxParticipants", "notes"];

const blankDraft: ClassDraft = {
  title: "",
  description: "",
  thumbnail: "",
  instructorName: "",
  instructorId: null,
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

function validateDraft(draft: ClassDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (draft.title.trim().length < 2) errors.title = "Enter a title with at least 2 characters.";
  if (!draft.description.trim()) errors.description = "Enter a class description.";
  if (draft.instructorName.trim().length < 2) errors.instructorName = "Enter the instructor’s name.";
  if (!draft.daysOfWeek.length) errors.daysOfWeek = "Select at least one teaching day.";
  if (!draft.startDate) errors.startDate = "Choose a start date.";
  if (!draft.endDate) errors.endDate = "Choose an end date.";
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) errors.endDate = "End date must be on or after the start date.";
  if (!draft.startTime) errors.startTime = "Choose a start time.";
  if (!draft.endTime) errors.endTime = "Choose an end time.";
  if (draft.startTime && draft.endTime && draft.endTime <= draft.startTime) {
    errors.endTime = "End time must be after start time.";
  }
  for (const field of ["thumbnail", "meetingUrl"] as const) {
    const value = draft[field]?.trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    } catch {
      errors[field] = "Enter a valid HTTP or HTTPS URL.";
    }
  }
  if (draft.maxParticipants != null && (!Number.isInteger(draft.maxParticipants) || draft.maxParticipants < 1)) {
    errors.maxParticipants = "Enter a whole number greater than zero.";
  }
  if (draft.meetingPlatform && draft.meetingPlatform.length > 80) errors.meetingPlatform = "Use 80 characters or fewer.";
  if (draft.notes && draft.notes.length > 10000) errors.notes = "Use 10,000 characters or fewer.";
  return errors;
}

function readServerFieldErrors(cause: unknown): FieldErrors | undefined {
  if (!axios.isAxiosError(cause)) return undefined;
  const data: unknown = cause.response?.data;
  if (typeof data !== "object" || data === null || !("errors" in data)) return undefined;
  const details = data.errors;
  if (typeof details !== "object" || details === null) return undefined;
  const fieldErrors: FieldErrors = {};
  for (const key of Object.keys(details) as ClassField[]) {
    if (!Object.prototype.hasOwnProperty.call(blankDraft, key)) continue;
    const messages = (details as Record<string, unknown>)[key];
    if (Array.isArray(messages) && typeof messages[0] === "string") fieldErrors[key] = messages[0];
  }
  return Object.keys(fieldErrors).length ? fieldErrors : undefined;
}

function fromClass(item: UpcomingClass): ClassDraft {
  return {
    title: item.title,
    description: item.description,
    thumbnail: item.thumbnail ?? "",
    instructorName: item.instructorName,
    instructorId: item.instructorId,
    daysOfWeek: [...item.daysOfWeek],
    startDate: item.startDate?.slice(0, 10) ?? "",
    endDate: item.endDate?.slice(0, 10) ?? "",
    startTime: item.startTime ?? "",
    endTime: item.endTime ?? "",
    courseId: item.courseId ?? "",
    meetingUrl: item.meetingUrl ?? "",
    meetingPlatform: item.meetingPlatform ?? "",
    maxParticipants: item.maxParticipants,
    notes: item.notes ?? "",
    status: item.status,
  };
}

export function AdminClassesPage() {
  const [classes, setClasses] = useState<UpcomingClass[]>([]);
  const [courses, setCourses] = useState<CourseAdminSummary[]>([]);
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string; role: string; isActive: boolean }>>([]);
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const originalDraft = useRef<ClassDraft | null>(null);

  async function loadClasses(filters: UpcomingClassFilters = {}) {
    let result = await upcomingClassService.list({ ...filters, page });
    if (!result.items.length && page > 1) {
      const previousPage = page - 1;
      result = await upcomingClassService.list({ ...filters, page: previousPage });
      setPage(previousPage);
    }
    setClasses(result.items);
    setTotalPages(result.pagination.totalPages);
  }

  useEffect(() => {
    Promise.all([adminService.courses(), upcomingClassService.instructors()])
      .then(([courseItems, userItems]) => {
        setCourses(courseItems);
        setInstructors(userItems.filter((user) => user.role === "INSTRUCTOR" && user.isActive));
      })
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
    originalDraft.current = null;
    setFieldErrors({});
    setError("");
    setNotice("");
  }

  async function editClass(item: UpcomingClass) {
    setError("");
    setNotice("");
    setFieldErrors({});
    try {
      const saved = await upcomingClassService.getAdmin(item.id);
      const draftValue = fromClass(saved);
      originalDraft.current = draftValue;
      setEditingId(item.id);
      setDraft(draftValue);
    } catch (cause) {
      setError(messageFor(cause));
      return;
    }
    document.getElementById("class-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateDraft(draft);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      setError("Please correct the highlighted fields.");
      return;
    }
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
      if (editingId && originalDraft.current) {
        const changed: Partial<UpcomingClassInput> = {};
        for (const key of Object.keys(input) as ClassField[]) {
          const value = input[key];
          const original = originalDraft.current[key];
          if (JSON.stringify(value) === JSON.stringify(original)) continue;
          if (optionalFields.includes(key) && (value === null || value === "")) continue;
          Object.assign(changed, { [key]: value });
        }
        if (Object.keys(changed).length) await upcomingClassService.update(editingId, changed);
      } else {
        await upcomingClassService.create(input);
      }
      const successMessage = editingId ? "Class updated." : "Class created.";
      startNew();
      setNotice(successMessage);
      await loadClasses({ search: search.trim() || undefined, status: statusFilter || undefined, from: from || undefined, to: to || undefined, sort });
    } catch (cause) {
      const serverFieldErrors = readServerFieldErrors(cause);
      if (serverFieldErrors) {
        setFieldErrors(serverFieldErrors);
        setError("Please correct the highlighted fields.");
      } else {
        setError(messageFor(cause));
      }
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

  const change = <K extends ClassField>(key: K, value: ClassDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setError("");
  };
  const fieldError = (field: ClassField) => fieldErrors[field] && <small className="class-field-error" role="alert">{fieldErrors[field]}</small>;
  const ariaInvalid = (field: ClassField) => fieldErrors[field] ? true : undefined;
  return <main className="content-page section dashboard-page admin-classes-page">
    <Link className="class-back-button" to="/admin"><ArrowLeft size={17} /> Admin dashboard</Link>
    <div className="eyebrow">PYPATH ADMINISTRATION</div><h1>Manage <span>classes.</span></h1><p className="content-intro">Create and manage all instructor-led classes, including upcoming, live, completed, and cancelled classes.</p>
    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="admin-notice" role="status">{notice}</div>}
    <section className="admin-editor-card class-filter-card" aria-label="Filter classes">
      <div className="class-filter-grid">
        <label className="admin-field">Search<input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Class, description, instructor" /></label>
        <label className="admin-field">Status<select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value as UpcomingClassStatus | ""); }}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{classStatusLabel(status)}</option>)}</select></label>
        <label className="admin-field">From date<input type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value); }} /></label>
        <label className="admin-field">To date<input type="date" value={to} onChange={(event) => { setPage(1); setTo(event.target.value); }} /></label>
        <label className="admin-field">Sort by date<select value={sort} onChange={(event) => setSort(event.target.value as "asc" | "desc")}><option value="asc">Earliest first</option><option value="desc">Latest first</option></select></label>
      </div>
    </section>
    <div className="admin-course-layout upcoming-admin-layout">
      <section className="admin-course-list">
        <div className="admin-course-list-heading"><h2>Classes</h2><button className="button button-dark" onClick={startNew}><Plus size={16} /> New class</button></div>
        {loading ? <div className="page-state">Loading classes…</div> : classes.length ? classes.map((item) => <article className="upcoming-admin-row" key={item.id}>
          <div><span className={`upcoming-class-status status-${item.status.toLowerCase()}`}>{classStatusLabel(item.status)}</span><strong>{item.title}</strong><small><CalendarDays size={13} /> {formatClassSchedule(item.daysOfWeek, item.startDate, item.endDate, item.startTime, item.endTime)}</small></div>
          <div className="admin-row-actions"><button className="icon-action" aria-label={`Edit ${item.title}`} onClick={() => editClass(item)}><Pencil size={15} /></button><button className="icon-action danger-action" aria-label={`Delete ${item.title}`} onClick={() => void removeClass(item)}><Trash2 size={15} /></button></div>
        </article>) : <p className="muted">No classes match these filters.</p>}
        <div className="class-pagination"><button className="button button-light" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="button button-light" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
      </section>
      <form className="admin-editor-card admin-course-editor" id="class-editor" noValidate onSubmit={(event) => void saveClass(event)}>
        <div className="admin-editor-title"><CalendarDays size={19} /><h2>{editingId ? "Edit class" : "Create a class"}</h2>{editingId && <button className="icon-action" type="button" aria-label="Cancel editing" onClick={startNew}><X size={15} /></button>}</div>
        <div className="admin-form-grid">
          <label className="admin-field full-field">Title<input required maxLength={160} aria-invalid={ariaInvalid("title")} value={draft.title} onChange={(event) => change("title", event.target.value)} />{fieldError("title")}</label>
          <label className="admin-field full-field">Description<textarea required rows={3} maxLength={10000} aria-invalid={ariaInvalid("description")} value={draft.description} onChange={(event) => change("description", event.target.value)} />{fieldError("description")}</label>
          <label className="admin-field">Instructor<input required maxLength={160} aria-invalid={ariaInvalid("instructorName")} value={draft.instructorName} onChange={(event) => change("instructorName", event.target.value)} placeholder="Instructor name" />{fieldError("instructorName")}</label>
          <label className="admin-field">Link instructor account<select value={draft.instructorId ?? ""} onChange={(event) => {
            const selectedInstructor = instructors.find((instructor) => instructor.id === event.target.value);
            change("instructorId", selectedInstructor?.id ?? null);
            if (selectedInstructor) change("instructorName", selectedInstructor.name);
          }}><option value="">No linked account</option>{instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.name}</option>)}</select></label>
          <fieldset className="admin-field full-field" aria-invalid={ariaInvalid("daysOfWeek")}><legend>Teaching days</legend><div className="admin-checkboxes">{weekDays.map((day) => <label key={day}><input type="checkbox" checked={draft.daysOfWeek.includes(day)} onChange={(event) => change("daysOfWeek", event.target.checked ? [...draft.daysOfWeek, day] : draft.daysOfWeek.filter((value) => value !== day))} /> {day[0] + day.slice(1).toLowerCase()}</label>)}</div>{fieldError("daysOfWeek")}</fieldset>
          <label className="admin-field">From date<input required type="date" aria-invalid={ariaInvalid("startDate")} value={draft.startDate} onChange={(event) => change("startDate", event.target.value)} />{fieldError("startDate")}</label>
          <label className="admin-field">To date<input required type="date" aria-invalid={ariaInvalid("endDate")} value={draft.endDate} onChange={(event) => change("endDate", event.target.value)} />{fieldError("endDate")}</label>
          <label className="admin-field">From time<input required type="time" aria-invalid={ariaInvalid("startTime")} value={draft.startTime} onChange={(event) => change("startTime", event.target.value)} />{fieldError("startTime")}</label>
          <label className="admin-field">To time<input required type="time" aria-invalid={ariaInvalid("endTime")} value={draft.endTime} onChange={(event) => change("endTime", event.target.value)} />{fieldError("endTime")}</label>
          <label className="admin-field">Related course<select value={draft.courseId ?? ""} onChange={(event) => change("courseId", event.target.value)}><option value="">No course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <label className="admin-field">Status<select value={draft.status} onChange={(event) => change("status", event.target.value as UpcomingClassStatus)}>{statuses.map((status) => <option key={status} value={status}>{classStatusLabel(status)}</option>)}</select></label>
          <label className="admin-field">Maximum participants<input type="number" min="1" aria-invalid={ariaInvalid("maxParticipants")} value={draft.maxParticipants ?? ""} onChange={(event) => change("maxParticipants", event.target.value ? Number(event.target.value) : null)} />{fieldError("maxParticipants")}</label>
          <label className="admin-field full-field">Thumbnail URL<input type="url" aria-invalid={ariaInvalid("thumbnail")} value={draft.thumbnail ?? ""} onChange={(event) => change("thumbnail", event.target.value)} />{fieldError("thumbnail")}</label>
          <label className="admin-field">Meeting platform<input maxLength={80} aria-invalid={ariaInvalid("meetingPlatform")} value={draft.meetingPlatform ?? ""} onChange={(event) => change("meetingPlatform", event.target.value)} placeholder="Zoom, Google Meet…" />{fieldError("meetingPlatform")}</label>
          <label className="admin-field">Meeting URL<input type="url" aria-invalid={ariaInvalid("meetingUrl")} value={draft.meetingUrl ?? ""} onChange={(event) => change("meetingUrl", event.target.value)} />{fieldError("meetingUrl")}</label>
          <label className="admin-field full-field">Learner notes<textarea rows={3} maxLength={10000} aria-invalid={ariaInvalid("notes")} value={draft.notes ?? ""} onChange={(event) => change("notes", event.target.value)} />{fieldError("notes")}</label>
        </div>
        <div className="class-editor-actions"><button className="button button-dark" type="submit" disabled={saving}><Save size={16} /> {saving ? "Saving…" : editingId ? "Save changes" : "Create class"}</button><button className="button button-light" type="button" onClick={startNew}>Clear</button></div>
      </form>
    </div>
  </main>;
}
