import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Plus,
  BarChart3,
  Loader2,
  Trash2,
  Eye,
  Send,
  Undo2
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const teacherNav = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/teacher/exams", label: "My Exams", icon: FileText },
  { to: "/teacher/exams/create", label: "Create Exam", icon: Plus },
  { to: "/teacher/results", label: "Results", icon: BarChart3 }
];

export function TeacherLayout() {
  return (
    <DashboardLayout navItems={teacherNav} title="Teacher Portal" subtitle="Exam Management">
      <Outlet />
    </DashboardLayout>
  );
}

export function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/teacher/dashboard"),
      api.get("/teacher/exams")
    ])
      .then(([statsRes, examsRes]) => {
        setStats(statsRes.data.stats);
        setExams(examsRes.data.exams.slice(0, 5));
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
        <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
        <p className="text-muted-foreground">Manage your exams and view student performance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Total Exams", value: stats?.totalExams || 0 },
          { label: "Published", value: stats?.publishedExams || 0 },
          { label: "Total Attempts", value: stats?.totalAttempts || 0 }
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
            <CardTitle>Recent Exams</CardTitle>
            <CardDescription>Your latest created exams</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link to="/teacher/exams/create">Create Exam</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No exams yet. Create your first exam!</p>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div key={exam._id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {exam.questionCount}/10 questions • {exam.duration} min
                    </p>
                  </div>
                  <Badge variant={exam.status === "published" ? "success" : "secondary"}>
                    {exam.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TeacherExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchExams = () => {
    api.get("/teacher/exams")
      .then((res) => setExams(res.data.exams))
      .catch(() => toast.error("Failed to load exams"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this exam and all its questions?")) return;
    try {
      await api.delete(`/teacher/exams/${id}`);
      toast.success("Exam deleted");
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const handlePublish = async (id) => {
    try {
      await api.patch(`/teacher/exams/${id}/publish`);
      toast.success("Exam published!");
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish");
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await api.patch(`/teacher/exams/${id}/unpublish`);
      toast.success("Exam unpublished");
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unpublish");
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Exams</h2>
          <p className="text-muted-foreground">Manage all your examinations.</p>
        </div>
        <Button asChild>
          <Link to="/teacher/exams/create">Create Exam</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {exams.map((exam) => (
          <Card key={exam._id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{exam.title}</h3>
                  <Badge variant={exam.status === "published" ? "success" : "secondary"}>
                    {exam.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{exam.description || "No description"}</p>
                <p className="text-xs text-muted-foreground">
                  {exam.questionCount}/10 questions • {exam.duration} min • {exam.attemptCount} attempts
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/exams/${exam._id}/questions`)}>
                  <Eye className="h-4 w-4" />
                  Questions
                </Button>
                {exam.status === "draft" ? (
                  <Button size="sm" onClick={() => handlePublish(exam._id)} disabled={exam.questionCount < 10}>
                    <Send className="h-4 w-4" />
                    Publish
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => handleUnpublish(exam._id)}>
                    <Undo2 className="h-4 w-4" />
                    Unpublish
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => handleDelete(exam._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {exams.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No exams created yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function CreateExam() {
  const [form, setForm] = useState({ title: "", description: "", duration: "30" });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api.post("/teacher/exams", {
        ...form,
        duration: parseInt(form.duration, 10)
      });
      toast.success("Exam created! Now add 10 questions.");
      navigate(`/teacher/exams/${res.data.exam._id}/questions`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create exam");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create New Exam</h2>
        <p className="text-muted-foreground">Set up exam details, then add 10 MCQ questions.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Exam Title</Label>
              <Input
                placeholder="e.g. Data Structures Final Exam"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the exam..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min="1"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & Add Questions"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function ManageQuestions() {
  const { id: examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "0"
  });
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    api.get(`/teacher/exams/${examId}`)
      .then((res) => {
        setExam(res.data.exam);
        setQuestions(res.data.questions);
      })
      .catch(() => toast.error("Failed to load exam"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post(`/teacher/exams/${examId}/questions`, {
        questionText: form.questionText,
        options: form.options,
        correctAnswer: parseInt(form.correctAnswer, 10)
      });
      toast.success("Question added");
      setForm({ questionText: "", options: ["", "", "", ""], correctAnswer: "0" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add question");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm("Delete this question?")) return;
    try {
      await api.delete(`/teacher/exams/${examId}/questions/${questionId}`);
      toast.success("Question deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete question");
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
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
        <h2 className="text-2xl font-bold">{exam?.title}</h2>
        <p className="text-muted-foreground">
          {questions.length}/10 questions added • {exam?.duration} minutes
        </p>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card key={q._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="font-medium">Q{idx + 1}. {q.questionText}</p>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {q.options.map((opt, i) => (
                        <p
                          key={i}
                          className={`text-sm rounded px-3 py-1.5 ${
                            i === q.correctAnswer
                              ? "bg-green-100 text-green-800 font-medium"
                              : "bg-muted"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                        </p>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q._id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {questions.length < 10 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Question #{questions.length + 1}</CardTitle>
            <CardDescription>Each exam requires exactly 10 MCQ questions with 4 options.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Textarea
                  value={form.questionText}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                  required
                />
              </div>
              {form.options.map((opt, i) => (
                <div key={i} className="space-y-2">
                  <Label>Option {String.fromCharCode(65 + i)}</Label>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    required
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.correctAnswer}
                  onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                >
                  {form.options.map((opt, i) => (
                    <option key={i} value={i}>
                      {String.fromCharCode(65 + i)}. {opt || `Option ${String.fromCharCode(65 + i)}`}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Question"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {questions.length === 10 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="font-semibold text-green-800">All 10 questions added!</p>
              <p className="text-sm text-green-700">You can now publish this exam from the exams page.</p>
            </div>
            <Button asChild>
              <Link to="/teacher/exams">Go to Exams</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function TeacherResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/teacher/results")
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
        <h2 className="text-2xl font-bold">Student Results</h2>
        <p className="text-muted-foreground">View performance across all your exams.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium">Student</th>
                  <th className="px-6 py-3 text-left font-medium">Exam</th>
                  <th className="px-6 py-3 text-left font-medium">Score</th>
                  <th className="px-6 py-3 text-left font-medium">Percentage</th>
                  <th className="px-6 py-3 text-left font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result._id} className="border-b last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-medium">{result.studentId?.name}</p>
                      <p className="text-xs text-muted-foreground">{result.studentId?.email}</p>
                    </td>
                    <td className="px-6 py-4">{result.examId?.title}</td>
                    <td className="px-6 py-4">{result.score}/{result.totalMarks}</td>
                    <td className="px-6 py-4">
                      <Badge variant={result.percentage >= 60 ? "success" : "destructive"}>
                        {result.percentage}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(result.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No results yet. Publish an exam for students to attempt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
