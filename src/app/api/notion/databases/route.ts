import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    const accessToken = authHeader.replace("Bearer ", "");
    const notion = new Client({ auth: accessToken });

    const response = await notion.search({
      filter: {
        property: "object",
        value: "database",
      },
    });

    if (!response.results) {
      throw new Error("No results returned from Notion");
    }

    const databases = response.results.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || "Untitled",
    }));

    return NextResponse.json({ databases });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch databases. Check server logs." },
      { status: 500 }
    );
  }
}
