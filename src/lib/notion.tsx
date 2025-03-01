import { Client } from "@notionhq/client";
import localforage from "localforage";

const NOTION_TOKEN_KEY = "notionToken";

export async function setNotionToken(providedToken: string | null) {
  localforage.setItem(NOTION_TOKEN_KEY, providedToken);
  return await getNotionToken();
}

export async function getNotionToken() {
  const val = await localforage.getItem<string>(NOTION_TOKEN_KEY);
  return val;
}

export async function createNotionClient(providedToken?: string) {
  const token = providedToken || (await getNotionToken());

  if (!token) {
    throw new Error("No Token provided");
  }

  return new Client({
    auth: token,
  });
}
