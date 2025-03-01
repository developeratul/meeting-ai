"use client";

import { MeetingProvider } from "@/components/live-transcription/hooks/storage-for-live-meeting";
import { SettingsProvider } from "@/lib/hooks/use-settings";
import { queryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <MeetingProvider>{children}</MeetingProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
