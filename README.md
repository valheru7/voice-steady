# Voice Steady

A pitch and resonance reminder for voice practice. Open the page, press **Start listening**, and it
plays a sound in your headphones when your voice has stayed below your pitch target for a while, so
you don't have to watch a screen. It runs in a browser tab for hours and can record just your
microphone, so you can analyze a whole session afterward.

Everything runs in your browser. Audio is never uploaded.

## Who it's for

Anyone who wants to keep their voice in a chosen range without staring at a meter:

- streamers, podcasters and call-center staff who talk for hours
- voice actors and cosplayers holding a character voice
- singers and public speakers warming up or practicing
- people working on their voice with a speech-language pathologist
- anyone who wants a lower, higher or brighter speaking voice

## How it works

- **Pitch.** It estimates pitch (YIN) from your microphone. Only clear, voiced sound above a level you set counts.
- **The cue.** After you have talked for a while (default 8 seconds of clear voice), it looks at your median
  pitch over the last 30 seconds. If that is below your threshold (default 150 Hz), it plays the cue,
  then waits out a cooldown (default 150 seconds).
- **Resonance.** It shows a live median of F2, the second formant, a rough sign of how bright or forward your voice sounds.
  It is color only. It never triggers a cue.
- **Recording (Chrome or Edge).** Saves only your microphone to a folder you choose, in 5-minute `.webm` (Opus)
  files, about 10-15 MB per hour. A crash loses at most the last 5 minutes.
- **Your cue sound.** A soft chime by default. You can record your own 2-second cue or load a file.

## Use it

1. Open `index.html` in Chrome or Edge. It works from a local file or any static host; there is no build step.
2. Allow the microphone and press **Start listening**.
3. Talk normally. Watch the big numbers (median pitch, median F2) and set the **threshold** and **resonance goal**
   to numbers that suit your own voice. Measure yourself first; a good threshold sits between your usual voice and your target.
4. Optional: **Choose folder & record** to save your microphone.

Tips:

- Keep the tab open. Browsers keep audio tabs running in the background.
- The status line at the top says why a cue has not fired (for example "3 of 8 s of voice heard").
- Choosing which speakers play the cue: in Chrome, set the browser's output in your operating system's volume mixer. Chrome may list only one speaker.
- If the cue is audible to viewers while streaming, make sure your streaming software is not capturing the browser.

## Limits

- **Pitch** is accurate to a few hertz on a clean microphone. Background noise, other voices and music can fool it.
- **Resonance (F2)** is a rough estimate. It changes with the vowel you say, your microphone and the room.
  Compare it with your own normal voice, not with a fixed number. The estimator was tuned against Praat on
  one voice, one microphone and two recordings, so treat it as a trend, not a measurement.
- It does not know who is talking. Use a headset microphone so it hears mostly you.
- Recording needs the File System Access API, so Firefox and Safari can run the meter but cannot record.
- This is practice support, not medical advice. If talking hurts or you get hoarse, rest and see a professional.

## Analyzing recordings

The recordings are ordinary Opus files. To analyze a session, join the pieces and use any tool that reads them,
for example Praat or `ffmpeg`:

```
printf "file '%s'\n" /path/to/recordings/*.webm > list.txt
ffmpeg -f concat -safe 0 -i list.txt -ac 1 -ar 16000 session.wav
```

`tools/` holds the browser formant estimator as plain functions (`formants.js`) and a script that compares it
with Praat output (`compare-formants.js`).

## Contributing

Issues and pull requests are welcome. Keep the tool one dependency-free HTML file where possible.

## License

GPL-3.0-or-later. See `LICENSE`. Copyright (C) 2026 Voice Steady contributors.
