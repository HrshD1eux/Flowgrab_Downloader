export type Platform = "youtube" | "twitter" | "instagram" | "generic" | null;

export type VideoFormat = {
  formatId: string;
  label: string;
  quality: string;
  ext: string;
  filesize?: number;
};

export type AudioFormat = {
  formatId: string;
  label: string;
  quality: string;
  ext: string;
  bitrate?: number;
  filesize?: number;
};

export type PlaylistItem = {
  title: string;
  url: string;
  thumbnailUrl: string;
  duration: string;
};

export type AnalysisResult = {
  title: string;
  thumbnailUrl: string;
  duration: string;
  author: string;
  url: string;
  isPlaylist?: boolean;
  playlistCount?: number;
  videoFormats: VideoFormat[];
  audioFormats: AudioFormat[];
  entries?: PlaylistItem[];
};

export type AdvancedOptions = {
  customFilename: string;
  embedThumbnail: boolean;
  embedMetadata?: boolean;
  downloadSubtitles: boolean;
  subtitleLanguage: string;
  outputFormat: string;
  outputPath: string;
};

export type DownloadOptions = {
  title: string;
  url: string;
  formatId: string;
  isAudio: boolean;
  options: AdvancedOptions;
};

export type DownloadProgress = {
  downloadId: string;
  percent: number;
  speed: string;
  eta: string;
  filename: string;
  status: string;
};

export type DownloadHistoryItem = {
  id: string;
  title: string;
  url: string;
  format: string;
  outputPath?: string;
  timestamp: string;
};
