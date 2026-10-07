import { ArrowLeft, ExternalLink, Link2, Plus, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { adminService, type CourseAdminSummary, type ManagedCourse, type ManagedLesson } from "../services/adminService";
import { learningResourceService, type LearningResourceInput } from "../services/learningResourceService";
import type { LearningResource, LearningResourceType } from "../types";

const resourceTypes: Array<{ value: LearningResourceType; label: string }> = [
  { value: "GITHUB", label: "GitHub" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "ARTICLE", label: "Article" },
  { value: "WEBSITE", label: "Website" },
  { value: "COURSE", label: "Course" },
  { value: "PDF", label: "PDF" },
  { value: "OTHER", label: "Other" },
];

type ResourceDraft = Omit<LearningResourceInput, "thumbnail"> & {
  thumbnail: string;
  courseId: string;
};

const emptyDraft: ResourceDraft = {
  title: "",
  description: "",
  url: "",
  type: "OTHER",
  thumbnail: "",
  order: 1,
  isPublished: false,
  lessonId: "",
  courseId: "",
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The learning resource could not be saved.";
}

function getCourseId(resource: LearningResource) {
  return resource.lesson?.module.course.id ?? "";
}

export function AdminLearningResourcesPage() {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [courses, setCourses] = useState<CourseAdminSummary[]>([]);
  const [editorLessons, setEditorLessons] = useState<ManagedLesson[]>([]);
  const [filterLessons, setFilterLessons] = useState<ManagedLesson[]>([]);
  const [draft, setDraft] = useState<ResourceDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<LearningResourceType | "">("");
  const [filterCourseId, setFilterCourseId] = useState("");
  const [filterLessonId, setFilterLessonId] = useState("");
  const [page, setPage] = useState(1);
  const [totalResources, setTotalResources] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshResources = useCallback(async () => {
    const result = await learningResourceService.listPage({
      search: search.trim() || undefined,
      type: filterType || undefined,
      courseId: filterCourseId || undefined,
      lessonId: filterLessonId || undefined,
    });
    setResources(result.items);
    setTotalResources(result.pagination.total);
    setTotalPages(result.pagination.totalPages);
    setPage(result.pagination.page);
  }, [filterCourseId, filterLessonId, filterType, search]);

  const loadLessons = useCallback(async (courseId: string) => {
    if (!courseId) {
      return [] as ManagedLesson[];
    }
    const course: ManagedCourse = await adminService.courseForEditing(courseId);
    return course.modules.flatMap((module) => module.lessons);
  }, []);

  useEffect(() => {
    Promise.all([adminService.courses(), learningResourceService.listPage()])
      .then(([courseItems, result]) => {
        setCourses(courseItems);
        setResources(result.items);
        setTotalResources(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((cause: unknown) => setError(errorMessage(cause)))
      .finally(() => setLoading(false));
  }, []);

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await refreshResources();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function clearFilters() {
    setSearch("");
    setFilterType("");
    setFilterCourseId("");
    setFilterLessonId("");
    setFilterLessons([]);
    setError("");
    try {
      const result = await learningResourceService.listPage();
      setResources(result.items);
      setTotalResources(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
      setPage(result.pagination.page);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    setError("");
    try {
      const result = await learningResourceService.listPage({
        search: search.trim() || undefined,
        type: filterType || undefined,
        courseId: filterCourseId || undefined,
        lessonId: filterLessonId || undefined,
        page: page + 1,
      });
      setResources((items) => [...items, ...result.items]);
      setTotalResources(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
      setPage(result.pagination.page);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoadingMore(false);
    }
  }

  function startNew() {
    setEditingId(null);
    setDraft(emptyDraft);
    setEditorLessons([]);
    setError("");
    setNotice("");
  }

  async function editResource(resource: LearningResource) {
    const courseId = getCourseId(resource);
    setError("");
    setNotice("");
    try {
      setEditorLessons(await loadLessons(courseId));
      setEditingId(resource.id);
      setDraft({
        title: resource.title,
        description: resource.description,
        url: resource.url,
        type: resource.type,
        thumbnail: resource.thumbnail ?? "",
        order: resource.order,
        isPublished: resource.isPublished ?? false,
        lessonId: resource.lessonId ?? resource.lesson?.id ?? "",
        courseId,
      });
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function saveResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const input: LearningResourceInput = {
      title: draft.title,
      description: draft.description,
      url: draft.url.trim(),
      type: draft.type,
      thumbnail: draft.thumbnail.trim() || null,
      order: Number(draft.order),
      isPublished: draft.isPublished,
      lessonId: draft.lessonId,
    };
    try {
      if (editingId) await learningResourceService.update(editingId, input);
      else await learningResourceService.create(input);
      await refreshResources();
      startNew();
      setNotice(editingId ? "Learning resource updated." : "Learning resource created.");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(resource: LearningResource) {
    setError("");
    setNotice("");
    try {
      await learningResourceService.update(resource.id, { isPublished: !resource.isPublished });
      await refreshResources();
      setNotice(resource.isPublished ? "Resource unpublished." : "Resource published.");
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function deleteResource(resource: LearningResource) {
    if (!window.confirm(`Delete "${resource.title}"?`)) return;
    setError("");
    setNotice("");
    try {
      await learningResourceService.delete(resource.id);
      await refreshResources();
      if (editingId === resource.id) startNew();
      setNotice("Learning resource deleted.");
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function changeCourse(courseId: string) {
    setDraft((current) => ({ ...current, courseId, lessonId: "" }));
    setError("");
    try {
      setEditorLessons(await loadLessons(courseId));
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function changeFilterCourse(courseId: string) {
    setFilterCourseId(courseId);
    setFilterLessonId("");
    setError("");
    try {
      setFilterLessons(await loadLessons(courseId));
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <main className="content-page section dashboard-page learning-resource-admin-page">
      <Link className="back-link" to="/admin"><ArrowLeft size={16} /> Admin dashboard</Link>
      <div className="eyebrow">PYPATH ADMINISTRATION</div>
      <h1>Learning <span>resources.</span></h1>
      <p className="content-intro">Curate useful links and materials for published lessons.</p>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="admin-notice" role="status">{notice}</div>}

      <section className="admin-editor-card resource-filter-card">
        <form className="resource-filter-form" onSubmit={(event) => void applyFilters(event)}>
          <label className="admin-field">Search resources
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or description" />
          </label>
          <label className="admin-field">Type
            <select value={filterType} onChange={(event) => setFilterType(event.target.value as LearningResourceType | "")}>
              <option value="">All types</option>
              {resourceTypes.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label className="admin-field">Course
            <select value={filterCourseId} onChange={(event) => void changeFilterCourse(event.target.value)}>
              <option value="">All courses</option>
              {courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}
            </select>
          </label>
          <label className="admin-field">Lesson
            <select value={filterLessonId} onChange={(event) => setFilterLessonId(event.target.value)} disabled={!filterCourseId}>
              <option value="">All lessons</option>
              {filterLessons.map((lesson) => <option value={lesson.id} key={lesson.id}>{lesson.title}</option>)}
            </select>
          </label>
          <div className="resource-filter-actions">
            <button className="button button-dark" type="submit">Apply filters</button>
            <button className="button button-light" type="button" onClick={() => void clearFilters()}>Clear</button>
          </div>
        </form>
      </section>

      <section className="resource-admin-layout">
        <div className="resource-list-panel">
          <div className="resource-list-heading">
            <div><h2>Resources</h2><p>{resources.length} of {totalResources} shown</p></div>
            <button className="button button-dark" type="button" onClick={startNew}><Plus size={15} /> Add resource</button>
          </div>
          {loading ? <p className="muted">Loading resources…</p> : resources.length ? (
            <div className="resource-admin-list">
              {resources.map((resource) => (
                <article className="resource-admin-item" key={resource.id}>
                  <div className="resource-admin-copy">
                    <span className={`learning-resource-type resource-type-${resource.type.toLowerCase()}`}>{resource.type}</span>
                    <h3>{resource.title}</h3>
                    <p>{resource.lesson?.module.course.title ?? "Unknown course"} · {resource.lesson?.title ?? "Unknown lesson"} · Order {resource.order}</p>
                    <span className={resource.isPublished ? "status-active" : "status-inactive"}>{resource.isPublished ? "Published" : "Draft"}</span>
                  </div>
                  <div className="admin-row-actions">
                    <a className="table-action" href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${resource.title}`}><ExternalLink size={14} /></a>
                    <button className="table-action" type="button" onClick={() => void togglePublished(resource)}>{resource.isPublished ? "Unpublish" : "Publish"}</button>
                    <button className="table-action" type="button" onClick={() => void editResource(resource)}>Edit</button>
                    <button className="icon-action danger-action" type="button" aria-label={`Delete ${resource.title}`} onClick={() => void deleteResource(resource)}><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="muted">{loading ? "" : "No resources match these filters."}</p>}
          {page < totalPages && <button className="button button-light resource-load-more" type="button" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Loading…" : "Load more resources"}</button>}
        </div>

        <form className="admin-editor-card resource-editor" onSubmit={(event) => void saveResource(event)}>
          <div className="admin-editor-title"><Link2 size={19} /><h2>{editingId ? "Edit resource" : "Add a resource"}</h2></div>
          <div className="admin-form-grid">
            <label className="admin-field full-field">Title
              <input required minLength={2} maxLength={160} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label className="admin-field full-field">Description
              <textarea rows={3} maxLength={10000} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label className="admin-field full-field">URL
              <input required type="url" placeholder="https://example.com/learning-resource" value={draft.url} onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))} />
            </label>
            <label className="admin-field">Resource type
              <select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as LearningResourceType }))}>
                {resourceTypes.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
              </select>
            </label>
            <label className="admin-field">Course
              <select required value={draft.courseId} onChange={(event) => void changeCourse(event.target.value)}>
                <option value="">Choose a course</option>
                {courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}
              </select>
            </label>
            <label className="admin-field full-field">Lesson
              <select required value={draft.lessonId} onChange={(event) => setDraft((current) => ({ ...current, lessonId: event.target.value }))} disabled={!draft.courseId || !editorLessons.length}>
                <option value="">Choose a lesson</option>
                {editorLessons.map((lesson) => <option value={lesson.id} key={lesson.id}>{lesson.title}</option>)}
              </select>
            </label>
            <label className="admin-field">Order
              <input required type="number" min="1" max="100000" value={draft.order} onChange={(event) => setDraft((current) => ({ ...current, order: Number(event.target.value) }))} />
            </label>
            <label className="admin-field">Thumbnail URL (optional)
              <input type="url" placeholder="https://example.com/image.jpg" value={draft.thumbnail} onChange={(event) => setDraft((current) => ({ ...current, thumbnail: event.target.value }))} />
            </label>
          </div>
          <label className="admin-check"><input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))} /> Published</label>
          <div className="resource-editor-actions">
            <button className="button button-dark" type="submit" disabled={saving}><Save size={15} />{saving ? "Saving…" : editingId ? "Save changes" : "Create resource"}</button>
            {editingId && <button className="button button-light" type="button" onClick={startNew}><X size={15} /> Cancel edit</button>}
          </div>
        </form>
      </section>
    </main>
  );
}
