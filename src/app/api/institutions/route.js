// src/app/api/institutions/route.js

import Institution from "@/lib/models/Institution";
import { connect } from "@/lib/mongodb/mongoose";

// GET /api/institutions?id=…&limit=…
export async function GET(req) {
  await connect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  // Fetch one by id
  if (id) {
    try {
      const inst = await Institution.findById(id);
      if (!inst) {
        return new Response(
          JSON.stringify({ error: "Institution not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ institution: inst }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("GET /institutions error:", err);
      return new Response(
        JSON.stringify({ error: "Error fetching institution" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Fetch list
  try {
    const list = await Institution.find({})
      .sort({ createdAt: -1 })
      .limit(limit);
    return new Response(JSON.stringify({ institutions: list }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /institutions list error:", err);
    return new Response(
      JSON.stringify({ error: "Error fetching institutions" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// POST /api/institutions
export async function POST(req) {
  await connect();
  const body = await req.json();
  const {
    title,
    code,
    description,
    email,
    phone,
    logoUrl,
    address,
    departments,
    admissionStatus,
    admissionPeriod,
    studentCount,
    establishedAt,
    social,
  } = body;

  // validate required
  if (!title || !email || !address) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const inst = new Institution({
      title,
      code,
      description,
      email,
      phone,
      logoUrl,
      address,
      departments,
      admissionStatus,
      admissionPeriod,
      studentCount,
      establishedAt,
      social,
    });
    await inst.save();
    return new Response(JSON.stringify({ institution: inst }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("POST /institutions error:", err);
    return new Response(JSON.stringify({ error: "Failed to create" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// PUT /api/institutions
// full update: requires body.id + all fields
export async function PUT(req) {
  await connect();
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const inst = await Institution.findById(id);
    if (!inst) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    // overwrite all updatable fields
    Object.assign(inst, updates);
    const saved = await inst.save();
    return new Response(JSON.stringify({ institution: saved }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PUT /institutions error:", err);
    return new Response(JSON.stringify({ error: "Failed to update" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// PATCH /api/institutions
// partial update: body.id + fields to patch
export async function PATCH(req) {
  await connect();
  const body = await req.json();
  const { id, ...patch } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const updated = await Institution.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true }
    );
    if (!updated) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ institution: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PATCH /institutions error:", err);
    return new Response(JSON.stringify({ error: "Failed to patch" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE /api/institutions
export async function DELETE(req) {
  await connect();
  const { id } = await req.json();
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const inst = await Institution.findByIdAndDelete(id);
    if (!inst) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /institutions error:", err);
    return new Response(JSON.stringify({ error: "Failed to delete" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
