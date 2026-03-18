import type { AnalysisResult } from '@/types';

export const mockAnalysisResult: AnalysisResult = {
  title: 'Epic Nature Documentary - The Wonders of the Wild',
  author: 'Nature Explorers',
  duration: '12:34',
  thumbnailUrl: "https://picsum.photos/seed/ytdlp/1280/720",
  url: "https://www.youtube.com/watch?v=mock",
  isPlaylist: false,
  videoFormats: [
    { formatId: 'best', label: '1080p', quality: '1080p', ext: 'mp4', filesize: 154000000 },
    { formatId: '720p', label: '720p', quality: '720p', ext: 'mp4', filesize: 85000000 },
    { formatId: '480p', label: '480p', quality: '480p', ext: 'mp4', filesize: 45000000 },
  ],
  audioFormats: [
    { formatId: 'bestaudio', label: 'MP3 320kbps', quality: 'mp3-320', ext: 'mp3', bitrate: 320 },
    { formatId: 'mp3-128', label: 'MP3 128kbps', quality: 'mp3-128', ext: 'mp3', bitrate: 128 },
    { formatId: 'wav', label: 'WAV', quality: 'wav', ext: 'wav', bitrate: 1411 },
  ]
};
