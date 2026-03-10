"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Platform, AnalysisResult, AdvancedOptions as AdvancedOptionsType, DownloadOptions } from '@/types';
import Header from '@/components/Header';
import UrlInput from '@/components/UrlInput';
import { Copy, Plus, X, History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import FormatSelector from '@/components/FormatSelector';
import AdvancedOptions from '@/components/AdvancedOptions';
import PlaylistSelector from '@/components/PlaylistSelector';
import DownloadSection from '@/components/DownloadSection';
import DownloadHistory from '@/components/DownloadHistory';
import ActiveDownloadsDrawer, { ActiveDownloadProgress } from '@/components/ActiveDownloadsDrawer';
import BatchUrlManager, { BatchDownloadTarget, BatchUrlManagerHandle } from '@/components/BatchUrlManager';
import { getVideoInfo, startDownload, cancelDownload, onDownloadProgress, openFolderDialog, getDownloadHistory } from '@/lib/tauri';
import { v4 as uuidv4 } from 'uuid';

const AnalysisSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-24 w-40 rounded-lg" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
    <Skeleton className="h-10 w-full" />
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  </div>
);

const InitialState = () => (
  <div className="text-center text-muted-foreground py-16 animate-fade-in">
    <h3 className="text-lg font-semibold">Ready when you are</h3>
    <p className="text-sm mt-1">Paste any YouTube, Twitter, Instagram, or supported URL above.</p>
  </div>
);

