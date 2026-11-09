import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Registration from "@/models/Registration";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const password = request.nextUrl.searchParams.get("password");

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await dbConnect();

    const registration = await Registration.findById(id);

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found" },
        { status: 404 }
      );
    }

    // Toggle payment status
    registration.paymentStatus =
      registration.paymentStatus === "pending" ? "verified" : "pending";
    await registration.save();

    return NextResponse.json({
      success: true,
      data: {
        id: registration._id,
        paymentStatus: registration.paymentStatus,
      },
    });
  } catch (error: any) {
    console.error("Status toggle error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

