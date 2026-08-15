# Online MCQ Exam System

A role-based online examination system built with **React, Node.js, Express.js, and MongoDB**. The system supports three roles: **Admin, Teacher/Examiner, and Student**.

## Features

### Admin
- Secure admin login
- Create and manage student accounts
- Create and manage teacher/examiner accounts
- Manage users and roles
- Manage examination-related data

### Teacher / Examiner
- Secure role-based login
- Create and manage exams
- Add exactly 10 MCQ questions per exam
- Define options and correct answers
- Set exam duration
- Publish exams for students
- View student performance and results

### Student
- Secure role-based login
- View available published exams
- Start a timed examination
- Attempt 10 MCQ questions
- Navigate between questions
- Submit answers manually or automatically when time expires
- Receive automatically evaluated scores
- View previous examination results

## System Workflow

```text
                         LOGIN
                           |
              +------------+------------+
              |            |             |
            ADMIN       TEACHER       STUDENT
              |            |             |
        Manage Users   Create Exam    View Exams
        Manage Roles   Add 10 MCQs    Start Exam
                         Set Answers    Timer
                         Set Timing     Answer
                         Publish        Submit
              |            |             |
              +------------+-------------+
                           |
                    Server-side Evaluation
                           |
                         Scoring
                           |
                        MongoDB
                           |
                    Result / Analytics
```

## Technology Stack

### Frontend
- React
- React Router
- Axios
- CSS / Tailwind CSS (as configured)

### Backend
- Node.js
- Express.js
- Mongoose
- JWT authentication
- bcrypt/bcryptjs for password hashing

### Database
- MongoDB / MongoDB Atlas

## Architecture

```text
online-mcq-exam-system/
|
+-- client/                 # React frontend
|   +-- src/
|       +-- components/
|       +-- pages/
|       |   +-- admin/
|       |   +-- teacher/
|       |   +-- student/
|       +-- services/
|       +-- App.jsx
|
+-- server/                 # Node.js + Express backend
    +-- config/
    +-- controllers/
    +-- middleware/
    +-- models/
    +-- routes/
    +-- server.js
```

## User Roles and Authorization

The application uses **Role-Based Access Control (RBAC)**.

| Role | Main Responsibilities |
|---|---|
| Admin | Manage students, teachers, users, and exam-related data |
| Teacher | Create exams, manage 10 MCQs, set answers/duration, view results |
| Student | Attempt exams, submit answers, view scores and previous results |

Authentication verifies **who the user is**, while authorization verifies **what the user is allowed to access**.

## Database Design

The planned database consists of the following main collections:

### Users

```text
users
- name
- email
- password
- role
- status
```

`role` can be:

```text
admin
teacher
student
```

### Exams

```text
exams
- title
- description
- duration
- totalMarks
- createdBy
- status
```

### Questions

```text
questions
- examId
- questionText
- options
- correctAnswer
- marks
```

### Exam Attempts / Results

```text
results
- studentId
- examId
- answers
- score
- totalMarks
- percentage
- startedAt
- submittedAt
- status
```

## Authentication Flow

1. Admin creates student/teacher accounts.
2. User logs in using their credentials.
3. Backend verifies the password using bcrypt.
4. Backend generates a JWT containing the user's identity and role.
5. React uses the authenticated session to display the appropriate dashboard.
6. Backend middleware verifies the JWT for protected APIs.
7. Role middleware ensures users can access only authorized endpoints.

Example:

```text
Student
   |
   +--> Student APIs       OK
   |
   +--> Teacher APIs       403 Forbidden
   |
   +--> Admin APIs         403 Forbidden
```

Correct answers are kept on the backend and are **not exposed to students while taking an exam**. Final evaluation and scoring are performed server-side.

## Exam Flow

```text
Teacher creates exam
        |
        v
Adds 10 MCQs
        |
        v
Sets correct answers + duration
        |
        v
Publishes exam
        |
        v
Student views available exams
        |
        v
Student starts exam
        |
        v
Timer starts
        |
        v
Student answers 10 questions
        |
        +---- Time expires ----+
        |                       |
        v                       v
   Manual Submit          Automatic Submit
        |                       |
        +-----------+-----------+
                    |
                    v
            Server-side Evaluation
                    |
                    v
              Score Calculation
                    |
                    v
             Result stored in DB
                    |
                    v
              Student sees result
```

## Getting Started

### Prerequisites

Install the following:

- Node.js (LTS recommended)
- npm
- MongoDB or a MongoDB Atlas account
- Git

### Clone the Repository

```bash
git clone https://github.com/sahelidgp/online-mcq-exam-system.git
cd online-mcq-exam-system
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

The React development server will run on the URL shown in the terminal.

### Backend Setup

Open another terminal:

```bash
cd server
npm install
npm run dev
```

If a `dev` script has not yet been configured, use:

```bash
node server.js
```

## Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

**Never commit `.env` to GitHub.**

A safe `.env.example` file can be committed instead:

```env
PORT=
MONGO_URI=
JWT_SECRET=
```

## Git Workflow

This project is developed collaboratively by three team members.

```text
main
 |
 +-- feature/student
 |
 +-- feature/teacher
 |
 +-- feature/admin
```

Each member works on their assigned role and creates a Pull Request before merging into `main`.

### Recommended workflow

```bash
git checkout main
git pull origin main

git checkout -b feature/student

# Make changes

git add .
git commit -m "feat: add student exam workflow"
git push -u origin feature/student
```

Then create a Pull Request on GitHub.

## API Structure

Planned API organization:

```text
/api/auth
/api/admin
/api/teacher
/api/student
```

Example student endpoints:

```text
GET  /api/student/exams
GET  /api/student/exams/:id
POST /api/student/exams/:id/submit
GET  /api/student/results
```

Example teacher endpoints:

```text
POST   /api/teacher/exams
GET    /api/teacher/exams
PUT    /api/teacher/exams/:id
DELETE /api/teacher/exams/:id
POST   /api/teacher/exams/:id/questions
GET    /api/teacher/results
```

Example admin endpoints:

```text
POST   /api/admin/users
GET    /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
```

## Security Considerations

- Passwords are hashed before storage.
- JWT is used for authenticated API access.
- Role-based middleware protects restricted routes.
- Correct answers are not sent to the student during the exam.
- Final scoring is performed on the backend.
- Environment variables are used for secrets and database credentials.
- `.env` files should never be committed to GitHub.

## Future Enhancements

- Question and option randomization
- Negative marking
- Exam attempt restrictions
- Search and filtering
- Pagination
- Student performance analytics
- Teacher performance dashboard
- Leaderboard
- Auto-save of answers
- Email notifications

## Team

Developed as a collaborative full-stack project using GitHub and Git.

### Roles



## License

This project is developed for educational and academic purposes.
