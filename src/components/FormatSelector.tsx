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
}

export default function FormatSelector({
  result,
  selectedFormat,
  setSelectedFormat,
  isDownloading,
  isAudioSelected = false,
}: FormatSelectorProps) {
  const activeTab = isAudioSelected ? "audio" : "video";

  const handleTabChange = (val: string) => {
    if (val === "audio") {
      const defaultAudio = result.audioFormats[0]?.formatId ?? "bestaudio";
      setSelectedFormat(defaultAudio, true);
    } else {
      const defaultVideo = result.videoFormats[0]?.formatId ?? "bestvideo+bestaudio/best";
      setSelectedFormat(defaultVideo, false);
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
          {result.videoFormats.map((format, idx) => (
            <Label
              key={format.formatId + format.quality}
              className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                !isAudioSelected && selectedFormat === format.formatId
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border/60 hover:bg-muted/40 hover:border-border"
              }`}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value={format.formatId}
                  id={`video-${format.formatId}-${idx}`}
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
                {format.filesize && (
                  <span>{(format.filesize / 1_048_576).toFixed(0)} MB</span>
                )}
                <span className="uppercase text-[10px] bg-muted px-2 py-0.5 rounded border border-border">
                  {format.ext}
                </span>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </TabsContent>

      <TabsContent value="audio" className="mt-3">
        <RadioGroup
          value={isAudioSelected ? (selectedFormat ?? "") : ""}
          onValueChange={(val) => setSelectedFormat(val, true)}
          disabled={isDownloading}
          className="grid gap-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar"
        >
          {result.audioFormats.map((format, idx) => (
            <Label
              key={format.formatId + format.quality}
              className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                isAudioSelected && selectedFormat === format.formatId
                  ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                  : "border-border/60 hover:bg-muted/40 hover:border-border"
              }`}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value={format.formatId}
                  id={`audio-${format.formatId}-${idx}`}
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
                {format.bitrate && <span>{Math.round(format.bitrate)} kbps</span>}
                <span className="uppercase text-[10px] bg-muted px-2 py-0.5 rounded border border-border">
                  {format.ext}
                </span>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </TabsContent>
    </Tabs>
  );
}
