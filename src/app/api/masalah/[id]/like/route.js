import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import Masalah from "@/lib/models/masalah";
import { connect } from "@/lib/mongodb/mongoose";

export async function POST(request, { params }) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connect();

    const masalah = await Masalah.findById(id);
    if (!masalah) {
      return NextResponse.json({ error: "Masalah not found" }, { status: 404 });
    }

    await masalah.toggleLike(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
