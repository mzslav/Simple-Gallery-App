import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp, confirmSignUp } from "aws-amplify/auth";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register" | "confirm"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(""); // Код підтвердження з email
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signIn({ username: email, password });
        loginUser();
        navigate("/gallery");
      } else if (mode === "register") {
        await signUp({
          username: email,
          password,
          options: { userAttributes: { email } },
        });
        setMode("confirm"); // Переходимо до вводу коду
      } else if (mode === "confirm") {
        await confirmSignUp({ username: email, confirmationCode: code });
        // Після підтвердження логінимось
        await signIn({ username: email, password });
        loginUser();
        navigate("/gallery");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
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
            {mode === "login" ? "Welcome back" : mode === "confirm" ? "Confirm Email" : "Create account"}
          </h1>
          <p className="login-card__subtitle">
            {mode === "confirm" ? "Check your email for the verification code" : "Sign in to your Gallery Lite account"}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="login-form__error">{error}</div>}

          <div className="login-form__field">
            <label className="login-form__label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="login-form__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mode === "confirm"}
              required
            />
          </div>

          {(mode === "login" || mode === "register") && (
            <div className="login-form__field">
              <label className="login-form__label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="login-form__input"
                placeholder="At least 8 characters, numbers, uppercase"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {mode === "confirm" && (
            <div className="login-form__field">
              <label className="login-form__label" htmlFor="code">Verification Code</label>
              <input
                id="code"
                type="text"
                className="login-form__input"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="login-form__submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "confirm" ? "Verify & Sign in" : "Create account"}
          </button>
        </form>

        {mode !== "confirm" && (
          <div className="login-card__footer">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button className="login-card__switch" onClick={() => { setMode("register"); setError(""); }}>
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button className="login-card__switch" onClick={() => { setMode("login"); setError(""); }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}