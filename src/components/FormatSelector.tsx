"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisResult } from "@/types";
import { Clapperboard, Music, Sparkles } from "lucide-react";

interface FormatSelectorProps {
  result: AnalysisResult;
  selectedFormat: string | null;
  /** Called with (formatId, isAudio) */
  setSelectedFormat: (format: string | null, isAudio: boolean) => void;
  isDownloading: boolean;
  isAudioSelected?: boolean;
  defaultAudioFormat?: string;
  defaultVideoFormat?: string;
}

function formatBytes(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes >= 1024 * 1024 * 1024) {
    return `~${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  return `~${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FormatSelector({
  result,
  selectedFormat,
  setSelectedFormat,
  isDownloading,
  isAudioSelected = false,
  defaultAudioFormat = "opus",
  defaultVideoFormat = "bestvideo+bestaudio/best",
}: FormatSelectorProps) {
  const activeTab = isAudioSelected ? "audio" : "video";

  const handleTabChange = (val: string) => {
    if (val === "audio") {
      // Find matching default audio format (e.g. audio-opus)
      const targetAudioId = `audio-${defaultAudioFormat.toLowerCase()}`;
      const matched = result.audioFormats.find(
        (a) => a.formatId === targetAudioId || a.quality === defaultAudioFormat.toLowerCase()
      );
      const chosen = matched?.formatId ?? result.audioFormats[0]?.formatId ?? "audio-opus";
      setSelectedFormat(chosen, true);
    } else {
      // Find matching default video format
      const matched = result.videoFormats.find(
        (v) => v.formatId === defaultVideoFormat || v.ext === defaultVideoFormat
      );
      const chosen = matched?.formatId ?? result.videoFormats[0]?.formatId ?? "bestvideo+bestaudio/best";
      setSelectedFormat(chosen, false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1 border border-border">
        <TabsTrigger
          value="video"
          className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          <Clapperboard className="mr-1.5 h-3.5 w-3.5 text-primary" />
          Video ({result.videoFormats.length})
        </TabsTrigger>
        <TabsTrigger
          value="audio"
          className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          <Music className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
          Audio ({result.audioFormats.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="video" className="mt-3">
        <RadioGroup
          value={!isAudioSelected ? (selectedFormat ?? "") : ""}
          onValueChange={(val) => setSelectedFormat(val, false)}
          disabled={isDownloading}
          className="grid gap-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar"
        >
          {result.videoFormats.map((format, idx) => {
            const isSelected = !isAudioSelected && selectedFormat === format.formatId;
            const sizeStr = formatBytes(format.filesize);

            return (
              <Label
                key={`video-item-${format.formatId}-${format.quality}-${idx}`}
                htmlFor={`video-radio-${idx}`}
                className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/60 hover:bg-muted/40 hover:border-border"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={format.formatId}
                    id={`video-radio-${idx}`}
                    className="h-4 w-4 text-primary"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{format.label}</span>
                    {idx === 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                        <Sparkles className="h-2.5 w-2.5" /> Max
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  {sizeStr && (
                    <span className="text-[11px] font-medium text-foreground/80 bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                      {sizeStr}
                    </span>
                  )}
                  <span className="uppercase text-[10px] bg-muted px-2 py-0.5 rounded border border-border">
                    {format.ext}
                  </span>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </TabsContent>

      <TabsContent value="audio" className="mt-3">
        <RadioGroup
          value={isAudioSelected ? (selectedFormat ?? "") : ""}
          onValueChange={(val) => setSelectedFormat(val, true)}
          disabled={isDownloading}
          className="grid gap-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar"
        >
          {result.audioFormats.map((format, idx) => {
            const isSelected = isAudioSelected && selectedFormat === format.formatId;
            const sizeStr = formatBytes(format.filesize);

            return (
              <Label
                key={`audio-item-${format.formatId}-${format.quality}-${idx}`}
                htmlFor={`audio-radio-${idx}`}
                className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                    : "border-border/60 hover:bg-muted/40 hover:border-border"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={format.formatId}
                    id={`audio-radio-${idx}`}
                    className="h-4 w-4 text-emerald-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{format.label}</span>
                    {idx === 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                        <Sparkles className="h-2.5 w-2.5" /> Best
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  {sizeStr ? (
                    <span className="text-[11px] font-medium text-foreground/80 bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                      {sizeStr}
                    </span>
                  ) : format.bitrate ? (
                    <span>{Math.round(format.bitrate)} kbps</span>
                  ) : null}
                  <span className="uppercase text-[10px] bg-muted px-2 py-0.5 rounded border border-border">
                    {format.ext}
                  </span>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </TabsContent>
    </Tabs>
  );
}
