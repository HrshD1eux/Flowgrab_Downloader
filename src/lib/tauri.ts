import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import packageJson from "../../package.json";
import type {
    AnalysisResult,
    DownloadOptions,
    DownloadProgress,
    DownloadHistoryItem,
} from "@/types";

// ── Types matching the Rust structs (snake_case from Rust → camelCase in JS) ──

interface RustVideoInfo {
    title: string;
    thumbnail_url: string;
    duration: string;
    author: string;
    url: string;
    is_playlist: boolean;
    playlist_count: number | null;
    video_formats: RustVideoFormat[];
    audio_formats: RustAudioFormat[];
    entries: RustPlaylistItem[] | null;
}

interface RustPlaylistItem {
    title: string;
    url: string;
    thumbnail_url: string;
    duration: string;
}

interface RustVideoFormat {
    format_id: string;
    label: string;
    quality: string;
    ext: string;
    filesize: number | null;
}

interface RustAudioFormat {
    format_id: string;
    label: string;
    quality: string;
    ext: string;
    bitrate: number | null;
    filesize: number | null;
}

interface RustDownloadProgress {
    download_id: string;
    percent: number;
    speed: string;
    eta: string;
    filename: string;
    status: string;
}

interface RustHistoryItem {
    id: string;
    url: string;
    title: string;
    format: string;
    outputPath?: string;   // Rust serde rename_all = "camelCase"
    timestamp: string;
}

export interface AppSettings {
    default_output_path: string;
    default_format: string;
    default_audio_format: string;
    embed_thumbnail: boolean;
    embed_metadata?: boolean;
    auto_capture_clipboard?: boolean;
    auto_reset_on_finish?: boolean;
}

// ── Map Rust response to our frontend types ──

function mapVideoInfo(r: RustVideoInfo): AnalysisResult {
    return {
        title: r.title,
        thumbnailUrl: r.thumbnail_url,
        duration: r.duration,
        author: r.author,
        url: r.url,
        isPlaylist: r.is_playlist,
        playlistCount: r.playlist_count ?? undefined,
        videoFormats: r.video_formats.map((f) => ({
            formatId: f.format_id,
            label: f.label,
            quality: f.quality,
            ext: f.ext,
            filesize: f.filesize ?? undefined,
        })),
        audioFormats: r.audio_formats.map((f) => ({
            formatId: f.format_id,
            label: f.label,
            quality: f.quality,
            ext: f.ext,
            bitrate: f.bitrate ?? undefined,
            filesize: f.filesize ?? undefined,
        })),
        entries: r.entries?.map((e) => ({
            title: e.title,
            url: e.url,
            thumbnailUrl: e.thumbnail_url,
            duration: e.duration,
        })),
    };
}

// ── Tauri command wrappers ──

/** Fetch video info and available formats for a URL */
export async function getVideoInfo(url: string): Promise<AnalysisResult> {
    const raw = await invoke<RustVideoInfo>("get_video_info", { url });
    return mapVideoInfo(raw);
}

/** Start a download. Emits download://progress events. */
export async function startDownload(
    downloadId: string,
    options: DownloadOptions
): Promise<void> {
    await invoke<void>("start_download", {
        downloadId,
        opts: {
            title: options.title,
            url: options.url,
            format_id: options.formatId,
            is_audio: options.isAudio,
            output_path: options.options.outputPath,
            custom_filename: options.options.customFilename,
            output_format: options.options.outputFormat,
            embed_thumbnail: options.options.embedThumbnail,
            embed_metadata: options.options.embedMetadata ?? true,
            download_subtitles: options.options.downloadSubtitles,
            subtitle_language: options.options.subtitleLanguage,
        },
    });
}

/** Listen to incoming deep links or browser open-url requests */
export function onOpenUrl(callback: (url: string) => void): Promise<UnlistenFn> {
    return listen<string>("app://open-url", (event) => {
        if (event.payload) {
            callback(event.payload);
        }
    });
}

/** Listen to real-time download progress events */
export function onDownloadProgress(
    callback: (progress: DownloadProgress) => void
): Promise<UnlistenFn> {
    return listen<RustDownloadProgress>("download://progress", (event) => {
        const p = event.payload;
        callback({
            downloadId: p.download_id,
            percent: p.percent,
            speed: p.speed,
            eta: p.eta,
            filename: p.filename,
            status: p.status,
        });
    });
}

