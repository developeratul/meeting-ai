"use client";

import { MeetingHistory } from "@/components/meeting-history/meeting-history";
import NotionConnection from "@/components/notion-connection";

export default function MeetingsPage() {
  return (
    <div className="space-y-6">
      <NotionConnection />
      <MeetingHistory />
    </div>
  );
}
