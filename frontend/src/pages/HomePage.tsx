import { ArrowDown, ArrowRight, ArrowUpRight, Check, Code2, Compass, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CourseCard } from "../components/CourseCard";
import { courseService } from "../services/courseService";
import type { Course } from "../types";

const steps = [
  { n: "01", icon: Compass, title: "Find your path", text: "Clear, structured courses that take you from curious to confident." },
  { n: "02", icon: Code2, title: "Learn by doing", text: "Short lessons paired with practice, so every concept sticks." },
  { n: "03", icon: Sparkles, title: "Make it real", text: "Build projects that turn what you learn into something you can show." },
];

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
            <div className="pill"><span className="pill-dot" /> A better way to learn Python</div>
            <h1>Learn Python.<br /><span>Build real things.</span></h1>
            <p className="hero-description">A practical place to learn Python, practice your skills, and turn what you know into projects you’re proud of.</p>
            <div className="hero-actions"><Link className="button button-dark" to="/courses">Start learning <ArrowUpRight size={17} /></Link><Link className="button button-light" to="/courses">Explore courses <ArrowRight size={17} /></Link></div>
            <div className="hero-proof"><div className="avatar-stack"><span>A</span><span>M</span><span>J</span><span>+</span></div><span><strong>A little progress, every day.</strong><br />A learning path built around you.</span></div>
          </div>
          <div className="hero-visual" aria-label="Decorative Python code illustration">
            <div className="float-note note-top"><span className="note-icon"><Check size={15} /></span>One lesson at a time</div>
            <div className="code-window">
              <div className="window-head"><div className="window-dots"><i /><i /><i /></div><span>first_program.py</span><span className="window-status">● ready</span></div>
              <div className="code-content"><div className="line-number">01<br />02<br />03<br />04<br />05<br />06</div><pre><span className="code-purple">def</span> <span className="code-yellow">say_hello</span>(name):{"\n"}  <span className="code-muted"># your first function</span>{"\n"}  message = <span className="code-green">f"Hello, {"{"}name{"}"}!"</span>{"\n"}  <span className="code-purple">return</span> message{"\n\n"}<span className="code-blue">print</span>(say_hello(<span className="code-green">"world"</span>))</pre></div>
              <div className="code-output"><span>OUTPUT</span><span className="output-check">✓</span><code>Hello, world!</code><span className="output-cursor">▌</span></div>
            </div>
            <div className="float-note note-bottom"><span className="play-badge"><Play size={12} fill="currentColor" /></span><span><strong>Small steps.</strong><br />Big confidence.</span></div>
            <span className="hero-scribble">✳</span>
          </div>
        </div>
        <a className="scroll-cue" href="#roadmap"><ArrowDown size={14} /> SCROLL TO EXPLORE</a>
      </section>

      <section className="roadmap section" id="roadmap">
        <div className="section-heading"><div><span className="eyebrow">THE PYPATH APPROACH</span><h2>Less overwhelm.<br /><span>More “I got this.”</span></h2></div><p>Learning to code shouldn’t feel like decoding a map. We make the next step obvious — and the progress yours.</p></div>
        <div className="steps-grid">{steps.map(({ n, icon: Icon, title, text }) => <article className="step-card" key={n}><div className="step-top"><span>{n}</span><Icon size={21} /></div><h3>{title}</h3><p>{text}</p><span className="step-line" /></article>)}</div>
      </section>

      <section className="courses-section section" id="courses">
        <div className="section-heading"><div><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>Start with the<br /><span>right building blocks.</span></h2></div><Link to="/courses" className="text-link">Browse all courses <ArrowRight size={16} /></Link></div>
        {courses.length ? <div className="course-grid">{courses.slice(0, 3).map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}</div> : coursesLoading ? <div className="page-state">Loading courses…</div> : coursesError ? <div className="page-state"><strong>Courses aren’t available right now.</strong><span>{coursesError}</span></div> : <div className="empty-courses"><div className="empty-icon"><Code2 size={24} /></div><div><strong>Your Python journey starts here.</strong><p>Courses will show up here as soon as they’re published.</p></div><Link to="/register" className="text-link">Create your account <ArrowRight size={16} /></Link></div>}
      </section>

      <section className="cta-section"><div className="cta-decoration">{"{ }"}</div><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Your first line of code<br />is closer than you think.</h2></div><Link className="button button-green" to="/register">Let’s get started <ArrowUpRight size={17} /></Link></section>
      <footer className="footer"><Link className="brand" to="/"><span className="brand-mark">Py</span> pypath<span className="brand-period">.</span></Link><span>Made for curious minds, one line at a time.</span><span>© {new Date().getFullYear()} PyPath</span></footer>
    </>
  );
}
