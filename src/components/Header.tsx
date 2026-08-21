"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Settings, Sparkles, Download, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[72px]" />;
  }

  const isDarkMode = resolvedTheme === "dark";

  return (
    <div className="flex items-center space-x-2">
      <Sun className={`h-3.5 w-3.5 ${!isDarkMode ? 'text-primary' : 'text-muted-foreground'}`} />
      <Switch
        id="theme-toggle"
        checked={isDarkMode}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
      <Moon className={`h-3.5 w-3.5 ${isDarkMode ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
  );
}

interface HeaderProps {
  activeView: 'downloader' | 'downloads';
  onViewChange: (view: 'downloader' | 'downloads') => void;
  activeDownloadCount?: number;
  onOpenSettings?: () => void;
  onOpenUpdates?: () => void;
}

export default function Header({
  activeView,
  onViewChange,
  activeDownloadCount = 0,
  onOpenSettings,
  onOpenUpdates,
}: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-border pb-5">
      {/* App Branding */}
      <div className="text-center md:text-left space-y-0.5">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          Video Downloader
        </h1>
        <p className="text-xs text-muted-foreground">
          High-performance media extractor powered by yt-dlp.
        </p>
      </div>

      {/* Navigation View Switcher & Action Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => onViewChange('downloader')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'downloader'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowDownToLine className="h-3.5 w-3.5 text-primary" />
            <span>Downloader</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('downloads')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
              activeView === 'downloads'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Download className="h-3.5 w-3.5 text-emerald-500" />
            <span>Downloads & History</span>
            {activeDownloadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-primary text-primary-foreground font-bold animate-pulse">
                {activeDownloadCount}
              </span>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-2xl border border-border">
          {onOpenUpdates && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenUpdates}
              className="h-8 px-2.5 gap-1.5 rounded-xl text-xs font-semibold hover:bg-muted text-foreground"
              title="Check for software and engine updates"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Updates</span>
            </Button>
          )}

          {onOpenSettings && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="h-8 w-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Open Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}

          <div className="h-4 w-px bg-border mx-1" />

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
