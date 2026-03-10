"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstagramIcon, TwitterIcon } from "@/components/icons";
import type { Platform } from "@/types";
import { Link, Youtube } from "lucide-react";

interface PlatformIconProps {
  platform: Platform;
}

function PlatformIcon({ platform }: PlatformIconProps) {
  const iconClass = "h-5 w-5 text-muted-foreground";

  switch (platform) {
    case "youtube":
      return <Youtube className={iconClass} />;
    case "twitter":
      return <TwitterIcon className={iconClass} />;
    case "instagram":
      return <InstagramIcon className={iconClass} />;
    case "generic":
      return <Link className={iconClass} />;
    default:
      return <Link className={iconClass} />;
  }
}

interface UrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  handleAnalyze: () => void;
  platform: Platform;
  isAnalyzing: boolean;
}

export default function UrlInput({
  url,
  setUrl,
  handleAnalyze,
  platform,
  isAnalyzing,
}: UrlInputProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video-url">Video URL</Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <PlatformIcon platform={platform} />
          </div>
          <Input
            id="video-url"
            name="video-url-input"
            type="url"
            autoComplete="off"
            placeholder="https://www.youtube.com/watch?v=..."
            className="pl-10 rounded-2xl h-12 text-base"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isAnalyzing}
          />
        </div>
      </div>
      <Button
        className="w-full rounded-2xl h-12 text-base font-bold transition-all hover:shadow-lg active:scale-[0.98]"
        onClick={handleAnalyze}
        disabled={!url || isAnalyzing}
      >
        {isAnalyzing ? "Analyzing..." : "Analyze URL"}
      </Button>
    </div>
  );
}
