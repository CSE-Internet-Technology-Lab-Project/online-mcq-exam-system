import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./StudentDashboard.css";

function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/student/profile");
        setStudent(response.data.student);
      } catch (error) {
        console.error("Failed to fetch profile:", error);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading...
      </div>
    );
  }

  return (
    <div className="student-dashboard">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo">
          ONLINE EXAM
          <span>SYSTEM</span>
        </div>

        <nav>
          <button className="nav-link active">
            Dashboard
          </button>

          <button className="nav-link">
            Exams
          </button>

          <button className="nav-link">
            Results
          </button>

          <button className="nav-link">
            Profile
          </button>
        </nav>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </aside>

      {/* Main */}
      <main className="dashboard-content">

        <header className="dashboard-topbar">

          <div>
            <h1>Dashboard</h1>
            <p>Student Examination Portal</p>
          </div>

          <div className="student-info">
            <div className="avatar">
              {student?.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{student?.name}</strong>
              <span>Student</span>
            </div>
          </div>

        </header>

        <section className="welcome">

          <h2>
            Welcome back, {student?.name}
          </h2>

          <p>
            View your examinations and track your performance.
          </p>

        </section>

        {/* Statistics */}
        <section className="stats">

          <div className="stat">
            <span>AVAILABLE EXAMS</span>
            <strong>4</strong>
          </div>

          <div className="stat">
            <span>COMPLETED EXAMS</span>
            <strong>8</strong>
          </div>

          <div className="stat">
            <span>AVERAGE SCORE</span>
            <strong>72%</strong>
          </div>

        </section>

        {/* Exams */}
        <section className="exams">

          <div className="section-header">
            <div>
              <h2>Available Examinations</h2>
              <p>Select an examination to begin.</p>
            </div>
          </div>

          <div className="exam-card">

            <div>
              <h3>Data Structures</h3>

              <p>
                Test your knowledge of fundamental
                data structures and algorithms.
              </p>

              <div className="exam-meta">
                <span>20 Questions</span>
                <span>30 Minutes</span>
              </div>
            </div>

            <button className="start-button">
              Start Exam
            </button>

          </div>

          <div className="exam-card">

            <div>
              <h3>Database Management Systems</h3>

              <p>
                Test your knowledge of DBMS,
                SQL and database concepts.
              </p>

              <div className="exam-meta">
                <span>20 Questions</span>
                <span>30 Minutes</span>
              </div>
            </div>

            <button className="start-button">
              Start Exam
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default StudentDashboard;