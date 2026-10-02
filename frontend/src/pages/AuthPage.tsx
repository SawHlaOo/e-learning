import { ArrowLeft, ArrowRight, Code2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(128),
});
type AuthInput = z.infer<typeof schema>;

export function AuthPage({ register = false }: { register?: boolean }) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const validationSchema = schema.superRefine((values, context) => {
    if (register && (!values.name || values.name.length < 2)) {
      context.addIssue({ code: "custom", path: ["name"], message: "Please enter your name" });
    }
  });
  const { register: field, handleSubmit, formState: { errors } } = useForm<AuthInput>({ resolver: zodResolver(validationSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setError("");
    try {
      const user = register
        ? await signUp(values.name ?? "", values.email, values.password)
        : await signIn(values.email, values.password);
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(destination || (user.role === "ADMIN" ? "/admin" : "/dashboard"), { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  });

  return <main className="auth-page">
    <Link className="auth-back" to="/"><ArrowLeft size={16} /> Back to home</Link>
    <div className="auth-card">
      <div className="auth-logo"><span className="brand-mark">Py</span></div>
      <span className="eyebrow">{register ? "YOUR NEXT CHAPTER" : "WELCOME BACK"}</span>
      <h1>{register ? "Let’s get you started." : "Good to see you again."}</h1>
      <p>{register ? "Create an account and start learning at your own pace." : "Sign in to pick up right where you left off."}</p>
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {register && <label className="field"><span>Your name</span><div className="input-wrap"><UserRound size={17} /><input autoComplete="name" placeholder="Ada Lovelace" {...field("name")} /></div>{errors.name && <small>{errors.name.message}</small>}</label>}
        <label className="field"><span>Email address</span><div className="input-wrap"><Mail size={17} /><input type="email" autoComplete="email" placeholder="you@example.com" {...field("email")} /></div>{errors.email && <small>{errors.email.message}</small>}</label>
        <label className="field"><span>Password</span><div className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} placeholder="At least 8 characters" {...field("password")} /><button type="button" className="show-password" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <small>{errors.password.message}</small>}</label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button button-dark auth-submit" disabled={submitting}>{submitting ? "One moment…" : register ? "Create account" : "Sign in"} <ArrowRight size={17} /></button>
      </form>
      <div className="auth-switch">{register ? "Already have an account?" : "New to PyPath?"} <Link to={register ? "/login" : "/register"}>{register ? "Sign in" : "Create an account"}</Link></div>
    </div>
    <div className="auth-side-note"><Code2 size={17} /> A little progress, every day.</div>
  </main>;
}
