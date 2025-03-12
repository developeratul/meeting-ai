"use client";

import { MeetingHistory } from "@/components/meeting-history/meeting-history";
import { NotionConnect } from "@/components/notion/notion-connect";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <NotionConnect />
      <MeetingHistory />
    </div>
  );
}
