# 🚀 Video Downloader

A premium, high-performance desktop application for downloading videos and audio from virtually anywhere, powered by **Tauri**, **Next.js**, and **yt-dlp**.

![Luxury UI](https://img.shields.io/badge/UI-Luxury_Glassmorphism-f472b6?style=for-the-badge)
![Tech](https://img.shields.io/badge/Engine-yt--dlp-22d3ee?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows-0284c7?style=for-the-badge)

---

## ✨ Key Features

### 🎨 Stunning Visuals & UX
*   **💎 Luxury Glassmorphism**: Ultra-soft corners (`rounded-[3rem]`) and backdrop-blur effects for a high-end, modern desktop feel.
*   **🌊 Deep Sea Dark Theme**: A sophisticated palette of absolute black, deep navy blue, and emerald green accents.
*   **⛲ Fountain Light Theme**: A vibrant, fluid mix of soft purple, sky blue, and rose pink gradients.
*   **🛡️ Privacy-First Design**: Automatic autocomplete/autofill disabling for all sensitive input fields.
*   **✨ Smooth Animations**: Premium entry transitions (`animate-premium-in`) and tactile hover effects.
*   **🌑 Dynamic Backgrounds**: Floating, pulsing blur accents and a subtle grain texture for depth and premium "printed" aesthetics.

### 🛠️ Powerful Download Engine
*   **🌐 Universal Compatibility**: Powered by `yt-dlp`, supporting over 1000+ sites including YouTube, Instagram, Twitter, and more.
*   **📦 Batch Manager**: Paste multiple URLs at once to analyze and download them in a single session.
*   **📑 Playlist Intelligence**: Detailed playlist expansion—view all entries, select specific videos, and track per-item progress.
*   **⚡ Parallel Processing**: High-speed downloads with 16 concurrent fragments per file and multi-video parallel downloading.
*   **📉 Smart History**: Track your previous downloads with a local, private history log.

### ⚙️ Advanced Customization
*   **📂 Custom Output Picker**: Select exactly where your files should go with a native Windows folder picker.
*   **🏷️ Intelligent Naming**: Custom filename patterns with automatic unique ID appending to prevent file collisions.
*   **🎬 Professional Metadata**: Auto-embed thumbnails and subtitles (with multi-language selection support).
*   **🔄 Live Engine Updates**: Stay up-to-date with the latest web platform changes with one-click `yt-dlp` updates.

---

## 🛠️ Detailed Setup Instructions

Follow these steps to set up the project locally on your machine.

### 1️⃣ Install Required Tools
Before you begin, ensure you have these installed:
*   **Node.js (v18+)**: [Download Here](https://nodejs.org/)
*   **Rust & Cargo**: [Installation Guide](https://www.rust-lang.org/tools/install)
*   **Git**: [Download Here](https://git-scm.com/)
*   **Tauri CLI**: Open your terminal and run:
    ```bash
    cargo install tauri-cli --version "^2.0.0"
    ```

### 2️⃣ Clone the Repository
Open your terminal/command prompt and run:
```bash
git clone https://github.com/yourusername/video-downloader.git
cd video-downloader
```

### 3️⃣ Setup External Binaries
The application depends on `yt-dlp` and `ffmpeg`.
1.  Navigate to `src-tauri/binaries/`.
2.  Ensure `yt-dlp.exe` and `ffmpeg.exe` are present in this folder.
    *   *Note: On Windows, Tauri expects these to be named exactly as configured in `tauri.conf.json`.*

### 4️⃣ Install Dependencies
From the project root, run:
```bash
npm install
```

### 5️⃣ Run for Development
Start the development environment (launches the app window):
```bash
cargo tauri dev
```
*The first run will take a few minutes as it compiles all Rust dependencies.*

---

## 📦 Building the Installer (EXE/MSI)

To create a professional standalone installer for Windows, follow these granular steps:

### 🧹 Preparation
1.  **Clear Old Builds**: Remove any existing build artifacts to ensure a clean slate.
    ```bash
    rmdir /s /q src-tauri\target
    ```

### 🚀 The Build Process
2.  **Run the Release Command**: This automated script bumps the application version and triggers the full Next.js/Rust production build in one go.
    ```bash
    npm run release
    ```
    *This process will perform a production build of the frontend and bundle the entire application (with the newly incremented version) into MSI and NSIS installers.*

### ✅ Final Verification
3.  **Find Your Installers**: Once finished, navigate to the output folders:
    *   **📦 MSI Installer**: `src-tauri/target/release/bundle/msi/`
    *   **⚙️ NSIS (EXE) Setup**: `src-tauri/target/release/bundle/nsis/`

---

## 📂 Project Structure
*   `src/`: **Next.js Frontend** — Where the UI, buttons, and animations live.
*   `src-tauri/`: **Rust Backend** — Where the fast, secure downloading logic lives.
*   `src-tauri/binaries/`: **Helper Tools** — Engines that power the video analysis and extraction.

## 🤝 Contributing
Found a bug or have a suggestion? Open an issue or submit a pull request!

## 📜 License
This project is licensed under the MIT License.
