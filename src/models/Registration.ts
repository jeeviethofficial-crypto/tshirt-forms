import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRegistration extends Document {
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  quantity: number;
  slipUrl: string;
  paymentStatus: "pending" | "verified";
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must not exceed 100 characters"],
    },
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      trim: true,
      match: [/^IT\d{6}$/i, "Student ID must be in format ITxxxxxx"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "WhatsApp number is required"],
      trim: true,
      match: [/^[\d+\-\s()]{7,20}$/, "Please provide a valid phone number"],
    },
    size: {
      type: String,
      required: [true, "T-shirt size is required"],
      enum: {
        values: ["XS", "S", "M", "L", "XL", "XXL"],
        message: "{VALUE} is not a valid size",
      },
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      max: [10, "Quantity must not exceed 10"],
      default: 1,
    },
    slipUrl: {
      type: String,
      required: [true, "Payment slip is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>("Registration", RegistrationSchema);

export default Registration;

