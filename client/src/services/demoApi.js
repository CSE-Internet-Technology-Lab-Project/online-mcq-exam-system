import demoData from "@/data/demoData.json";

const STORAGE_KEY = "mcq-demo-store";

let store = null;

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function initDemoStore() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      store = JSON.parse(saved);
      return store;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  store = cloneData(demoData);
  persistStore();
  return store;
}

export function resetDemoStore() {
  store = cloneData(demoData);
  persistStore();
  return store;
}

function getStore() {
  if (!store) initDemoStore();
  return store;
}

function persistStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function getCurrentUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function requireRole(roles) {
  const user = getCurrentUser();
  if (!user) throw { status: 401, message: "Authentication required" };
  if (roles && !roles.includes(user.role)) throw { status: 403, message: "Access denied" };
  return user;
}

function stripPassword(user) {
  const { password, ...safe } = user;
  return safe;
}

function getQuestionsForExam(examId) {
  return getStore().questions
    .filter((q) => q.examId === examId)
    .sort((a, b) => a.order - b.order);
}

function getExamWithMeta(exam, extra = {}) {
  const questionCount = getQuestionsForExam(exam._id).length;
  const attemptCount = getStore().results.filter(
    (r) => r.examId === exam._id && r.status !== "in_progress"
  ).length;
  return { ...exam, questionCount, attemptCount, ...extra };
}

export function handleDemoRequest(method, url, body) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const data = routeRequest(method, url, body);
        resolve({ data });
      } catch (err) {
        reject({
          response: {
            status: err.status || 500,
            data: { success: false, message: err.message || "Request failed" }
          }
        });
      }
    }, 300);
  });
}

