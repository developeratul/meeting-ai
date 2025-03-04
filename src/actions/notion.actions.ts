"use server";

import { createNotionClient } from "@/lib/notion";
import { BlockObjectRequest, UserObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export async function checkNotionConnection(providedToken: string) {
  try {
    const client = await createNotionClient(providedToken);

    const user = await client.users.me({});

    if (!user) {
      return false;
    }

    // Valid token
    return true;
  } catch (error) {
    console.log(JSON.stringify(error));
    return false;
  }
}

export async function getNotionUser(
  token: string
): Promise<{ type: "error"; message: string } | { type: "success"; data: UserObjectResponse }> {
  try {
    const client = await createNotionClient(token);

    const user = await client.users.me({});

    return { type: "success", data: user };
  } catch (err) {
    console.log(JSON.stringify(err));
    return { type: "error", message: "Notion Authentication was corrupted" };
  }
}

export async function createNotionPage(token: string, title: string, blocks: BlockObjectRequest[]) {
  const notion = await createNotionClient(token);

  // https://www.notion.so/developeratul/1ac7233d3fce8006938dcc73369f478c?v=1ac7233d3fce80368b18000c1784787b&pvs=4
  console.log("API clal");

  const non = await notion.pages.create({
    parent: { database_id: "1ac7233d3fce8006938dcc73369f478c", type: "database_id" }, // No specific parent page
    properties: {
      title: [
        {
          type: "text",
          text: { content: title },
        },
      ],
    },
    children: blocks,
  });
  console.log({ non });
}