/** Get download history */
export async function getDownloadHistory(): Promise<DownloadHistoryItem[]> {
    const raw = await invoke<RustHistoryItem[]>("get_download_history");
    return raw.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        format: r.format,
        outputPath: r.outputPath,
        timestamp: r.timestamp,
    }));
}

/** Cancel or pause an active download by ID */
export async function cancelDownload(downloadId: string, reason: 'paused' | 'cancelled' | string = 'cancelled'): Promise<void> {
    await invoke('cancel_download', { downloadId, reason });
}

/** Clear download history */
export async function clearDownloadHistory(): Promise<void> {
    await invoke<void>("clear_download_history");
}

/** Update the yt-dlp binary */
export async function updateYtDlp(): Promise<string> {
    return await invoke('update_yt_dlp');
}

/** Get installed yt-dlp version */
export async function getYtDlpVersion(): Promise<string> {
    return await invoke<string>('get_ytdlp_version');
}

/** Get installed FFmpeg version/status */
export async function getFfmpegVersion(): Promise<string> {
    return await invoke<string>('get_ffmpeg_version');
}

/** Get saved settings */
export async function getSettings(): Promise<AppSettings> {
    return await invoke<AppSettings>("get_settings");
}

/** Save settings */
export async function saveSettings(settings: AppSettings): Promise<void> {
    await invoke<void>("save_settings", { settings });
}

/** Open a folder picker dialog and return the selected path */
export async function openFolderDialog(): Promise<string | null> {
    try {
        const result = await openDialog({ directory: true, multiple: false });
        if (typeof result === "string") return result;
        return null;
    } catch (e) {
        console.warn("Folder dialog failed or was cancelled:", e);
        return null;
    }
}

export interface AppUpdateInfo {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseName: string;
    releaseNotes: string;
    releaseUrl: string;
    downloadUrl?: string;
    publishedAt: string;
}

/** Query GitHub Releases API for desktop app updates */
export async function checkAppUpdate(repo = "HrshD1eux/Flowgrab_Downlaoder"): Promise<AppUpdateInfo> {
    const currentVersion = packageJson.version;
    try {
        const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
            headers: {
                Accept: "application/vnd.github.v3+json",
            },
        });
        if (!res.ok) {
            throw new Error(`GitHub API returned status ${res.status}`);
        }
        const data = await res.json();
        const latestTag = (data.tag_name || "").replace(/^v/, "");
        
        const assets = data.assets || [];
        const installerAsset = assets.find((a: { name: string; browser_download_url: string }) => 
            a.name.endsWith(".exe") || a.name.endsWith(".msi")
        );

        const curParts = currentVersion.split('.').map(Number);
        const latParts = latestTag.split('.').map(Number);
        let hasUpdate = false;
        for (let i = 0; i < Math.max(curParts.length, latParts.length); i++) {
            const cur = curParts[i] || 0;
            const lat = latParts[i] || 0;
            if (lat > cur) {
                hasUpdate = true;
                break;
            } else if (lat < cur) {
                break;
            }
        }

        return {
            hasUpdate,
            currentVersion,
            latestVersion: latestTag || currentVersion,
            releaseName: data.name || data.tag_name || "Latest Release",
            releaseNotes: data.body || "No changelog provided.",
            releaseUrl: data.html_url || `https://github.com/${repo}/releases/latest`,
            downloadUrl: installerAsset ? installerAsset.browser_download_url : data.html_url,
            publishedAt: data.published_at || "",
        };
    } catch (e) {
        return {
            hasUpdate: false,
            currentVersion,
            latestVersion: currentVersion,
            releaseName: "Up to date",
            releaseNotes: String(e),
            releaseUrl: `https://github.com/${repo}/releases`,
            publishedAt: "",
        };
    }
}

/** Reveal a downloaded file or directory in native File Explorer / Finder */
export async function openInFileExplorer(path: string): Promise<void> {
    if (!path) return;
    await invoke<void>("open_in_file_explorer", { path });
}

export interface AppUpdateDownloadProgress {
    percent: number;
    bytes_downloaded: number;
    total_bytes: number;
    status: string;
}

/** Download and execute official app update installer in background */
export async function installAppUpdate(downloadUrl: string): Promise<string> {
    return await invoke<string>("install_app_update", { downloadUrl });
}

/** Listen to in-app update download progress */
export function onAppUpdateProgress(
    callback: (progress: AppUpdateDownloadProgress) => void
): Promise<UnlistenFn> {
    return listen<AppUpdateDownloadProgress>("app-update://progress", (event) => {
        if (event.payload) {
            callback(event.payload);
        }
    });
}
