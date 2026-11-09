import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Registration from "@/models/Registration";

export async function GET(request: NextRequest) {
  try {
    const password = request.nextUrl.searchParams.get("password");

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const registrations = await Registration.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Aggregation: size breakdown
    const sizeBreakdown = await Registration.aggregate([
      {
        $group: {
          _id: "$size",
          count: { $sum: "$quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalOrders = registrations.length;
    const totalQuantity = registrations.reduce((sum, r) => sum + r.quantity, 0);
    const price = parseInt(process.env.TSHIRT_PRICE || "1500", 10);
    const totalRevenue = totalQuantity * price;

    return NextResponse.json({
      success: true,
      data: {
        registrations,
        summary: {
          totalOrders,
          totalQuantity,
          totalRevenue,
          sizeBreakdown: sizeBreakdown.map((s) => ({
            size: s._id,
            count: s.count,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error("Admin fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

