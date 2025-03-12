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

    // Fetch user's workspace info
    const response = await notion.users.me();

    const workspace = {
      name: response.bot?.workspace_name || "Notion Workspace",
      icon: response.bot?.workspace_icon || null,
    };

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return NextResponse.json({ error: "Failed to fetch workspace" }, { status: 500 });
  }
}
