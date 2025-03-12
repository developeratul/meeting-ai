import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    const accessToken = authHeader.replace("Bearer ", "");
    const notion = new Client({ auth: accessToken });

    const database = await notion.databases.retrieve({
      database_id: params.id,
    });

    return NextResponse.json({
      database: {
        id: database.id,
        title: database.title[0]?.plain_text || "Untitled",
      },
    });
  } catch (error) {
    console.error("Error fetching database:", error);
    return NextResponse.json({ error: "Failed to fetch database" }, { status: 500 });
  }
}
