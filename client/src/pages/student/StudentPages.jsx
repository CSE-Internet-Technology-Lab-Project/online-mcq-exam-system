import { useEffect, useState, useCallback, useRef } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  User,
  Loader2,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const studentNav = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/student/exams", label: "Exams", icon: FileText },
  { to: "/student/results", label: "Results", icon: BarChart3 },
  { to: "/student/profile", label: "Profile", icon: User }
];

export function StudentLayout() {
  return (
    <DashboardLayout navItems={studentNav} title="Student Portal" subtitle="Examination Center">
      <Outlet />
    </DashboardLayout>
  );
}

export function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/student/dashboard"),
      api.get("/student/exams")
    ])
      .then(([statsRes, examsRes]) => {
        setStats(statsRes.data.stats);
        setExams(examsRes.data.exams.filter((e) => e.attemptStatus !== "completed").slice(0, 3));
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Welcome back!</h2>
        <p className="text-muted-foreground">View your examinations and track your performance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Available Exams", value: stats?.availableExams || 0 },
          { label: "Completed Exams", value: stats?.completedExams || 0 },
          { label: "Average Score", value: `${stats?.averageScore || 0}%` }
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Available Examinations</CardTitle>
            <CardDescription>Select an examination to begin.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/student/exams">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No available exams right now.</p>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam._id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-semibold">{exam.title}</h3>
                    <p className="text-sm text-muted-foreground">{exam.description}</p>
                    <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                      <span>{exam.questionCount} Questions</span>
                      <span>{exam.duration} Minutes</span>
                    </div>
                  </div>
                  <Button onClick={() => navigate(`/student/exams/${exam._id}/take`)}>
                    <Play className="h-4 w-4" />
                    {exam.attemptStatus === "in_progress" ? "Continue" : "Start Exam"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/student/exams")
      .then((res) => setExams(res.data.exams))
      .catch(() => toast.error("Failed to load exams"))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (status) => {
    const map = {
      not_started: { label: "Available", variant: "default" },
      in_progress: { label: "In Progress", variant: "warning" },
      completed: { label: "Completed", variant: "success" }
    };
    const s = map[status] || map.not_started;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Available Exams</h2>
        <p className="text-muted-foreground">Browse and attempt published examinations.</p>
      </div>

      <div className="grid gap-4">
        {exams.map((exam) => (
          <Card key={exam._id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{exam.title}</h3>
                  {statusBadge(exam.attemptStatus)}
                </div>
                <p className="text-sm text-muted-foreground">{exam.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {exam.questionCount} Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {exam.duration} Minutes
                  </span>
                  {exam.attemptStatus === "completed" && (
                    <span>Score: {exam.score}/{exam.totalMarks} ({exam.percentage}%)</span>
                  )}
                </div>
              </div>
              {exam.attemptStatus === "completed" ? (
                <Button variant="outline" asChild>
                  <Link to={`/student/results/${exam.resultId}`}>View Result</Link>
                </Button>
              ) : (
                <Button onClick={() => navigate(`/student/exams/${exam._id}/take`)}>
                  <Play className="h-4 w-4" />
                  {exam.attemptStatus === "in_progress" ? "Continue" : "Start Exam"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {exams.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No published exams available yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const submitExam = useCallback(async (autoSubmitted = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    try {
      const answerArray = questions.map((q) => ({
        questionId: q._id,
        selectedOption: answers[q._id] ?? null
      }));

      const res = await api.post(`/student/exams/${id}/submit`, {
        answers: answerArray,
        autoSubmitted
      });

      toast.success(autoSubmitted ? "Time's up! Exam auto-submitted." : "Exam submitted successfully!");
      navigate(`/student/results/${res.data.result._id}`);
    } catch (err) {
      submittedRef.current = false;
      toast.error(err.response?.data?.message || "Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  }, [answers, id, navigate, questions]);

  useEffect(() => {
    api.get(`/student/exams/${id}`)
      .then((res) => {
        setExam(res.data.exam);
        setQuestions(res.data.questions);

        const saved = {};
        Object.entries(res.data.savedAnswers || {}).forEach(([qId, opt]) => {
          saved[qId] = opt;
        });
        setAnswers(saved);

        const elapsed = Math.floor((Date.now() - new Date(res.data.startedAt).getTime()) / 1000);
        const total = res.data.exam.duration * 60;
        setTimeLeft(Math.max(0, total - elapsed));
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to start exam");
        navigate("/student/exams");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (timeLeft <= 0 || !exam || loading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, loading, submitExam, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const selectAnswer = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="font-semibold">{exam?.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length} • {answeredCount} answered
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold",
            timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {questions.map((q, i) => (
            <button
              key={q._id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
                i === currentIndex
                  ? "bg-primary text-primary-foreground"
                  : answers[q._id] !== undefined && answers[q._id] !== null
                    ? "bg-green-100 text-green-800"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Question {currentIndex + 1}</CardTitle>
            <CardDescription className="text-base text-foreground">
              {currentQuestion?.questionText}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion?.options.map((option, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(currentQuestion._id, i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                  answers[currentQuestion._id] === i
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <span className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                  answers[currentQuestion._id] === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex((i) => i + 1)}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (confirm("Submit your exam? This cannot be undone.")) {
                  submitExam(false);
                }
              }}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Exam"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/results")
      .then((res) => setResults(res.data.results))
      .catch(() => toast.error("Failed to load results"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Results</h2>
        <p className="text-muted-foreground">View your past examination results.</p>
      </div>

      <div className="grid gap-4">
        {results.map((result) => (
          <Card key={result._id}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold">{result.examId?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Submitted: {new Date(result.submittedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold">{result.percentage}%</p>
                  <p className="text-sm text-muted-foreground">{result.score}/{result.totalMarks}</p>
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/student/results/${result._id}`}>Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No results yet. Take an exam to see your scores here.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function ResultDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/student/results/${id}`)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load result"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { result, answers } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{result.exam?.title}</h2>
        <p className="text-muted-foreground">Detailed result breakdown</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Score</CardDescription></CardHeader>
          <CardContent><p className="text-3xl font-bold">{result.score}/{result.totalMarks}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Percentage</CardDescription></CardHeader>
          <CardContent>
            <p className={cn("text-3xl font-bold", result.percentage >= 60 ? "text-green-600" : "text-destructive")}>
              {result.percentage}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Status</CardDescription></CardHeader>
          <CardContent>
            <Badge variant={result.status === "submitted" ? "success" : "warning"}>
              {result.status === "auto_submitted" ? "Auto Submitted" : "Submitted"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {answers.map((a, i) => (
          <Card key={i} className={a.isCorrect ? "border-green-200" : "border-red-200"}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                {a.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
                )}
                <div className="flex-1 space-y-2">
                  <p className="font-medium">Q{i + 1}. {a.questionText}</p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {a.options.map((opt, j) => (
                      <p
                        key={j}
                        className={cn(
                          "rounded px-3 py-1.5 text-sm",
                          j === a.correctAnswer && "bg-green-100 text-green-800 font-medium",
                          j === a.selectedOption && j !== a.correctAnswer && "bg-red-100 text-red-800",
                          j !== a.correctAnswer && j !== a.selectedOption && "bg-muted"
                        )}
                      >
                        {String.fromCharCode(65 + j)}. {opt}
                        {j === a.correctAnswer && " ✓"}
                        {j === a.selectedOption && j !== a.correctAnswer && " ✗"}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" asChild>
        <Link to="/student/results">Back to Results</Link>
      </Button>
    </div>
  );
}

export function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/profile")
      .then((res) => setStudent(res.data.student))
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Profile</h2>
        <p className="text-muted-foreground">Your account information.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {student?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-semibold">{student?.name}</p>
              <Badge variant="secondary">{student?.role}</Badge>
            </div>
          </div>
          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{student?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={student?.status === "active" ? "success" : "warning"}>
                {student?.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">{new Date(student?.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
