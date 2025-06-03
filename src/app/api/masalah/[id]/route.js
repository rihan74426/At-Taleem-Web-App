import { NextResponse } from "next/server";
import Masalah from "@/lib/models/masalah";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connect } from "@/lib/mongodb/mongoose";

// GET /api/masalah/[id] - Get single masalah
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    await connect();

    const masalah = await Masalah.findById(id)
      .populate("categories", "name")
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
      })
      .lean();

    if (!masalah) {
      return NextResponse.json({ error: "Masalah not found" }, { status: 404 });
    }

    return NextResponse.json(masalah);
  } catch (error) {
    console.error("Error fetching masalah:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/masalah/[id] - Update entire masalah
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connect();

    const masalah = await Masalah.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!masalah) {
      return NextResponse.json({ error: "Masalah not found" }, { status: 404 });
    }

    return NextResponse.json(masalah);
  } catch (error) {
    console.error("Error updating masalah:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/masalah/[id] - Partially update masalah
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connect();

    const masalah = await Masalah.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!masalah) {
      return NextResponse.json({ error: "Masalah not found" }, { status: 404 });
    }

    return NextResponse.json(masalah);
  } catch (error) {
    console.error("Error updating masalah:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/masalah/[id] - Delete masalah
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connect();

    const masalah = await Masalah.findByIdAndDelete(id);

    if (!masalah) {
      return NextResponse.json({ error: "Masalah not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Masalah deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting masalah:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
