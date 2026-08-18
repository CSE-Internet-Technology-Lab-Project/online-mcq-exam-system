import Exam from "../models/Exam.js";
import Question from "../models/Question.js";
import Result from "../models/Result.js";
import User from "../models/User.js";

const REQUIRED_QUESTIONS = 10;

const verifyExamOwnership = async (examId, teacherId) => {
  const exam = await Exam.findOne({ _id: examId, createdBy: teacherId });
  return exam;
};

export const createExam = async (req, res) => {
  try {
    const { title, description, duration } = req.body;

    if (!title || !duration) {
      return res.status(400).json({
        success: false,
        message: "Title and duration are required"
      });
    }

    const exam = await Exam.create({
      title,
      description: description || "",
      duration,
      createdBy: req.user.userId
    });

    res.status(201).json({ success: true, exam });
  } catch (error) {
    console.error("Create exam error:", error.message);
    res.status(500).json({ success: false, message: "Failed to create exam" });
  }
};

export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });

    const examsWithCounts = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await Question.countDocuments({ examId: exam._id });
        const attemptCount = await Result.countDocuments({
          examId: exam._id,
          status: { $in: ["submitted", "auto_submitted"] }
        });

        return {
          ...exam.toObject(),
          questionCount,
          attemptCount
        };
      })
    );

    res.status(200).json({ success: true, exams: examsWithCounts });
  } catch (error) {
    console.error("Get exams error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch exams" });
  }
};

export const getExamById = async (req, res) => {
  try {
    const exam = await verifyExamOwnership(req.params.id, req.user.userId);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const questions = await Question.find({ examId: exam._id }).sort({ order: 1 });

    res.status(200).json({ success: true, exam, questions });
  } catch (error) {
    console.error("Get exam error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch exam" });
  }
};

export const updateExam = async (req, res) => {
  try {
    const exam = await verifyExamOwnership(req.params.id, req.user.userId);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const { title, description, duration } = req.body;

    if (title) exam.title = title;
    if (description !== undefined) exam.description = description;
    if (duration) exam.duration = duration;

    await exam.save();

    res.status(200).json({ success: true, exam });
  } catch (error) {
    console.error("Update exam error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update exam" });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await verifyExamOwnership(req.params.id, req.user.userId);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    await Question.deleteMany({ examId: exam._id });
    await Result.deleteMany({ examId: exam._id });
    await exam.deleteOne();

    res.status(200).json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Delete exam error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete exam" });
  }
};

export const publishExam = async (req, res) => {
  try {
    const exam = await verifyExamOwnership(req.params.id, req.user.userId);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const questionCount = await Question.countDocuments({ examId: exam._id });

    if (questionCount !== REQUIRED_QUESTIONS) {
      return res.status(400).json({
        success: false,
        message: `Exam must have exactly ${REQUIRED_QUESTIONS} questions before publishing`
      });
    }

    exam.status = "published";
    await exam.save();

    res.status(200).json({ success: true, exam, message: "Exam published successfully" });
  } catch (error) {
    console.error("Publish exam error:", error.message);
    res.status(500).json({ success: false, message: "Failed to publish exam" });
  }
};

export const unpublishExam = async (req, res) => {
  try {
    const exam = await verifyExamOwnership(req.params.id, req.user.userId);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    exam.status = "draft";
    await exam.save();

    res.status(200).json({ success: true, exam, message: "Exam unpublished" });
  } catch (error) {
    console.error("Unpublish exam error:", error.message);
    res.status(500).json({ success: false, message: "Failed to unpublish exam" });
  }
};

export const addQuestion = async (req, res) => {
  try {
    const exam = await verifyExamOwnership(req.params.id, req.user.userId);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const questionCount = await Question.countDocuments({ examId: exam._id });

    if (questionCount >= REQUIRED_QUESTIONS) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${REQUIRED_QUESTIONS} questions allowed per exam`
      });
    }

    const { questionText, options, correctAnswer, marks } = req.body;

    if (!questionText || !options || correctAnswer === undefined) {
      return res.status(400).json({
        success: false,
        message: "Question text, options, and correct answer are required"
      });
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Exactly 4 options are required"
      });
    }

    if (correctAnswer < 0 || correctAnswer > 3) {
      return res.status(400).json({
        success: false,
        message: "Correct answer must be an index between 0 and 3"
      });
    }

    const question = await Question.create({
      examId: exam._id,
      questionText,
      options,
      correctAnswer,
      marks: marks || 1,
      order: questionCount
    });

    res.status(201).json({ success: true, question });
  } catch (error) {
    console.error("Add question error:", error.message);
    res.status(500).json({ success: false, message: "Failed to add question" });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const exam = await verifyExamOwnership(req.params.id, req.user.userId);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const question = await Question.findOne({
      _id: req.params.questionId,
      examId: exam._id
    });

    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const { questionText, options, correctAnswer, marks } = req.body;

    if (questionText) question.questionText = questionText;
    if (options) {
      if (options.length !== 4) {
        return res.status(400).json({
          success: false,
          message: "Exactly 4 options are required"
        });
      }
      question.options = options;
    }
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (marks) question.marks = marks;

    await question.save();

    res.status(200).json({ success: true, question });
  } catch (error) {
    console.error("Update question error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update question" });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const exam = await verifyExamOwnership(req.params.id, req.user.userId);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const question = await Question.findOneAndDelete({
      _id: req.params.questionId,
      examId: exam._id
    });

    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    res.status(200).json({ success: true, message: "Question deleted" });
  } catch (error) {
    console.error("Delete question error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete question" });
  }
};

export const getResults = async (req, res) => {
  try {
    const teacherExams = await Exam.find({ createdBy: req.user.userId }).select("_id title");
    const examIds = teacherExams.map((e) => e._id);

    const results = await Result.find({
      examId: { $in: examIds },
      status: { $in: ["submitted", "auto_submitted"] }
    })
      .populate("studentId", "name email")
      .populate("examId", "title duration")
      .sort({ submittedAt: -1 });

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Get results error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch results" });
  }
};

export const getExamResults = async (req, res) => {
  try {
    const exam = await verifyExamOwnership(req.params.id, req.user.userId);

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    const results = await Result.find({
      examId: exam._id,
      status: { $in: ["submitted", "auto_submitted"] }
    })
      .populate("studentId", "name email")
      .sort({ submittedAt: -1 });

    res.status(200).json({ success: true, exam, results });
  } catch (error) {
    console.error("Get exam results error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch exam results" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user.userId });
    const examIds = exams.map((e) => e._id);

    const totalExams = exams.length;
    const publishedExams = exams.filter((e) => e.status === "published").length;
    const totalAttempts = await Result.countDocuments({
      examId: { $in: examIds },
      status: { $in: ["submitted", "auto_submitted"] }
    });

    res.status(200).json({
      success: true,
      stats: { totalExams, publishedExams, totalAttempts }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};
