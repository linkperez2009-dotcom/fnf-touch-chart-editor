import React, { useState, useRef, useEffect } from 'react';

function ChartEditor({ chart, onChartUpdate, audioFiles, isPlaying, onPlayStatusChange }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedNote, setSelectedNote] = useState(null);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const instAudioRef = useRef(null);
  const voicesAudioRef = useRef(null);

  const GRID_SIZE = 4; // 4K: left, down, up, right
  const PIXELS_PER_BEAT = 50;

  useEffect(() => {
    // Initialize audio elements if files are available
    if (audioFiles.inst) {
      const instUrl = URL.createObjectURL(audioFiles.inst);
      if (instAudioRef.current) {
        instAudioRef.current.src = instUrl;
      } else {
        instAudioRef.current = new Audio(instUrl);
      }
    }

    if (audioFiles.voices) {
      const voicesUrl = URL.createObjectURL(audioFiles.voices);
      if (voicesAudioRef.current) {
        voicesAudioRef.current.src = voicesUrl;
      } else {
        voicesAudioRef.current = new Audio(voicesUrl);
      }
    }

    return () => {
      if (audioFiles.inst) {
        URL.revokeObjectURL(instAudioRef.current?.src);
      }
      if (audioFiles.voices) {
        URL.revokeObjectURL(voicesAudioRef.current?.src);
      }
    };
  }, [audioFiles]);

  const handlePlayPause = () => {
    if (!audioFiles.inst || !audioFiles.voices) {
      alert('Please upload both audio files first');
      return;
    }

    if (isPlaying) {
      instAudioRef.current?.pause();
      voicesAudioRef.current?.pause();
      onPlayStatusChange(false);
    } else {
      instAudioRef.current?.play();
      voicesAudioRef.current?.play();
      onPlayStatusChange(true);
    }
  };

  const handleNoteClick = (column, row) => {
    const timeMs = row * (60000 / (chart.song.bpm * PIXELS_PER_BEAT));
    
    // Check if note already exists
    const existingNote = chart.song.notes.find(
      note => note.time === timeMs && note.type === column
    );

    let updatedNotes = [...chart.song.notes];

    if (existingNote) {
      // Remove note if it exists
      updatedNotes = updatedNotes.filter(n => n !== existingNote);
    } else {
      // Add new note
      updatedNotes.push({
        time: timeMs,
        type: column,
        length: 0,
      });
    }

    const updatedChart = {
      ...chart,
      song: {
        ...chart.song,
        notes: updatedNotes,
      },
    };

    onChartUpdate(updatedChart);
    setSelectedNote(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      handlePlayPause();
    }
  };

  const noteExists = (column, row) => {
    const timeMs = row * (60000 / (chart.song.bpm * PIXELS_PER_BEAT));
    return chart.song.notes.some(
      note => note.time === timeMs && note.type === column
    );
  };

  const gridRows = 200; // Number of rows in the grid

  return (
    <div className="chart-editor" role="region" aria-label="Chart editor grid">
      <div className="editor-controls">
        <button
          onClick={handlePlayPause}
          onKeyDown={handleKeyDown}
          className="play-button"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          aria-pressed={isPlaying}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <div className="time-display" role="status" aria-live="polite">
          Time: {(currentTime / 1000).toFixed(2)}s
        </div>
      </div>

      <div className="grid-container">
        <div className="grid-header">
          <div className="column-label">← Left</div>
          <div className="column-label">↓ Down</div>
          <div className="column-label">↑ Up</div>
          <div className="column-label">→ Right</div>
        </div>

        <div className="grid-wrapper">
          <div className="grid">
            {Array.from({ length: gridRows }).map((_, row) => (
              <div key={`row-${row}`} className="grid-row">
                {Array.from({ length: GRID_SIZE }).map((_, col) => (
                  <button
                    key={`cell-${row}-${col}`}
                    className={`grid-cell ${
                      noteExists(col, row) ? 'note-active' : ''
                    } ${
                      selectedNote?.row === row && selectedNote?.col === col ? 'selected' : ''
                    }`}
                    onClick={() => handleNoteClick(col, row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNoteClick(col, row);
                      }
                    }}
                    aria-label={`Note at row ${row}, column ${col}${
                      noteExists(col, row) ? ', active' : ''
                    }`}
                    aria-pressed={noteExists(col, row)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="editor-stats" role="status">
        <p>Total notes: {chart.song.notes.length}</p>
        <p>BPM: {chart.song.bpm}</p>
        <p>Speed: {chart.song.speed}x</p>
      </div>
    </div>
  );
}

export default ChartEditor;