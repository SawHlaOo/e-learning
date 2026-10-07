import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Calculator, Check, Compass, Facebook, Globe2, Instagram, Languages, Palette, Send, Sparkles, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { BrandLogo } from "../components/BrandLogo";
import { CourseCard } from "../components/CourseCard";
import { UpcomingClassesSection } from "../components/UpcomingClassesSection";
import { courseService } from "../services/courseService";
import type { Course } from "../types";

const steps = [
  { n: "01", icon: Compass, title: "Find your path", text: "Clear, structured courses that take you from curious to confident." },
  { n: "02", icon: BookOpen, title: "Learn by doing", text: "Short lessons and practice help new ideas stick." },
  { n: "03", icon: Sparkles, title: "Make it yours", text: "Turn what you learn into skills you can use every day." },
];

const learningAreas = [
  { icon: Languages, title: "Languages", detail: "Practice a little every day", tone: "learning-language" },
  { icon: Calculator, title: "Math & science", detail: "Build understanding step by step", tone: "learning-science" },
  { icon: Palette, title: "Creative skills", detail: "Explore ideas and make things", tone: "learning-creative" },
  { icon: Globe2, title: "Technology", detail: "Learn practical digital skills", tone: "learning-tech" },
];

const socialLinks = [
  { label: "Instagram", href: import.meta.env.VITE_SOCIAL_INSTAGRAM_URL, icon: Instagram },
  { label: "Facebook", href: import.meta.env.VITE_SOCIAL_FACEBOOK_URL, icon: Facebook },
  { label: "YouTube", href: import.meta.env.VITE_SOCIAL_YOUTUBE_URL, icon: Youtube },
  { label: "TikTok", href: import.meta.env.VITE_SOCIAL_TIKTOK_URL, icon: TikTokIcon },
  { label: "Telegram", href: import.meta.env.VITE_SOCIAL_TELEGRAM_URL || import.meta.env.VITE_TELEGRAM_ENROLL_URL, icon: Send },
].map(({ label, href, icon }) => {
  if (!href) return { label, href: undefined, icon };
  try {
    const url = new URL(href);
    return { label, href: url.protocol === "https:" ? url.toString() : undefined, icon };
  } catch {
    return { label, href: undefined, icon };
  }
});

function TikTokIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.6 7.1a6.7 6.7 0 0 1-4.1-1.4v8.1a6.3 6.3 0 1 1-5.5-6.2v3.5a2.9 2.9 0 1 0 2.1 2.8V2.5h3.4c.2 2.1 1.7 3.8 4.1 4.2v.4Z" /></svg>;
}

export function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  useEffect(() => {
    courseService.list()
      .then(setCourses)
      .catch((cause: unknown) => setCoursesError(cause instanceof Error ? cause.message : "Courses could not be loaded"))
      .finally(() => setCoursesLoading(false));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="pill"><span className="pill-dot" /> A better way to learn, your way</div>
            <h1>Curiosity takes<br /><span>you anywhere.</span></h1>
            <p className="hero-description">Explore languages, science, creative skills, technology, and more—with clear lessons that help you grow at your own pace.</p>
            <div className="hero-actions"><Link className="button button-dark" to="/upcoming-classes">Upcoming classes <ArrowUpRight size={17} /></Link><Link className="button button-light" to="/courses">Explore courses <ArrowRight size={17} /></Link></div>
            <div className="hero-proof"><div className="avatar-stack"><span>A</span><span>M</span><span>J</span><span>+</span></div><span><strong>A little progress, every day.</strong><br />A learning path built around you.</span></div>
          </div>
          <div className="hero-visual" aria-label="Explore different learning subjects">
            <div className="float-note note-top"><span className="note-icon"><Check size={15} /></span>One lesson at a time</div>
            <div className="learning-board">
              <div className="learning-board-header"><div><span className="eyebrow">YOUR LEARNING SPACE</span><strong>What would you like to learn?</strong></div><span className="learning-board-sparkle"><Sparkles size={19} /></span></div>
              <div className="learning-card-grid">{learningAreas.map(({ icon: Icon, title, detail, tone }) => <article className={`learning-card ${tone}`} key={title}><span className="learning-card-icon"><Icon size={20} /></span><span className="learning-card-copy"><strong>{title}</strong><small>{detail}</small></span><ArrowRight className="learning-card-arrow" size={16} /></article>)}</div>
              <div className="learning-board-footer"><span className="learning-progress-icon"><BookOpen size={16} /></span><span><strong>Small steps add up</strong><small>Choose a topic and start learning today.</small></span><span className="learning-progress"><i /></span></div>
            </div>
            <div className="float-note note-bottom"><span className="play-badge"><BookOpen size={14} /></span><span><strong>Your next skill.</strong><br />Your own pace.</span></div>
            <span className="hero-scribble">✳</span>
          </div>
        </div>
        <a className="scroll-cue" href="#roadmap"><ArrowDown size={14} /> SCROLL TO EXPLORE</a>
      </section>

      <section className="roadmap section" id="roadmap">
        <div className="section-heading"><div><span className="eyebrow">THE YOUR CHOICE APPROACH</span><h2>Less overwhelm.<br /><span>More “I got this.”</span></h2></div><p>Learning something new shouldn’t feel overwhelming. We make the next step clear and the progress yours.</p></div>
        <div className="steps-grid">{steps.map(({ n, icon: Icon, title, text }) => <article className="step-card" key={n}><div className="step-top"><span>{n}</span><Icon size={21} /></div><h3>{title}</h3><p>{text}</p><span className="step-line" /></article>)}</div>
      </section>

      <section className="courses-section section" id="courses">
        <div className="section-heading"><div><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>Start with the<br /><span>right building blocks.</span></h2></div><Link to="/courses" className="text-link">Browse all courses <ArrowRight size={16} /></Link></div>
        {courses.length ? <div className="course-grid">{courses.slice(0, 3).map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}</div> : coursesLoading ? <div className="page-state">Loading courses…</div> : coursesError ? <div className="page-state"><strong>Courses aren’t available right now.</strong><span>{coursesError}</span></div> : <div className="empty-courses"><div className="empty-icon"><BookOpen size={24} /></div><div><strong>Your learning journey starts here.</strong><p>New courses will appear here as they’re published.</p></div><Link to="/register" className="text-link">Create your account <ArrowRight size={16} /></Link></div>}
      </section>

      <UpcomingClassesSection />
      <section className="cta-section"><div className="cta-decoration"><Sparkles /></div><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Your next new skill<br />is closer than you think.</h2></div><Link className="button button-green" to="/register">Let’s get started <ArrowUpRight size={17} /></Link></section>
      <footer className="footer">
        <Link className="brand brand-logo" to="/" aria-label="Your Choice Tech home"><BrandLogo /></Link>
        <span>Made for curious minds, one line at a time.</span>
        <nav className="footer-socials" aria-label="Social media">{socialLinks.map(({ label, href, icon: Icon }) => href
          ? <a key={label} href={href} aria-label={label} title={label} target="_blank" rel="noopener noreferrer"><Icon size={18} /></a>
          : <button key={label} type="button" aria-label={`${label} link not configured`} title={`Set VITE_SOCIAL_${label.toUpperCase()}_URL in Vercel`} disabled><Icon size={18} /></button>)}</nav>
      </footer>
    </>
  );
}
