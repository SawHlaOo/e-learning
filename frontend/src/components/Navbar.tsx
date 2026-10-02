import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function logout() {
    await signOut();
    navigate("/");
    setMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link className="brand" to="/" onClick={() => setMenuOpen(false)}><span className="brand-mark">Py</span> pypath<span className="brand-period">.</span></Link>
        <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <NavLink to="/courses" onClick={() => setMenuOpen(false)}>Courses</NavLink>
          <a href="/#roadmap" onClick={() => setMenuOpen(false)}>How it works</a>
          {user ? (
            <>
              <NavLink to={user.role === "ADMIN" ? "/admin" : "/dashboard"} onClick={() => setMenuOpen(false)}>{user.role === "ADMIN" ? "Admin" : "My learning"}</NavLink>
              <button className="nav-login" onClick={() => void logout()}>Log out</button>
            </>
          ) : (
            <>
              <NavLink className="nav-login" to="/login" onClick={() => setMenuOpen(false)}>Log in</NavLink>
              <Link className="nav-cta" to="/register" onClick={() => setMenuOpen(false)}>Get started <ArrowUpRight size={16} /></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
