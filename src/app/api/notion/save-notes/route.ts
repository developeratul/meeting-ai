import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

// Helper function to split text into chunks of max 2000 chars
function splitIntoChunks(text: string, maxLength: number = 2000) {
  const chunks = [];
  let currentChunk = "";

  // Split by double newlines to preserve paragraph structure
  const paragraphs = text.split("\n\n");

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk);

      // If paragraph itself is too long, split it
      if (paragraph.length > maxLength) {
        const words = paragraph.split(" ");
        currentChunk = words[0];

        for (let i = 1; i < words.length; i++) {
          if ((currentChunk + " " + words[i]).length <= maxLength) {
            currentChunk += " " + words[i];
          } else {
            chunks.push(currentChunk);
            currentChunk = words[i];
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      if (currentChunk) currentChunk += "\n\n";
      currentChunk += paragraph;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

export async function POST(request: Request) {
  try {
    const { title, content, access_token, database_id, page_id } = await request.json();

    if (!access_token || !database_id) {
      return NextResponse.json({ error: "Missing Notion credentials" }, { status: 400 });
    }

    const notion = new Client({ auth: access_token });
    const contentChunks = splitIntoChunks(content);

    if (page_id) {
      // Update existing page
      await notion.blocks.children.append({
        block_id: page_id,
        children: contentChunks.map((chunk) => ({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: chunk } }],
          },
        })),
      });

      return NextResponse.json({
        success: true,
        pageId: page_id,
      });
    } else {
      // Create new page
      const database = await notion.databases.retrieve({ database_id });
      const titleProperty = Object.entries(database.properties).find(
        ([_, prop]: [string, any]) => prop.type === "title"
      );

      if (!titleProperty) {
        throw new Error("No title property found in database");
      }

      const [titlePropertyName] = titleProperty;

      const response = await notion.pages.create({
        parent: { database_id },
        properties: {
          [titlePropertyName]: {
            title: [{ text: { content: title } }],
          },
        },
        children: contentChunks.map((chunk) => ({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: chunk } }],
          },
        })),
      });

      return NextResponse.json({
        success: true,
        pageId: response.id,
        url: response.url,
      });
    }
  } catch (error) {
    console.error("Error saving to Notion:", error);
    return NextResponse.json({ error: "Failed to save to Notion" }, { status: 500 });
  }
}
