import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

// 1. Create a Student or Teacher Account (Admin Action)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    return res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create user', error });
  }
});

// 2. Fetch all users for Admin Dashboard
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error });
  }
});

export default router;