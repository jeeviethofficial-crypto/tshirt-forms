import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { sendOrderReceipt } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const fullName = formData.get("fullName") as string;
    const studentId = formData.get("studentId") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const size = formData.get("size") as string;
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const slip = formData.get("slip") as File | null;

    // --- Validation ---
    const errors: string[] = [];

    if (!fullName || fullName.trim().length < 2) {
      errors.push("Full name must be at least 2 characters.");
    }
    const cleanStudentId = studentId?.trim().toUpperCase();
    if (!cleanStudentId || !/^IT\d{6}$/i.test(cleanStudentId)) {
      errors.push("Student ID must be in format ITxxxxxx (e.g., IT123456).");
    }
    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      errors.push("Please provide a valid email address.");
    }
    if (!phone || !/^[\d+\-\s()]{7,20}$/.test(phone.trim())) {
      errors.push("Please provide a valid WhatsApp number.");
    }
    if (!["XS", "S", "M", "L", "XL", "XXL"].includes(size)) {
      errors.push("Please select a valid T-shirt size.");
    }
    if (!quantity || quantity < 1 || quantity > 10) {
      errors.push("Quantity must be between 1 and 10.");
    }
    if (!slip) {
      errors.push("Payment slip screenshot is required.");
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    await dbConnect();

    // Prevent spam / accidental double submit within the same minute
    const recentDuplicate = await Registration.findOne({
      studentId: cleanStudentId,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            "You have submitted an order in the last 60 seconds. Please check your email or wait a moment.",
          ],
        },
        { status: 429 }
      );
    }

    // --- Upload slip to Cloudinary ---
    const bytes = await slip!.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const slipUrl = await uploadToCloudinary(buffer);

    const validSize = size as "XS" | "S" | "M" | "L" | "XL" | "XXL";

    const registration = await Registration.create({
      fullName: fullName.trim(),
      studentId: cleanStudentId,
      email: cleanEmail,
      phone: phone.trim(),
      size: validSize,
      quantity,
      slipUrl,
    });

    const regId = (registration as unknown as { _id: string })._id.toString();
    const unitPrice = parseInt(process.env.TSHIRT_PRICE || "1500", 10);
    const totalAmount = quantity * unitPrice;

    // Send receipt email asynchronously in background
    sendOrderReceipt({
      to: cleanEmail,
      fullName: fullName.trim(),
      studentId: cleanStudentId,
      size: validSize,
      quantity,
      totalAmount,
      orderId: regId,
    }).catch((err) => console.error("Email notification failed:", err));

    return NextResponse.json(
      {
        success: true,
        data: {
          id: regId,
          fullName: registration.fullName,
          studentId: registration.studentId,
          email: registration.email,
          size: registration.size,
          quantity: registration.quantity,
          paymentStatus: registration.paymentStatus,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, errors: [error.message] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        errors: [
          error?.message || "Internal server error. Please try again.",
        ],
      },
      { status: 500 }
    );
  }
}
