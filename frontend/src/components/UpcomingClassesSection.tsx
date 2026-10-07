import { ArrowRight, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { upcomingClassService } from "../services/upcomingClassService";
import type { UpcomingClass } from "../types";
import { UpcomingClassCard } from "./UpcomingClassCard";

export function UpcomingClassesSection({ compact = false }: { compact?: boolean }) {
  const [classes, setClasses] = useState<UpcomingClass[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    upcomingClassService.upcoming(4)
      .then((result) => {
        if (!active) return;
        setClasses(result.items);
        setTotal(result.pagination.total);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Upcoming classes could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className={`upcoming-classes-section section${compact ? " upcoming-classes-compact" : ""}`} aria-labelledby="upcoming-classes-title">
      <div className="section-heading">
        <div><span className="eyebrow">LEARN TOGETHER</span><h2 id="upcoming-classes-title">Upcoming <span>classes.</span></h2></div>
        <Link className="text-link" to="/classes">{total > classes.length ? "View all" : "Browse classes"} <ArrowRight size={16} /></Link>
      </div>
      {loading
        ? <div className="page-state" role="status">Loading upcoming classes…</div>
        : error
          ? <div className="upcoming-classes-empty" role="alert"><strong>Upcoming classes aren’t available right now.</strong><span>{error}</span></div>
          : classes.length
            ? <div className="upcoming-classes-grid">{classes.map((item) => <UpcomingClassCard key={item.id} upcomingClass={item} />)}</div>
            : <div className="upcoming-classes-empty"><CalendarDays size={24} /><strong>No upcoming classes at the moment.</strong><span>Check back soon for new classes.</span></div>}
    </section>
  );
}
