"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/button";
import { X, XCircle, ChevronUp, ChevronDown, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { cancelDownload } from "@/lib/tauri";

export type ActiveDownloadProgress = {
    downloadId: string;
    title: string;
    percent: number;
    speed: string;
    eta: string;
    status: string;
};

interface ActiveDownloadsDrawerProps {
    downloads: Map<string, ActiveDownloadProgress>;
    onCancel: (id: string) => void;
}

export default function ActiveDownloadsDrawer({ downloads, onCancel }: ActiveDownloadsDrawerProps) {
    const [isOpen, setIsOpen] = useState(true);
    const activeCount = Array.from(downloads.values()).filter(d => d.status !== 'completed' && !d.status.startsWith('error')).length;

    if (downloads.size === 0) return null;

    return (
        <div className={`fixed bottom-0 right-4 sm:right-8 z-50 w-[calc(100%-32px)] sm:w-[420px] bg-card/80 backdrop-blur-xl border border-primary/20 shadow-2xl transition-all duration-500 ease-in-out transform rounded-t-3xl overflow-hidden ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-56px)]'
            }`}>
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 border-b cursor-pointer bg-primary/10 hover:bg-primary/20 transition-colors rounded-t-3xl"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <Download className={`h-6 w-6 text-primary ${activeCount > 0 ? 'animate-bounce' : ''}`} />
                    <span className="text-base font-black tracking-tight">Active Downloads ({activeCount})</span>
                </div>
                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="h-6 w-6 text-muted-foreground" /> : <ChevronUp className="h-6 w-6 text-muted-foreground" />}
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="h-[450px] p-4 custom-scrollbar">
                <div className="space-y-6">
                    {Array.from(downloads.values()).reverse().map((dl) => (
                        <div key={dl.downloadId} className="space-y-3 bg-muted/40 p-4 rounded-2xl border border-primary/10 shadow-sm transition-all hover:border-primary/30">
                            <div className="flex justify-between items-start gap-4">
                                <p className="text-base font-bold truncate flex-1 text-foreground" title={dl.title}>{dl.title}</p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCancel(dl.downloadId);
                                    }}
                                    disabled={dl.status === 'completed' || dl.status.startsWith('error') || dl.status === 'cancelled'}
                                >
                                    <XCircle className="h-5 w-5" />
                                </Button>
                            </div>

                            <ProgressBar
                                value={dl.percent}
                                className={`h-2.5 shadow-sm ${dl.status === 'completed' ? 'bg-green-500' : dl.status.startsWith('error') ? 'bg-red-500' : dl.status === 'cancelled' ? 'bg-orange-500' : 'bg-primary/20'}`}
                            />

                            <div className="flex justify-between text-sm font-bold mt-1">
                                <span className="text-muted-foreground/90">
                                    {dl.status === 'queued' ? '⏳ Queued...' : dl.status === 'cancelled' ? '🚫 Cancelled' : dl.status === 'completed' ? '✅ Finished' : `${dl.speed} ${dl.eta ? `· ${dl.eta}` : ''}`}
                                </span>
                                <span className={dl.status === 'completed' ? 'text-green-600' : dl.status.startsWith('error') ? 'text-red-500' : dl.status === 'cancelled' ? 'text-orange-500' : 'text-primary'}>
                                    {dl.status === 'downloading' ? `${Math.round(dl.percent)}%` : dl.status.charAt(0).toUpperCase() + dl.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
