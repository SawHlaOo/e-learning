import { ArrowRight, CalendarDays, Send, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import type { UpcomingClass } from "../types";
import { getTelegramEnrollUrl } from "../utils/telegram";
import { classStatusLabel, formatClassSchedule, getClassStatus } from "../utils/upcomingClass";

export function UpcomingClassCard({ upcomingClass, detailPath = "/classes" }: { upcomingClass: UpcomingClass; detailPath?: string }) {
  const status = getClassStatus(upcomingClass);
  const telegramEnrollUrl = getTelegramEnrollUrl(import.meta.env.VITE_TELEGRAM_ENROLL_URL);
  return (
    <article className="upcoming-class-card">
      {upcomingClass.thumbnail
        ? <img className="upcoming-class-image" src={upcomingClass.thumbnail} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />
        : <div className="upcoming-class-image upcoming-class-image-placeholder" aria-hidden="true"><CalendarDays size={28} /></div>}
      <div className="upcoming-class-card-content">
        <div className="upcoming-class-card-heading">
          <span className={`upcoming-class-status status-${status.toLowerCase()}`}>{classStatusLabel(status)}</span>
          {upcomingClass.course && <span className="upcoming-class-category">{upcomingClass.course.title}</span>}
        </div>
        <h3>{upcomingClass.title}</h3>
        <p className="upcoming-class-description">{upcomingClass.description}</p>
        <div className="upcoming-class-meta">
          <span><CalendarDays size={15} />{formatClassSchedule(upcomingClass.daysOfWeek, upcomingClass.startDate, upcomingClass.endDate, upcomingClass.startTime, upcomingClass.endTime)}</span>
          <span><UserRound size={15} />{upcomingClass.instructorName || "Instructor to be announced"}</span>
        </div>
        <div className="class-card-actions">
          <Link className="button button-dark upcoming-class-view" to={`${detailPath}/${upcomingClass.id}`}>View details <ArrowRight size={16} /></Link>
          {status === "UPCOMING" && (telegramEnrollUrl
            ? <a className="button button-light upcoming-class-view class-enroll-button" href={telegramEnrollUrl} target="_blank" rel="noopener noreferrer">Go to Telegram to enroll <Send size={16} /></a>
            : <button className="button button-light upcoming-class-view class-enroll-button enrollment-disabled" type="button" disabled>Go to Telegram to enroll <Send size={16} /></button>)}
        </div>
      </div>
    </article>
  );
}
