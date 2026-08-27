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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  RefreshCw,
  Sparkles,
  Download,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Layers,
  ArrowUpCircle,
} from "lucide-react";
import {
  checkAppUpdate,
  updateYtDlp,
  getYtDlpVersion,
  getFfmpegVersion,
  installAppUpdate,
  onAppUpdateProgress,
  type AppUpdateInfo,
} from "@/lib/tauri";
import { useToast } from "@/hooks/use-toast";
import packageJson from "../../package.json";

interface UpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdateModal({ open, onOpenChange }: UpdateModalProps) {
  const { toast } = useToast();
  const [appInfo, setAppInfo] = useState<AppUpdateInfo | null>(null);
  const [engineVersion, setEngineVersion] = useState<string>("");
  const [ffmpegVersion, setFfmpegVersion] = useState<string>("");
  const [isCheckingApp, setIsCheckingApp] = useState(false);
  const [isUpdatingEngine, setIsUpdatingEngine] = useState(false);
  const [engineUpdateResult, setEngineUpdateResult] = useState<string>("");

  const [isInstallingApp, setIsInstallingApp] = useState(false);
  const [appUpdateProgress, setAppUpdateProgress] = useState(0);
  const [appUpdateStatusText, setAppUpdateStatusText] = useState("");

  useEffect(() => {
    if (open) {
      // Load current yt-dlp version
      getYtDlpVersion()
        .then((v) => setEngineVersion(v))
        .catch(() => setEngineVersion("Bundled"));

      // Load FFmpeg version
      getFfmpegVersion()
        .then((v) => setFfmpegVersion(v))
        .catch(() => setFfmpegVersion("FFmpeg Bundled"));

      // Check app updates
      handleCheckAppUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Listen to background in-app download progress
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    if (isInstallingApp) {
      onAppUpdateProgress((p) => {
        setAppUpdateProgress(p.percent);
        if (p.status === "launching" || p.percent >= 100) {
          setAppUpdateStatusText("Launching installer...");
        } else {
          setAppUpdateStatusText(`Downloading update (${Math.round(p.percent)}%)...`);
        }
      }).then((fn) => {
        unlisten = fn;
      });
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, [isInstallingApp]);

  const handleCheckAppUpdate = async () => {
    setIsCheckingApp(true);
    try {
      const info = await checkAppUpdate();
      setAppInfo(info);
    } catch (err) {
      console.warn("Failed to check app updates:", err);
    } finally {
      setIsCheckingApp(false);
    }
  };

  const handleInstallAppUpdate = async () => {
    if (!appInfo?.downloadUrl) return;
    setIsInstallingApp(true);
    setAppUpdateProgress(0);
    setAppUpdateStatusText("Connecting to release server...");

    try {
      await installAppUpdate(appInfo.downloadUrl);
      toast({
        title: "Installer Launched",
        description: "The updater is running. The app will close and update automatically.",
      });
    } catch (err) {
      const msg = String(err);
      setIsInstallingApp(false);
      toast({
        title: "In-App Update Failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleUpdateEngine = async () => {
    setIsUpdatingEngine(true);
    setEngineUpdateResult("");
    try {
      const result = await updateYtDlp();
      setEngineUpdateResult(result);
      // Refresh version
      const newVer = await getYtDlpVersion();
      setEngineVersion(newVer);
      toast({
        title: "Engine Updated",
        description: result || "yt-dlp has been updated and saved permanently in AppData.",
      });
    } catch (err) {
      const msg = String(err);
      setEngineUpdateResult(`Error: ${msg}`);
      toast({
        title: "Engine Update Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEngine(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] bg-card/90 backdrop-blur-2xl border border-white/10 shadow-2xl p-8 max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="space-y-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Software & Engine Updates
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground">
                Check GitHub releases and manage media extraction engines.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1 custom-scrollbar">
          {/* 1. App Version Card */}
          <div className="p-6 rounded-3xl bg-muted/30 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Application
                </span>
                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                  Flowgrab Downloader{" "}
                  <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    v{appInfo?.currentVersion || packageJson.version}
                  </span>
                </h4>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckAppUpdate}
                disabled={isCheckingApp || isInstallingApp}
                className="rounded-xl h-9 gap-1.5 text-xs font-bold border-white/10 hover:bg-muted/50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isCheckingApp ? "animate-spin" : ""}`} />
                {isCheckingApp ? "Checking..." : "Check Releases"}
              </Button>
            </div>

            {appInfo && (
              <div className="space-y-3 pt-2 border-t border-white/5 text-sm">
                {appInfo.hasUpdate ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          <Sparkles className="h-4 w-4 shrink-0" />
                          <span>New Release Available: v{appInfo.latestVersion}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Automatic 1-click background download and installation.
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={handleInstallAppUpdate}
                        disabled={isInstallingApp}
                        className="rounded-xl h-9 px-4 gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95 shrink-0 w-full sm:w-auto"
                      >
                        {isInstallingApp ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                            Update Now
                          </>
                        )}
                      </Button>
                    </div>

                    {isInstallingApp && (
                      <div className="space-y-1.5 bg-background/50 p-3 rounded-2xl border border-white/5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{appUpdateStatusText}</span>
                          <span className="text-primary font-mono">{Math.round(appUpdateProgress)}%</span>
                        </div>
                        <ProgressBar value={appUpdateProgress} className="h-2 rounded-full" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground">Changelog:</span>
                      <ScrollArea className="h-28 rounded-xl bg-background/50 p-3 border border-white/5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {appInfo.releaseNotes}
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>You are running the latest desktop version (v{appInfo.currentVersion}).</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-white/5" />

          {/* 2. yt-dlp Extraction Engine Card */}
          <div className="p-6 rounded-3xl bg-muted/30 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Extraction Core
                </span>
                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-cyan-400" />
                  yt-dlp Engine
                  {engineVersion && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {engineVersion}
                    </span>
                  )}
                </h4>
              </div>
              <Button
                size="sm"
                onClick={handleUpdateEngine}
                disabled={isUpdatingEngine}
                className="rounded-xl h-9 gap-1.5 text-xs font-bold bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all active:scale-95 shadow-md"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isUpdatingEngine ? "animate-spin" : ""}`} />
                {isUpdatingEngine ? "Downloading..." : "Update Engine"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Downloads and saves the latest official standalone engine directly to your user AppData so updates persist permanently across restarts.
            </p>

            {engineUpdateResult && (
              <div className="p-3 rounded-2xl bg-background/50 border border-white/5 text-xs font-mono text-cyan-400/90 whitespace-pre-wrap max-h-24 overflow-y-auto">
                {engineUpdateResult}
              </div>
            )}
          </div>

          <Separator className="bg-white/5" />

          {/* 3. FFmpeg Processing Core Card */}
          <div className="p-6 rounded-3xl bg-muted/30 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Media Muxing & Encoding
                </span>
                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-400" />
                  FFmpeg Core
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ready
              </span>
            </div>

            <p className="text-xs font-mono text-muted-foreground/80 truncate bg-muted/40 p-2.5 rounded-xl border border-white/5" title={ffmpegVersion}>
              {ffmpegVersion || "FFmpeg 7.x (High Performance Muxer & Audio Converter)"}
            </p>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-white/5 shrink-0 flex justify-between sm:justify-between items-center w-full">
          <a
            href="https://github.com/HrshD1eux/Flowgrab_Downloader/releases"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-bold"
          >
            GitHub Releases <ExternalLink className="h-3 w-3" />
          </a>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-2xl h-11 font-bold px-6 border-white/10 hover:bg-muted/40"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
