import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getProfile,
  getExams,
  startExam,
  submitExam,
  getResults,
  getResultById,
  getDashboardStats,
  saveProgress
} from "../controllers/studentController.js";

const router = express.Router();

router.use(protect, authorizeRoles("student"));

router.get("/profile", getProfile);
router.get("/dashboard", getDashboardStats);
router.get("/exams", getExams);
router.get("/exams/:id", startExam);
router.post("/exams/:id/submit", submitExam);
router.put("/exams/:id/progress", saveProgress);
router.get("/results", getResults);
router.get("/results/:id", getResultById);

export default router;
