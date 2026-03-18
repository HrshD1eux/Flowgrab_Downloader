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
import { useState } from "react";
import type { AdvancedOptions as AdvancedOptionsType } from "@/types";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, RefreshCw } from "lucide-react";
import { updateYtDlp } from "@/lib/tauri";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const result = await updateYtDlp();
      toast({
        title: "Engine Update",
        description: result || "yt-dlp has been updated successfully.",
      });
    } catch (err) {
      toast({
        title: "Update Failed",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="advanced-options">
        <AccordionTrigger className="text-sm font-medium">
          Advanced Options
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-6 pt-4">

            {/* Output Folder */}
            <div className="grid gap-2">
              <Label>Output Folder</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Default download folder"
                  value={options.outputPath}
                  onChange={(e) =>
                    setOptions({ ...options, outputPath: e.target.value })
                  }
                  disabled={isDownloading}
                  className="flex-1 rounded-xl"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onBrowseFolder}
                  disabled={isDownloading}
                  type="button"
                  title="Browse folder"
                  className="rounded-xl"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Custom Filename */}
            <div className="grid gap-2">
              <Label htmlFor="custom-filename">Custom Filename</Label>
              <Input
                id="custom-filename"
                name="video-filename-custom"
                autoComplete="off"
                placeholder="e.g. my-cool-video (leave blank for auto)"
                value={options.customFilename}
                onChange={(e) =>
                  setOptions({ ...options, customFilename: e.target.value })
                }
                disabled={isDownloading}
                className="rounded-xl"
              />
            </div>

            {/* Output Format — always visible */}
            <div className="grid gap-2">
              <Label>Output Container Format</Label>
              <Select
                value={options.outputFormat}
                onValueChange={(value: string) =>
                  setOptions({ ...options, outputFormat: value })
                }
                disabled={isDownloading}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="mkv">MKV</SelectItem>
                  <SelectItem value="webm">WEBM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="embed-thumbnail"
                  checked={options.embedThumbnail}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setOptions({ ...options, embedThumbnail: checked === true })
                  }
                  disabled={isDownloading}
                />
                <Label htmlFor="embed-thumbnail" className="text-sm font-normal">
                  Embed thumbnail
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="download-subtitles"
                  checked={options.downloadSubtitles}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setOptions({ ...options, downloadSubtitles: checked === true })
                  }
                  disabled={isDownloading}
                />
                <Label htmlFor="download-subtitles" className="text-sm font-normal">
                  Download subtitles
                </Label>
              </div>
            </div>

            {/* Subtitle language — only when subtitles enabled */}
            {options.downloadSubtitles && (
              <div className="grid gap-2">
                <Label>Subtitle Language</Label>
                <Select
                  value={options.subtitleLanguage}
                  onValueChange={(value: string) =>
                    setOptions({ ...options, subtitleLanguage: value })
                  }
                  disabled={isDownloading}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
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

            <Separator className="my-2" />

            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Engine Maintenance</Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 rounded-xl"
                onClick={handleUpdate}
                disabled={isUpdating || isDownloading}
              >
                <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? "Checking for updates..." : "Check for Engine Updates"}
              </Button>
            </div>

          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

