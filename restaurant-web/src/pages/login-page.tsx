import { useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login({ email, password });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to login right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <p className="eyebrow">Restaurant owner panel</p>
        <h1>Run your restaurant without the messy dashboard feeling.</h1>
        <p className="muted login-copy">
          Accept orders, manage menu, publish offers, and keep delivery flow in
          sync with one clean workspace.
        </p>
        <div className="login-points">
          <div className="point-card">
            <strong>Live order inbox</strong>
            <span>Owner-ready status actions wired to your backend.</span>
          </div>
          <div className="point-card">
            <strong>Menu & offers</strong>
            <span>Structure ready for Cloudinary and CRUD expansion.</span>
          </div>
        </div>
      </section>

      <section className="login-card">
        <div>
          <p className="eyebrow">Secure login</p>
          <h2>Welcome back</h2>
          <p className="muted">
            Only `restaurant_owner` accounts can enter this workspace.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="owner@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login to owner panel"}
          </button>
        </form>
      </section>
    </div>
  );
}
