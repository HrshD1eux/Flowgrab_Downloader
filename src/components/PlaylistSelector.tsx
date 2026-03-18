"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlaylistItem } from "@/types";
import Image from "next/image";
import { CheckSquare, Square } from "lucide-react";

interface PlaylistSelectorProps {
    entries: PlaylistItem[];
    onSelectionChange: (selectedUrls: string[]) => void;
}

export default function PlaylistSelector({ entries, onSelectionChange }: PlaylistSelectorProps) {
    const allUrls = entries.map(e => e.url);
    const [selectedUrls, setSelectedUrls] = useState<string[]>(allUrls);

    // Notify parent on mount only, via useEffect to avoid setState-during-render
    useEffect(() => {
        onSelectionChange(allUrls);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedUrls.length === entries.length) {
            setSelectedUrls([]);
            onSelectionChange([]);
        } else {
            setSelectedUrls(allUrls);
            onSelectionChange(allUrls);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUrls.length, entries.length, allUrls.join(','), onSelectionChange]);

    // Key fix: compute next state OUTSIDE the setter, then call parent AFTER setState
    const toggleOne = useCallback((url: string) => {
        setSelectedUrls(prev => {
            const next = prev.includes(url)
                ? prev.filter(u => u !== url)
                : [...prev, url];
            // Schedule parent notification in the next event loop tick,
            // so it runs AFTER this render completes — avoiding setState-during-render
            setTimeout(() => onSelectionChange(next), 0);
            return next;
        });
    }, [onSelectionChange]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Playlist Videos ({selectedUrls.length}/{entries.length} selected)</h3>
                <Button variant="ghost" size="sm" onClick={toggleAll} className="h-8 gap-2">
                    {selectedUrls.length === entries.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    {selectedUrls.length === entries.length ? "Deselect All" : "Select All"}
                </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted/30">
                <div className="space-y-3">
                    {entries.map((entry, idx) => {
                        const isSelected = selectedUrls.includes(entry.url);
                        return (
                            <div
                                key={`${entry.url}-${idx}`}
                                className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-accent/50 ${isSelected ? 'bg-accent/30' : ''}`}
                                onClick={() => toggleOne(entry.url)}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleOne(entry.url)}
                                    onClick={e => e.stopPropagation()}
                                />
                                <div className="relative flex-shrink-0 w-24 aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                    {entry.thumbnailUrl ? (
                                        <Image
                                            src={entry.thumbnailUrl}
                                            alt={entry.title}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="text-xs text-muted-foreground">No Thumb</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-none truncate">{idx + 1}. {entry.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{entry.duration}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
