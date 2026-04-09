import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/gallery" className="navbar__brand">
          <span className="navbar__brand-icon">◈</span>
          <span className="navbar__brand-name">Gallery Lite</span>
        </Link>

        <nav className="navbar__nav">
          <Link
            to="/gallery"
            className={`navbar__link ${isActive("/gallery") ? "navbar__link--active" : ""}`}
          >
            Gallery
          </Link>

          {user && (
            <Link
              to="/upload"
              className={`navbar__link ${isActive("/upload") ? "navbar__link--active" : ""}`}
            >
              Upload
            </Link>
          )}
        </nav>

        <div className="navbar__actions">
          {user ? (
            <>
              <span className="navbar__user">{user.email}</span>
              <button className="navbar__btn navbar__btn--ghost" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar__btn navbar__btn--accent">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
