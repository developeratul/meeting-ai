import { useState } from "react";

interface NotionConnection {
  access_token: string;
  database_id: string;
}

export const useNotionIntegration = () => {
  const [isSavingToNotion, setIsSavingToNotion] = useState(false);
  const [notionError, setNotionError] = useState<string | null>(null);

  const getNotionConnection = (): NotionConnection | null => {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("notion_connection");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  const saveToNotion = async (title: string, content: string, notionPageId?: string) => {
    setIsSavingToNotion(true);
    setNotionError(null);

    const connection = getNotionConnection();
    if (!connection) {
      setNotionError("Please connect your Notion account first");
      setIsSavingToNotion(false);
      return;
    }

    console.log({ connection });

    try {
      const response = await fetch("/api/notion/save-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          access_token: connection.access_token,
          database_id: connection.database_id,
          page_id: notionPageId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save to Notion");
      }

      return await response.json();
    } catch (error) {
      setNotionError(error instanceof Error ? error.message : "Failed to save to Notion");
      throw error;
    } finally {
      setIsSavingToNotion(false);
    }
  };

  return {
    saveToNotion,
    isSavingToNotion,
    notionError,
    isNotionConnected: !!getNotionConnection(),
  };
};