export default function Home() {
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
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('');
  const [downloadEta, setDownloadEta] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [batchProgressMap, setBatchProgressMap] = useState<Map<string, ActiveDownloadProgress>>(new Map());
  // Batch URL manager targets (from BatchUrlManager component)
  const [batchTargets, setBatchTargets] = useState<BatchDownloadTarget[]>([]);
  const [showBatchManager, setShowBatchManager] = useState(false);

  const currentDownloadId = useRef<string | null>(null);
  const activeDownloads = useRef<Set<string>>(new Set());
  const unlistenRef = useRef<(() => void) | null>(null);
  const batchManagerRef = useRef<BatchUrlManagerHandle>(null);

  const { toast } = useToast();

  const handleCancelItem = async (id: string) => {
    try {
      await cancelDownload(id);
      activeDownloads.current.delete(id);
      setBatchProgressMap(prev => {
        const next = new Map(prev);
        const item = next.get(id);
        if (item) next.set(id, { ...item, status: 'cancelled' });
        return next;
      });
    } catch (err) {
      toast({ title: "Failed to cancel", description: String(err), variant: "destructive" });
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

  // Clean up event listener on unmount
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    async function setupDragDrop() {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();

      const unsubscribe = await win.onDragDropEvent((event) => {
        if (event.payload.type === 'drop') {
          const droppedText = event.payload.paths[0]; // For URLs, it usually comes as a path if dragged from browser or text
          if (droppedText && (droppedText.startsWith('http://') || droppedText.startsWith('https://'))) {
            setUrl(droppedText);
            // Optionally auto-analyze
            // Since setUrl is async in terms of state, we might need a ref or effect
          }
        }
      });
      unlisten = unsubscribe;
    }

    setupDragDrop();

    return () => {
      if (unlisten) unlisten();
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

  // Auto-analyze when URL is changed via drag & drop
  useEffect(() => {
    if (url && !isAnalyzing && !analysisResult) {
      // Small timeout to ensure the UI has updated or just check if it's a "fresh" URL
      // handleAnalyze(); // Triggering here might be too aggressive if typing, but for drag-drop it's good.
      // We'll leave it to the user to click analyze for now to avoid loops, or use a heuristic.
    }
  }, [url]);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSelectedFormat(null);
    setSelectedPlaylistUrls([]);
    setDownloadStatus('idle');
    setDownloadProgress(0);
    setErrorMessage('');

    // Also trigger batch URL analysis if the batch manager has pending input
    batchManagerRef.current?.analyzeCurrentInput();

    try {
      const result = await getVideoInfo(url);
      setAnalysisResult(result);
      if (result.entries) {
        setSelectedPlaylistUrls(result.entries.map(e => e.url));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      toast({
        title: "Failed to analyze URL",
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
  }, []);

  const handleDownload = async () => {
    if (!analysisResult) return;

    // Build targets: playlist items OR single video from the analyzed URL
    const primaryTargets = analysisResult.entries
      ? analysisResult.entries.filter(e => selectedPlaylistUrls.includes(e.url))
        .map(e => ({ title: e.title, url: e.url, formatId: selectedFormat ?? 'bestvideo+bestaudio/best', isAudio: isAudioSelected }))
      : [{ title: analysisResult.title, url: analysisResult.url, formatId: selectedFormat ?? 'bestvideo+bestaudio/best', isAudio: isAudioSelected }];

    // Merge in batch-managed URLs (each may have its own quality override)
    const allTargets = [
      ...primaryTargets,
      ...batchTargets,  // already has per-video formatId from BatchUrlManager
    ];

    if (allTargets.length === 0) {
      toast({ title: "No videos selected", description: "Please select at least one video to download.", variant: "destructive" });
      return;
    }

    setDownloadStatus('downloading');
    setDownloadProgress(0);
    setDownloadSpeed(`Processing ${allTargets.length} items...`);
    setDownloadEta('');
    setDownloadFilename('');
    setErrorMessage('');

    // Ensure listener is active
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
          if (activeDownloads.current.size === 0) {
            setDownloadStatus('completed');
            toast({ title: "All downloads complete!", description: "Look at your history for details." });
          }
        } else if (progress.status.startsWith('error')) {
          activeDownloads.current.delete(progress.downloadId);
          const msg = progress.status.replace('error:', '');
          setErrorMessage(msg);
          if (activeDownloads.current.size === 0) {
            setDownloadStatus('error');
          }
        } else {
          setDownloadProgress(progress.percent);
          setDownloadSpeed(progress.speed);
          setDownloadEta(progress.eta);
          setDownloadFilename(progress.filename);
        }
      });
      unlistenRef.current = unlisten;
    }

    for (const target of allTargets) {
      const downloadId = uuidv4();
      activeDownloads.current.add(downloadId);

      // Add to batch map immediately as queued
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
        // Use per-target formatId if available (from batch manager), else global
        formatId: (target as BatchDownloadTarget).formatId ?? selectedFormat ?? 'bestvideo+bestaudio/best',
        isAudio: (target as BatchDownloadTarget).isAudio ?? isAudioSelected,
        options: advancedOptions,
      };

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
      setDownloadSpeed('Cancelling...');
      await Promise.all(ids.map(id => cancelDownload(id)));
      activeDownloads.current.clear();
      setDownloadStatus('idle');
      setDownloadProgress(0);
      setDownloadSpeed('');
      toast({ title: "Downloads cancelled", description: "All active tasks have been stopped." });
    } catch (err) {
      toast({ title: "Failed to cancel", description: String(err), variant: "destructive" });
    }
  };

  const copyTitle = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult.title);
    toast({
      title: "Copied!",
      description: "Video title copied to clipboard.",
    });
  };

  const handleReset = useCallback(() => {
    setUrl('');
    setAnalysisResult(null);
    setSelectedFormat(null);
    setSelectedPlaylistUrls([]);
    setIsAudioSelected(false);
    setDownloadStatus('idle');
    setDownloadProgress(0);
    setDownloadSpeed('');
    setDownloadEta('');
    setDownloadFilename('');
    setErrorMessage('');
    setBatchProgressMap(new Map());
    setBatchTargets([]);
    setShowBatchManager(false);
  }, []);

  return (
    <main className="min-h-screen w-full relative overflow-x-hidden bg-background">
      {/* Dynamic Theme Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] animate-pulse-soft delay-700" />
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-accent/20 rounded-full blur-[110px] animate-pulse-soft delay-1000" />

        {/* Grain Texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative z-10 p-4 md:p-8 lg:p-12 animate-premium-in selection:bg-primary/20">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <Header />

          <div className="flex flex-col gap-12">
            {/* Main Content Column — Now Full Width */}
            <div className="w-full space-y-8">
              <Card className="rounded-[3rem] shadow-2xl border border-white/5 bg-card/60 backdrop-blur-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] hover:border-white/10">
                <CardHeader className="p-8 pb-4">
                  <UrlInput
                    url={url}
                    setUrl={setUrl}
                    handleAnalyze={handleAnalyze}
                    platform={platform}
                    isAnalyzing={isAnalyzing}
                  />
                  {/* ── Batch URL Manager ── */}
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setShowBatchManager(v => !v)}
                      className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-all py-2 px-4 rounded-2xl hover:bg-primary/5 active:scale-95"
                    >
                      {showBatchManager ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {showBatchManager
                        ? 'Hide batch manager'
                        : batchTargets.length > 0
                          ? `Batch queue: ${batchTargets.length} video${batchTargets.length > 1 ? 's' : ''} ready`
                          : 'Add more URLs (batch download)'}
                    </button>
                    {/* Keep mounted at all times to preserve state — hide/show via CSS */}
                    <div className={showBatchManager ? 'mt-6 animate-premium-in duration-500' : 'hidden'}>
                      <BatchUrlManager
                        ref={batchManagerRef}
                        defaultFormatId={selectedFormat}
                        defaultIsAudio={isAudioSelected}
                        onTargetsChange={setBatchTargets}
                      />
                    </div>
                  </div>
                </CardHeader>
                <Separator className="bg-white/5" />
                <CardContent className="p-8 pt-10">
                  {isAnalyzing ? (
                    <AnalysisSkeleton />
                  ) : !analysisResult ? (
                    <InitialState />
                  ) : (
                    <div className="space-y-10 animate-premium-in">
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                        <div className="relative group shrink-0">
                          {analysisResult.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={analysisResult.thumbnailUrl}
                              alt="Video thumbnail"
                              className="rounded-[2.5rem] aspect-video object-cover w-full md:w-80 shadow-2xl border border-white/10 group-hover:scale-[1.03] transition-transform duration-500"
                            />
                          ) : (
                            <div className="rounded-[2.5rem] aspect-video bg-muted/50 w-full md:w-80 flex items-center justify-center border border-dashed text-muted-foreground text-sm font-bold">
                              No Thumbnail
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                            <span className="text-white text-xs font-black uppercase tracking-widest">{analysisResult.duration}</span>
                          </div>
                        </div>

                        <div className="flex-1 space-y-6 text-center md:text-left">
                          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                            <h2 className="text-lg md:text-xl font-black leading-tight tracking-tight text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300 font-mono">
                              {analysisResult.title}
                            </h2>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-12 w-12 flex-shrink-0 rounded-2xl hover:scale-110 transition-all bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                              onClick={copyTitle}
                              title="Copy Title"
                            >
                              <Copy className="h-5 w-5" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-cyan-400/70 font-bold uppercase tracking-widest font-mono">
                            <span className="bg-cyan-500/5 px-4 py-1.5 rounded-xl border border-cyan-500/10 backdrop-blur-sm">
                              Author: <span className="text-cyan-400">{analysisResult.author}</span>
                            </span>
                            <span className="bg-cyan-500/5 px-4 py-1.5 rounded-xl border border-cyan-500/10 backdrop-blur-sm">
                              TIME: <span className="text-cyan-400">{analysisResult.duration}</span>
                            </span>
                            {analysisResult.isPlaylist && (
                              <span className="bg-fuchsia-500/10 text-fuchsia-400 px-4 py-1.5 rounded-xl flex items-center gap-2 border border-fuchsia-500/20 shadow-[0_0_10px_rgba(232,121,249,0.1)]">
                                <Plus className="h-4 w-4" /> PL_IDX ({analysisResult.playlistCount ?? '?'})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {analysisResult.entries && (
                        <div className="animate-premium-in delay-150 duration-700">
                          <Separator className="mb-8 bg-white/5" />
                          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-fuchsia-500/60 mb-6 font-mono border-l-2 border-fuchsia-500/30 pl-4">Playlist Content</h3>
                          <PlaylistSelector
                            entries={analysisResult.entries}
                            onSelectionChange={setSelectedPlaylistUrls}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
                        <div className="space-y-6">
                          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-500/60 font-mono border-l-2 border-cyan-500/30 pl-4">Select Format</h3>
                          <FormatSelector
                            result={analysisResult}
                            selectedFormat={selectedFormat}
                            setSelectedFormat={handleFormatSelect}
                            isDownloading={downloadStatus === 'downloading'}
                          />
                        </div>
                        <div className="space-y-6">
                          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500/60 font-mono border-l-2 border-indigo-500/30 pl-4">Download Settings</h3>
                          <AdvancedOptions
                            options={advancedOptions}
                            setOptions={setAdvancedOptions}
                            isDownloading={downloadStatus === 'downloading'}
                            onBrowseFolder={handleBrowseFolder}
                          />
                        </div>
                      </div>

                      <Separator className="bg-white/5" />

                      <DownloadSection
                        handleDownload={handleDownload}
                        isDownloading={downloadStatus === 'downloading'}
                        downloadProgress={downloadProgress}
                        status={downloadStatus}
                        isFormatSelected={!!selectedFormat || !!analysisResult.isPlaylist || batchTargets.length > 0}
                        speed={downloadSpeed}
                        eta={downloadEta}
                        filename={downloadFilename}
                        errorMessage={errorMessage}
                        onReset={handleReset}
                        onCancel={handleCancel}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Column — Now Bottom Section */}
            <div className="w-full space-y-8 pt-4">
              <div className="relative animate-premium-in delay-300 duration-1000">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-[3.5rem] blur-2xl opacity-30" />
                <Card className="relative rounded-[3rem] shadow-2xl border border-white/5 bg-card/40 backdrop-blur-3xl overflow-hidden flex flex-col min-h-[400px]">
                  <CardHeader className="p-8 pb-6 border-b border-white/5 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black flex items-center gap-3">
                        <HistoryIcon className="h-8 w-8 text-primary" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Recent Downloads</span>
                      </h3>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[800px] overflow-y-auto custom-scrollbar">
                      <DownloadHistory />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <ActiveDownloadsDrawer
            downloads={batchProgressMap}
            onCancel={handleCancelItem}
          />
        </div>
      </div>
    </main>
  );
}
