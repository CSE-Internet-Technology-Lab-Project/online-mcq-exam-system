import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";

import { AdminLayout, AdminDashboard, AdminUsers } from "@/pages/admin/AdminPages";
import {
  TeacherLayout,
  TeacherDashboard,
  TeacherExams,
  CreateExam,
  ManageQuestions,
  TeacherResults
} from "@/pages/teacher/TeacherPages";
import {
  StudentLayout,
  StudentDashboard,
  StudentExams,
  TakeExam,
  StudentResults,
  ResultDetail,
  StudentProfile
} from "@/pages/student/StudentPages";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          {/* Teacher Routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="exams" element={<TeacherExams />} />
            <Route path="exams/create" element={<CreateExam />} />
            <Route path="exams/:id/questions" element={<ManageQuestions />} />
            <Route path="results" element={<TeacherResults />} />
          </Route>

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="exams" element={<StudentExams />} />
            <Route path="results" element={<StudentResults />} />
            <Route path="results/:id" element={<ResultDetail />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          <Route
            path="/student/exams/:id/take"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <TakeExam />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
