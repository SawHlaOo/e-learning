import { ArrowLeft, BookOpen, Plus, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Course } from "../types";
import { adminService, type CourseAdminSummary, type ManagedCourse, type ManagedLesson, type ManagedModule } from "../services/adminService";
import { courseService, type CourseInput } from "../services/courseService";
import { lessonService, type LessonInput } from "../services/lessonService";
import { moduleService, type ModuleInput } from "../services/moduleService";

const emptyCourse: CourseInput = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  thumbnail: "",
  level: "EASY",
  estimatedHours: 0,
  published: false,
  featured: false,
};

const emptyModule = { title: "", description: "", order: 1 };
const emptyLesson = {
  title: "",
  slug: "",
  content: "",
  order: 1,
  published: true,
  durationMinutes: 10,
  youtubeUrl: "",
};

function slugify(value: string, fallback: "course" | "lesson" = "course", minimumLength = 3) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!slug) return fallback;
  return slug.length < minimumLength ? `${slug}-${fallback}` : slug;
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "The change could not be saved.";
}

function nextOrder(items: Array<{ order: number }>) {
  return items.reduce((maxOrder, item) => Math.max(maxOrder, item.order), 0) + 1;
}

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseAdminSummary[]>([]);
  const [selected, setSelected] = useState<ManagedCourse | null>(null);
  const [courseDraft, setCourseDraft] = useState<CourseInput>(emptyCourse);
  const [moduleDraft, setModuleDraft] = useState(emptyModule);
  const [lessonDraft, setLessonDraft] = useState(emptyLesson);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [activeLessonModule, setActiveLessonModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thumbnailImageFailed, setThumbnailImageFailed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshCourses = useCallback(async () => {
    const items = await adminService.courses();
    setCourses(items);
    return items;
  }, []);

  const refreshSelected = useCallback(async (id: string) => {
    const course = await adminService.courseForEditing(id);
    setSelected(course);
    setCourseDraft({
      title: course.title,
      slug: course.slug,
      summary: course.summary ?? "",
      description: course.description,
      thumbnail: course.thumbnail ?? "",
      level: course.level,
      estimatedHours: course.estimatedHours ?? 0,
      published: course.published ?? false,
      featured: course.featured ?? false,
    });
    setThumbnailImageFailed(false);
    setModuleDraft({ ...emptyModule, order: nextOrder(course.modules) });
    return course;
  }, []);

  useEffect(() => {
    refreshCourses()
      .catch((cause: unknown) => setError(messageFrom(cause)))
      .finally(() => setLoading(false));
  }, [refreshCourses]);

  async function selectCourse(course: CourseAdminSummary) {
    setError("");
    setNotice("");
    setEditingModule(null);
    setEditingLesson(null);
    setActiveLessonModule(null);
    try {
      await refreshSelected(course.id);
    } catch (cause) {
      setError(messageFrom(cause));
    }
  }

  function startNewCourse() {
    setSelected(null);
    setCourseDraft(emptyCourse);
    setThumbnailImageFailed(false);
    setModuleDraft(emptyModule);
    setLessonDraft(emptyLesson);
    setEditingModule(null);
    setEditingLesson(null);
    setActiveLessonModule(null);
    setError("");
    setNotice("");
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const saved = selected
        ? await courseService.update(selected.id, courseDraft)
        : await courseService.create(courseDraft);
      await refreshCourses();
      await refreshSelected(saved.id);
      setNotice(selected ? "Course updated." : "Course created.");
    } catch (cause) {
      setError(messageFrom(cause));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse(course: CourseAdminSummary) {
    if (!window.confirm(`Delete "${course.title}" and its modules and lessons?`)) return;
    setError("");
    try {
      await courseService.delete(course.id);
      setCourses((items) => items.filter((item) => item.id !== course.id));
      if (selected?.id === course.id) startNewCourse();
      setNotice("Course deleted.");
    } catch (cause) {
      setError(messageFrom(cause));
    }
  }

  async function saveModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const input: ModuleInput = { ...moduleDraft, courseId: selected.id };
      if (editingModule) await moduleService.update(editingModule, input);
      else await moduleService.create(input);
      await refreshSelected(selected.id);
      await refreshCourses();
      setEditingModule(null);
      setNotice(editingModule ? "Module updated." : "Module created.");
    } catch (cause) {
      setError(messageFrom(cause));
    } finally {
      setSaving(false);
    }
  }

  async function deleteModule(module: ManagedModule) {
    if (!selected || !window.confirm(`Delete "${module.title}" and all its lessons?`)) return;
    setError("");
    try {
      await moduleService.delete(module.id);
      await refreshSelected(selected.id);
      await refreshCourses();
      setNotice("Module deleted.");
    } catch (cause) {
      setError(messageFrom(cause));
    }
  }

  function editModule(module: ManagedModule) {
    setEditingModule(module.id);
    setModuleDraft({ title: module.title, description: module.description ?? "", order: module.order });
    setEditingLesson(null);
    setActiveLessonModule(null);
    setLessonDraft(emptyLesson);
  }

  function editLesson(lesson: ManagedLesson, module: ManagedModule) {
    setEditingLesson(lesson.id);
    setActiveLessonModule(module.id);
    setLessonDraft({
      title: lesson.title,
      slug: lesson.slug ?? "",
      content: lesson.content ?? "",
      order: lesson.order,
      published: lesson.published,
      durationMinutes: lesson.durationMinutes ?? 10,
      youtubeUrl: lesson.youtubeUrl ?? "",
    });
  }

  async function saveLesson(event: FormEvent<HTMLFormElement>, module: ManagedModule) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { youtubeUrl, ...lessonFields } = lessonDraft;
      const input: LessonInput = {
        ...lessonFields,
        slug: slugify(lessonDraft.slug || lessonDraft.title, "lesson", 2),
        moduleId: module.id,
        ...(youtubeUrl.trim() ? { youtubeUrl: youtubeUrl.trim() } : {}),
      };
      if (editingLesson) {
        const update: Partial<LessonInput> = {
          ...lessonFields,
          slug: slugify(lessonDraft.slug || lessonDraft.title, "lesson", 2),
          youtubeUrl: youtubeUrl.trim() || null,
        };
        await lessonService.update(editingLesson, update);
      } else {
        await lessonService.create(input);
      }
      const refreshedCourse = selected ? await refreshSelected(selected.id) : null;
      const refreshedModule = refreshedCourse?.modules.find((item) => item.id === module.id);
      setLessonDraft({ ...emptyLesson, order: nextOrder(refreshedModule?.lessons ?? module.lessons) });
      setEditingLesson(null);
      setActiveLessonModule(null);
      setNotice(editingLesson ? "Lesson updated." : "Lesson created.");
    } catch (cause) {
      setError(messageFrom(cause));
    } finally {
      setSaving(false);
    }
  }

  async function deleteLesson(lesson: ManagedLesson, module: ManagedModule) {
    if (!selected || !window.confirm(`Delete lesson "${lesson.title}"?`)) return;
    setError("");
    try {
      await lessonService.delete(lesson.id);
      const refreshedCourse = await refreshSelected(selected.id);
      if (editingLesson === lesson.id) {
        setEditingLesson(null);
        setActiveLessonModule(null);
        const refreshedModule = refreshedCourse.modules.find((item) => item.id === module.id);
        setLessonDraft({ ...emptyLesson, order: nextOrder(refreshedModule?.lessons ?? module.lessons) });
      }
      setNotice("Lesson deleted.");
    } catch (cause) {
      setError(messageFrom(cause));
    }
  }

  const courseField = <K extends keyof CourseInput>(key: K, value: CourseInput[K]) =>
    setCourseDraft((draft) => ({ ...draft, [key]: value }));
  const thumbnailPreview = courseDraft.thumbnail?.trim() ?? "";
  const isSafeImageUrl = (() => {
    if (!thumbnailPreview) return false;
    try {
      const url = new URL(thumbnailPreview);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  })();

  return (
    <main className="content-page section dashboard-page admin-course-page">
      <Link className="back-link" to="/admin"><ArrowLeft size={16} /> Admin dashboard</Link>
      <div className="eyebrow">PYPATH ADMINISTRATION</div>
      <h1>Course <span>studio.</span></h1>
      <p className="content-intro">Create courses, organize modules, and add lesson content and YouTube videos.</p>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="admin-notice" role="status">{notice}</div>}

      <div className="admin-course-layout">
        <aside className="admin-course-list">
          <div className="admin-course-list-heading">
            <h2>Courses</h2>
            <button className="button button-dark" type="button" onClick={startNewCourse}><Plus size={15} /> New</button>
          </div>
          {loading ? <p className="muted">Loading courses…</p> : courses.length ? courses.map((course) => (
            <div className={`admin-course-list-item${selected?.id === course.id ? " selected" : ""}`} key={course.id}>
              <button type="button" className="admin-course-select" onClick={() => void selectCourse(course)}>
                <strong>{course.title}</strong>
                <span>{course.published ? "Published" : "Draft"} · {course._count?.modules ?? 0} modules</span>
              </button>
              <button className="icon-action danger-action" type="button" aria-label={`Delete ${course.title}`} onClick={() => void deleteCourse(course)}><Trash2 size={15} /></button>
            </div>
          )) : <p className="muted">No courses yet. Create your first one.</p>}
        </aside>

        <section className="admin-course-editor">
          <form className="admin-editor-card" onSubmit={(event) => void saveCourse(event)}>
            <div className="admin-editor-title"><BookOpen size={19} /><h2>{selected ? "Course details" : "Create a course"}</h2></div>
            <div className="admin-form-grid">
              <label className="admin-field">Title
                <input required minLength={3} maxLength={120} value={courseDraft.title} onChange={(event) => {
                  const title = event.target.value;
                  setCourseDraft((draft) => ({ ...draft, title, slug: selected ? draft.slug : slugify(title) }));
                }} />
              </label>
              <label className="admin-field">URL slug
                <input required minLength={3} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={courseDraft.slug} onChange={(event) => courseField("slug", slugify(event.target.value))} />
              </label>
              <label className="admin-field">Level
                <select value={courseDraft.level} onChange={(event) => courseField("level", event.target.value as Course["level"])}>
                  <option value="EASY">Beginner</option><option value="MEDIUM">Intermediate</option><option value="HARD">Advanced</option>
                </select>
              </label>
              <label className="admin-field">Estimated hours
                <input type="number" min="0" max="10000" value={courseDraft.estimatedHours} onChange={(event) => courseField("estimatedHours", Number(event.target.value))} />
              </label>
              <label className="admin-field full-field">Short summary
                <input maxLength={500} value={courseDraft.summary} onChange={(event) => courseField("summary", event.target.value)} />
              </label>
              <label className="admin-field full-field">Thumbnail image URL
                <input type="url" placeholder="https://example.com/course-thumbnail.jpg" value={courseDraft.thumbnail} onChange={(event) => {
                  setThumbnailImageFailed(false);
                  courseField("thumbnail", event.target.value);
                }} />
                <span className="admin-field-hint">Use a publicly accessible HTTP or HTTPS image URL.</span>
              </label>
              {isSafeImageUrl && (
                <div className="admin-thumbnail-preview full-field">
                  <span>Thumbnail preview</span>
                  {thumbnailImageFailed
                    ? <span className="admin-thumbnail-error">Image could not be loaded. Check the URL and make sure it is publicly accessible.</span>
                    : <img src={thumbnailPreview} alt={`${courseDraft.title || "Course"} thumbnail preview`} onError={() => setThumbnailImageFailed(true)} />}
                </div>
              )}
              <label className="admin-field full-field">Description
                <textarea required rows={4} maxLength={20000} value={courseDraft.description} onChange={(event) => courseField("description", event.target.value)} />
              </label>
            </div>
            <div className="admin-checkboxes">
              <label><input type="checkbox" checked={courseDraft.published} onChange={(event) => courseField("published", event.target.checked)} /> Published</label>
              <label><input type="checkbox" checked={courseDraft.featured} onChange={(event) => courseField("featured", event.target.checked)} /> Featured on homepage</label>
            </div>
            <button className="button button-dark" type="submit" disabled={saving}><Save size={15} /> {saving ? "Saving…" : "Save course"}</button>
          </form>

          {selected && (
            <section className="admin-editor-card curriculum-editor">
              <div className="admin-editor-title"><BookOpen size={19} /><h2>Modules and lessons</h2></div>
              <p className="muted">Lessons are shown in the course curriculum. Add a YouTube URL to embed its video on that lesson’s page.</p>
              {selected.modules.map((module) => (
                <article className="module-panel admin-module-card" key={module.id}>
                  <div className="admin-module-heading">
                    <h3><span>{String(module.order).padStart(2, "0")}</span>{module.title}</h3>
                    <div className="admin-row-actions">
                      <button className="table-action" type="button" onClick={() => {
                        setEditingLesson(null);
                        setActiveLessonModule(module.id);
                        setLessonDraft({ ...emptyLesson, order: nextOrder(module.lessons) });
                      }}>Add lesson</button>
                      <button className="table-action" type="button" onClick={() => editModule(module)}>Edit</button>
                      <button className="icon-action danger-action" type="button" aria-label={`Delete ${module.title}`} onClick={() => void deleteModule(module)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  {module.description && <p className="module-description">{module.description}</p>}
                  {module.lessons.map((lesson) => (
                    <div className="admin-lesson-row" key={lesson.id}>
                      <div><strong>{lesson.order}. {lesson.title}</strong><span>{lesson.youtubeUrl ? "YouTube video added" : "No video"} · {lesson.published ? "Published" : "Draft"}</span></div>
                      <div className="admin-row-actions">
                        <button className="table-action" type="button" onClick={() => editLesson(lesson, module)}>Edit</button>
                        <button className="icon-action danger-action" type="button" aria-label={`Delete ${lesson.title}`} onClick={() => void deleteLesson(lesson, module)}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                  {activeLessonModule === module.id && <form className="admin-inline-form" onSubmit={(event) => void saveLesson(event, module)}>
                    <h4>{editingLesson ? "Edit lesson" : "Add a lesson"}</h4>
                    <div className="admin-form-grid">
                      <label className="admin-field">Lesson title
                        <input required minLength={2} value={lessonDraft.title} onChange={(event) => setLessonDraft((draft) => ({ ...draft, title: event.target.value, slug: editingLesson ? draft.slug : slugify(event.target.value, "lesson", 2) }))} />
                      </label>
                      <label className="admin-field">URL slug
                        <input required minLength={2} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={lessonDraft.slug} onChange={(event) => setLessonDraft((draft) => ({ ...draft, slug: slugify(event.target.value, "lesson", 2) }))} />
                      </label>
                      <label className="admin-field full-field">YouTube video URL
                        <input type="url" placeholder="https://www.youtube.com/watch?v=…" value={lessonDraft.youtubeUrl} onChange={(event) => setLessonDraft((draft) => ({ ...draft, youtubeUrl: event.target.value }))} />
                      </label>
                      <label className="admin-field full-field">Lesson content
                        <textarea rows={4} placeholder="Leave blank to use the standard lesson introduction." value={lessonDraft.content} onChange={(event) => setLessonDraft((draft) => ({ ...draft, content: event.target.value }))} />
                      </label>
                      <label className="admin-field">Order
                        <input type="number" min="1" value={lessonDraft.order} onChange={(event) => setLessonDraft((draft) => ({ ...draft, order: Number(event.target.value) }))} />
                      </label>
                      <label className="admin-field">Duration (minutes)
                        <input type="number" min="0" value={lessonDraft.durationMinutes} onChange={(event) => setLessonDraft((draft) => ({ ...draft, durationMinutes: Number(event.target.value) }))} />
                      </label>
                    </div>
                    <label className="admin-check"><input type="checkbox" checked={lessonDraft.published} onChange={(event) => setLessonDraft((draft) => ({ ...draft, published: event.target.checked }))} /> Publish lesson</label>
                    <div className="admin-row-actions">
                      <button className="button button-dark" type="submit" disabled={saving}><Save size={15} /> Save lesson</button>
                      {editingLesson && <button className="button button-light" type="button" onClick={() => { setEditingLesson(null); setActiveLessonModule(null); setLessonDraft(emptyLesson); }}><X size={15} /> Cancel</button>}
                    </div>
                  </form>}
                </article>
              ))}

              <form className="admin-inline-form module-form" onSubmit={(event) => void saveModule(event)}>
                <h4>{editingModule ? "Edit module" : "Add a module"}</h4>
                <div className="admin-form-grid">
                  <label className="admin-field">Module title
                    <input required minLength={2} value={moduleDraft.title} onChange={(event) => setModuleDraft((draft) => ({ ...draft, title: event.target.value }))} />
                  </label>
                  <label className="admin-field">Order
                    <input type="number" min="1" value={moduleDraft.order} onChange={(event) => setModuleDraft((draft) => ({ ...draft, order: Number(event.target.value) }))} />
                  </label>
                  <label className="admin-field full-field">Module description
                    <textarea rows={2} placeholder="Leave blank to use the standard module description." value={moduleDraft.description} onChange={(event) => setModuleDraft((draft) => ({ ...draft, description: event.target.value }))} />
                  </label>
                </div>
                <div className="admin-row-actions">
                  <button className="button button-dark" type="submit" disabled={saving}><Save size={15} /> Save module</button>
                  {editingModule && <button className="button button-light" type="button" onClick={() => { setEditingModule(null); setModuleDraft({ ...emptyModule, order: nextOrder(selected.modules) }); }}><X size={15} /> Cancel</button>}
                </div>
              </form>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
