import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, register } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fn = mode === "login" ? login : register;
      const data = await fn(email.trim(), password);
      loginUser(data.token, data.user);
      navigate("/gallery");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page page-enter">
      <div className="login-card">
        <div className="login-card__header">
          <span className="login-card__icon">◈</span>
          <h1 className="login-card__title">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="login-card__subtitle">
            {mode === "login"
              ? "Sign in to your Gallery Lite account"
              : "Join Gallery Lite and start sharing images"}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="login-form__error">{error}</div>}

          <div className="login-form__field">
            <label className="login-form__label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="login-form__input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="login-form__field">
            <label className="login-form__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="login-form__input"
              placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            className="login-form__submit"
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <div className="login-card__footer">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                className="login-card__switch"
                onClick={() => { setMode("register"); setError(""); }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="login-card__switch"
                onClick={() => { setMode("login"); setError(""); }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
