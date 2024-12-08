// app/api/trips/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Trip } from "@/models/Trip";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { job_id, location, dateRange, interests, cities, content } = body;

    if (!job_id || !location) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("tripplanner");
    
    const trip: Trip = {
      job_id,
      location,
      dateRange,
      interests,
      cities,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection<Trip>("trips").insertOne(trip);

    return NextResponse.json({
      _id: result.insertedId,
      ...trip
    });
  } catch (error) {
    console.error("[TRIPS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("tripplanner");
    
    const trips = await db.collection<Trip>("trips")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(trips);
  } catch (error) {
    console.error("[TRIPS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const job_id = searchParams.get("job_id");

    if (!job_id) {
      return new NextResponse("Job ID required", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("tripplanner");
    
    await db.collection<Trip>("trips").deleteOne({ job_id });

    return NextResponse.json({ message: "Trip deleted" });
  } catch (error) {
    console.error("[TRIPS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}