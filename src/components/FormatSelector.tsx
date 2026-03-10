"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisResult } from "@/types";
import { Clapperboard, Music } from "lucide-react";

interface FormatSelectorProps {
  result: AnalysisResult;
  selectedFormat: string | null;
  /** Called with (formatId, isAudio) */
  setSelectedFormat: (format: string | null, isAudio: boolean) => void;
  isDownloading: boolean;
}

export default function FormatSelector({
  result,
  selectedFormat,
  setSelectedFormat,
  isDownloading,
}: FormatSelectorProps) {
  return (
    <Tabs defaultValue="video" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="video">
          <Clapperboard className="mr-2 h-4 w-4" />
          Video
        </TabsTrigger>
        <TabsTrigger value="audio">
          <Music className="mr-2 h-4 w-4" />
          Audio
        </TabsTrigger>
      </TabsList>

      <TabsContent value="video">
        <RadioGroup
          value={selectedFormat ?? ""}
          onValueChange={(val) => setSelectedFormat(val, false)}
          disabled={isDownloading}
          className="grid gap-3 pt-4"
        >
          {result.videoFormats.map((format) => (
            <Label
              key={format.formatId}
              className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-all ${selectedFormat === format.formatId
                ? "border-primary bg-primary/10 shadow-md"
                : "hover:bg-muted/50 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center space-x-4">
                <RadioGroupItem value={format.formatId} id={`video-${format.formatId}`} className="h-5 w-5" />
                <span className="text-lg font-bold tracking-tight">{format.label}</span>
              </div>
              <div className="flex items-center gap-4 text-base text-muted-foreground font-black italic">
                {format.filesize && (
                  <span>{(format.filesize / 1_048_576).toFixed(0)} MB</span>
                )}
                <span className="uppercase font-mono text-xs bg-secondary/80 px-3 py-1.5 rounded-xl border border-white/5">{format.ext}</span>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </TabsContent>

      <TabsContent value="audio">
        <RadioGroup
          value={selectedFormat ?? ""}
          onValueChange={(val) => setSelectedFormat(val, true)}
          disabled={isDownloading}
          className="grid gap-3 pt-4"
        >
          {result.audioFormats.map((format) => (
            <Label
              key={format.formatId}
              className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-all ${selectedFormat === format.formatId
                ? "border-primary bg-primary/10 shadow-md"
                : "hover:bg-muted/50 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center space-x-4">
                <RadioGroupItem value={format.formatId} id={`audio-${format.formatId}`} className="h-5 w-5" />
                <span className="text-lg font-bold tracking-tight">{format.label}</span>
              </div>
              <div className="flex items-center gap-3 text-base text-muted-foreground font-black italic">
                {format.bitrate && <span>{Math.round(format.bitrate)}kbps</span>}
                <span className="uppercase font-mono text-xs bg-secondary/80 px-3 py-1.5 rounded-xl border border-white/5">{format.ext}</span>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </TabsContent>
    </Tabs>
  );
}
