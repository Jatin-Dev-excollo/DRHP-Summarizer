import React, { useMemo, useEffect, useState } from "react";
import { summaryService } from "@/services/api";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface Summary {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  documentId: string;
}

function groupSummariesByDay(summaries: Summary[]) {
  const now = new Date();
  const today: Summary[] = [];
  const yesterday: Summary[] = [];
  const lastWeek: Summary[] = [];
  const older: Summary[] = [];

  summaries.forEach((summary) => {
    const summaryDate = new Date(summary.updatedAt);
    const diffDays = Math.floor(
      (now.getTime() - summaryDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) today.push(summary);
    else if (diffDays === 1) yesterday.push(summary);
    else if (diffDays <= 7) lastWeek.push(summary);
    else older.push(summary);
  });

  return [
    { label: "Today", summaries: today },
    { label: "Yesterday", summaries: yesterday },
    { label: "Last Week", summaries: lastWeek },
    { label: "Older", summaries: older },
  ].filter((g) => g.summaries.length > 0);
}

interface SummaryHistorySidebarProps {
  documentId: string;
  selectedSummaryId: string | null;
  onSelectSummary: (summaryId: string | null) => void;
  onNewSummary: () => void;
}

export function SummaryHistorySidebar({
  documentId,
  selectedSummaryId,
  onSelectSummary,
  onNewSummary,
}: SummaryHistorySidebarProps) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      if (!documentId) {
        console.log(documentId);
        setSummaries([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedSummaries = await summaryService.getByDocumentId(
          documentId
        );
        setSummaries(fetchedSummaries);
        setError(null);
      } catch (err) {
        console.error("Error fetching summaries:", err);
        setError("Failed to load summary history");
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, [documentId]);

  const grouped = useMemo(() => groupSummariesByDay(summaries), [summaries]);

  const handleDelete = async (summaryId: string) => {
    try {
      await summaryService.delete(summaryId);
      setSummaries(summaries.filter((summary) => summary.id !== summaryId));
      if (selectedSummaryId === summaryId) {
        onSelectSummary(null);
      }
    } catch (err) {
      console.error("Error deleting summary:", err);
      setError("Failed to delete summary");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "h:mm a");
  };

  const getSummaryTitle = (summary: Summary) => {
    if (summary.title === "New Summary") {
      // Extract first sentence or first 30 characters from content
      const firstSentence = summary.content.split(/[.!?]/)[0];
      return firstSentence.length > 30
        ? firstSentence.slice(0, 30) + "..."
        : firstSentence;
    }
    return summary.title;
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <div>
      {grouped.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No summaries yet for this document.
        </p>
      ) : (
        grouped.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.summaries.map((summary) => (
                <li
                  key={summary.id}
                  className={`flex items-center p-2 rounded-lg transition-colors cursor-pointer ${
                    selectedSummaryId === summary.id
                      ? "bg-accent/20 text-accent-foreground"
                      : "hover:bg-muted/30 text-foreground"
                  }`}
                  onClick={() => onSelectSummary(summary.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {getSummaryTitle(summary)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(summary.updatedAt)}
                    </div>
                  </div>
                  <button
                    className="ml-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(summary.id);
                    }}
                    title="Delete summary"
                  >
                    &#10005;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
