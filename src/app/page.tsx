"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Platform, AnalysisResult, AdvancedOptions as AdvancedOptionsType, DownloadOptions } from '@/types';
import Header from '@/components/Header';
import UrlInput from '@/components/UrlInput';
import { Copy, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import FormatSelector from '@/components/FormatSelector';
import AdvancedOptions from '@/components/AdvancedOptions';
import PlaylistSelector from '@/components/PlaylistSelector';
import DownloadSection from '@/components/DownloadSection';
import DownloadsManager, { type ActiveDownloadItem } from '@/components/DownloadsManager';
import SettingsModal from '@/components/SettingsModal';
import UpdateModal from '@/components/UpdateModal';
import BatchUrlManager, { BatchDownloadTarget, BatchUrlManagerHandle } from '@/components/BatchUrlManager';
import { getVideoInfo, startDownload, cancelDownload, onDownloadProgress, onOpenUrl, openFolderDialog, getSettings, type AppSettings } from '@/lib/tauri';
import { v4 as uuidv4 } from 'uuid';

const AnalysisSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-20 w-36 rounded-xl" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
    </div>
    <Skeleton className="h-9 w-full rounded-xl" />
    <div className="space-y-2.5">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  </div>
);

const InitialState = () => (
  <div className="text-center text-muted-foreground py-12 animate-fade-in">
    <h3 className="text-sm font-semibold text-foreground">Ready to download</h3>
    <p className="text-xs mt-1 text-muted-foreground">Paste any supported video or playlist URL above to begin analysis.</p>
  </div>
);

