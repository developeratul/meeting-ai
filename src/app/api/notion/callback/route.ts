import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=no_code`);
    }

    // Exchange the code for an access token
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing client credentials");
    }

    const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/notion/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const data = await tokenResponse.json();

    // Redirect back to the app with the access token
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?access_token=${data.access_token}`
    );
  } catch (error) {
    console.error("Notion OAuth error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=auth_failed`);
  }
}
