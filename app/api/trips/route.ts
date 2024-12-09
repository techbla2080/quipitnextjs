// app/api/trips/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Trip } from "@/models/Trip";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { job_id, location, dateRange, interests, cities, content } = body;

    if (!job_id || !location) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
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

    return new NextResponse(
      JSON.stringify({
        _id: result.insertedId,
        ...trip
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error("[TRIPS_POST]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
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

    return new NextResponse(
      JSON.stringify(trips),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error("[TRIPS_GET]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const job_id = searchParams.get("job_id");

    if (!job_id) {
      return new NextResponse(
        JSON.stringify({ error: "Job ID required" }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const client = await clientPromise;
    const db = client.db("tripplanner");
    
    await db.collection<Trip>("trips").deleteOne({ job_id });

    return new NextResponse(
      JSON.stringify({ message: "Trip deleted" }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error("[TRIPS_DELETE]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}