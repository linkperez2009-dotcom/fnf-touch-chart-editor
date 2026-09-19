# FNF Touch Chart Editor — Android

A touch-first browser chart editor for Friday Night Funkin'. The default layout is **4K**, with optional 6K/7K modes.

## Features

- 4K default: Left / Down / Up / Right.
- Optional 6K and 7K layouts.
- MP3, OGG, WAV and other browser-supported audio files.
- Combined instrumental + vocals audio is supported.
- Audio is processed locally in the browser; it is not uploaded.
- BPM control, scroll speed and instrumental offset.
- Snap: 1/1, 1/2, 1/4, 1/8, 1/16, 1/32.
- Tap notes.
- Hold/sustain notes with selectable subdivision length.
- Play/pause/stop.
- Seek bar.
- -1 beat / +1 beat buttons.
- Save/load a project JSON, including the local audio as a data URL when available.
- Export legacy FNF JSON.
- Export a V-Slice-style `.fnfc` package containing:
  - `<song>-chart.json`
  - `<song>-metadata.json`
  - `manifest.json`
  - `README.txt`
- Song metadata: title, artist, charter, stage, characters, difficulty, speed and offset.
- Android/Chrome-friendly touch targets.

## V-Slice

V-Slice charts use a chart JSON and a metadata JSON. The exporter targets chart version `2.0.0` and metadata version `2.2.4`, uses millisecond note times, and maps the 4 player lanes to V-Slice directions 4–7.

**Use 4K when exporting V-Slice.** 6K/7K are available for other FNF/legacy workflows, but vanilla V-Slice's chart format is four-key/two-strumline.

The exported `.fnfc` is a chart package; song audio assets are not embedded. Put your `Inst`/`Voices` assets in the appropriate V-Slice mod song folder separately.

## Run locally

Requirements:
- Node.js 18 or newer
- npm

```bash
npm install
npm start
```

Then open the local address shown by Create React App.

## Build

```bash
npm run build
```

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this project to the repository root.
3. Make sure the default branch is named `main`.
4. Edit `package.json` and replace:

```text
https://YOUR-USERNAME.github.io/fnf-touch-chart-editor
```

with your actual GitHub Pages URL.
5. Push to `main`.
6. The included `.github/workflows/deploy.yml` builds the project and publishes it through GitHub Pages.
7. In GitHub, open **Settings → Pages** and choose **GitHub Actions** if GitHub asks for a source.
8. Wait for the workflow to finish. Open the Pages URL in Chrome on Android.
9. In Chrome you can use **⋮ → Add to Home screen**.

## Android workflow

1. Open the Pages URL.
2. Load your song audio.
3. Keep **4K** selected for V-Slice.
4. Set BPM and snap.
5. Press Play and use the seek bar or ±1 beat controls.
6. Tap lanes to place notes.
7. Turn on Hold mode and choose a hold length for sustains.
8. Save the project regularly.
9. When finished, export the `.fnfc` package.

## Notes

Project JSON can become large because it can contain a base64/data-URL copy of the audio. For long songs, keep the project file as a backup and avoid sending it through apps that have attachment-size limits.
