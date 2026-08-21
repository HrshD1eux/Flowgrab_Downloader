# 🚀 Video Downloader

A modern, high-performance, privacy-first desktop application for downloading videos and audio from virtually any web platform, built with **Tauri v2**, **Next.js 15**, **React 19**, and **yt-dlp**.

[![Platform](https://img.shields.io/badge/Platform-Windows-0284c7?style=flat-square)](https://github.com/HrshD1eux/Video_Downloader)
[![Engine](https://img.shields.io/badge/Core-yt--dlp-22d3ee?style=flat-square)](https://github.com/yt-dlp/yt-dlp)
[![Framework](https://img.shields.io/badge/Framework-Tauri_v2-24c8db?style=flat-square)](https://tauri.app/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

---

## ✨ Key Features

### 🎬 Universal Video & Audio Support
* **Complete Resolution Spectrum**: Download at any resolution from **4K Ultra HD (2160p)**, **2K (1440p)**, **1080p Full HD**, **720p HD**, **480p**, down to **360p** and **240p Data Saver**.
* **Audiophile Codec Options**: Extract high-fidelity audio in **`.opus`** (Best quality-to-size ratio), **`.mp3`** (Universal compatibility, 320kbps), **`.m4a`** (Apple native AAC), **`.flac`** (Lossless studio master), and **`.wav`** (Uncompressed PCM).
* **Universal Platform Compatibility**: Over 1,000+ supported sites including YouTube, Twitter / X, Instagram, TikTok, Reddit, Facebook, Vimeo, and more.

### ⚡ Blazing Performance & Architecture
* **Single-Pass Extraction**: Fast URL inspection extracting complete video manifests and playlist entries in a single process pass.
* **Anti-Throttling Engine**: Built-in player client negotiation preventing HTTP 403 Forbidden errors and Cloudflare rate limits.
* **Controlled Concurrency**: Safe parallel fragment downloads with automatic queue management to protect your connection.

### 🎨 Modern, Performance-Focused UI
* **Minimalist Slate/Zinc Theme**: Clean, distraction-free interface with instant Dark and Light mode switching.
* **Dedicated Downloads & History Dashboard**: Real-time progress bars, live transfer speed (`MB/s`), time remaining (`ETA`), and individual cancel controls.
* **Full Settings Persistence**: Set default download directories, preferred video container (`mp4`, `mkv`, `webm`), default audio formats, and auto-thumbnail embedding.
* **Live Update System**: Check for new application releases on GitHub and update the internal extraction engine (`yt-dlp`) with a single click.

---

## 🛠️ Development & Building

### Prerequisites
* **Node.js (v18+)**
* **Rust & Cargo (v1.77+)**
* **Tauri CLI (v2)**:
  ```bash
  cargo install tauri-cli --version "^2.0.0"
  ```

### 1. Clone & Install
```bash
git clone https://github.com/HrshD1eux/Video_Downloader.git
cd Video_Downloader
npm install
```

### 2. Run in Development
```bash
cargo tauri dev
```

### 3. Run Automated Tests
```bash
# Backend Rust Unit Tests
cargo test --manifest-path src-tauri/Cargo.toml

# Frontend TypeScript Validation
npm run typecheck
```

### 4. Build Production Installer (MSI / EXE)
```bash
npm run build
cargo tauri build
```
The output installers will be placed in `src-tauri/target/release/bundle/`.

---

## 📂 Architecture Overview

```
Video_Downloader/
├── src/                      # Next.js 15 App Router Frontend
│   ├── app/                  # Layout, globals.css, main page
│   ├── components/           # UI components, DownloadsManager, SettingsModal, UpdateModal
│   └── lib/                  # Tauri IPC bindings & GitHub updater client
├── src-tauri/                # Rust Desktop Backend
│   ├── src/
│   │   ├── commands/         # download, video analysis, engine resolver, settings, updates
│   │   └── lib.rs            # Application state, plugins, tray menu, invoke handler
│   ├── binaries/             # Bundled yt-dlp & FFmpeg binaries
│   ├── tauri.conf.json       # Tauri bundle configuration & permissions
│   └── Cargo.toml            # Rust dependencies & metadata
└── package.json              # Frontend scripts & dependencies
```

---

## 📜 License
This project is open source and available under the [MIT License](LICENSE).
