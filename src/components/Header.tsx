"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[100px]" />; // Placeholder
  }

  const isDarkMode = resolvedTheme === "dark";

  return (
    <div className="flex items-center space-x-2">
      <Sun className={`h-5 w-5 transition-colors ${!isDarkMode ? 'text-primary' : 'text-muted-foreground'}`} />
      <Switch
        id="theme-toggle"
        checked={isDarkMode}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
      <Moon className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
  );
}


export default function Header() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
      <div className="text-center md:text-left space-y-2">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Video Downloader
        </h1>
        <p className="text-muted-foreground text-base md:text-lg font-bold italic tracking-wide">
          Fast. Clean. Powerful. <span className="text-primary/60">Powered by yt-dlp.</span>
        </p>
      </div>
      <div className="bg-secondary/40 p-3 rounded-3xl border border-white/5 shadow-xl backdrop-blur-md">
        <ThemeToggle />
      </div>
    </div>
  )
}
