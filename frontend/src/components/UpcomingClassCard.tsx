import { ArrowRight, CalendarDays, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import type { UpcomingClass } from "../types";
import { formatClassSchedule, getClassStatus } from "../utils/upcomingClass";

export function UpcomingClassCard({ upcomingClass }: { upcomingClass: UpcomingClass }) {
  const status = getClassStatus(upcomingClass);
  return (
    <article className="upcoming-class-card">
      {upcomingClass.thumbnail
        ? <img className="upcoming-class-image" src={upcomingClass.thumbnail} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />
        : <div className="upcoming-class-image upcoming-class-image-placeholder" aria-hidden="true"><CalendarDays size={28} /></div>}
      <div className="upcoming-class-card-content">
        <div className="upcoming-class-card-heading">
          <span className={`upcoming-class-status status-${status.toLowerCase()}`}>{status.toLowerCase()}</span>
          {upcomingClass.course && <span className="upcoming-class-category">{upcomingClass.course.title}</span>}
        </div>
        <h3>{upcomingClass.title}</h3>
        <p className="upcoming-class-description">{upcomingClass.description}</p>
        <div className="upcoming-class-meta">
          <span><CalendarDays size={15} />{formatClassSchedule(upcomingClass.daysOfWeek, upcomingClass.startDate, upcomingClass.endDate, upcomingClass.startTime, upcomingClass.endTime)}</span>
          <span><UserRound size={15} />{upcomingClass.instructorName || "Instructor to be announced"}</span>
        </div>
        <Link className="button button-dark upcoming-class-view" to={`/classes/${upcomingClass.id}`}>View details <ArrowRight size={16} /></Link>
      </div>
    </article>
  );
}
