"use server";

import { createNotionClient } from "@/lib/notion";
import { UserObjectResponse } from "@notionhq/client/build/src/api-endpoints";

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
