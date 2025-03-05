/* eslint-disable @typescript-eslint/no-explicit-any */
import { Note } from "@/components/meeting-history/types";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { type ClassValue, clsx } from "clsx";
import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import { twMerge } from "tailwind-merge";
import { unified } from "unified";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Add this function to your existing utils.ts file
export function stripAnsiCodes(str: string): string {
  return str.replace(/\x1B\[[0-9;]*[JKmsu]/g, "");
}
export function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );
}

export function keysToCamelCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamelCase<T>(v)) as any;
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toCamelCase(key)]: keysToCamelCase(obj[key]),
      }),
      {}
    ) as T;
  }
  return obj;
}

export function encode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase();
  });
}
export const convertHtmlToMarkdown = (html: string) => {
  const convertedHtml = html.replace(
    /<img\s+(?:[^>]*?\s+)?src="([^"]*)"(?:\s+(?:[^>]*?\s+)?alt="([^"]*)")?\s*\/?>/g,
    (match, src, alt) => {
      return `![${alt || ""}](${src})`;
    }
  );
  return convertedHtml.replace(/<[^>]*>/g, "");
};

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
}

export const markdownToBlocks = async (markdown: string): Promise<BlockObjectRequest[]> => {
  const processedContent = await remark().use(remarkHtml).process(markdown);
  const htmlContent = processedContent.toString();

  return [
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text", // <-- Fix: This must be "text"
            text: { content: htmlContent },
          }, // <-- Explicitly cast it to the correct type
        ],
      },
    },
  ];
};

export const markdownToNotionBlocks = async (notes: Note[]): Promise<BlockObjectRequest[]> => {
  const blocks: BlockObjectRequest[] = [];

  for (const note of notes) {
    const tree = unified().use(remarkParse).parse(note.text);

    tree.children.forEach((node: any) => {
      if (node.type === "paragraph") {
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: { content: node.children.map((c: any) => c.value).join("") },
              },
            ],
          },
        });
      }

      if (node.type === "heading") {
        blocks.push({
          object: "block",
          type: `heading_${node.depth}` as any, // heading_1, heading_2, heading_3
          [`heading_${node.depth}`]: {
            rich_text: [
              {
                type: "text",
                text: { content: node.children.map((c: any) => c.value).join("") },
              },
            ],
          },
        } as any);
      }

      if (node.type === "list") {
        node.children.forEach((listItem: any) => {
          blocks.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                {
                  type: "text",
                  text: { content: listItem.children.map((c: any) => c.value).join("") },
                },
              ],
            },
          });
        });
      }
    });
  }

  return blocks;
};
