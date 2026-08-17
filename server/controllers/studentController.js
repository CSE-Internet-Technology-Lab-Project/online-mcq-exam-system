import User from "../models/User.js";

export const getStudentProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user.userId).select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Student profile fetched successfully",
      student
    });
  } catch (error) {
    console.error("Get student profile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student profile"
    });
  }
};