function routeRequest(method, url, body) {
  const path = url.replace(/^\//, "");

  // AUTH
  if (method === "POST" && path === "auth/login") {
    const user = getStore().users.find(
      (u) => u.email === body.email && u.password === body.password
    );
    if (!user) throw { status: 401, message: "Invalid email or password" };
    if (user.status !== "active") throw { status: 403, message: "Your account is inactive" };
    return {
      success: true,
      message: "Login successful",
      token: `demo-token-${user._id}`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    };
  }

  // ADMIN
  if (path === "admin/dashboard") {
    requireRole(["admin"]);
    const users = getStore().users;
    return {
      success: true,
      stats: {
        totalUsers: users.length,
        totalStudents: users.filter((u) => u.role === "student").length,
        totalTeachers: users.filter((u) => u.role === "teacher").length,
        totalAdmins: users.filter((u) => u.role === "admin").length
      }
    };
  }

  if (path === "admin/users" && method === "GET") {
    requireRole(["admin"]);
    return { success: true, users: getStore().users.map(stripPassword) };
  }

  if (path === "admin/users" && method === "POST") {
    requireRole(["admin"]);
    if (getStore().users.some((u) => u.email === body.email)) {
      throw { status: 409, message: "Email already in use" };
    }
    const user = {
      _id: generateId("user"),
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
      status: "active",
      createdAt: new Date().toISOString()
    };
    getStore().users.push(user);
    persistStore();
    return { success: true, user: stripPassword(user) };
  }

  let adminUserMatch = path.match(/^admin\/users\/(.+)$/);
  if (adminUserMatch && method === "PUT") {
    requireRole(["admin"]);
    const user = getStore().users.find((u) => u._id === adminUserMatch[1]);
    if (!user) throw { status: 404, message: "User not found" };
    if (body.name) user.name = body.name;
    if (body.email) user.email = body.email;
    if (body.role) user.role = body.role;
    if (body.status) user.status = body.status;
    if (body.password) user.password = body.password;
    persistStore();
    return { success: true, user: stripPassword(user) };
  }

  if (adminUserMatch && method === "DELETE") {
    requireRole(["admin"]);
    const current = getCurrentUser();
    if (adminUserMatch[1] === current.id) throw { status: 400, message: "You cannot delete your own account" };
    const idx = getStore().users.findIndex((u) => u._id === adminUserMatch[1]);
    if (idx === -1) throw { status: 404, message: "User not found" };
    getStore().users.splice(idx, 1);
    persistStore();
    return { success: true, message: "User deleted successfully" };
  }

  // TEACHER
  if (path === "teacher/dashboard") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const exams = getStore().exams.filter((e) => e.createdBy === user.id);
    const examIds = exams.map((e) => e._id);
    return {
      success: true,
      stats: {
        totalExams: exams.length,
        publishedExams: exams.filter((e) => e.status === "published").length,
        totalAttempts: getStore().results.filter(
          (r) => examIds.includes(r.examId) && r.status !== "in_progress"
        ).length
      }
    };
  }

  if (path === "teacher/exams" && method === "GET") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const exams = getStore().exams
      .filter((e) => e.createdBy === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((e) => getExamWithMeta(e));
    return { success: true, exams };
  }

  if (path === "teacher/exams" && method === "POST") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const exam = {
      _id: generateId("exam"),
      title: body.title,
      description: body.description || "",
      duration: body.duration,
      totalMarks: 10,
      createdBy: user.id,
      status: "draft",
      createdAt: new Date().toISOString()
    };
    getStore().exams.push(exam);
    persistStore();
    return { success: true, exam };
  }

  let teacherExamMatch = path.match(/^teacher\/exams\/([^/]+)$/);
  if (teacherExamMatch && method === "GET") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const exam = getStore().exams.find((e) => e._id === teacherExamMatch[1] && e.createdBy === user.id);
    if (!exam) throw { status: 404, message: "Exam not found" };
    return { success: true, exam, questions: getQuestionsForExam(exam._id) };
  }

  if (teacherExamMatch && method === "PUT") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const exam = getStore().exams.find((e) => e._id === teacherExamMatch[1] && e.createdBy === user.id);
    if (!exam) throw { status: 404, message: "Exam not found" };
    if (body.title) exam.title = body.title;
    if (body.description !== undefined) exam.description = body.description;
    if (body.duration) exam.duration = body.duration;
    persistStore();
    return { success: true, exam };
  }

  if (teacherExamMatch && method === "DELETE") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const idx = getStore().exams.findIndex((e) => e._id === teacherExamMatch[1] && e.createdBy === user.id);
    if (idx === -1) throw { status: 404, message: "Exam not found" };
    const examId = getStore().exams[idx]._id;
    getStore().exams.splice(idx, 1);
    getStore().questions = getStore().questions.filter((q) => q.examId !== examId);
    getStore().results = getStore().results.filter((r) => r.examId !== examId);
    persistStore();
    return { success: true, message: "Exam deleted successfully" };
  }

  let publishMatch = path.match(/^teacher\/exams\/([^/]+)\/publish$/);
  if (publishMatch && method === "PATCH") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const exam = getStore().exams.find((e) => e._id === publishMatch[1] && e.createdBy === user.id);
    if (!exam) throw { status: 404, message: "Exam not found" };
    if (getQuestionsForExam(exam._id).length !== 10) {
      throw { status: 400, message: "Exam must have exactly 10 questions before publishing" };
    }
    exam.status = "published";
    persistStore();
    return { success: true, exam, message: "Exam published successfully" };
  }

  let unpublishMatch = path.match(/^teacher\/exams\/([^/]+)\/unpublish$/);
  if (unpublishMatch && method === "PATCH") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const exam = getStore().exams.find((e) => e._id === unpublishMatch[1] && e.createdBy === user.id);
    if (!exam) throw { status: 404, message: "Exam not found" };
    exam.status = "draft";
    persistStore();
    return { success: true, exam, message: "Exam unpublished" };
  }

  let addQuestionMatch = path.match(/^teacher\/exams\/([^/]+)\/questions$/);
  if (addQuestionMatch && method === "POST") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const exam = getStore().exams.find((e) => e._id === addQuestionMatch[1] && e.createdBy === user.id);
    if (!exam) throw { status: 404, message: "Exam not found" };
    const existing = getQuestionsForExam(exam._id);
    if (existing.length >= 10) throw { status: 400, message: "Maximum 10 questions allowed per exam" };
    const question = {
      _id: generateId("q"),
      examId: exam._id,
      questionText: body.questionText,
      options: body.options,
      correctAnswer: body.correctAnswer,
      marks: body.marks || 1,
      order: existing.length
    };
    getStore().questions.push(question);
    persistStore();
    return { success: true, question };
  }

  let questionMatch = path.match(/^teacher\/exams\/([^/]+)\/questions\/([^/]+)$/);
  if (questionMatch && method === "DELETE") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const exam = getStore().exams.find((e) => e._id === questionMatch[1] && e.createdBy === user.id);
    if (!exam) throw { status: 404, message: "Exam not found" };
    const idx = getStore().questions.findIndex((q) => q._id === questionMatch[2] && q.examId === exam._id);
    if (idx === -1) throw { status: 404, message: "Question not found" };
    getStore().questions.splice(idx, 1);
    persistStore();
    return { success: true, message: "Question deleted" };
  }

  if (path === "teacher/results" && method === "GET") {
    requireRole(["teacher"]);
    const user = getCurrentUser();
    const examIds = getStore().exams.filter((e) => e.createdBy === user.id).map((e) => e._id);
    const results = getStore().results
      .filter((r) => examIds.includes(r.examId) && r.status !== "in_progress")
      .map((r) => ({
        ...r,
        studentId: stripPassword(getStore().users.find((u) => u._id === r.studentId) || {}),
        examId: getStore().exams.find((e) => e._id === r.examId)
      }))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return { success: true, results };
  }

  // STUDENT
  if (path === "student/profile") {
    requireRole(["student"]);
    const user = getCurrentUser();
    const student = getStore().users.find((u) => u._id === user.id);
    if (!student) throw { status: 404, message: "Student not found" };
    return { success: true, student: stripPassword(student) };
  }

  if (path === "student/dashboard") {
    requireRole(["student"]);
    const user = getCurrentUser();
    const completed = getStore().results.filter(
      (r) => r.studentId === user.id && r.status !== "in_progress"
    );
    return {
      success: true,
      stats: {
        availableExams: getStore().exams.filter((e) => e.status === "published").length,
        completedExams: completed.length,
        averageScore: completed.length
          ? Math.round(completed.reduce((s, r) => s + r.percentage, 0) / completed.length)
          : 0
      }
    };
  }

  if (path === "student/exams" && method === "GET") {
    requireRole(["student"]);
    const user = getCurrentUser();
    const exams = getStore().exams
      .filter((e) => e.status === "published")
      .map((exam) => {
        const result = getStore().results.find((r) => r.studentId === user.id && r.examId === exam._id);
        const teacher = getStore().users.find((u) => u._id === exam.createdBy);
        return {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          createdBy: teacher ? { name: teacher.name } : null,
          questionCount: getQuestionsForExam(exam._id).length,
          attemptStatus: !result ? "not_started" : result.status === "in_progress" ? "in_progress" : "completed",
          resultId: result?._id || null,
          score: result?.status !== "in_progress" ? result?.score : null,
          percentage: result?.status !== "in_progress" ? result?.percentage : null
        };
      });
    return { success: true, exams };
  }

  let startExamMatch = path.match(/^student\/exams\/([^/]+)$/);
  if (startExamMatch && method === "GET") {
    requireRole(["student"]);
    const user = getCurrentUser();
    const exam = getStore().exams.find((e) => e._id === startExamMatch[1] && e.status === "published");
    if (!exam) throw { status: 404, message: "Exam not found or not published" };

    let result = getStore().results.find((r) => r.studentId === user.id && r.examId === exam._id);
    if (result && result.status !== "in_progress") {
      throw { status: 400, message: "You have already completed this exam" };
    }

    const questions = getQuestionsForExam(exam._id);
    if (questions.length !== 10) throw { status: 400, message: "Exam is not ready yet" };

    if (!result) {
      result = {
        _id: generateId("result"),
        studentId: user.id,
        examId: exam._id,
        answers: questions.map((q) => ({ questionId: q._id, selectedOption: null })),
        score: 0,
        totalMarks: 10,
        percentage: 0,
        startedAt: new Date().toISOString(),
        submittedAt: null,
        status: "in_progress"
      };
      getStore().results.push(result);
      persistStore();
    }

    const savedAnswers = {};
    result.answers.forEach((a) => {
      savedAnswers[a.questionId] = a.selectedOption;
    });

    return {
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks
      },
      questions: questions.map((q, i) => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks,
        order: i
      })),
      resultId: result._id,
      startedAt: result.startedAt,
      savedAnswers
    };
  }

  let submitMatch = path.match(/^student\/exams\/([^/]+)\/submit$/);
  if (submitMatch && method === "POST") {
    requireRole(["student"]);
    const user = getCurrentUser();
    const exam = getStore().exams.find((e) => e._id === submitMatch[1]);
    if (!exam) throw { status: 404, message: "Exam not found" };

    const result = getStore().results.find(
      (r) => r.studentId === user.id && r.examId === exam._id && r.status === "in_progress"
    );
    if (!result) throw { status: 400, message: "Exam not started" };

    const questions = getQuestionsForExam(exam._id);
    let score = 0;
    result.answers = questions.map((q) => {
      const ans = body.answers?.find((a) => a.questionId === q._id);
      const selectedOption = ans?.selectedOption ?? null;
      if (selectedOption === q.correctAnswer) score += q.marks;
      return { questionId: q._id, selectedOption };
    });
    result.score = score;
    result.totalMarks = questions.reduce((s, q) => s + q.marks, 0);
    result.percentage = Math.round((score / result.totalMarks) * 100);
    result.submittedAt = new Date().toISOString();
    result.status = body.autoSubmitted ? "auto_submitted" : "submitted";
    persistStore();

    return {
      success: true,
      result: {
        _id: result._id,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        status: result.status,
        submittedAt: result.submittedAt
      }
    };
  }

  if (path === "student/results" && method === "GET") {
    requireRole(["student"]);
    const user = getCurrentUser();
    const results = getStore().results
      .filter((r) => r.studentId === user.id && r.status !== "in_progress")
      .map((r) => ({
        ...r,
        examId: getStore().exams.find((e) => e._id === r.examId)
      }))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return { success: true, results };
  }

  let resultDetailMatch = path.match(/^student\/results\/([^/]+)$/);
  if (resultDetailMatch && method === "GET") {
    requireRole(["student"]);
    const user = getCurrentUser();
    const result = getStore().results.find(
      (r) => r._id === resultDetailMatch[1] && r.studentId === user.id && r.status !== "in_progress"
    );
    if (!result) throw { status: 404, message: "Result not found" };

    const exam = getStore().exams.find((e) => e._id === result.examId);
    const questions = getQuestionsForExam(result.examId);

    const answers = questions.map((q) => {
      const studentAnswer = result.answers.find((a) => a.questionId === q._id);
      return {
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedOption: studentAnswer?.selectedOption ?? null,
        isCorrect: studentAnswer?.selectedOption === q.correctAnswer,
        marks: q.marks
      };
    });

    return {
      success: true,
      result: {
        _id: result._id,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        status: result.status,
        startedAt: result.startedAt,
        submittedAt: result.submittedAt,
        exam
      },
      answers
    };
  }

  throw { status: 404, message: "Endpoint not found" };
}
