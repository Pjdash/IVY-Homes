import { useState } from "react";
import * as api from "../api";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("demo1@ivy.homes");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onLogin(await api.login(email.trim(), password));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-brand">
          <span className="brand-mark">i</span> Ivy<span>/homes</span>
        </div>
        <div className="login-copy">
          <p className="eyebrow">A better way home</p>
          <h1>
            Find a place
            <br />
            <em>to become.</em>
          </h1>
          <p>
            One clear view of the homes, rentals and communities shaping your
            city.
          </p>
        </div>
        <div className="login-stat">
          <strong>01</strong>
          <span>
            City, honestly
            <br />
            mapped.
          </span>
        </div>
      </div>
      <div className="login-panel">
        <div className="login-form-wrap">
          <p className="eyebrow">Welcome back</p>
          <h2>Open your city.</h2>
          <p className="form-hint">
            Sign in with the credentials from your Ivy email.
          </p>
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && (
              <div className="error-box" role="alert">
                {error}
              </div>
            )}
            <button className="primary-button" disabled={loading}>
              {loading ? "Connecting..." : "Enter Ivy Homes →"}
            </button>
          </form>
          <small className="privacy-note">
            Your session expires after 24 hours and is cleared when you sign
            out.
          </small>
        </div>
      </div>
    </div>
  );
}
