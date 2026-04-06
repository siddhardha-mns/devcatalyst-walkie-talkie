# 📻 DevCatalyst — Walkie-Talkie Web App

Real-time PTT (Push-to-Talk) walkie-talkie for up to 50 simultaneous users.
Built with Node.js, Socket.IO, and the Web Audio API.

---

## Features
- 🎙️ Push-to-Talk with one-speaker-at-a-time channel locking
- 🔊 Background audio via silent AudioContext keep-alive trick
- 📳 Background notifications via Service Worker
- 📡 Opus audio codec (low-latency, high quality)
- ⌨️ Spacebar PTT shortcut on desktop
- 👥 Live member count per room
- 🔇 Mute output toggle

---

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
# http://localhost:3000
```

Open in two different browser tabs or devices on the same network to test.

---

## Deploy for Free

### Option A — Railway (Recommended, always-on)
1. Push this folder to a GitHub repo
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Railway auto-detects Node.js and runs `npm start`
4. Done — Railway gives you a public HTTPS URL

### Option B — Render
1. Push to GitHub
2. Go to https://render.com → New Web Service → Connect your repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Free tier note: spins down after 15 min inactivity (add a cron ping to keep it alive)

### Option C — Fly.io
```bash
npm install -g flyctl
flyctl auth login
flyctl launch
flyctl deploy
```

---

## Background Audio — How it Works

Browsers suspend audio in background tabs. This app defeats that with:

1. **Silent Oscillator**: A near-zero-volume oscillator runs constantly in the
   AudioContext, tricking the browser into keeping audio alive.

2. **Service Worker**: Registered at startup, handles background notifications
   when someone starts speaking while the tab isn't focused.

3. **PWA Install**: For best results on mobile (especially iOS), prompt users to
   install as a PWA (Add to Home Screen). This gives the app persistent audio
   behavior close to a native app.

**iOS Safari note**: Background audio on iOS is severely restricted in Safari tabs.
Installing as a PWA via Add to Home Screen is the most reliable workaround.

---

## Architecture

```
Client (Browser)                    Server (Node.js)
─────────────────                   ─────────────────
[PTT Button held]
  → MediaRecorder captures mic
  → 150ms audio chunks
  → socket.emit('ptt-start')   →    Lock channel to speaker
  → socket.emit('audio-chunk') →    Broadcast to all others
                               ←    socket.on('audio-chunk')
                                      → audioCtx.decodeAudioData()
                                      → BufferSource.start()
```

## File Structure

```
/
├── server/
│   └── index.js        — Express + Socket.IO server
├── client/
│   ├── index.html      — Full single-file frontend
│   └── sw.js           — Service Worker (background audio)
├── package.json
└── README.md
```

---

## Scaling Beyond 50 Users

For 100+ simultaneous users, consider:
- **Mediasoup** or **LiveKit** (SFU architecture) instead of relaying via Node.js
- **Redis Pub/Sub** for multi-server broadcasting
- **Cloudflare Workers** for edge-based audio relay
