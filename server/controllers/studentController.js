import User from "../models/User.js";
import Exam from "../models/Exam.js";
import Question from "../models/Question.js";
import Result from "../models/Result.js";

export const getProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user.userId).select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    if (student.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.status(200).json({ success: true, student });
  } catch (error) {
    console.error("Profile error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student profile"
    });
  }
};

export const getExams = async (req, res) => {
  try {
    const publishedExams = await Exam.find({ status: "published" })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    const studentId = req.user.userId;

    const examsWithStatus = await Promise.all(
      publishedExams.map(async (exam) => {
        const result = await Result.findOne({ studentId, examId: exam._id });
        const questionCount = await Question.countDocuments({ examId: exam._id });

        return {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          createdBy: exam.createdBy,
          questionCount,
          attemptStatus: result
            ? result.status === "in_progress"
              ? "in_progress"
              : "completed"
            : "not_started",
          resultId: result?._id || null,
          score: result?.status !== "in_progress" ? result?.score : null,
          percentage: result?.status !== "in_progress" ? result?.percentage : null
        };
      })
    );

    res.status(200).json({ success: true, exams: examsWithStatus });
  } catch (error) {
    console.error("Get student exams error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch exams" });
  }
};

export const startExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      status: "published"
    });

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found or not published" });
    }

    const studentId = req.user.userId;

    let result = await Result.findOne({ studentId, examId: exam._id });

    if (result && result.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "You have already completed this exam"
      });
    }

    const questions = await Question.find({ examId: exam._id }).sort({ order: 1 });

    if (questions.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Exam is not ready yet"
      });
    }

    if (!result) {
      result = await Result.create({
        studentId,
        examId: exam._id,
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedOption: null
        })),
        totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
        startedAt: new Date(),
        status: "in_progress"
      });
    }

    const safeQuestions = questions.map((q, index) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks,
      order: index
    }));

    const savedAnswers = result.answers.reduce((acc, a) => {
      acc[a.questionId.toString()] = a.selectedOption;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks
      },
      questions: safeQuestions,
      resultId: result._id,
      startedAt: result.startedAt,
      savedAnswers
    });
  } catch (error) {
    console.error("Start exam error:", error.message);
    res.status(500).json({ success: false, message: "Failed to start exam" });
  }
};

export const submitExam = async (req, res) => {
  try {
    const { answers, autoSubmitted } = req.body;
    const studentId = req.user.userId;
    const examId = req.params.id;

    const exam = await Exam.findOne({ _id: examId, status: "published" });

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const result = await Result.findOne({ studentId, examId });

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Exam not started"
      });
    }

    if (result.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Exam already submitted"
      });
    }

    const questions = await Question.find({ examId });

    let score = 0;
    const evaluatedAnswers = questions.map((q) => {
      const studentAnswer = answers?.find(
        (a) => a.questionId === q._id.toString() || a.questionId === q._id
      );
      const selectedOption = studentAnswer?.selectedOption ?? null;
      const isCorrect = selectedOption === q.correctAnswer;

      if (isCorrect) score += q.marks;

      return {
        questionId: q._id,
        selectedOption
      };
    });

    result.answers = evaluatedAnswers;
    result.score = score;
    result.totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    result.percentage = result.totalMarks > 0
      ? Math.round((score / result.totalMarks) * 100)
      : 0;
    result.submittedAt = new Date();
    result.status = autoSubmitted ? "auto_submitted" : "submitted";

    await result.save();

    res.status(200).json({
      success: true,
      result: {
        _id: result._id,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        status: result.status,
        submittedAt: result.submittedAt
      }
    });
  } catch (error) {
    console.error("Submit exam error:", error.message);
    res.status(500).json({ success: false, message: "Failed to submit exam" });
  }
};

export const getResults = async (req, res) => {
  try {
    const results = await Result.find({
      studentId: req.user.userId,
      status: { $in: ["submitted", "auto_submitted"] }
    })
      .populate("examId", "title duration totalMarks")
      .sort({ submittedAt: -1 });

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Get student results error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch results" });
  }
};

export const getResultById = async (req, res) => {
  try {
    const result = await Result.findOne({
      _id: req.params.id,
      studentId: req.user.userId,
      status: { $in: ["submitted", "auto_submitted"] }
    }).populate("examId", "title duration totalMarks");

    if (!result) {
      return res.status(404).json({ success: false, message: "Result not found" });
    }

    const questions = await Question.find({ examId: result.examId._id }).sort({ order: 1 });

    const detailedAnswers = questions.map((q) => {
      const studentAnswer = result.answers.find(
        (a) => a.questionId.toString() === q._id.toString()
      );

      return {
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedOption: studentAnswer?.selectedOption ?? null,
        isCorrect: studentAnswer?.selectedOption === q.correctAnswer,
        marks: q.marks
      };
    });

    res.status(200).json({
      success: true,
      result: {
        _id: result._id,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        status: result.status,
        startedAt: result.startedAt,
        submittedAt: result.submittedAt,
        exam: result.examId
      },
      answers: detailedAnswers
    });
  } catch (error) {
    console.error("Get result detail error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch result" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [availableExams, completedResults] = await Promise.all([
      Exam.countDocuments({ status: "published" }),
      Result.find({
        studentId,
        status: { $in: ["submitted", "auto_submitted"] }
      })
    ]);

    const averageScore = completedResults.length > 0
      ? Math.round(
          completedResults.reduce((sum, r) => sum + r.percentage, 0) / completedResults.length
        )
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        availableExams,
        completedExams: completedResults.length,
        averageScore
      }
    });
  } catch (error) {
    console.error("Student stats error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

export const saveProgress = async (req, res) => {
  try {
    const { answers } = req.body;
    const studentId = req.user.userId;
    const examId = req.params.id;

    const result = await Result.findOne({
      studentId,
      examId,
      status: "in_progress"
    });

    if (!result) {
      return res.status(404).json({ success: false, message: "No active exam session" });
    }

    if (answers && Array.isArray(answers)) {
      result.answers = answers.map((a) => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption
      }));
      await result.save();
    }

    res.status(200).json({ success: true, message: "Progress saved" });
  } catch (error) {
    console.error("Save progress error:", error.message);
    res.status(500).json({ success: false, message: "Failed to save progress" });
  }
};
