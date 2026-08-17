import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

const MONGO_URI = 'mongodb+srv://sahelimahanty25_db_user:Saheli@online-mcq-exam-system.su1yizq.mongodb.net/';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    const pass = await bcrypt.hash('password123', 10);

    const initialUsers = [
      { name: 'Saheli (Teacher)', email: 'sahelimahanty25@gmail.com', password: pass, role: 'teacher' },
      { name: 'Student User', email: 'student@nitdgp.ac.in', password: pass, role: 'student' }
    ];

    for (let u of initialUsers) {
      await User.updateOne({ email: u.email }, u, { upsert: true });
    }

    console.log('Seeded initial accounts!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();