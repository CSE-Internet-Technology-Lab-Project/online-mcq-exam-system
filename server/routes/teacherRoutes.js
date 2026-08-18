import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  unpublishExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getResults,
  getExamResults,
  getDashboardStats
} from "../controllers/teacherController.js";

const router = express.Router();

router.use(protect, authorizeRoles("teacher"));

router.get("/dashboard", getDashboardStats);
router.get("/exams", getExams);
router.post("/exams", createExam);
router.get("/exams/:id", getExamById);
router.put("/exams/:id", updateExam);
router.delete("/exams/:id", deleteExam);
router.patch("/exams/:id/publish", publishExam);
router.patch("/exams/:id/unpublish", unpublishExam);
router.post("/exams/:id/questions", addQuestion);
router.put("/exams/:id/questions/:questionId", updateQuestion);
router.delete("/exams/:id/questions/:questionId", deleteQuestion);
router.get("/results", getResults);
router.get("/results/:id", getExamResults);

export default router;
