import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ExternalLink, History } from "lucide-react";
import { getDownloadHistory, clearDownloadHistory } from "@/lib/tauri";
import type { DownloadHistoryItem } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function DownloadHistory() {
    const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadHistory = async () => {
        try {
            setIsLoading(true);
            const data = await getDownloadHistory();
            // Sort newest first
            setHistory(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch (err) {
            console.error("Failed to load history:", err);
            toast({
                title: "Error loading history",
                description: "Could not retrieve your download history.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
        // Set up an interval to refresh history occasionally, or we could rely on an event.
        // For now, load on mount.
    }, []);

    const handleClearHistory = async () => {
        try {
            await clearDownloadHistory();
            setHistory([]);
            toast({
                title: "History cleared",
                description: "Your download history has been completely removed.",
            });
        } catch (err) {
            toast({
                title: "Failed to clear",
                description: "An error occurred while clearing history.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
                Loading history...
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground italic">
                No recent downloads.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-end p-2 border-b bg-muted/5 font-medium">
                <Button variant="ghost" size="sm" onClick={handleClearHistory} className="text-[10px] font-black uppercase tracking-widest h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all active:scale-95">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Clear History
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {history.map((item) => (
                        <div key={item.id} className="group relative flex flex-col gap-3 p-5 rounded-[2.5rem] glass-card border border-white/5 hover:border-white/10 transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] mb-2">
                            <div className="flex justify-between items-start">
                                <span className="font-semibold text-[13px] leading-tight truncate pr-2 group-hover:text-primary transition-colors" title={item.title}>
                                    {item.title || "Unknown File"}
                                </span>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                                    title="Open original URL"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-wider">{item.format}</span>
                                    <span className="text-[10px] font-black italic text-muted-foreground/70 tracking-tight">
                                        {new Date(item.timestamp).toLocaleDateString()} · {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                            {item.outputPath && (
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 truncate bg-background/40 px-2 py-1 rounded-md border border-primary/5" title={item.outputPath}>
                                    <span className="opacity-70">📁</span> {item.outputPath}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
