import { useEffect, useState } from "react";
import { LiveMeetingData } from "../types";

const STORAGE_KEY = "liveMeetingData";

const createNewMeeting = (): LiveMeetingData => ({
  id: crypto.randomUUID(),
  title: null,
  isArchived: false,
  mergedChunks: [],
  editedMergedChunks: {},
  notes: [],
  analysis: null,
  isAiNotesEnabled: true,
  notionPageId: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const migrateExistingData = (data: any): LiveMeetingData => {
  if (!data.notionPageId) {
    data.notionPageId = undefined;
  }
  return data;
};

export const useMeetingContext = () => {
  const [data, setData] = useState<LiveMeetingData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setData(migrateExistingData(parsed));
        } catch (e) {
          console.error("Failed to parse stored meeting data:", e);
        }
      }
    };
    loadData();
  }, []);

  return { data, setData };
};

export const startNewMeeting = async () => {
  const newMeeting = createNewMeeting();
  await localStorage.setItem(STORAGE_KEY, JSON.stringify(newMeeting));
  return newMeeting;
};

export const archiveLiveMeeting = async () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;

  try {
    const data = JSON.parse(stored);
    const archivedMeeting = {
      ...data,
      isArchived: true,
      updatedAt: new Date().toISOString(),
      // Preserve notionPageId when archiving
    };

    // ... rest of archive logic
  } catch (e) {
    console.error("Failed to archive meeting:", e);
    return false;
  }
};
