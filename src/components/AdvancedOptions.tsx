"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdvancedOptions as AdvancedOptionsType } from "@/types";
import { FolderOpen } from "lucide-react";

interface AdvancedOptionsProps {
  options: AdvancedOptionsType;
  setOptions: (options: AdvancedOptionsType) => void;
  isDownloading: boolean;
  onBrowseFolder?: () => void;
}

export default function AdvancedOptions({
  options,
  setOptions,
  isDownloading,
  onBrowseFolder,
}: AdvancedOptionsProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="advanced-options" className="border-border">
        <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground py-3">
          Download Settings & Metadata
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-2">

            {/* Output Folder */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Output Directory</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Default download folder"
                  value={options.outputPath}
                  onChange={(e) =>
                    setOptions({ ...options, outputPath: e.target.value })
                  }
                  disabled={isDownloading}
                  className="flex-1 rounded-xl bg-muted/30 border-border h-9 text-xs"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onBrowseFolder}
                  disabled={isDownloading}
                  type="button"
                  title="Browse folder"
                  className="rounded-xl h-9 w-9 border-border hover:bg-muted"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Custom Filename */}
            <div className="grid gap-1.5">
              <Label htmlFor="custom-filename" className="text-xs font-semibold">Custom Filename</Label>
              <Input
                id="custom-filename"
                name="video-filename-custom"
                autoComplete="off"
                placeholder="Leave blank for original title"
                value={options.customFilename}
                onChange={(e) =>
                  setOptions({ ...options, customFilename: e.target.value })
                }
                disabled={isDownloading}
                className="rounded-xl bg-muted/30 border-border h-9 text-xs"
              />
            </div>

            {/* Output Format */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Output Container Format</Label>
              <Select
                value={options.outputFormat}
                onValueChange={(value: string) =>
                  setOptions({ ...options, outputFormat: value })
                }
                disabled={isDownloading}
              >
                <SelectTrigger className="rounded-xl bg-muted/30 border-border h-9 text-xs">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="mp4">MP4 (Video Container)</SelectItem>
                  <SelectItem value="mkv">MKV (Matroska / Subtitle friendly)</SelectItem>
                  <SelectItem value="webm">WEBM (Modern Web VP9/AV1)</SelectItem>
                  <SelectItem value="opus">OPUS (Audio)</SelectItem>
                  <SelectItem value="mp3">MP3 (Universal Audio)</SelectItem>
                  <SelectItem value="m4a">M4A (Apple Audio)</SelectItem>
                  <SelectItem value="flac">FLAC (Lossless Audio)</SelectItem>
                  <SelectItem value="wav">WAV (PCM Audio)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center space-x-2 bg-muted/20 p-2.5 rounded-xl border border-border">
                <Checkbox
                  id="embed-thumbnail"
                  checked={options.embedThumbnail}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setOptions({ ...options, embedThumbnail: checked === true })
                  }
                  disabled={isDownloading}
                />
                <Label htmlFor="embed-thumbnail" className="text-xs font-medium cursor-pointer">
                  Embed Thumbnail
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-muted/20 p-2.5 rounded-xl border border-border">
                <Checkbox
                  id="download-subtitles"
                  checked={options.downloadSubtitles}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setOptions({ ...options, downloadSubtitles: checked === true })
                  }
                  disabled={isDownloading}
                />
                <Label htmlFor="download-subtitles" className="text-xs font-medium cursor-pointer">
                  Download Subtitles
                </Label>
              </div>
            </div>

            {/* Subtitle language */}
            {options.downloadSubtitles && (
              <div className="grid gap-1.5 animate-fade-in">
                <Label className="text-xs font-semibold">Subtitle Language</Label>
                <Select
                  value={options.subtitleLanguage}
                  onValueChange={(value: string) =>
                    setOptions({ ...options, subtitleLanguage: value })
                  }
                  disabled={isDownloading}
                >
                  <SelectTrigger className="rounded-xl bg-muted/30 border-border h-9 text-xs">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
