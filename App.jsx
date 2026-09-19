import React, { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import './styles/App.css';

const LANES = {
  '4K': ['← Left', '↓ Down', '↑ Up', '→ Right'],
  '6K': ['↙', '←', '↓', '↑', '→', '↗'],
  '7K': ['↙', '←', '↓', '↑', '→', '↗', '•']
};
const DEFAULT_BPM = 120;
const SNAP_OPTIONS = [
  { label: '1/1', value: 1 },
  { label: '1/2', value: 2 },
  { label: '1/4', value: 4 },
  { label: '1/8', value: 8 },
  { label: '1/16', value: 16 },
  { label: '1/32', value: 32 }
];

const emptyChart = () => ({
  version: 2,
  title: 'untitled',
  difficulty: 'normal',
  lanes: 4,
  bpm: DEFAULT_BPM,
  speed: 1,
  offset: 0,
  notes: [],
  bpmChanges: [{ time: 0, bpm: DEFAULT_BPM }],
  metadata: {
    artist: '',
    charter: '',
    stage: 'mainStage',
    player1: 'bf',
    player2: 'dad',
    player3: 'gf',
    noteStyle: 'funkin'
  }
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugify(s) {
  return (s || 'untitled').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
  return `${m}:${s}.${ms}`;
}

function quantize(ms, bpm, snap) {
  const unit = (60000 / bpm) / snap;
  return Math.round(ms / unit) * unit;
}

function App() {
  const [chart, setChart] = useState(emptyChart);
  const [audioFile, setAudioFile] = useState(null);
  const [audioDataUrl, setAudioDataUrl] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [snap, setSnap] = useState(4);
  const [holdLength, setHoldLength] = useState(0);
  const [holdMode, setHoldMode] = useState(false);
  const [lanesMode, setLanesMode] = useState('4K');
  const [difficulty, setDifficulty] = useState('normal');
  const [status, setStatus] = useState('Ready');
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef(null);
  const fileRef = useRef(null);
  const rafRef = useRef(null);

  const laneLabels = LANES[lanesMode];
  const visibleBeats = 24;
  const beatMs = 60000 / Math.max(1, chart.bpm);
  const unitMs = beatMs / snap;
  const windowStart = Math.max(0, Math.floor(currentTime / (beatMs * 4)) * (beatMs * 4));
  const rowCount = visibleBeats * snap;
  const rowHeight = 30;

  useEffect(() => {
    if (!audioRef.current) return;
    if (audioDataUrl) audioRef.current.src = audioDataUrl;
  }, [audioDataUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setAudioDuration(audio.duration || 0);
    const onEnded = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioDataUrl]);

  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const notesInWindow = useMemo(() => {
    const end = windowStart + visibleBeats * beatMs;
    return chart.notes.filter(n => n.time >= windowStart - 1 && n.time <= end + 1);
  }, [chart.notes, windowStart, beatMs]);

  const setTime = (seconds) => {
    const t = Math.max(0, Math.min(audioDuration || Infinity, seconds));
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const togglePlay = async () => {
    if (!audioRef.current || !audioDataUrl) {
      setStatus('Load an audio file first.');
      return;
    }
    try {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        await audioRef.current.play();
        setPlaying(true);
      }
    } catch {
      setStatus('Chrome blocked playback; tap Play again.');
    }
  };

  const addOrRemoveNote = (lane, rawTime) => {
    const time = quantize(rawTime, chart.bpm, snap);
    const existing = chart.notes.find(n => n.lane === lane && Math.abs(n.time - time) < 0.5);
    if (existing) {
      setChart(c => ({ ...c, notes: c.notes.filter(n => n !== existing) }));
      setStatus('Note removed.');
      return;
    }
    const length = holdMode ? holdLength * unitMs : 0;
    const note = { time: Math.max(0, time), lane, length: Math.max(0, length), type: 'normal' };
    setChart(c => ({ ...c, notes: [...c.notes, note].sort((a,b) => a.time-b.time || a.lane-b.lane) }));
    setStatus(length ? `Hold added: ${Math.round(length)} ms` : 'Tap note added.');
  };

  const handleGridPointer = (e, row) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const lane = Math.max(0, Math.min(laneLabels.length - 1, Math.floor((e.clientX - rect.left) / (rect.width / laneLabels.length))));
    const time = windowStart + row * unitMs;
    addOrRemoveNote(lane, time);
  };

  const handleAudio = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setStatus('Please choose an audio file.');
      return;
    }
    setAudioFile(file);
    setAudioDataUrl(await readFileAsDataURL(file));
    setStatus(`Loaded: ${file.name}`);
  };

  const updateChart = (field, value) => setChart(c => ({ ...c, [field]: value }));
  const updateMeta = (field, value) => setChart(c => ({ ...c, metadata: { ...c.metadata, [field]: value } }));

  const saveProject = async () => {
    const project = {
      app: 'FNF Touch Chart Editor',
      projectVersion: 2,
      savedAt: new Date().toISOString(),
      chart,
      lanesMode,
      snap,
      holdMode,
      holdLength,
      audio: audioDataUrl ? { name: audioFile?.name || 'audio', dataUrl: audioDataUrl } : null
    };
    downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${slugify(chart.title)}-project.json`);
    setStatus('Project saved.');
  };

  const loadProject = (file) => {
    const r = new FileReader();
    r.onload = e => {
      try {
        const p = JSON.parse(e.target.result);
        const loaded = p.chart || p;
        setChart({ ...emptyChart(), ...loaded, metadata: { ...emptyChart().metadata, ...(loaded.metadata || {}) } });
        if (p.lanesMode) setLanesMode(p.lanesMode);
        if (p.snap) setSnap(p.snap);
        if (typeof p.holdMode === 'boolean') setHoldMode(p.holdMode);
        if (p.holdLength != null) setHoldLength(p.holdLength);
        if (p.audio?.dataUrl) {
          setAudioDataUrl(p.audio.dataUrl);
          setAudioFile({ name: p.audio.name || 'project-audio', type: 'audio/mpeg' });
        }
        setStatus('Project loaded.');
      } catch {
        setStatus('Invalid project JSON.');
      }
    };
    r.readAsText(file);
  };

  const exportLegacy = () => {
    const sections = [];
    const sorted = [...chart.notes].sort((a,b)=>a.time-b.time);
    for (const n of sorted) {
      let section = sections.find(s => n.time >= s.start && n.time < s.start + 2000);
      if (!section) {
        const start = Math.floor(n.time / 2000) * 2000;
        section = { start, sectionNotes: [], mustHitSection: true, lengthInSteps: 16 };
        sections.push(section);
      }
      section.sectionNotes.push([n.time, n.lane, n.length || 0]);
    }
    sections.sort((a,b)=>a.start-b.start);
    const out = {
      song: {
        song: chart.title,
        notes: sections.map(s => ({ sectionNotes: s.sectionNotes, mustHitSection: true, lengthInSteps: 16 })),
        bpm: chart.bpm,
        sections: sections.length,
        needsVoices: false,
        player1: chart.metadata.player1,
        player2: chart.metadata.player2,
        player3: chart.metadata.player3,
        speed: chart.speed
      }
    };
    downloadBlob(new Blob([JSON.stringify(out, null, 2)], {type:'application/json'}), `${slugify(chart.title)}-${difficulty}.json`);
    setStatus('Legacy FNF JSON exported.');
  };

  const buildVSlice = () => {
    if (lanesMode !== '4K') {
      setStatus('V-Slice export requires 4K. Switch to 4K first.');
      return null;
    }
    const diff = difficulty || 'normal';
    const vsNotes = chart.notes.map(n => {
      const stepCrochet = beatMs / 4;
      const out = { t: Number(n.time.toFixed(3)), d: n.lane + 4 };
      if (n.length > 0) out.l = Number(Math.max(0, n.length - stepCrochet * 0.5).toFixed(3));
      if (n.type && n.type !== 'normal') out.k = n.type;
      return out;
    }).sort((a,b)=>a.t-b.t);
    const chartData = {
      scrollSpeed: { [diff]: Number(chart.speed) || 1 },
      notes: { [diff]: vsNotes },
      events: [],
      version: '2.0.0',
      generatedBy: 'FNF Touch Chart Editor'
    };
    const meta = {
      timeFormat: 'ms',
      artist: chart.metadata.artist || 'Unknown',
      charter: chart.metadata.charter || 'FNF Touch Chart Editor',
      playData: {
        album: 'volume1',
        previewStart: 0,
        previewEnd: 15000,
        ratings: { [diff]: 0 },
        stage: chart.metadata.stage || 'mainStage',
        difficulties: [diff],
        characters: {
          player: chart.metadata.player1 || 'bf',
          opponent: chart.metadata.player2 || 'dad',
          girlfriend: chart.metadata.player3 || 'gf',
          instrumental: 'Inst',
          altInstrumentals: [],
          opponentVocals: ['Voices-opp'],
          playerVocals: ['Voices-bf']
        },
        songVariations: [],
        noteStyle: chart.metadata.noteStyle || 'funkin'
      },
      songName: chart.title,
      offsets: {
        vocals: {},
        instrumental: Number(chart.offset) || 0,
        altInstrumentals: {},
        altVocals: {}
      },
      timeChanges: [{ t: 0, bpm: Number(chart.bpm) || 120, n: 4, d: 4 }],
      generatedBy: 'FNF Touch Chart Editor',
      version: '2.2.4',
      looped: false
    };
    return { chartData, meta, diff };
  };

  const exportVSlice = async () => {
    const built = buildVSlice();
    if (!built) return;
    const { chartData, meta } = built;
    const base = slugify(chart.title);
    const zip = new JSZip();
    zip.file(`${base}-chart.json`, JSON.stringify(chartData, null, 2));
    zip.file(`${base}-metadata.json`, JSON.stringify(meta, null, 2));
    zip.file('manifest.json', JSON.stringify({ version: '1.0.0', songId: base }, null, 2));
    zip.file('README.txt',
      `Generated by FNF Touch Chart Editor.\\n` +
      `V-Slice chart version: ${chartData.version}\\n` +
      `Metadata version: ${meta.version}\\n` +
      `Difficulty: ${built.diff}\\n\\n` +
      `Place the song audio assets separately in your V-Slice mod.`
    );
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${base}-${built.diff}.fnfc`);
    setStatus('V-Slice .fnfc package exported.');
  };

  const noteAt = (lane, time) => chart.notes.find(n => n.lane === lane && Math.abs(n.time - time) < 0.5);

  const removeAll = () => {
    if (window.confirm('Delete every note in this chart?')) {
      setChart(c => ({ ...c, notes: [] }));
      setStatus('All notes deleted.');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>FNF Touch Chart Editor</h1>
          <p>Android-first • 4K default • 6K/7K available • local-only</p>
        </div>
        <span className="status">{status}</span>
      </header>

      <main>
        <section className="panel top-panel">
          <div className="row wrap">
            <label className="fileButton">🎵 Load Audio
              <input ref={fileRef} type="file" accept="audio/*" onChange={e=>handleAudio(e.target.files?.[0])}/>
            </label>
            <label className="fileButton">📂 Load Project
              <input type="file" accept=".json" onChange={e=>e.target.files?.[0] && loadProject(e.target.files[0])}/>
            </label>
            <button onClick={saveProject}>💾 Save Project</button>
            <button onClick={exportLegacy}>⬇ Legacy JSON</button>
            <button className="primary" onClick={exportVSlice}>📦 Export V-Slice .fnfc</button>
            <button className="danger" onClick={removeAll}>🗑 Clear Notes</button>
          </div>
          <audio ref={audioRef} preload="metadata"/>
        </section>

        <section className="panel">
          <div className="controls-grid">
            <label>Layout
              <select value={lanesMode} onChange={e=>{setLanesMode(e.target.value); updateChart('lanes', LANES[e.target.value].length);}}>
                <option>4K</option><option>6K</option><option>7K</option>
              </select>
            </label>
            <label>Difficulty
              <input value={difficulty} onChange={e=>{setDifficulty(e.target.value); updateChart('difficulty', e.target.value);}}/>
            </label>
            <label>BPM
              <input type="number" min="1" max="500" step="0.01" value={chart.bpm} onChange={e=>{const bpm=Number(e.target.value)||120; updateChart('bpm',bpm); updateChart('bpmChanges',[{time:0,bpm}]);}}/>
            </label>
            <label>Scroll Speed
              <input type="number" min="0.1" max="10" step="0.1" value={chart.speed} onChange={e=>updateChart('speed',Number(e.target.value)||1)}/>
            </label>
            <label>Snap
              <select value={snap} onChange={e=>setSnap(Number(e.target.value))}>
                {SNAP_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label>Hold length
              <select value={holdLength} onChange={e=>setHoldLength(Number(e.target.value))}>
                <option value="0">Tap</option>
                <option value="1">1 subdivision</option>
                <option value="2">2 subdivisions</option>
                <option value="4">4 subdivisions</option>
                <option value="8">8 subdivisions</option>
                <option value="16">16 subdivisions</option>
              </select>
            </label>
            <button className={holdMode?'active':''} onClick={()=>setHoldMode(v=>!v)}>〰 Hold mode: {holdMode?'ON':'OFF'}</button>
            <button onClick={()=>setShowSettings(v=>!v)}>⚙ Song settings</button>
          </div>
          {showSettings && <div className="settings">
            <label>Song title<input value={chart.title} onChange={e=>updateChart('title',e.target.value)}/></label>
            <label>Artist<input value={chart.metadata.artist} onChange={e=>updateMeta('artist',e.target.value)}/></label>
            <label>Charter<input value={chart.metadata.charter} onChange={e=>updateMeta('charter',e.target.value)}/></label>
            <label>Stage<input value={chart.metadata.stage} onChange={e=>updateMeta('stage',e.target.value)}/></label>
            <label>Player<input value={chart.metadata.player1} onChange={e=>updateMeta('player1',e.target.value)}/></label>
            <label>Opponent<input value={chart.metadata.player2} onChange={e=>updateMeta('player2',e.target.value)}/></label>
            <label>Girlfriend<input value={chart.metadata.player3} onChange={e=>updateMeta('player3',e.target.value)}/></label>
            <label>Instrumental offset (ms)<input type="number" value={chart.offset} onChange={e=>updateChart('offset',Number(e.target.value)||0)}/></label>
          </div>}
        </section>

        <section className="panel transport">
          <button onClick={()=>setTime(currentTime-beatMs)}>⏪ -1 beat</button>
          <button className="play" onClick={togglePlay}>{playing?'⏸ Pause':'▶ Play'}</button>
          <button onClick={()=>{setTime(0); setPlaying(false); audioRef.current?.pause();}}>⏹ Stop</button>
          <button onClick={()=>setTime(currentTime+beatMs)}>⏩ +1 beat</button>
          <div className="time">{formatTime(currentTime)} / {formatTime(audioDuration)}</div>
          <input className="seek" type="range" min="0" max={audioDuration||1} step="0.001" value={Math.min(currentTime,audioDuration||1)} onChange={e=>setTime(Number(e.target.value))}/>
        </section>

        <section className="panel editor">
          <div className="gridHeader" style={{gridTemplateColumns:`repeat(${laneLabels.length}, 1fr)`}}>
            {laneLabels.map((l,i)=><div key={i}>{l}</div>)}
          </div>
          <div className="grid" style={{height: `${rowCount*rowHeight}px`}}>
            {Array.from({length: rowCount}).map((_,row)=>{
              const t = windowStart + row*unitMs;
              const beatIndex = Math.round((t-windowStart)/beatMs);
              const isBeat = Math.abs((t-windowStart)%beatMs)<0.01;
              const notesAt = notesInWindow.filter(n=>Math.abs(n.time-t)<0.5);
              return <div key={row} className={`gridRow ${isBeat?'beatRow':''}`} style={{top:`${row*rowHeight}px`, height:`${rowHeight}px`, '--lanes': laneLabels.length}}>
                {laneLabels.map((_,lane)=>{
                  const n=notesAt.find(x=>x.lane===lane);
                  return <button key={lane} className={`cell ${n?'note':''} ${n?.length?'hold':''}`} onClick={(e)=>{
                    const rect=e.currentTarget.getBoundingClientRect();
                    const lane2=lane;
                    const time=windowStart+row*unitMs;
                    addOrRemoveNote(lane2,time);
                  }} aria-label={`${laneLabels[lane]} at ${Math.round(t)} ms`}>
                    {n ? (n.length>0?'●━━':'●') : ''}
                  </button>
                })}
              </div>
            })}
            <div className="playhead" style={{top:`${Math.max(0,Math.min(rowCount-1,(currentTime-windowStart)/unitMs))*rowHeight+rowHeight/2}px`}}/>
          </div>
          <div className="gridFooter">
            <span>Window starts at {formatTime(windowStart/1000)}</span>
            <span>Tap = note • tap an existing note = delete • Hold mode + Hold length = sustain</span>
          </div>
        </section>

        <section className="panel help">
          <h2>Android quick workflow</h2>
          <ol>
            <li>Load your MP3/OGG/WAV.</li>
            <li>Set BPM and choose a snap (1/4 or 1/8 is a good starting point).</li>
            <li>Keep <b>4K</b> selected for V-Slice.</li>
            <li>Press Play, pause/seek where you want, then tap the four lanes to place notes.</li>
            <li>For sustains, turn on Hold mode and choose a hold length.</li>
            <li>Save Project frequently. The project can include the local audio data, so large songs create large JSON files.</li>
            <li>When finished, use <b>Export V-Slice .fnfc</b>. The package contains the V-Slice chart and metadata; audio assets are kept separate for your mod.</li>
          </ol>
          <p><b>Important:</b> V-Slice's current format uses a chart JSON plus a metadata JSON; the exporter follows the documented V-Slice chart/meta structure and maps 4K player lanes to V-Slice lanes 4–7. </p>
        </section>
      </main>
      <footer>FNF Touch Chart Editor • Works locally in Chrome • No audio upload server</footer>
    </div>
  );
}
export default App;
