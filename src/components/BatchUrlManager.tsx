"use client";

import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getVideoInfo } from "@/lib/tauri";
import { AnalysisResult, VideoFormat, AudioFormat, PlaylistItem } from "@/types";
import { Loader2, Trash2, AlertCircle } from "lucide-react";

export interface BatchVideoItem {
    id: string;
    url: string;
    title: string;
    thumbnailUrl: string;
    duration: string;
    author: string;
    isPlaylist: boolean;
    entries: PlaylistItem[];
    selectedEntryUrls: string[];
    videoFormats: VideoFormat[];
    audioFormats: AudioFormat[];
    /** null = use global default */
    overrideFormatId: string | null;
    overrideIsAudio: boolean;
    status: "analyzing" | "ready" | "error";
    error?: string;
    expanded: boolean;
}

export interface BatchDownloadTarget {
    url: string;
    title: string;
    formatId: string;
    isAudio: boolean;
}

export interface BatchUrlManagerHandle {
    analyzeCurrentInput: () => void;
}

interface BatchUrlManagerProps {
    defaultFormatId: string | null;
    defaultIsAudio: boolean;
    onTargetsChange: (targets: BatchDownloadTarget[]) => void;
}

const BatchUrlManager = forwardRef<BatchUrlManagerHandle, BatchUrlManagerProps>(
    ({ defaultFormatId, defaultIsAudio, onTargetsChange }, ref) => {
        const [inputText, setInputText] = useState("");
        const [items, setItems] = useState<BatchVideoItem[]>([]);
        const [isAnalyzing, setIsAnalyzing] = useState(false);

        const notifyParent = useCallback((updated: BatchVideoItem[]) => {
            const targets: BatchDownloadTarget[] = [];
            for (const item of updated) {
                if (item.status !== "ready") continue;
                const fmtId = item.overrideFormatId ?? defaultFormatId ?? "bestvideo+bestaudio/best";
                const isAudio = item.overrideFormatId ? item.overrideIsAudio : defaultIsAudio;
                if (item.isPlaylist && item.entries.length > 0) {
                    // Flatten selected playlist entries into individual targets
                    for (const entry of item.entries) {
                        if (item.selectedEntryUrls.includes(entry.url)) {
                            targets.push({ url: entry.url, title: entry.title, formatId: fmtId, isAudio });
                        }
                    }
                } else {
                    targets.push({ url: item.url, title: item.title, formatId: fmtId, isAudio });
                }
            }
            // Defer to avoid setState-during-render when called inside setItems updater
            setTimeout(() => onTargetsChange(targets), 0);
        }, [defaultFormatId, defaultIsAudio, onTargetsChange]);

        const analyzeUrls = useCallback(async (overrideText?: string) => {
            const text = overrideText ?? inputText;
            const rawUrls = text
                .split("\n")
                .map(u => u.trim())
                .filter(u => u.startsWith("http"));

            if (rawUrls.length === 0) return;

            setIsAnalyzing(true);
            setInputText("");

            const newPending: BatchVideoItem[] = rawUrls
                .filter(u => !items.some(i => i.url === u))
                .map(u => ({
                    id: crypto.randomUUID(),
                    url: u,
                    title: u,
                    thumbnailUrl: "",
                    duration: "",
                    author: "",
                    isPlaylist: false,
                    entries: [],
                    selectedEntryUrls: [],
                    videoFormats: [],
                    audioFormats: [],
                    overrideFormatId: null,
                    overrideIsAudio: false,
                    status: "analyzing" as const,
                    expanded: false,
                }));

            // Add placeholders immediately
            setItems(prev => [...prev, ...newPending]);

            // Analyze concurrently
            const results = await Promise.allSettled(newPending.map(p => getVideoInfo(p.url)));

            setItems(prev => {
                const next = [...prev];
                newPending.forEach((pending, idx) => {
                    const i = next.findIndex(x => x.id === pending.id);
                    if (i === -1) return;
                    const result = results[idx];
                    if (result.status === "fulfilled") {
                        const r: AnalysisResult = result.value;
                        const allEntryUrls = (r.entries ?? []).map(e => e.url);
                        next[i] = {
                            ...next[i],
                            title: r.title,
                            thumbnailUrl: r.thumbnailUrl,
                            duration: r.duration,
                            author: r.author,
                            isPlaylist: !!r.isPlaylist,
                            entries: r.entries ?? [],
                            selectedEntryUrls: allEntryUrls,
                            videoFormats: r.videoFormats,
                            audioFormats: r.audioFormats,
                            status: "ready",
                            // Auto-expand playlists so user sees the video list immediately
                            expanded: !!r.isPlaylist && (r.entries?.length ?? 0) > 0,
                        };
                    } else {
                        next[i] = { ...next[i], error: String(result.reason), status: "error" };
                    }
                });
                notifyParent(next);
                return next;
            });

            setIsAnalyzing(false);
        }, [inputText, items, notifyParent]);

        // Expose analyzeCurrentInput so parent can trigger it
        useImperativeHandle(ref, () => ({
            analyzeCurrentInput: () => {
                if (inputText.trim()) analyzeUrls();
            },
        }), [analyzeUrls, inputText]);

        const removeItem = (id: string) => {
            setItems(prev => {
                const next = prev.filter(i => i.id !== id);
                notifyParent(next);
                return next;
            });
        };

        const setOverrideFormat = (id: string, formatId: string, isAudio: boolean) => {
            setItems(prev => {
                const next = prev.map(i =>
                    i.id === id
                        ? { ...i, overrideFormatId: formatId === "__default" ? null : formatId, overrideIsAudio: isAudio }
                        : i
                );
                notifyParent(next);
                return next;
            });
        };

        const toggleEntrySelection = (itemId: string, entryUrl: string) => {
            setItems(prev => {
                const next = prev.map(item => {
                    if (item.id !== itemId) return item;
                    const sel = item.selectedEntryUrls.includes(entryUrl)
                        ? item.selectedEntryUrls.filter(u => u !== entryUrl)
                        : [...item.selectedEntryUrls, entryUrl];
                    return { ...item, selectedEntryUrls: sel };
                });
                notifyParent(next);
                return next;
            });
        };

        const toggleAllEntries = (itemId: string, selectAll: boolean) => {
            setItems(prev => {
                const next = prev.map(item => {
                    if (item.id !== itemId) return item;
                    return { ...item, selectedEntryUrls: selectAll ? item.entries.map(e => e.url) : [] };
                });
                notifyParent(next);
                return next;
            });
        };

        const toggleExpanded = (id: string) => {
            setItems(prev => prev.map(i => i.id === id ? { ...i, expanded: !i.expanded } : i));
        };

        const getFormatOptions = (item: BatchVideoItem) => {
            const opts: { value: string; label: string; isAudio: boolean }[] = [
                { value: "__default", label: "↩ Use Global Quality", isAudio: false },
            ];
            item.videoFormats.forEach(f => opts.push({ value: f.formatId, label: `🎬 ${f.label}`, isAudio: false }));
            item.audioFormats.forEach(f => opts.push({ value: f.formatId, label: `🎵 ${f.label}`, isAudio: true }));
            return opts;
        };

        return (
            <div className="space-y-3">
                {/* URL Input */}
                <div className="flex gap-4">
                    <Textarea
                        className="text-lg font-mono min-h-[160px] resize-none flex-1 p-6 rounded-[2.5rem] bg-card/40 backdrop-blur-xl border-white/5 focus:border-primary/30 transition-all shadow-inner"
                        placeholder={"Paste URLs, one per line:\nhttps://youtube.com/watch?v=...\nhttps://youtube.com/playlist?list=..."}
                        autoComplete="off"
                        name="batch-url-input"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) analyzeUrls(); }}
                    />
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-[160px] px-8 flex-shrink-0 flex-col gap-3 rounded-[2.5rem] bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all hover:scale-[1.02] active:scale-95 shadow-xl group"
                        onClick={() => analyzeUrls()}
                        disabled={isAnalyzing || !inputText.trim()}
                    >
                        {isAnalyzing
                            ? <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            : <span className="text-3xl transition-transform group-hover:scale-125">▶</span>}
                        <span className="text-sm font-black tracking-widest uppercase">{isAnalyzing ? "..." : "Add URLs"}</span>
                    </Button>
                </div>

                {/* Items list */}
                {items.length > 0 && (
                    <>
                        <div className="flex items-center justify-between px-2">
                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">
                                {items.filter(i => i.status === "ready").length} / {items.length} Ready
                            </p>
                            <Button
                                size="sm" variant="ghost"
                                className="h-8 text-xs text-destructive hover:text-destructive gap-2 font-black uppercase tracking-wider rounded-xl hover:bg-destructive/5"
                                onClick={() => { setItems([]); setTimeout(() => onTargetsChange([]), 0); }}
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Clear All
                            </Button>
                        </div>

                        <ScrollArea className="h-[400px] rounded-[2rem] border-white/5 bg-black/20 p-4">
                            <div className="space-y-2 pr-1">
                                {items.map(item => (
                                    <div key={item.id} className="rounded-[2rem] glass-card overflow-hidden animate-premium-in border-none shadow-lg mb-4">
                                        {/* Main row */}
                                        <div className="flex items-start gap-3 p-2">
                                            {/* Thumbnail */}
                                            <div className="relative flex-shrink-0 w-20 aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                                {item.status === "analyzing" ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                ) : item.status === "error" ? (
                                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                                ) : item.thumbnailUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.thumbnailUrl} alt={item.title} className="object-cover w-full h-full" />
                                                ) : (
                                                    <span className="text-[9px] text-muted-foreground text-center px-1">No Thumb</span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <p className="text-lg font-bold leading-snug truncate" title={item.title}>
                                                    {item.status === "error"
                                                        ? <span className="text-destructive">❌ Analysis Failed</span>
                                                        : item.title}
                                                </p>
                                                {item.status === "ready" && (
                                                    <p className="text-base text-muted-foreground truncate font-medium">
                                                        {item.isPlaylist
                                                            ? `📋 Playlist · ${item.selectedEntryUrls.length}/${item.entries.length} selected`
                                                            : `${item.author} · ${item.duration}`}
                                                    </p>
                                                )}
                                                {/* Format override */}
                                                {item.status === "ready" && item.videoFormats.length > 0 && (
                                                    <Select
                                                        value={item.overrideFormatId ?? "__default"}
                                                        onValueChange={val => {
                                                            const isAudio = item.audioFormats.some(f => f.formatId === val);
                                                            setOverrideFormat(item.id, val, isAudio);
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs w-full rounded-xl bg-primary/5 border-primary/10 font-bold">
                                                            <SelectValue placeholder="Override Quality..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {getFormatOptions(item).map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>

                                            {/* Playlist expand/collapse toggle — visible text button */}
                                            {item.status === "ready" && item.isPlaylist && item.entries.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="text-sm text-primary font-black hover:bg-primary/5 py-2 px-4 rounded-xl transition-all active:scale-95 text-left mt-2 flex items-center gap-2 italic"
                                                    onClick={() => toggleExpanded(item.id)}
                                                >
                                                    {item.expanded
                                                        ? `▼ ${item.selectedEntryUrls.length}/${item.entries.length} Selected`
                                                        : `▶ View ${item.entries.length} Videos`}
                                                </button>
                                            )}

                                            <div className="flex flex-col gap-1 flex-shrink-0">
                                                <Button
                                                    size="icon" variant="ghost"
                                                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Playlist entries (collapsible) */}
                                        {item.isPlaylist && item.expanded && item.entries.length > 0 && (
                                            <div className="border-t bg-muted/30 px-2 pb-2">
                                                <div className="flex items-center justify-between py-3">
                                                    <span className="text-sm text-muted-foreground font-bold italic">
                                                        Select Videos ({item.selectedEntryUrls.length}/{item.entries.length})
                                                    </span>
                                                    <div className="flex gap-4">
                                                        <button
                                                            className="text-sm text-primary font-black hover:underline"
                                                            onClick={() => toggleAllEntries(item.id, true)}
                                                        >Select All</button>
                                                        <button
                                                            className="text-sm text-muted-foreground font-bold hover:underline"
                                                            onClick={() => toggleAllEntries(item.id, false)}
                                                        >Deselect All</button>
                                                    </div>
                                                </div>
                                                <ScrollArea className="h-[160px]">
                                                    <div className="space-y-1 pr-1">
                                                        {item.entries.map((entry, idx) => (
                                                            <div
                                                                key={entry.url}
                                                                className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/40 cursor-pointer select-none"
                                                                onClick={() => toggleEntrySelection(item.id, entry.url)}
                                                            >
                                                                <Checkbox
                                                                    checked={item.selectedEntryUrls.includes(entry.url)}
                                                                    className="h-3.5 w-3.5 pointer-events-none flex-shrink-0"
                                                                    tabIndex={-1}
                                                                />
                                                                <div className="flex-shrink-0 w-12 aspect-video rounded-md overflow-hidden bg-muted">
                                                                    {entry.thumbnailUrl
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        ? <img src={entry.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                                        : <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">{idx + 1}</div>
                                                                    }
                                                                </div>
                                                                <p className="text-sm font-bold truncate flex-1" title={entry.title}>
                                                                    {idx + 1}. {entry.title}
                                                                </p>
                                                                <span className="text-xs text-muted-foreground font-bold font-mono">{entry.duration}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </>
                )}
            </div>
        );
    }
);

BatchUrlManager.displayName = "BatchUrlManager";
export default BatchUrlManager;
