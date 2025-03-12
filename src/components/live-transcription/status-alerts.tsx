import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ServiceStatus } from "../meeting-history/types";

interface StatusAlertsProps {
  serviceStatus?: ServiceStatus;
  minimal?: boolean;
  isRecording: boolean;
  error?: string;
  notionError?: string | null;
  isSavingToNotion?: boolean;
}

export function StatusAlerts({
  serviceStatus,
  minimal = false,
  isRecording,
  error,
  notionError,
  isSavingToNotion,
}: StatusAlertsProps) {
  if (minimal) {
    return (
      <div className="fixed top-2 right-2 z-50">
        {serviceStatus === "available" ? (
          <div className="w-2 h-2 rounded-full bg-green-500" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-red-500" />
        )}
      </div>
    );
  }

  if (serviceStatus === "no_subscription") {
    return (
      <Alert className="mb-4 border-red-500">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-500 font-medium">
          please subscribe to screenpipe cloud in settings.
        </AlertDescription>
      </Alert>
    );
  }

  if (serviceStatus === "forbidden") {
    return (
      <Alert className="mb-4 border-red-500">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-500 font-medium">
          real-time transcription is disabled. please enable it in screenpipe settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {isSavingToNotion && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Saving to Notion...</AlertTitle>
        </Alert>
      )}

      {notionError && (
        <Alert variant="destructive">
          <AlertTitle>Failed to save to Notion</AlertTitle>
          <AlertDescription>{notionError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
