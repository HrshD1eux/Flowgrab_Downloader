"use client";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Download, RotateCcw, XCircle, CheckCircle2, AlertCircle } from "lucide-react";

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
    completed: 'Download completed successfully',
    error: errorMessage || 'An error occurred during download.',
  }[status];

  return (
    <div className="space-y-4 pt-1">
      {status === 'completed' || status === 'error' ? (
        <Button
          size="lg"
          className="w-full text-sm font-semibold rounded-2xl h-12 transition-all active:scale-[0.99]"
          onClick={onReset}
          variant="outline"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Download Another Media
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            size="lg"
            className="flex-1 text-sm font-semibold rounded-2xl h-12 transition-all bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm active:scale-[0.99]"
            onClick={handleDownload}
            disabled={!isFormatSelected || isDownloading}
          >
            {isDownloading ? (
              <>
                <div className="mr-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Downloading Media...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Now
              </>
            )}
          </Button>

          {isDownloading && onCancel && (
            <Button
              size="lg"
              variant="destructive"
              className="px-5 rounded-2xl h-12 transition-all active:scale-[0.98] font-semibold text-xs"
              onClick={onCancel}
              title="Stop current download"
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Stop
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2 bg-muted/20 p-3.5 rounded-2xl border border-border">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-foreground">Status</span>
          <span className={`font-medium flex items-center gap-1 ${
            status === 'completed' ? 'text-emerald-500' :
            status === 'error' ? 'text-destructive' :
            'text-muted-foreground'
          }`}>
            {status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
            {status === 'error' && <AlertCircle className="h-3.5 w-3.5" />}
            {statusText}
          </span>
        </div>

        <ProgressBar
          value={status === 'error' ? 100 : downloadProgress}
          className={`w-full h-2 rounded-full ${
            status === 'completed' ? 'bg-emerald-500' :
            status === 'error' ? 'bg-destructive' :
            ''
          }`}
        />

        {/* Speed + ETA row while downloading */}
        {isDownloading && (speed || eta) && (
          <div className="flex justify-between text-[11px] text-muted-foreground font-mono pt-1">
            <span>{speed && `Speed: ${speed}`}</span>
            <span>{eta && `ETA: ${eta}`}</span>
          </div>
        )}

        {/* Filename while downloading */}
        {isDownloading && filename && (
          <p className="text-[11px] text-muted-foreground truncate font-mono" title={filename}>
            📄 {filename}
          </p>
        )}
      </div>
    </div>
  );
}
