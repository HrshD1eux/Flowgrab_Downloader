"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Download,
  Trash2,
  XCircle,
  CheckCircle2,
  Clock,
  Music,
  Video,
  FileText,
  Sparkles,
  ExternalLink,
  FolderOpen,
  Pause,
  Play,
} from "lucide-react";
import {
  getDownloadHistory,
  clearDownloadHistory,
  openInFileExplorer,
} from "@/lib/tauri";
import type { DownloadHistoryItem } from "@/types";
import { useToast } from "@/hooks/use-toast";

export interface ActiveDownloadItem {
  downloadId: string;
  title: string;
  percent: number;
  speed: string;
  eta: string;
  status: string;
}

interface DownloadsManagerProps {
  activeDownloads: Map<string, ActiveDownloadItem>;
  onCancelActive: (id: string) => void;
  onPauseActive?: (id: string) => void;
  onResumeActive?: (id: string) => void;
  refreshTrigger: number;
}

export default function DownloadsManager({
  activeDownloads,
  onCancelActive,
  onPauseActive,
  onResumeActive,
  refreshTrigger,
}: DownloadsManagerProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const activeList = Array.from(activeDownloads.values());
  const activeCount = activeList.filter(
    (i) => i.status === "downloading" || i.status === "queued"
  ).length;

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const items = await getDownloadHistory();
      setHistory(items.reverse()); // Most recent first
    } catch (err) {
      console.warn("Failed to load history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearDownloadHistory();
      setHistory([]);
      toast({
        title: "History Cleared",
        description: "Your download history has been cleared.",
      });
    } catch (err) {
      toast({
        title: "Failed to clear history",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const handleOpenFolder = async (path?: string) => {
    if (!path) {
      toast({
        title: "Path unavailable",
        description: "Output path was not saved for this item.",
        variant: "destructive",
      });
      return;
    }

    try {
      await openInFileExplorer(path);
    } catch (err) {
      toast({
        title: "Could not open folder",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "Recent";
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Active In-Flight Downloads */}
      <Card className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Download className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Active Queue ({activeList.length})
              </CardTitle>
            </div>
            {activeCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 animate-pulse">
                <Sparkles className="h-3 w-3" /> {activeCount} downloading
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {activeList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Download className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No active downloads</p>
              <p className="text-[11px] opacity-70">
                Tasks in progress will appear here with live speed, ETA, and controls.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeList.map((item) => {
                const isCompleted = item.status === "completed";
                const isError = item.status.startsWith("error");
                const isQueued = item.status === "queued";
                const isPaused = item.status === "paused";
                const isDownloading = item.status === "downloading";

                return (
                  <div
                    key={item.downloadId}
                    className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-foreground truncate" title={item.title}>
                          {item.title || "Downloading media..."}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold uppercase text-[10px] ${
                              isCompleted
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : isError
                                ? "bg-destructive/10 text-destructive border border-destructive/20"
                                : isPaused
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : isQueued
                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}
                          >
                            {item.status}
                          </span>

                          {item.speed && <span>⚡ {item.speed}</span>}
                          {item.eta && <span>⏳ {item.eta}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Pause / Resume Controls */}
                        {isDownloading && onPauseActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPauseActive(item.downloadId)}
                            className="h-8 px-2.5 text-xs text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 rounded-xl font-semibold"
                            title="Pause Download"
                          >
                            <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                          </Button>
                        )}

                        {isPaused && onResumeActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onResumeActive(item.downloadId)}
                            className="h-8 px-2.5 text-xs text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 rounded-xl font-semibold"
                            title="Resume Download"
                          >
                            <Play className="h-3.5 w-3.5 mr-1" /> Resume
                          </Button>
                        )}

                        {/* Stop Control */}
                        {!isCompleted && !isError && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancelActive(item.downloadId)}
                            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl font-semibold"
                            title="Cancel / Stop"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Stop
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(item.percent)}%</span>
                      </div>
                      <ProgressBar
                        value={isError ? 100 : item.percent}
                        className={`h-2 rounded-full ${
                          isCompleted
                            ? "bg-emerald-500"
                            : isError
                            ? "bg-destructive"
                            : isPaused
                            ? "bg-amber-500"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Completed Download History */}
      <Card className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Download History ({history.length})
              </CardTitle>
            </div>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {isLoadingHistory ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No download records yet</p>
              <p className="text-[11px] opacity-70">
                Completed downloads will be saved here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {history.map((item) => {
                const isAudio = item.format === "audio";
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-border hover:bg-muted/40 transition-colors gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isAudio
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-primary/10 text-primary border border-primary/20"
                        }`}
                      >
                        {isAudio ? (
                          <Music className="h-4 w-4" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-foreground truncate" title={item.title}>
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <span className="uppercase font-bold px-1.5 py-0.2 rounded bg-muted border border-border">
                            {item.format}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatDate(item.timestamp)}
                          </span>
                        </div>

                        {/* File Destination Path */}
                        {item.outputPath && (
                          <p
                            className="text-[10px] font-mono text-muted-foreground/80 truncate max-w-full bg-muted/40 px-2 py-0.5 rounded border border-border/50"
                            title={item.outputPath}
                          >
                            📂 {item.outputPath}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      {item.outputPath && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenFolder(item.outputPath)}
                          className="h-8 px-2.5 text-xs text-foreground hover:bg-muted rounded-xl font-medium"
                          title="Show in File Explorer"
                        >
                          <FolderOpen className="h-3.5 w-3.5 mr-1 text-primary" />
                          <span>Show in Folder</span>
                        </Button>
                      )}

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 transition-colors"
                          title="Open Source Link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
