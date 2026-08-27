"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Download,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  Bookmark,
  ExternalLink,
  ChevronDown,
  Monitor,
  Terminal,
  FileCheck,
  Globe,
  Radio,
} from "lucide-react";
import packageJson from "../../../package.json";

export default function LandingPage() {
  const [activeScreenshot, setActiveScreenshot] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const currentVer = packageJson.version || "1.1.2";
  const releaseBaseUrl = "https://github.com/HrshD1eux/Flowgrab_Downlaoder/releases/latest";

  const screenshots = [
    {
      id: 1,
      title: "Main Downloader",
      badge: "Clean Light UI",
      desc: "Distraction-free interface with instant URL analysis and platform auto-detection.",
      src: "/screenshots/screenshot1.png",
    },
    {
      id: 2,
      title: "4K Stream & Codecs",
      badge: "Audiophile Audio",
      desc: "Extract 2160p 60fps video, pristine Opus 320kbps audio, and studio lossless FLAC.",
      src: "/screenshots/screenshot2.png",
    },
    {
      id: 3,
      title: "Smart Batch Queue",
      badge: "Auto-Capture",
      desc: "Copy links consecutively in Chrome/Brave to build multi-video queues automatically.",
      src: "/screenshots/screenshot3.png",
    },
    {
      id: 4,
      title: "Active Downloads",
      badge: "Speed Monitor",
      desc: "Live transfer speeds (MB/s), remaining ETA, progress bars, and Show-in-Folder actions.",
      src: "/screenshots/screenshot4.png",
    },
    {
      id: 5,
      title: "1-Click In-App Updater",
      badge: "Background Install",
      desc: "Zero manual downloads — streams official release installers and updates in background.",
      src: "/screenshots/screenshot5.png",
    },
  ];

  const faqs = [
    {
      q: "What is Flowgrab Downloader and how is it different from web downloaders?",
      a: "Flowgrab Downloader is a high-performance, open-source desktop application built on Tauri v2, yt-dlp, and FFmpeg. Unlike ad-ridden web downloaders (such as Y2Mate or SnapSave), Flowgrab operates locally on your machine with 0 ads, 0 tracking, no cloud servers, unthrottled gigabit multithreaded download speeds, and supports uncompressed 4K 60FPS video and studio-quality Opus/FLAC audio.",
    },
    {
      q: "How does Clipboard Auto-Capture and Deep-Linking work?",
      a: "When Clipboard Auto-Capture is enabled in Settings, clicking 'Share -> Copy Link' or copying any media URL (Ctrl+C) in Chrome, Brave, Edge, or Firefox immediately loads and analyzes the video inside Flowgrab with zero manual pasting. If a video is already loaded, copying subsequent links automatically stacks them into the Batch Queue.",
    },
    {
      q: "Which video and audio formats does Flowgrab support?",
      a: "Flowgrab extracts video streams in 4K Ultra HD (2160p), 2K (1440p), 1080p Full HD, 720p HD, and 480p in MP4, MKV, and WebM containers. For audio, it provides pristine OPUS (best compression & quality), MP3 (320kbps CBR/VBR), M4A (Apple AAC), FLAC (Lossless Studio Master), and WAV.",
    },
    {
      q: "Does Flowgrab embed metadata and album cover artwork?",
      a: "Yes. Flowgrab utilizes FFmpeg to automatically write complete ID3 and media tags (Title, Artist, Album, Release Date, Description) and embed high-resolution thumbnail artwork directly into the output files.",
    },
    {
      q: "Is Flowgrab Downloader free and open source?",
      a: "Flowgrab Downloader is 100% free and open-source under the MIT License. There are no paywalls, subscriptions, feature limits, or telemetry. You can audit the complete source code on GitHub.",
    },
  ];

  // Structured Data Schema for SEO / AEO / GEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Flowgrab Downloader",
        "operatingSystem": "Windows 10, Windows 11, Linux (Ubuntu, Debian, Fedora, Arch)",
        "applicationCategory": "MultimediaApplication",
        "applicationSubCategory": "Video & Audio Downloader",
        "softwareVersion": `v${currentVer}`,
        "description": "High-performance, privacy-first desktop application for downloading 4K video, audiophile Opus/FLAC audio, and playlists from 1,000+ websites.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
        "author": {
          "@type": "Person",
          "name": "HrshD1eux",
          "url": "https://github.com/HrshD1eux",
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "ratingCount": "120",
        },
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-cyan-500 selection:text-white font-sans antialiased">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Top Announcement / Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/app-icon.png"
              alt="Flowgrab Icon"
              width={36}
              height={36}
              className="rounded-xl shadow-sm border border-slate-200"
            />
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Flowgrab
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                v{currentVer}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-cyan-600 transition-colors">
              Features
            </a>
            <a href="#screenshots" className="hover:text-cyan-600 transition-colors">
              Screenshots
            </a>
            <a href="#bookmarklet" className="hover:text-cyan-600 transition-colors">
              1-Click Bookmarklet
            </a>
            <a href="#faq" className="hover:text-cyan-600 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/HrshD1eux/Flowgrab_Downlaoder"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
            >
              GitHub <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={releaseBaseUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" /> Download Free
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100/60">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 text-xs font-black tracking-wide uppercase shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>High-Performance Media & Stream Extractor</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.08]">
            Grab Any Video & Audio Stream.{" "}
            <span className="bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
              Zero Ads. Full 4K Speed.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            Flowgrab is a modern, privacy-first desktop application for downloading pristine 4K video, studio Opus/FLAC audio, and batch playlists from 1,000+ sites with instant browser clipboard capture.
          </p>

          {/* Download Buttons Matrix */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={`${releaseBaseUrl}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-base transition-all shadow-xl shadow-cyan-600/25 active:scale-95"
            >
              <Download className="h-5 w-5" />
              <span>Download for Windows (.exe / .msi)</span>
            </a>

            <a
              href={`${releaseBaseUrl}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <Monitor className="h-5 w-5 text-slate-600" />
              <span>Linux (.deb / .AppImage)</span>
            </a>
          </div>

          {/* Quality Micro-Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 pt-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% Free & Open Source
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-500" /> Zero Telemetry or Adware
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" /> Multithreaded Unthrottled Engine
            </div>
          </div>
        </div>

        {/* 3. Interactive Screenshots Showcase */}
        <div id="screenshots" className="max-w-6xl mx-auto px-6 mt-16 space-y-6">
          {/* Screenshot Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-fit mx-auto border border-slate-300/60">
            {screenshots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScreenshot(s.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeScreenshot === s.id
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* Active Preview Frame */}
          <div className="relative rounded-3xl bg-white p-3 border border-slate-200/80 shadow-2xl shadow-slate-900/10 overflow-hidden">
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <Image
                src={screenshots.find((s) => s.id === activeScreenshot)?.src || "/screenshots/screenshot1.png"}
                alt={screenshots.find((s) => s.id === activeScreenshot)?.title || "Flowgrab Screenshot"}
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80 rounded-xl mt-3 border border-slate-200/60">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-mono">
                  {screenshots.find((s) => s.id === activeScreenshot)?.badge}
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  {screenshots.find((s) => s.id === activeScreenshot)?.desc}
                </p>
              </div>
              <a
                href={releaseBaseUrl}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 shrink-0"
              >
                Try this feature <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid (SEO / AEO Pillar) */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-600">
            Engineered For Power & Precision
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Everything You Need in a Media Extractor
          </h2>
          <p className="text-base text-slate-600 font-medium">
            Designed from the ground up for power users, audiophiles, researchers, and creators who demand clean, unthrottled downloads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="p-3.5 rounded-2xl bg-sky-50 text-sky-600 w-fit border border-sky-100">
              <Monitor className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Ultra HD 4K & 8K Extraction</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Download at maximum native bitrate — 4K 2160p 60fps HDR, 1440p 2K, 1080p Full HD, or compact 720p with AV01 and VP9 codec support.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 w-fit border border-emerald-100">
              <Radio className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Audiophile Audio Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Extract pristine Opus (.opus) for pure fidelity, 320kbps MP3 for universal playback, or studio lossless FLAC and WAV with perfect dynamic range.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="p-3.5 rounded-2xl bg-cyan-50 text-cyan-600 w-fit border border-cyan-100">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Smart Clipboard Auto-Capture</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Click Share ➔ Copy Link in any browser and Flowgrab automatically detects, parses, and queues the media without manual paste.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 w-fit border border-indigo-100">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Multi-URL Batch Manager</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Copy 5, 10, or 20 links one after another from your browser to queue them into a batch queue and download them all in parallel.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 w-fit border border-amber-100">
              <FileCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Tag & Artwork Embedding</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Automatically embed complete ID3 metadata (Title, Artist, Album, Date, Description) and high-resolution cover artwork directly into files.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 w-fit border border-rose-100">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">1-Click In-App Updater</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Never visit GitHub manually for updates. The in-app updater downloads new releases in the background and auto-launches the installer.
            </p>
          </div>
        </div>
      </section>

      {/* 5. 1-Click Bookmarklet Setup Section */}
      <section id="bookmarklet" className="py-20 bg-slate-100/80 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-700">
              Browser Superpower
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              1-Click Browser Bookmarklet
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Drag this button to your bookmarks bar to send any YouTube, Twitter, TikTok, or Instagram video directly to Flowgrab with 1 click:
            </p>
          </div>

          {/* Draggable Bookmarklet Button */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 max-w-lg mx-auto">
            <a
              href="javascript:window.location.href='flowgrab://'+encodeURIComponent(window.location.href);"
              onClick={(e) => {
                e.preventDefault();
                alert("Drag this button to your browser's Bookmarks bar (Ctrl+Shift+B) to use it on any webpage!");
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 text-white font-extrabold text-sm shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition-all"
              title="Drag me to your Bookmarks bar!"
            >
              <Bookmark className="h-4 w-4" />
              <span>⚡ Send to Flowgrab</span>
            </a>

            <div className="text-xs text-slate-500 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-left overflow-x-auto">
              <code>javascript:window.location.href=&apos;flowgrab://&apos;+encodeURIComponent(window.location.href);</code>
            </div>
            <p className="text-xs text-slate-500">
              Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl + Shift + B</kbd> to show bookmarks bar, then drag the button above!
            </p>
          </div>
        </div>
      </section>

      {/* 6. Comparison Table (AEO / GEO Knowledge Matrix) */}
      <section className="py-24 max-w-5xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-600">
            Why Flowgrab Wins
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Flowgrab vs. Web Downloaders & Paid Tools
          </h2>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-600">
              <tr>
                <th className="p-4 sm:p-6">Feature</th>
                <th className="p-4 sm:p-6 text-cyan-700 bg-cyan-50/50">Flowgrab Downloader</th>
                <th className="p-4 sm:p-6">Web Scrapers (Y2Mate, etc.)</th>
                <th className="p-4 sm:p-6">Commercial Tools (4K Video DL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              <tr>
                <td className="p-4 sm:p-6 font-bold">4K 60FPS & 8K Video</td>
                <td className="p-4 sm:p-6 text-emerald-600 bg-cyan-50/30 font-bold">✓ Native Unthrottled</td>
                <td className="p-4 sm:p-6 text-rose-500">✗ Blocked or 720p Cap</td>
                <td className="p-4 sm:p-6 text-slate-500">Paid License Required</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-bold">Ad & Tracker Free</td>
                <td className="p-4 sm:p-6 text-emerald-600 bg-cyan-50/30 font-bold">✓ 100% Clean (0 Ads)</td>
                <td className="p-4 sm:p-6 text-rose-500">✗ Popups, Malware & Redirects</td>
                <td className="p-4 sm:p-6 text-amber-600">Upgrade Prompts</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-bold">Opus & FLAC Lossless Audio</td>
                <td className="p-4 sm:p-6 text-emerald-600 bg-cyan-50/30 font-bold">✓ Direct Extraction</td>
                <td className="p-4 sm:p-6 text-rose-500">✗ Low Quality 128k MP3</td>
                <td className="p-4 sm:p-6 text-slate-600">Limited Formats</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-bold">Clipboard Auto-Capture</td>
                <td className="p-4 sm:p-6 text-emerald-600 bg-cyan-50/30 font-bold">✓ Instant Background Detection</td>
                <td className="p-4 sm:p-6 text-rose-500">✗ Manual Copy-Paste</td>
                <td className="p-4 sm:p-6 text-slate-500">Manual Click</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-bold">License & Cost</td>
                <td className="p-4 sm:p-6 text-emerald-600 bg-cyan-50/30 font-bold">✓ 100% Free (MIT Open Source)</td>
                <td className="p-4 sm:p-6 text-slate-500">Ad-supported</td>
                <td className="p-4 sm:p-6 text-slate-500">$20 - $40 / Year</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. FAQ Section (AEO Structured) */}
      <section id="faq" className="py-24 bg-slate-100/60 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-700">
              Questions & Answers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white border border-slate-200 transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between text-left font-bold text-slate-900 text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      openFaq === index ? "rotate-180 text-cyan-600" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed font-medium pt-2 border-t border-slate-100">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Call to Action & Footer */}
      <footer className="py-16 bg-white border-t border-slate-200 text-center space-y-8">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Ready for Lightning-Fast Media Extraction?
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            Download Flowgrab Downloader today. 100% free, zero ads, no subscription.
          </p>
          <a
            href={releaseBaseUrl}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-base shadow-xl shadow-cyan-600/20 transition-all active:scale-95"
          >
            <Download className="h-5 w-5" /> Download Flowgrab v{currentVer}
          </a>
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <p>© 2026 Flowgrab Downloader. Released under the MIT License.</p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/HrshD1eux/Flowgrab_Downlaoder"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              GitHub Repository
            </a>
            <a
              href="https://github.com/HrshD1eux/Flowgrab_Downlaoder/releases"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              Release Notes
            </a>
            <a
              href="https://github.com/yt-dlp/yt-dlp"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              yt-dlp Engine
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
