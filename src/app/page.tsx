"use client";

import { MeetingHistory } from "@/components/meeting-history/meeting-history";
import NotionConnection from "@/components/notion-connection";
import { useEffect } from "react";

// Instead of redirecting, show meetings directly at root
export default function HomePage() {
  useEffect(() => {
    console.log("homepage mounted");
  }, []);

  return (
    <div className="space-y-6">
      <NotionConnection />
      <MeetingHistory />
    </div>
  );
}
