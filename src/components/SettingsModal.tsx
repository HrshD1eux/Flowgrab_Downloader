"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Save, Settings as SettingsIcon, Music, Video } from "lucide-react";
import { getSettings, saveSettings, openFolderDialog, type AppSettings } from "@/lib/tauri";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsSaved?: (settings: AppSettings) => void;
}

export default function SettingsModal({
  open,
  onOpenChange,
  onSettingsSaved,
}: SettingsModalProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>({
    default_output_path: "",
    default_format: "mp4",
    default_audio_format: "mp3",
    embed_thumbnail: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      getSettings().then((s) => {
        if (s) {
          setSettings({
            default_output_path: s.default_output_path || "",
            default_format: s.default_format || "mp4",
            default_audio_format: s.default_audio_format || "opus",
            embed_thumbnail: s.embed_thumbnail ?? true,
            auto_reset_on_finish: s.auto_reset_on_finish ?? false,
          });
        }
      });
    }
  }, [open]);

  const handleBrowseFolder = async () => {
    const path = await openFolderDialog();
    if (path) {
      setSettings((prev) => ({ ...prev, default_output_path: path }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settings);
      toast({
        title: "Settings Saved",
        description: "Your default preferences have been updated.",
      });
      onSettingsSaved?.(settings);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Failed to save settings",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl bg-card border border-border shadow-2xl p-6 md:p-8">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Application Settings</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure your default download parameters and media formats.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 py-5">
          {/* Default Output Folder */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold text-foreground">Default Download Folder</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Default (System Downloads)"
                value={settings.default_output_path}
                readOnly
                className="flex-1 rounded-xl bg-muted/40 border-border h-10 text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleBrowseFolder}
                type="button"
                title="Browse folder"
                className="rounded-xl h-10 w-10 border-border hover:bg-muted"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Default Video Format */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-primary" /> Default Video Container
            </Label>
            <Select
              value={settings.default_format}
              onValueChange={(val: string) =>
                setSettings((prev) => ({ ...prev, default_format: val }))
              }
            >
              <SelectTrigger className="rounded-xl bg-muted/40 border-border h-10 text-xs">
                <SelectValue placeholder="Select container format" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="mp4">MP4 (Recommended / Universal)</SelectItem>
                <SelectItem value="mkv">MKV (Matroska / Subtitles support)</SelectItem>
                <SelectItem value="webm">WEBM (Modern Web VP9/AV1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Audio Format */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-emerald-500" /> Default Audio Format
            </Label>
            <Select
              value={settings.default_audio_format}
              onValueChange={(val: string) =>
                setSettings((prev) => ({ ...prev, default_audio_format: val }))
              }
            >
              <SelectTrigger className="rounded-xl bg-muted/40 border-border h-10 text-xs">
                <SelectValue placeholder="Select audio format" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="opus">.opus — OPUS (Best Quality & Compression ratio)</SelectItem>
                <SelectItem value="mp3">.mp3 — MP3 (Most Popular / Universal Compatibility)</SelectItem>
                <SelectItem value="m4a">.m4a — M4A / AAC (Apple Native & High Fidelity)</SelectItem>
                <SelectItem value="flac">.flac — FLAC (Lossless Studio Master)</SelectItem>
                <SelectItem value="wav">.wav — WAV (Uncompressed Studio PCM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Embed Thumbnail Default */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-foreground cursor-pointer" htmlFor="settings-thumb">
                Auto-Embed Artwork
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Embed cover thumbnails inside downloaded video/audio files.
              </p>
            </div>
            <Switch
              id="settings-thumb"
              checked={settings.embed_thumbnail}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, embed_thumbnail: checked }))
              }
            />
          </div>

          {/* Auto-Reset Downloader after Download */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-foreground cursor-pointer" htmlFor="settings-autoreset">
                Auto-Reset Downloader
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Automatically clear completed video and prepare URL input for next download.
              </p>
            </div>
            <Switch
              id="settings-autoreset"
              checked={settings.auto_reset_on_finish ?? false}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, auto_reset_on_finish: checked }))
              }
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-10 font-semibold px-5 border-border hover:bg-muted text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl h-10 font-semibold px-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-sm transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
