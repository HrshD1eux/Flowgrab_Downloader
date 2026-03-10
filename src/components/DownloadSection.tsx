"use client";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Download, RotateCcw, XCircle } from "lucide-react";

interface DownloadSectionProps {
  handleDownload: () => void;
  isDownloading: boolean;
  downloadProgress: number;
  status: 'idle' | 'downloading' | 'completed' | 'error';
  isFormatSelected: boolean;
  speed?: string;
  eta?: string;
  filename?: string;
  errorMessage?: string;
  onReset: () => void;
  onCancel?: () => void;
}

export default function DownloadSection({
  handleDownload,
  isDownloading,
  downloadProgress,
  status,
  isFormatSelected,
  speed,
  eta,
  filename,
  errorMessage,
  onReset,
  onCancel,
}: DownloadSectionProps) {

  const statusText = {
    idle: 'Ready to download',
    downloading: `Downloading... ${Math.round(downloadProgress)}%`,
    completed: '✅ Download completed!',
    error: `❌ ${errorMessage || 'An error occurred.'}`,
  }[status];

  const progressColor =
    status === 'completed' ? 'bg-green-500' :
      status === 'error' ? 'bg-red-500' :
        undefined;

  return (
    <div className="space-y-4">
      {status === 'completed' || status === 'error' ? (
        <Button
          size="lg"
          className="w-full text-lg font-bold rounded-2xl h-14 transition-all hover:shadow-lg active:scale-[0.98]"
          onClick={onReset}
          variant="secondary"
        >
          <RotateCcw className="mr-2 h-6 w-6" />
          Download Another Video
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            size="lg"
            className="flex-1 text-xl font-bold rounded-2xl h-16 transition-all hover:shadow-xl active:scale-[0.99] bg-gradient-to-r from-primary to-primary/80"
            onClick={handleDownload}
            disabled={!isFormatSelected || isDownloading}
          >
            {isDownloading ? (
              <>
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-3 h-6 w-6" />
                Start Download
              </>
            )}
          </Button>

          {isDownloading && onCancel && (
            <Button
              size="lg"
              variant="destructive"
              className="px-6 rounded-2xl h-16 transition-all hover:shadow-lg active:scale-[0.98]"
              onClick={onCancel}
              title="Stop current download"
            >
              <XCircle className="h-6 w-6" />
              <span className="ml-2 font-bold">Stop</span>
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Status</span>
          <span className={status === 'completed' ? 'text-green-400' : status === 'error' ? 'text-red-400' : ''}>
            {statusText}
          </span>
        </div>

        <ProgressBar
          value={status === 'error' ? 100 : downloadProgress}
          className={`w-full h-3 rounded-full ${progressColor ?? ''}`}
        />

        {/* Speed + ETA row while downloading */}
        {isDownloading && (speed || eta) && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{speed && `Speed: ${speed}`}</span>
            <span>{eta && `ETA: ${eta}`}</span>
          </div>
        )}

        {/* Filename while downloading */}
        {isDownloading && filename && (
          <p className="text-xs text-muted-foreground truncate" title={filename}>
            📁 {filename}
          </p>
        )}
      </div>
    </div>
  );
}
