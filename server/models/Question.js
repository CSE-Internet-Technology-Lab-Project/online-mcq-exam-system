import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    options: {
      type: [String],
      validate: {
        validator: (v) => v.length === 4,
        message: "Exactly 4 options are required"
      },
      required: true
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    marks: {
      type: Number,
      default: 1
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