export default function Home() {
  const [activeView, setActiveView] = useState<'downloader' | 'downloads'>('downloader');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedPlaylistUrls, setSelectedPlaylistUrls] = useState<string[]>([]);
  const [isAudioSelected, setIsAudioSelected] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptionsType>({
    customFilename: '',
    embedThumbnail: true,
    downloadSubtitles: false,
    subtitleLanguage: 'en',
    outputFormat: 'mp4',
    outputPath: '',
  });
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [batchProgressMap, setBatchProgressMap] = useState<Map<string, ActiveDownloadItem>>(new Map());
  const [batchTargets, setBatchTargets] = useState<BatchDownloadTarget[]>([]);
  const [showBatchManager, setShowBatchManager] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdatesOpen, setIsUpdatesOpen] = useState(false);

  const activeDownloads = useRef<Set<string>>(new Set());
  const unlistenRef = useRef<(() => void) | null>(null);
  const batchManagerRef = useRef<BatchUrlManagerHandle>(null);
  const downloadOptionsMap = useRef<Map<string, DownloadOptions>>(new Map());

  const { toast } = useToast();

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Load saved settings on startup
  useEffect(() => {
    async function loadInitialSettings() {
      try {
        const settings = await getSettings();
        if (settings) {
          setAppSettings(settings);
          setAdvancedOptions(prev => ({
            ...prev,
            outputPath: settings.default_output_path || prev.outputPath,
            outputFormat: settings.default_format || prev.outputFormat,
            embedThumbnail: settings.embed_thumbnail ?? prev.embedThumbnail,
            embedMetadata: settings.embed_metadata ?? true,
          }));
        }
      } catch (err) {
        console.warn("Could not load initial settings:", err);
      }
    }
    loadInitialSettings();
  }, []);

  const handleSettingsSaved = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    setAdvancedOptions(prev => ({
      ...prev,
      outputPath: newSettings.default_output_path || prev.outputPath,
      outputFormat: newSettings.default_format || prev.outputFormat,
      embedThumbnail: newSettings.embed_thumbnail ?? prev.embedThumbnail,
      embedMetadata: newSettings.embed_metadata ?? true,
    }));
  };

  const activeDownloadCount = useMemo(() => {
    const items = Array.from(batchProgressMap.values());
    return items.filter(i => i.status === 'downloading' || i.status === 'queued').length;
  }, [batchProgressMap]);

  // Compute smooth, non-flickering progress for both single and batch downloads
  const progressMetrics = useMemo(() => {
    const items = Array.from(batchProgressMap.values());
    const totalCount = items.length;
    if (totalCount === 0) {
      return { percent: 0, speed: '', eta: '', filename: '' };
    }

    const completedCount = items.filter(i => i.status === 'completed').length;
    const activeItems = items.filter(i => i.status === 'downloading');
    const queuedCount = items.filter(i => i.status === 'queued').length;

    if (totalCount === 1) {
      const item = items[0];
      return {
        percent: item.percent,
        speed: item.speed,
        eta: item.eta,
        filename: item.title,
      };
    }

    // Multiple items: calculate average progress and summary
    const sumPercent = items.reduce((acc, item) => {
      if (item.status === 'completed') return acc + 100;
      return acc + item.percent;
    }, 0);

    const avgPercent = Math.round(sumPercent / totalCount);

    let speedText = '';
    if (activeItems.length > 0) {
      speedText = `${activeItems.length} downloading, ${queuedCount} queued (${completedCount}/${totalCount} finished)`;
    } else if (queuedCount > 0) {
      speedText = `${queuedCount} queued (${completedCount}/${totalCount} finished)...`;
    }

    const primaryActive = activeItems[0];
    const etaText = primaryActive && primaryActive.eta ? `ETA: ${primaryActive.eta}` : '';
    const filenameText = primaryActive ? primaryActive.title : '';

    return {
      percent: avgPercent,
      speed: speedText,
      eta: etaText,
      filename: filenameText,
    };
  }, [batchProgressMap]);

  const handleCancelItem = async (id: string) => {
    try {
      await cancelDownload(id, 'cancelled');
      activeDownloads.current.delete(id);
      downloadOptionsMap.current.delete(id);
      setBatchProgressMap(prev => {
        const next = new Map(prev);
        const item = next.get(id);
        if (item) next.set(id, { ...item, status: 'cancelled', speed: '', eta: '' });
        return next;
      });

      if (activeDownloads.current.size === 0) {
        setDownloadStatus('idle');
      }
      toast({ title: "Stopped", description: "Download has been stopped." });
    } catch (err) {
      toast({ title: "Failed to stop", description: String(err), variant: "destructive" });
    }
  };

  const handlePauseItem = async (id: string) => {
    try {
      await cancelDownload(id, 'paused');
      activeDownloads.current.delete(id);
      setBatchProgressMap(prev => {
        const next = new Map(prev);
        const item = next.get(id);
        if (item) next.set(id, { ...item, status: 'paused', speed: '', eta: '' });
        return next;
      });
      toast({ title: "Paused", description: "Download has been paused. Click Resume anytime." });
    } catch (err) {
      toast({ title: "Failed to pause", description: String(err), variant: "destructive" });
    }
  };

  const handleResumeItem = async (id: string) => {
    const options = downloadOptionsMap.current.get(id);
    if (!options) {
      toast({ title: "Cannot resume", description: "Download configuration expired. Please start again.", variant: "destructive" });
      return;
    }

    activeDownloads.current.add(id);
    setDownloadStatus('downloading');
    setErrorMessage('');
    setBatchProgressMap(prev => {
      const next = new Map(prev);
      const item = next.get(id);
      if (item) next.set(id, { ...item, status: 'downloading', speed: 'Resuming...', eta: '' });
      return next;
    });

    try {
      await startDownload(id, options);
    } catch (err) {
      activeDownloads.current.delete(id);
      const msg = String(err);
      setErrorMessage(msg);
      setBatchProgressMap(prev => {
        const next = new Map(prev);
        const item = next.get(id);
        if (item) next.set(id, { ...item, status: `error: ${msg}`, speed: '', eta: '' });
        return next;
      });
      toast({ title: "Failed to resume", description: msg, variant: "destructive" });
    }
  };

  const handleRetryItem = async (id: string) => {
    const options = downloadOptionsMap.current.get(id);
    if (!options) {
      toast({ title: "Cannot retry", description: "Download configuration expired. Please analyze URL again.", variant: "destructive" });
      return;
    }

    activeDownloads.current.add(id);
    setDownloadStatus('downloading');
    setErrorMessage('');
    setBatchProgressMap(prev => {
      const next = new Map(prev);
      const item = next.get(id);
      if (item) next.set(id, { ...item, status: 'downloading', percent: 0, speed: 'Retrying...', eta: '' });
      return next;
    });

    try {
      await startDownload(id, options);
    } catch (err) {
      activeDownloads.current.delete(id);
      const msg = String(err);
      setErrorMessage(msg);
      setBatchProgressMap(prev => {
        const next = new Map(prev);
        const item = next.get(id);
        if (item) next.set(id, { ...item, status: `error: ${msg}`, speed: '', eta: '' });
        return next;
      });
      toast({ title: "Retry Failed", description: msg, variant: "destructive" });
    }
  };

  // Detect platform from URL
  useEffect(() => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setPlatform('youtube');
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      setPlatform('twitter');
    } else if (url.includes('instagram.com')) {
      setPlatform('instagram');
    } else if (url.length > 0) {
      setPlatform('generic');
    } else {
      setPlatform(null);
    }
  }, [url]);

  const lastProcessedUrlRef = useRef<string>('');

  const handleProcessIncomingUrl = useCallback(async (incomingUrl: string) => {
    const cleanUrl = incomingUrl.trim();
    if (!cleanUrl || cleanUrl === lastProcessedUrlRef.current) return;
    lastProcessedUrlRef.current = cleanUrl;

    // Check if a primary video is already analyzed or loaded in the app
    if (analysisResult || url.trim().length > 0) {
      // Automatic Batch Queueing: Add to Batch Download Queue
      setBatchTargets(prev => {
        if (prev.some(t => t.url === cleanUrl)) return prev;
        const newTarget: BatchDownloadTarget = {
          title: cleanUrl,
          url: cleanUrl,
          formatId: selectedFormat || (isAudioSelected ? (appSettings?.default_audio_format ? `audio-${appSettings.default_audio_format}` : 'audio-best') : (appSettings?.default_format || 'bestvideo+bestaudio/best')),
          isAudio: isAudioSelected,
        };
        return [...prev, newTarget];
      });
      setShowBatchManager(true);
      toast({
        title: "Added to Batch Queue",
        description: `Queued consecutive link: ${cleanUrl}`,
      });
    } else {
      // First URL: Load and analyze immediately
      setUrl(cleanUrl);
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setSelectedFormat(null);
      setSelectedPlaylistUrls([]);
      setDownloadStatus('idle');
      setErrorMessage('');
      try {
        const result = await getVideoInfo(cleanUrl);
        setAnalysisResult(result);
        if (isAudioSelected) {
          const defaultAudioCode = appSettings?.default_audio_format || 'opus';
          const matchedAudio = result.audioFormats.find(f => f.formatId === `audio-${defaultAudioCode}`);
          setSelectedFormat(matchedAudio ? matchedAudio.formatId : (result.audioFormats[0]?.formatId || 'audio-best'));
        } else {
          const defaultRes = appSettings?.default_format || 'mp4';
          const defaultMatch = result.videoFormats.find(f => f.quality.toLowerCase().includes(defaultRes) || f.ext.toLowerCase() === defaultRes);
          setSelectedFormat(defaultMatch ? defaultMatch.formatId : (result.videoFormats[0]?.formatId || null));
        }
        if (result.isPlaylist && result.entries) {
          setSelectedPlaylistUrls(result.entries.map(e => e.url));
        }
        toast({
          title: "Link Captured & Analyzed",
          description: result.title,
        });
      } catch (err) {
        setErrorMessage(String(err));
        setDownloadStatus('error');
        toast({
          title: "Analysis Failed",
          description: String(err),
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [analysisResult, url, selectedFormat, isAudioSelected, appSettings, toast]);

  // Clean up event listener on unmount & deep link / clipboard handlers
  useEffect(() => {
    let unlistenDragDrop: (() => void) | null = null;
    let unlistenOpenUrl: (() => void) | null = null;

    async function setupListeners() {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const win = getCurrentWindow();

        unlistenDragDrop = await win.onDragDropEvent((event) => {
          if (event.payload.type === 'drop') {
            const droppedText = event.payload.paths[0];
            if (droppedText && (droppedText.startsWith('http://') || droppedText.startsWith('https://'))) {
              handleProcessIncomingUrl(droppedText);
            }
          }
        });
      } catch (e) {
        console.warn("Drag and drop init skipped:", e);
      }

      try {
        unlistenOpenUrl = await onOpenUrl((incoming) => {
          handleProcessIncomingUrl(incoming);
        });
      } catch (e) {
        console.warn("Deep link listener skipped:", e);
      }
    }

    setupListeners();

    // Clipboard auto-capture on window focus
    const checkClipboard = async () => {
      if (appSettings && appSettings.auto_capture_clipboard === false) return;
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
          const clipText = await navigator.clipboard.readText();
          if (clipText && (clipText.startsWith('http://') || clipText.startsWith('https://'))) {
            const isMedia = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|twitter\.com|x\.com|instagram\.com|tiktok\.com|facebook\.com|vimeo\.com|reddit\.com|threads\.net|twitch\.tv|soundcloud\.com)/i.test(clipText.trim());
            if (isMedia && clipText.trim() !== lastProcessedUrlRef.current) {
              handleProcessIncomingUrl(clipText.trim());
            }
          }
        }
      } catch {
        // Clipboard read permission might be denied or window unfocused
      }
    };

    window.addEventListener('focus', checkClipboard);

    return () => {
      if (unlistenDragDrop) unlistenDragDrop();
      if (unlistenOpenUrl) unlistenOpenUrl();
      window.removeEventListener('focus', checkClipboard);
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, [handleProcessIncomingUrl, appSettings]);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSelectedFormat(null);
    setSelectedPlaylistUrls([]);
    setDownloadStatus('idle');
    setErrorMessage('');

    batchManagerRef.current?.analyzeCurrentInput();

    try {
      const result = await getVideoInfo(url);
      setAnalysisResult(result);
      if (result.entries) {
        setSelectedPlaylistUrls(result.entries.map(e => e.url));
      }

      if (isAudioSelected) {
        const defAudio = appSettings?.default_audio_format || 'opus';
        const targetId = `audio-${defAudio.toLowerCase()}`;
        const matched = result.audioFormats.find(
          a => a.formatId === targetId || a.quality === defAudio.toLowerCase()
        );
        setSelectedFormat(matched?.formatId ?? result.audioFormats[0]?.formatId ?? 'audio-opus');
      } else {
        setSelectedFormat(result.videoFormats[0]?.formatId ?? 'bestvideo+bestaudio/best');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      toast({
        title: "Analysis Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormatSelect = useCallback((formatId: string | null, isAudio: boolean) => {
    setSelectedFormat(formatId);
    setIsAudioSelected(isAudio);

    setAdvancedOptions(prev => {
      const audioFormats = ['opus', 'mp3', 'm4a', 'flac', 'wav'];
      if (isAudio) {
        let matchingExt = 'opus';
        if (formatId) {
          const stripped = formatId.replace(/^audio-/, '').toLowerCase();
          if (audioFormats.includes(stripped)) matchingExt = stripped;
        }
        return { ...prev, outputFormat: matchingExt };
      } else {
        if (audioFormats.includes(prev.outputFormat.toLowerCase())) {
          return { ...prev, outputFormat: appSettings?.default_format || 'mp4' };
        }
        return prev;
      }
    });
  }, [appSettings]);

  const handleDownload = async () => {
    if (!analysisResult && batchTargets.length === 0) return;

    const primaryTargets = analysisResult
      ? analysisResult.entries
        ? analysisResult.entries.filter(e => selectedPlaylistUrls.includes(e.url))
          .map(e => ({ title: e.title, url: e.url, formatId: selectedFormat ?? 'bestvideo+bestaudio/best', isAudio: isAudioSelected }))
        : [{ title: analysisResult.title, url: analysisResult.url, formatId: selectedFormat ?? 'bestvideo+bestaudio/best', isAudio: isAudioSelected }]
      : [];

    const allTargets = [
      ...primaryTargets,
      ...batchTargets,
    ];

    if (allTargets.length === 0) {
      toast({ title: "No videos selected", description: "Please select at least one item to download.", variant: "destructive" });
      return;
    }

    setDownloadStatus('downloading');
    setErrorMessage('');

    if (!unlistenRef.current) {
      const unlisten = await onDownloadProgress((progress) => {
        setBatchProgressMap(prev => {
          const next = new Map(prev);
          const existing = next.get(progress.downloadId);
          if (existing) {
            next.set(progress.downloadId, {
              ...existing,
              percent: progress.percent,
              speed: progress.speed,
              eta: progress.eta,
              status: progress.status,
            });
          }
          return next;
        });

        if (progress.status === 'completed') {
          activeDownloads.current.delete(progress.downloadId);
          setHistoryRefreshKey(k => k + 1);

          // Remove completed task from active map after 2 seconds
          setTimeout(() => {
            setBatchProgressMap(prev => {
              const next = new Map(prev);
              next.delete(progress.downloadId);
              return next;
            });
          }, 2000);

          if (activeDownloads.current.size === 0) {
            setDownloadStatus('completed');
            toast({ title: "Download complete!", description: "Check your history for completed files." });

            if (appSettings?.auto_reset_on_finish) {
              setTimeout(() => {
                handleReset();
                toast({ title: "Ready for Next Download", description: "Downloader auto-reset completed." });
              }, 2500);
            }
          }
        } else if (progress.status === 'paused') {
          activeDownloads.current.delete(progress.downloadId);
          if (activeDownloads.current.size === 0) {
            setDownloadStatus('idle');
          }
        } else if (progress.status === 'cancelled') {
          activeDownloads.current.delete(progress.downloadId);
          if (activeDownloads.current.size === 0) {
            setDownloadStatus('idle');
          }
        } else if (progress.status.startsWith('error')) {
          activeDownloads.current.delete(progress.downloadId);
          const msg = progress.status.replace('error:', '').trim();
          setErrorMessage(msg);
          if (activeDownloads.current.size === 0) {
            setDownloadStatus('error');
          }
          toast({
            title: "Download Failed",
            description: msg || "Process encountered an error.",
            variant: "destructive",
          });
        }
      });
      unlistenRef.current = unlisten;
    }

    for (const target of allTargets) {
      const downloadId = uuidv4();
      activeDownloads.current.add(downloadId);

      setBatchProgressMap(prev => {
        const next = new Map(prev);
        next.set(downloadId, {
          downloadId,
          title: target.title,
          percent: 0,
          speed: 'Queued...',
          eta: '',
          status: 'queued',
        });
        return next;
      });

      const downloadOptions: DownloadOptions = {
        title: target.title,
        url: target.url,
        formatId: (target as BatchDownloadTarget).formatId ?? selectedFormat ?? 'bestvideo+bestaudio/best',
        isAudio: (target as BatchDownloadTarget).isAudio ?? isAudioSelected,
        options: advancedOptions,
      };

      downloadOptionsMap.current.set(downloadId, downloadOptions);

      try {
        await startDownload(downloadId, downloadOptions);
      } catch (err) {
        activeDownloads.current.delete(downloadId);
        setBatchProgressMap(prev => {
          const next = new Map(prev);
          const item = next.get(downloadId);
          if (item) next.set(downloadId, { ...item, status: 'error' });
          return next;
        });
        console.error(`Failed to start download for ${target.title}:`, err);
      }
    }
  };

  const handleBrowseFolder = async () => {
    const path = await openFolderDialog();
    if (path) {
      setAdvancedOptions((prev) => ({ ...prev, outputPath: path }));
    }
  };

  const handleCancel = async () => {
    const ids = Array.from(activeDownloads.current);
    if (ids.length === 0) return;

    try {
      await Promise.all(ids.map(id => cancelDownload(id)));
      activeDownloads.current.clear();
      setBatchProgressMap(prev => {
        const next = new Map(prev);
        for (const [id, item] of next.entries()) {
          if (item.status !== 'completed' && !item.status.startsWith('error')) {
            next.set(id, { ...item, status: 'cancelled' });
          }
        }
        return next;
      });
      setDownloadStatus('idle');
      toast({ title: "Cancelled", description: "Active downloads have been cancelled." });
    } catch (err) {
      toast({ title: "Failed to cancel", description: String(err), variant: "destructive" });
    }
  };

  const copyTitle = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult.title);
    toast({
      title: "Copied",
      description: "Title copied to clipboard.",
    });
  };

  const handleReset = useCallback(() => {
    setUrl('');
    setAnalysisResult(null);
    setSelectedFormat(null);
    setSelectedPlaylistUrls([]);
    setIsAudioSelected(false);
    setDownloadStatus('idle');
    setErrorMessage('');
    setBatchProgressMap(new Map());
    setBatchTargets([]);
    setShowBatchManager(false);
  }, []);

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="max-w-[1100px] mx-auto p-4 md:p-8 space-y-6 animate-fade-in">
        <Header
          activeView={activeView}
          onViewChange={setActiveView}
          activeDownloadCount={activeDownloadCount}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenUpdates={() => setIsUpdatesOpen(true)}
        />

        {/* View 1: Main Downloader View */}
        {activeView === 'downloader' && (
          <div className="w-full space-y-6 animate-fade-in">
            <Card className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <UrlInput
                  url={url}
                  setUrl={setUrl}
                  handleAnalyze={handleAnalyze}
                  platform={platform}
                  isAnalyzing={isAnalyzing}
                />
                
                {/* Batch URL Toggle */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowBatchManager(v => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-xl hover:bg-muted"
                  >
                    {showBatchManager ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {showBatchManager
                      ? 'Hide batch queue'
                      : batchTargets.length > 0
                        ? `Batch queue: ${batchTargets.length} items ready`
                        : 'Batch Download (Multiple URLs)'}
                  </button>
                  <div className={showBatchManager ? 'mt-4 animate-slide-up' : 'hidden'}>
                    <BatchUrlManager
                      ref={batchManagerRef}
                      defaultFormatId={selectedFormat}
                      defaultIsAudio={isAudioSelected}
                      onTargetsChange={setBatchTargets}
                    />
                  </div>
                </div>
              </CardHeader>

              <Separator className="bg-border" />

              <CardContent className="p-6">
                {isAnalyzing ? (
                  <AnalysisSkeleton />
                ) : !analysisResult ? (
                  <InitialState />
                ) : (
                  <div className="space-y-6 animate-slide-up">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <div className="relative group shrink-0">
                        {analysisResult.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={analysisResult.thumbnailUrl}
                            alt="Thumbnail"
                            className="rounded-2xl aspect-video object-cover w-full sm:w-64 border border-border shadow-sm"
                          />
                        ) : (
                          <div className="rounded-2xl aspect-video bg-muted w-full sm:w-64 flex items-center justify-center border border-dashed text-muted-foreground text-xs font-semibold">
                            No Thumbnail
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white font-bold">
                          {analysisResult.duration}
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 text-center sm:text-left">
                        <div className="flex justify-between items-start gap-3">
                          <h2 className="text-base font-bold leading-snug tracking-tight text-foreground line-clamp-2">
                            {analysisResult.title}
                          </h2>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-lg hover:bg-muted text-muted-foreground"
                            onClick={copyTitle}
                            title="Copy Title"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
                          <span className="bg-muted px-2.5 py-1 rounded-lg border border-border font-medium">
                            {analysisResult.author}
                          </span>
                          <span className="bg-muted px-2.5 py-1 rounded-lg border border-border font-mono">
                            {analysisResult.duration}
                          </span>
                          {analysisResult.isPlaylist && (
                            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20 font-semibold">
                              Playlist ({analysisResult.playlistCount ?? '?'})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {analysisResult.entries && (
                      <div className="pt-2">
                        <Separator className="mb-4 bg-border" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Playlist Items</h3>
                        <PlaylistSelector
                          entries={analysisResult.entries}
                          selectedUrls={selectedPlaylistUrls}
                          onSelectionChange={setSelectedPlaylistUrls}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Format</h3>
                        <FormatSelector
                          result={analysisResult}
                          selectedFormat={selectedFormat}
                          setSelectedFormat={handleFormatSelect}
                          isDownloading={downloadStatus === 'downloading'}
                          isAudioSelected={isAudioSelected}
                          defaultAudioFormat={appSettings?.default_audio_format || 'opus'}
                          defaultVideoFormat={appSettings?.default_format || 'bestvideo+bestaudio/best'}
                        />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Options</h3>
                        <AdvancedOptions
                          options={advancedOptions}
                          setOptions={setAdvancedOptions}
                          isDownloading={downloadStatus === 'downloading'}
                          isAudioSelected={isAudioSelected}
                          onBrowseFolder={handleBrowseFolder}
                        />
                      </div>
                    </div>

                    <Separator className="bg-border" />

                    <DownloadSection
                      handleDownload={handleDownload}
                      isDownloading={downloadStatus === 'downloading'}
                      downloadProgress={progressMetrics.percent}
                      status={downloadStatus}
                      isFormatSelected={!!selectedFormat || !!analysisResult.isPlaylist || batchTargets.length > 0}
                      speed={progressMetrics.speed}
                      eta={progressMetrics.eta}
                      filename={progressMetrics.filename}
                      errorMessage={errorMessage}
                      onReset={handleReset}
                      onCancel={handleCancel}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* View 2: Dedicated Downloads & History Manager */}
        {activeView === 'downloads' && (
          <div className="w-full animate-fade-in">
            <DownloadsManager
              activeDownloads={batchProgressMap}
              onCancelActive={handleCancelItem}
              onPauseActive={handlePauseItem}
              onResumeActive={handleResumeItem}
              onRetryActive={handleRetryItem}
              refreshTrigger={historyRefreshKey}
            />
          </div>
        )}

        <SettingsModal
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          onSettingsSaved={handleSettingsSaved}
        />

        <UpdateModal
          open={isUpdatesOpen}
          onOpenChange={setIsUpdatesOpen}
        />
      </div>
    </main>
  );
}
