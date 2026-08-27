const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const WIDTH = 1920;
const HEIGHT = 1080;

const screenshots = [
  {
    name: 'screenshot1',
    title: 'Flowgrab Downloader — Minimalist Light Theme Main Interface',
    svg: `
      <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="50%" stop-color="#f1f5f9" />
            <stop offset="100%" stop-color="#e2e8f0" />
          </linearGradient>
          <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
          <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#f8fafc" />
          </linearGradient>
          <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.06" />
          </filter>
        </defs>

        <!-- Background -->
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)" />

        <!-- App Window Container -->
        <rect x="140" y="80" width="1640" height="920" rx="36" fill="url(#cardGrad)" stroke="#e2e8f0" stroke-width="2" filter="url(#cardShadow)" />

        <!-- Window Title Bar -->
        <rect x="140" y="80" width="1640" height="90" rx="36" fill="#ffffff" />
        <line x1="140" y1="170" x2="1780" y2="170" stroke="#f1f5f9" stroke-width="2" />

        <!-- Window Dots -->
        <circle cx="190" cy="125" r="7" fill="#ef4444" opacity="0.8" />
        <circle cx="215" cy="125" r="7" fill="#f59e0b" opacity="0.8" />
        <circle cx="240" cy="125" r="7" fill="#10b981" opacity="0.8" />

        <!-- Brand Logo -->
        <text x="280" y="133" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" fill="url(#brandGrad)">⚡ Flowgrab</text>
        <text x="430" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#64748b">High-Performance Media Extractor</text>

        <!-- View Switcher -->
        <rect x="1250" y="105" width="310" height="42" rx="14" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" />
        <rect x="1253" y="108" width="150" height="36" rx="12" fill="#ffffff" />
        <text x="1285" y="131" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#0f172a">⬇ Downloader</text>
        <text x="1425" y="131" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#64748b">📦 History</text>

        <!-- Settings Button -->
        <circle cx="1605" cy="126" r="18" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" />
        <text x="1598" y="132" font-size="14">⚙</text>

        <!-- Updates Button -->
        <rect x="1640" y="106" width="100" height="40" rx="14" fill="#ecfeff" stroke="#a5f3fc" stroke-width="1" />
        <text x="1658" y="131" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#0284c7">✨ v1.1.2</text>

        <!-- Main Card Content -->
        <!-- Search/URL Input Box -->
        <rect x="220" y="220" width="1480" height="84" rx="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
        <text x="260" y="271" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#94a3b8">Paste any video or playlist URL (YouTube, Twitter/X, TikTok, Instagram, Reddit...)</text>
        
        <!-- Analyze Button -->
        <rect x="1500" y="232" width="180" height="60" rx="20" fill="url(#brandGrad)" />
        <text x="1555" y="269" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="800" fill="#ffffff">Analyze ➔</text>

        <!-- Platform Badges -->
        <g transform="translate(240, 335)">
          <rect x="0" y="0" width="140" height="38" rx="12" fill="#fff1f2" stroke="#fecdd3" stroke-width="1" />
          <text x="18" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#e11d48">▶ YouTube 4K</text>

          <rect x="155" y="0" width="130" height="38" rx="12" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1" />
          <text x="175" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#0284c7">𝕏 Twitter / X</text>

          <rect x="300" y="0" width="130" height="38" rx="12" fill="#fdf2f8" stroke="#fbcfe8" stroke-width="1" />
          <text x="318" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#db2777">📸 Instagram</text>

          <rect x="445" y="0" width="120" height="38" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
          <text x="465" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#0f172a">🎵 TikTok HD</text>

          <rect x="580" y="0" width="160" height="38" rx="12" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1" />
          <text x="598" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#16a34a">⚡ 1,000+ Sites</text>
        </g>

        <!-- Feature Grid Cards -->
        <!-- Card 1 -->
        <rect x="220" y="415" width="470" height="490" rx="28" fill="#ffffff" stroke="#f1f5f9" stroke-width="2" />
        <rect x="250" y="445" width="56" height="56" rx="18" fill="#e0f2fe" />
        <text x="268" y="481" font-size="24">🎬</text>
        <text x="325" y="480" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#0f172a">Ultra HD 4K &amp; 8K</text>
        <text x="250" y="535" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#64748b" width="410">
          Extract pristine 2160p (4K), 1440p (2K), and 1080p 60fps video streams with unthrottled multithreaded download speed.
        </text>
        <rect x="250" y="600" width="410" height="52" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
        <text x="270" y="632" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#0f172a">4K 2160p (60fps) · AV01 / VP9</text>
        <rect x="250" y="665" width="410" height="52" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
        <text x="270" y="697" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#0f172a">1080p Full HD · MP4 / H.264</text>
        <rect x="250" y="730" width="410" height="52" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
        <text x="270" y="762" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#0f172a">720p HD · Compact MP4</text>

        <!-- Card 2 -->
        <rect x="725" y="415" width="470" height="490" rx="28" fill="#ffffff" stroke="#f1f5f9" stroke-width="2" />
        <rect x="755" y="445" width="56" height="56" rx="18" fill="#dcfce7" />
        <text x="773" y="481" font-size="24">🎵</text>
        <text x="830" y="480" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#0f172a">Audiophile Extraction</text>
        <text x="755" y="535" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#64748b">
          Studio master quality audio extraction with automatic cover artwork and ID3 metadata tag embedding.
        </text>
        <rect x="755" y="600" width="410" height="52" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
        <text x="775" y="632" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#059669">OPUS (.opus — Best Fidelity)</text>
        <rect x="755" y="665" width="410" height="52" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
        <text x="775" y="697" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#0f172a">MP3 (320kbps — Universal)</text>
        <rect x="755" y="730" width="410" height="52" rx="14" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
        <text x="775" y="762" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#0f172a">FLAC (.flac — Studio Lossless)</text>

        <!-- Card 3 -->
        <rect x="1230" y="415" width="470" height="490" rx="28" fill="#ffffff" stroke="#f1f5f9" stroke-width="2" />
        <rect x="1260" y="445" width="56" height="56" rx="18" fill="#fef3c7" />
        <text x="1278" y="481" font-size="24">⚡</text>
        <text x="1335" y="480" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#0f172a">Smart Auto-Capture</text>
        <text x="1260" y="535" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#64748b">
          Copy any video link in Chrome, Brave, or Edge and Flowgrab auto-detects and queues the media instantly.
        </text>
        <rect x="1260" y="600" width="410" height="70" rx="16" fill="#ecfeff" stroke="#a5f3fc" stroke-width="1" />
        <text x="1280" y="630" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#0891b2">🔗 Clipboard Auto-Capture Active</text>
        <text x="1280" y="652" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#64748b">Share ➔ Copy Link automatically loads video</text>

        <rect x="1260" y="690" width="410" height="70" rx="16" fill="#fdf4ff" stroke="#f0abfc" stroke-width="1" />
        <text x="1280" y="720" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#c026d3">📑 Consecutive Batch Queueing</text>
        <text x="1280" y="742" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#64748b">Copy multiple links to build batch downloads</text>
      </svg>
    `
  },
  {
    name: 'screenshot2',
    title: 'Flowgrab Downloader — 4K Stream Analysis &amp; Codec Selection',
    svg: `
      <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="100%" stop-color="#e2e8f0" />
          </linearGradient>
          <linearGradient id="brandGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
          <filter id="shadow2" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.08" />
          </filter>
        </defs>
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad2)" />
        <rect x="140" y="80" width="1640" height="920" rx="36" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" filter="url(#shadow2)" />

        <!-- Header -->
        <rect x="140" y="80" width="1640" height="85" rx="36" fill="#ffffff" />
        <line x1="140" y1="165" x2="1780" y2="165" stroke="#f1f5f9" stroke-width="2" />
        <circle cx="190" cy="122" r="7" fill="#ef4444" opacity="0.8" />
        <circle cx="215" cy="122" r="7" fill="#f59e0b" opacity="0.8" />
        <circle cx="240" cy="122" r="7" fill="#10b981" opacity="0.8" />
        <text x="280" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="url(#brandGrad2)">⚡ Flowgrab</text>

        <!-- Video Info Card -->
        <rect x="220" y="205" width="1480" height="190" rx="24" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        
        <!-- Thumbnail Mockup -->
        <rect x="245" y="225" width="260" height="150" rx="18" fill="#0f172a" />
        <text x="345" y="310" font-size="36" fill="#ffffff">▶</text>
        <rect x="435" y="340" width="60" height="26" rx="8" fill="#000000" opacity="0.8" />
        <text x="445" y="358" font-family="monospace" font-size="12" font-weight="700" fill="#ffffff">12:45</text>

        <!-- Video Title &amp; Details -->
        <text x="535" y="265" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#0f172a">Interstellar Theme (Live Orchestra Performance in 4K Ultra HD)</text>
        <text x="535" y="300" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#64748b">Hans Zimmer Live · 14.8M Views · 4K 60FPS HDR</text>

        <!-- Tags -->
        <rect x="535" y="325" width="110" height="32" rx="10" fill="#dbeafe" />
        <text x="552" y="346" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#1d4ed8">🎬 4K 2160p</text>

        <rect x="655" y="325" width="120" height="32" rx="10" fill="#dcfce7" />
        <text x="670" y="346" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#15803d">🎵 Opus 320k</text>

        <rect x="785" y="325" width="140" height="32" rx="10" fill="#fef3c7" />
        <text x="800" y="346" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#b45309">🏷 Tag Embedded</text>

        <!-- Format Selector Section -->
        <text x="220" y="435" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#0f172a">Select Stream Quality &amp; Container</text>
        
        <!-- Stream List Columns -->
        <!-- Option 1: 4K Selected -->
        <rect x="220" y="460" width="720" height="74" rx="20" fill="#ecfeff" stroke="#06b6d4" stroke-width="2" />
        <circle cx="260" cy="497" r="10" fill="#06b6d4" />
        <circle cx="260" cy="497" r="4" fill="#ffffff" />
        <text x="290" y="495" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#0f172a">4K Ultra HD (2160p · 60fps)</text>
        <text x="290" y="517" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#0891b2">AV01 Video + Opus Master Audio</text>
        <rect x="800" y="478" width="115" height="36" rx="12" fill="#ffffff" stroke="#06b6d4" stroke-width="1" />
        <text x="825" y="501" font-family="monospace" font-size="13" font-weight="800" fill="#0891b2">~1.85 GB</text>

        <!-- Option 2: 1080p -->
        <rect x="220" y="545" width="720" height="74" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
        <circle cx="260" cy="582" r="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
        <text x="290" y="580" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#0f172a">1080p Full HD (60fps)</text>
        <text x="290" y="602" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#64748b">H.264 Video · High Universal Compatibility</text>
        <rect x="815" y="563" width="100" height="36" rx="12" fill="#f8fafc" />
        <text x="835" y="586" font-family="monospace" font-size="13" font-weight="700" fill="#64748b">~420 MB</text>

        <!-- Option 3: 720p -->
        <rect x="220" y="630" width="720" height="74" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
        <circle cx="260" cy="667" r="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
        <text x="290" y="665" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#0f172a">720p HD Data Saver</text>
        <text x="290" y="687" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#64748b">Optimized mobile bitrate stream</text>
        <rect x="815" y="648" width="100" height="36" rx="12" fill="#f8fafc" />
        <text x="835" y="671" font-family="monospace" font-size="13" font-weight="700" fill="#64748b">~195 MB</text>

        <!-- Advanced Container Options Panel -->
        <rect x="980" y="460" width="720" height="244" rx="24" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <text x="1015" y="500" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#0f172a">Muxing &amp; Metadata Options</text>

        <!-- Container Dropdown Mock -->
        <rect x="1015" y="525" width="650" height="48" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
        <text x="1035" y="555" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#0f172a">Output Container: MP4 (.mp4 — Universal &amp; Mobile Compatible)</text>
        <text x="1635" y="555" font-size="14" fill="#64748b">▼</text>

        <!-- Checkboxes -->
        <rect x="1015" y="595" width="310" height="44" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="1030" y="609" width="16" height="16" rx="4" fill="#0284c7" />
        <text x="1034" y="622" font-size="12" fill="#ffffff">✓</text>
        <text x="1055" y="623" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#0f172a">Embed High-Res Artwork</text>

        <rect x="1355" y="595" width="310" height="44" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="1370" y="609" width="16" height="16" rx="4" fill="#0284c7" />
        <text x="1374" y="622" font-size="12" fill="#ffffff">✓</text>
        <text x="1395" y="623" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#0f172a">Embed ID3/Media Metadata</text>

        <!-- Download Action Button -->
        <rect x="220" y="740" width="1480" height="76" rx="24" fill="url(#brandGrad2)" />
        <text x="860" y="787" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#ffffff">⬇ Download 4K Ultra HD Now</text>
      </svg>
    `
  },
  {
    name: 'screenshot3',
    title: 'Flowgrab Downloader — Smart Consecutive Batch Queue Manager',
    svg: `
      <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="100%" stop-color="#e2e8f0" />
          </linearGradient>
          <linearGradient id="brandGrad3" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
          <filter id="shadow3" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.08" />
          </filter>
        </defs>
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad3)" />
        <rect x="140" y="80" width="1640" height="920" rx="36" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" filter="url(#shadow3)" />

        <!-- Header -->
        <rect x="140" y="80" width="1640" height="85" rx="36" fill="#ffffff" />
        <line x1="140" y1="165" x2="1780" y2="165" stroke="#f1f5f9" stroke-width="2" />
        <text x="280" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="url(#brandGrad3)">⚡ Flowgrab Batch Manager</text>

        <!-- Batch Notification Banner -->
        <rect x="220" y="195" width="1480" height="60" rx="18" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" />
        <text x="250" y="232" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#15803d">✓ Smart Clipboard Batch Mode Active — 4 Videos Auto-Captured from Chrome</text>

        <!-- Batch Queue Items -->
        <!-- Item 1 -->
        <rect x="220" y="275" width="1480" height="96" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <rect x="240" y="291" width="110" height="64" rx="12" fill="#1e293b" />
        <text x="285" y="330" font-size="20" fill="#ffffff">▶</text>
        <text x="370" y="322" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#0f172a">1. Cinematic 4K Drone Footage (Switzerland Alps HDR)</text>
        <text x="370" y="344" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#64748b">NatureFilms · 08:30 · 2160p 60fps</text>
        <rect x="1480" y="305" width="190" height="38" rx="12" fill="#ecfeff" stroke="#a5f3fc" stroke-width="1" />
        <text x="1515" y="329" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#0891b2">4K Ultra HD · Ready</text>

        <!-- Item 2 -->
        <rect x="220" y="385" width="1480" height="96" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <rect x="240" y="401" width="110" height="64" rx="12" fill="#1e293b" />
        <text x="285" y="440" font-size="20" fill="#ffffff">▶</text>
        <text x="370" y="432" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#0f172a">2. Lo-Fi Hip Hop Beats to Relax / Study to (Full Mix)</text>
        <text x="370" y="454" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#64748b">ChilledCow · 45:10 · Audio Only</text>
        <rect x="1480" y="415" width="190" height="38" rx="12" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1" />
        <text x="1510" y="439" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#16a34a">OPUS 320k · Ready</text>

        <!-- Item 3 -->
        <rect x="220" y="495" width="1480" height="96" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <rect x="240" y="511" width="110" height="64" rx="12" fill="#1e293b" />
        <text x="285" y="550" font-size="20" fill="#ffffff">▶</text>
        <text x="370" y="542" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#0f172a">3. Rust &amp; Tauri 2.0 Full Architecture Crash Course</text>
        <text x="370" y="564" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#64748b">DevCode · 24:18 · 1080p 60fps</text>
        <rect x="1480" y="525" width="190" height="38" rx="12" fill="#ecfeff" stroke="#a5f3fc" stroke-width="1" />
        <text x="1515" y="549" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#0891b2">1080p Full HD · Ready</text>

        <!-- Item 4 -->
        <rect x="220" y="605" width="1480" height="96" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <rect x="240" y="621" width="110" height="64" rx="12" fill="#1e293b" />
        <text x="285" y="660" font-size="20" fill="#ffffff">▶</text>
        <text x="370" y="652" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#0f172a">4. Quantum Physics Explained in 10 Minutes</text>
        <text x="370" y="674" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#64748b">ScienceWorld · 10:02 · 1080p</text>
        <rect x="1480" y="635" width="190" height="38" rx="12" fill="#ecfeff" stroke="#a5f3fc" stroke-width="1" />
        <text x="1515" y="659" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#0891b2">1080p Full HD · Ready</text>

        <!-- Batch Download All Action -->
        <rect x="220" y="740" width="1480" height="80" rx="24" fill="url(#brandGrad3)" />
        <text x="800" y="790" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#ffffff">⬇ Download All 4 Queued Videos in Parallel</text>
      </svg>
    `
  },
  {
    name: 'screenshot4',
    title: 'Flowgrab Downloader — Active Parallel Downloads &amp; History Manager',
    svg: `
      <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="100%" stop-color="#e2e8f0" />
          </linearGradient>
          <linearGradient id="brandGrad4" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
          <filter id="shadow4" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.08" />
          </filter>
        </defs>
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad4)" />
        <rect x="140" y="80" width="1640" height="920" rx="36" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" filter="url(#shadow4)" />

        <!-- Header -->
        <rect x="140" y="80" width="1640" height="85" rx="36" fill="#ffffff" />
        <line x1="140" y1="165" x2="1780" y2="165" stroke="#f1f5f9" stroke-width="2" />
        <text x="280" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="url(#brandGrad4)">⚡ Flowgrab Active Downloads &amp; History</text>

        <!-- Stats Bar -->
        <rect x="220" y="195" width="470" height="90" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <text x="250" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#64748b">CURRENT NETWORK SPEED</text>
        <text x="250" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" fill="#0284c7">48.6 MB/s</text>

        <rect x="725" y="195" width="470" height="90" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <text x="755" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#64748b">ACTIVE EXTRACTING TASKS</text>
        <text x="755" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" fill="#059669">2 Downloading · 1 Completed</text>

        <rect x="1230" y="195" width="470" height="90" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <text x="1260" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#64748b">ESTIMATED TIME REMAINING</text>
        <text x="1260" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" fill="#0f172a">00:14 (Seconds)</text>

        <!-- Active Download Row 1 -->
        <rect x="220" y="320" width="1480" height="130" rx="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
        <text x="250" y="358" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="800" fill="#0f172a">4K Swiss Alps Drone Cinema (2160p 60fps HDR)</text>
        <text x="1560" y="358" font-family="monospace" font-size="16" font-weight="800" fill="#0284c7">78%</text>
        <!-- Progress bar -->
        <rect x="250" y="380" width="1420" height="12" rx="6" fill="#e2e8f0" />
        <rect x="250" y="380" width="1107" height="12" rx="6" fill="url(#brandGrad4)" />
        <text x="250" y="425" font-family="monospace" font-size="13" font-weight="600" fill="#64748b">Speed: 32.4 MB/s · ETA: 00:08 · Size: 1.45 GB / 1.85 GB</text>
        <rect x="1540" y="405" width="130" height="34" rx="10" fill="#fee2e2" />
        <text x="1575" y="427" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#dc2626">⏸ Pause</text>

        <!-- Active Download Row 2 -->
        <rect x="220" y="475" width="1480" height="130" rx="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
        <text x="250" y="513" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="800" fill="#0f172a">Hans Zimmer Live Concert — Interstellar Suite (Lossless FLAC)</text>
        <text x="1560" y="513" font-family="monospace" font-size="16" font-weight="800" fill="#0284c7">52%</text>
        <!-- Progress bar -->
        <rect x="250" y="535" width="1420" height="12" rx="6" fill="#e2e8f0" />
        <rect x="250" y="535" width="738" height="12" rx="6" fill="url(#brandGrad4)" />
        <text x="250" y="580" font-family="monospace" font-size="13" font-weight="600" fill="#64748b">Speed: 16.2 MB/s · ETA: 00:06 · Size: 180 MB / 340 MB</text>
        <rect x="1540" y="560" width="130" height="34" rx="10" fill="#fee2e2" />
        <text x="1575" y="582" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#dc2626">⏸ Pause</text>

        <!-- Completed History Row -->
        <text x="220" y="650" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#0f172a">Completed History</text>

        <rect x="220" y="670" width="1480" height="90" rx="20" fill="#f0fdf4" stroke="#86efac" stroke-width="1" />
        <text x="250" y="710" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="#0f172a">✓ Rust &amp; Tauri 2.0 Architecture Guide.mp4</text>
        <text x="250" y="735" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#15803d">Saved to: C:\\Users\\Downloads\\Flowgrab · 420 MB</text>
        
        <!-- Show in folder button -->
        <rect x="1500" y="695" width="170" height="42" rx="12" fill="#ffffff" stroke="#86efac" stroke-width="1.5" />
        <text x="1525" y="721" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#15803d">📂 Show in Folder</text>
      </svg>
    `
  },
  {
    name: 'screenshot5',
    title: 'Flowgrab Downloader — 1-Click In-App Background Updater &amp; FFmpeg Core',
    svg: `
      <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad5" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="100%" stop-color="#e2e8f0" />
          </linearGradient>
          <linearGradient id="brandGrad5" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
          <filter id="shadow5" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="16" stdDeviation="32" flood-color="#0f172a" flood-opacity="0.12" />
          </filter>
        </defs>
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad5)" />

        <!-- Background Blurred Mockup -->
        <rect x="140" y="80" width="1640" height="920" rx="36" fill="#ffffff" opacity="0.6" />

        <!-- Updater Modal Overlay -->
        <rect x="520" y="160" width="880" height="760" rx="32" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" filter="url(#shadow5)" />

        <!-- Modal Header -->
        <rect x="560" y="200" width="56" height="56" rx="18" fill="#e0f2fe" />
        <text x="578" y="236" font-size="24">✨</text>
        <text x="635" y="230" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="#0f172a">Software &amp; Engine Updates</text>
        <text x="635" y="255" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#64748b">Check official releases and manage media extraction engines.</text>

        <!-- Card 1: App Version &amp; 1-Click Updater -->
        <rect x="560" y="290" width="800" height="210" rx="24" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <text x="590" y="325" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#64748b" letter-spacing="1">APPLICATION RELEASE</text>
        <text x="590" y="355" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#0f172a">Flowgrab Downloader v1.1.2</text>
        
        <!-- Live Download Progress in Modal -->
        <rect x="590" y="380" width="740" height="90" rx="18" fill="#ecfeff" stroke="#a5f3fc" stroke-width="1" />
        <text x="615" y="415" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#0891b2">Downloading Official Release (v1.1.2) in Background...</text>
        <text x="1275" y="415" font-family="monospace" font-size="15" font-weight="800" fill="#0891b2">74%</text>
        <rect x="615" y="435" width="690" height="10" rx="5" fill="#cffafe" />
        <rect x="615" y="435" width="510" height="10" rx="5" fill="#06b6d4" />

        <!-- Card 2: yt-dlp Persistent Core -->
        <rect x="560" y="525" width="800" height="160" rx="24" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <text x="590" y="560" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#64748b" letter-spacing="1">EXTRACTION CORE</text>
        <text x="590" y="590" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#0f172a">yt-dlp Engine Core</text>
        <rect x="760" y="572" width="135" height="26" rx="8" fill="#e0f2fe" />
        <text x="772" y="590" font-family="monospace" font-size="12" font-weight="700" fill="#0284c7">v2026.08.19</text>
        <text x="590" y="625" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#64748b">Direct GitHub binary streaming to user AppData. Updates persist permanently across restarts.</text>
        
        <rect x="1190" y="560" width="140" height="42" rx="12" fill="#0284c7" />
        <text x="1215" y="586" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#ffffff">Update Core</text>

        <!-- Card 3: FFmpeg Core -->
        <rect x="560" y="705" width="800" height="110" rx="24" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
        <text x="590" y="740" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#64748b" letter-spacing="1">MEDIA MUXING &amp; ENCODING</text>
        <text x="590" y="770" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#0f172a">FFmpeg 7.x Muxer Core</text>
        <rect x="1225" y="740" width="105" height="34" rx="10" fill="#dcfce7" />
        <text x="1245" y="762" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#15803d">✓ Ready</text>
        <text x="590" y="795" font-family="monospace" font-size="12" font-weight="600" fill="#64748b">High Performance Muxer &amp; Audio Converter</text>

        <!-- Close Button -->
        <rect x="1210" y="845" width="150" height="50" rx="16" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" />
        <text x="1265" y="876" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#0f172a">Close</text>
      </svg>
    `
  }
];

async function generateAll() {
  const rootDir = path.resolve(__dirname, '..');
  const screenshotsDir = path.join(rootDir, 'screenshots');
  const publicScreenshotsDir = path.join(rootDir, 'public', 'screenshots');

  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
  if (!fs.existsSync(publicScreenshotsDir)) fs.mkdirSync(publicScreenshotsDir, { recursive: true });

  for (const s of screenshots) {
    const svgBuffer = Buffer.from(s.svg);
    const rootPng = path.join(screenshotsDir, `${s.name}.png`);
    const publicPng = path.join(publicScreenshotsDir, `${s.name}.png`);

    await sharp(svgBuffer).png({ quality: 95 }).toFile(rootPng);
    fs.copyFileSync(rootPng, publicPng);
    console.log(`Generated: ${rootPng} & ${publicPng}`);
  }
}

generateAll().then(() => {
  console.log('All 5 high-resolution light-theme screenshots successfully generated!');
}).catch(console.error);
