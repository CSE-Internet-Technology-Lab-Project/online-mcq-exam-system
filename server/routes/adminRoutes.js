import express from 'express';
const router = express.Router();

// 1. Create a Student or Teacher account
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    res.status(201).json({ message: `${role} account created successfully` });
  } catch (error) {
    res.status(500).json({ message: "Failed to create user", error: error.message });
  }
});

// 2. Get all users (filter by role if provided: ?role=student or ?role=teacher)
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    res.status(200).json({ message: `Fetched ${role || 'all'} users` });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
});

// 3. Update user role or profile details
router.patch('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    res.status(200).json({ message: `User ${userId} updated successfully` });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
});

// 4. Delete user account
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    res.status(200).json({ message: `User ${userId} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
});

// 5. Delete exam / moderation data
router.delete('/exams/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    res.status(200).json({ message: `Exam ${examId} deleted by Admin` });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete exam", error: error.message });
  }
});

export default router;