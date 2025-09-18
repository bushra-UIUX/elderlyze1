import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../Firebase/firebase";
import Logo from "../Assets/Images/Logo.png";
import { Link } from "react-router-dom";
import "../Assets/Css/SignIn.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("✅ Password reset email sent! Check your inbox.");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format");
      } else {
        setError(err.message || "Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <div className="container">
        <div className="auth-card">
          <img src={Logo} alt="Elderlyze" className="auth-logo" />
          <h1>Reset your password</h1>
          <p className="auth-sub">We'll email you a secure link to reset it</p>

          <form className="auth-form" onSubmit={handleResetPassword}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />

            {error && <div className="error-text" role="alert">{error}</div>}
            {message && <div className="success-text" role="alert">{message}</div>}

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="auth-alt">
            <Link className="btn btn-ghost" to="/signin">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default ForgotPassword;
