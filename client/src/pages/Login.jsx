import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }

      if (user.role === "student") {
        navigate("/student/dashboard");
      } else if (user.role === "teacher") {
        navigate("/teacher/dashboard");
      } else if (user.role === "admin") {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT SIDE */}
      <section className="login-hero">

        <div className="hero-content">

          <div className="brand">
            <div className="brand-logo">
              <span>🎓</span>
            </div>

            <div>
              <h2>ONLINE EXAM</h2>
              <p>SYSTEM</p>
            </div>
          </div>

          <div className="hero-heading">
            <div className="hero-line"></div>

            <h1>
              Smart Exams.
              <br />
              Bright Futures.
            </h1>

            <p>
              A secure and reliable platform for
              <br />
              online examinations.
            </p>
          </div>

          <div className="features">

            <div className="feature">
              <div className="feature-icon">✓</div>

              <div>
                <h3>Secure</h3>
                <p>
                  Your data and exams are
                  <br />
                  protected with advanced security.
                </p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">◷</div>

              <div>
                <h3>Timed Exams</h3>
                <p>
                  Real-time countdown and auto
                  <br />
                  submission for fairness.
                </p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">▥</div>

              <div>
                <h3>Instant Results</h3>
                <p>
                  Get your results immediately
                  <br />
                  after submission.
                </p>
              </div>
            </div>

          </div>

          <div className="hero-decoration">
            <div className="book book-one"></div>
            <div className="book book-two"></div>
            <div className="pencil">✎</div>
          </div>

        </div>

      </section>

      {/* RIGHT SIDE */}
      <section className="login-section">

        <div className="top-action">
          <span>New here?</span>

          <button type="button">
            <span>♙</span>
            Contact Administrator
          </button>
        </div>

        <div className="login-card">

          <div className="login-header">
            <h1>Welcome Back!</h1>

            <p>
              Sign in to continue to your account
            </p>
          </div>

          <div className="divider-logo">
            <span></span>

            <div>🎓</div>

            <span></span>
          </div>

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label>Email Address</label>

              <div className="input-wrapper">
                <span className="input-icon">✉</span>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>

              <div className="input-wrapper">
                <span className="input-icon">♙</span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "◉" : "◌"}
                </button>
              </div>
            </div>

            <div className="login-options">

              <label className="remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                />

                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password"
              >
                Forgot Password?
              </button>

            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              className="sign-in-button"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? "Signing In..." : "Sign In"}</span>

              {!loading && <span>→</span>}
            </button>

          </form>

          <div className="security-label">
            <span></span>
            <p>Secure&nbsp; • &nbsp;Reliable&nbsp; • &nbsp;Fair</p>
            <span></span>
          </div>

          <div className="admin-notice">
            <div className="notice-icon">✓</div>

            <p>
              Accounts are created and managed
              <br />
              by the system administrator.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Login;