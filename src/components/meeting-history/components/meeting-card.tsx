import { LiveMeetingData } from "@/components/live-transcription/hooks/storage-for-live-meeting";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "@screenpipe/browser";
import { ChevronDown, FileText, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { MeetingAnalysis } from "../../live-transcription/hooks/ai-create-all-notes";
import { generateMeetingSummary } from "../../live-transcription/hooks/ai-meeting-summary";
import { generateMeetingName } from "../../live-transcription/hooks/ai-meeting-title";
import type { MeetingPrep } from "../types";
import { MeetingPrepDetails } from "./meeting-prep-card";

interface MeetingCardProps {
  meeting: LiveMeetingData;
  onUpdate: (
    id: string,
    update: {
      aiName?: string;
      aiSummary?: string;
      analysis?: MeetingAnalysis | null;
      title?: string;
    }
  ) => void;
  settings: Settings;
  onDelete?: () => void;
  isLive?: boolean;
  onLoadArchived?: () => void;
}

function getWordCount(meeting: LiveMeetingData): number {
  return (
    meeting.chunks?.reduce((count, chunk) => {
      // Split by whitespace and filter out empty strings
      const words = chunk.text?.split(/\s+/).filter((word) => word.length > 0) || [];
      return count + words.length;
    }, 0) || 0
  );
}

export function MeetingCard({
  meeting,
  onUpdate,
  settings,
  onDelete,
  isLive,
  onLoadArchived,
}: MeetingCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (start: string, end?: string): string => {
    if (!end) return "0m";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;

    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const handleGenerateName = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      if (!settings) {
        throw new Error("no settings found");
      }

      console.log("generating name for meeting:", {
        id: meeting.id,
        currentTitle: meeting.title,
      });

      const newTitle = await generateMeetingName(meeting, settings);

      onUpdate(meeting.id, {
        title: newTitle,
        aiName: newTitle, // Adding this for backwards compatibility
        analysis: meeting.analysis, // Preserve existing analysis
      });

      toast({
        title: "name generated",
        description: "ai name has been generated and saved",
      });
    } catch (error) {
      console.error("failed to generate name:", error);
      toast({
        title: "generation failed",
        description: "failed to generate ai name. please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    try {
      if (!settings) {
        throw new Error("no settings found");
      }

      console.log("generating summary for meeting:", {
        id: meeting.id,
        title: meeting.title,
      });

      const aiSummary = await generateMeetingSummary(meeting, settings);

      // Update only the analysis field while preserving other fields
      onUpdate(meeting.id, {
        analysis: {
          facts: meeting.analysis?.facts || [],
          events: meeting.analysis?.events || [],
          flow: meeting.analysis?.flow || [],
          decisions: meeting.analysis?.decisions || [],
          summary: [aiSummary],
        },
      });

      toast({
        title: "summary generated",
        description: "ai summary has been generated and saved",
      });
    } catch (error) {
      console.error("failed to generate summary:", error);
      toast({
        title: "generation failed",
        description: "failed to generate ai summary. please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const getDurationMinutes = (start: string, end?: string): number => {
    if (!end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.floor((endTime - startTime) / (1000 * 60));
  };

  const durationMinutes = getDurationMinutes(meeting.startTime, meeting.endTime);

  const wordCount = getWordCount(meeting);

  const handleCardClick = () => {
    if (isLive) {
      // Instead of router.push, use window.location for a full page load
      window.location.href = "/meetings/live";
    } else if (onLoadArchived) {
      console.log("loading archived meeting:", {
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
      });
      onLoadArchived();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const skipConfirm = localStorage.getItem("skipDeleteConfirm") === "true";

    if (skipConfirm) {
      onDelete?.();
    } else {
      setShowDeleteDialog(true);
    }
  };

  const handleConfirmDelete = () => {
    if (dontAskAgain) {
      localStorage.setItem("skipDeleteConfirm", "true");
    }
    setShowDeleteDialog(false);
    onDelete?.();
  };

  return (
    <Card
      className="w-full mb-1 cursor-pointer hover:bg-accent/50 border"
      onClick={handleCardClick}
    >
      <CardContent className="p-5 relative">
        {!isLive && onLoadArchived && (
          <div className="absolute right-2 top-2">
            <HoverCard openDelay={0} closeDelay={0}>
              <HoverCardTrigger>
                <div className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Archived
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2">
                <span className="text-sm text-muted-foreground">
                  click to load and edit this meeting
                </span>
              </HoverCardContent>
            </HoverCard>
          </div>
        )}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground/10 origin-bottom transition-transform duration-500"
          style={{
            transform: `scaleY(${0.5 + Math.min(durationMinutes / 60, 1) * 0.5})`,
            opacity: 0.2,
          }}
        />
        <div className="space-y-2 mb-5">
          <h3 className="text-base font-bold">{meeting.title || "Untitled meeting"}</h3>
          {meeting.analysis?.summary && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {meeting.analysis.summary}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex text-sm text-muted-foreground font-medium items-center">
            {formatTime(meeting.startTime)} • {formatDuration(meeting.startTime, meeting.endTime)}
            {wordCount > 0 && (
              <>
                {" • "}
                {wordCount.toLocaleString()} words
              </>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <HoverCard openDelay={0} closeDelay={0}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1"
                  onClick={handleGenerateName}
                  disabled={isGenerating}
                >
                  <Wand2 className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2">
                <span className="text-sm text-muted-foreground">
                  re-generate an ai name for this meeting
                </span>
              </HoverCardContent>
            </HoverCard>
            <HoverCard openDelay={0} closeDelay={0}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                >
                  <FileText className={`h-4 w-4 ${isGeneratingSummary ? "animate-spin" : ""}`} />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2">
                <span className="text-sm text-muted-foreground">
                  generate an ai summary for this meeting
                </span>
              </HoverCardContent>
            </HoverCard>

            {meeting.analysis && !meeting.endTime && "previousContext" in meeting.analysis && (
              <HoverCard openDelay={0} closeDelay={0}>
                <HoverCardTrigger asChild>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1 flex items-center gap-1 text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300"
                      >
                        <span className="text-xs">ai prep</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="absolute left-0 right-0 mt-2 z-20 bg-white dark:bg-gray-950 border rounded-md p-4 shadow-lg">
                      <MeetingPrepDetails aiPrep={meeting.analysis as unknown as MeetingPrep} />
                    </CollapsibleContent>
                  </Collapsible>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                  <span className="text-sm text-muted-foreground">
                    view ai-generated meeting preparation insights
                  </span>
                </HoverCardContent>
              </HoverCard>
            )}
            <HoverCard openDelay={0} closeDelay={0}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2">
                <span className="text-sm text-muted-foreground">delete this meeting</span>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </CardContent>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>delete meeting</DialogTitle>
          </DialogHeader>
          <DialogDescription>are you sure you want to delete this meeting?</DialogDescription>
          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              id="dontAskAgain"
              checked={dontAskAgain}
              onCheckedChange={(checked) => setDontAskAgain(checked as boolean)}
            />
            <label
              htmlFor="dontAskAgain"
              className="text-sm text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              don't ask again
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(false);
              }}
            >
              cancel
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmDelete();
              }}
            >
              delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
