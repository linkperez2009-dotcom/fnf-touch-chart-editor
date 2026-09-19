import React, { useRef } from 'react';

function Toolbar({ onSaveChart, onLoadChart, isPlaying, onPlayStatusChange }) {
  const fileInputRef = useRef(null);

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const chart = JSON.parse(e.target.result);
          onLoadChart(chart);
          alert('Chart loaded successfully!');
        } catch (error) {
          alert('Error loading chart: Invalid JSON format');
          console.error('Chart loading error:', error);
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid .json chart file');
    }
  };

  const handleKeyDown = (e, callback) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      callback();
    } else if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      handleLoadClick();
    }
  };

  return (
    <nav className="toolbar" role="toolbar" aria-label="Chart editor controls">
      <div className="toolbar-group">
        <button
          onClick={onSaveChart}
          className="toolbar-button save-button"
          aria-label="Save chart as JSON file (Ctrl+S)"
          onKeyDown={(e) => handleKeyDown(e, onSaveChart)}
          title="Save chart - Ctrl+S"
        >
          💾 Save Chart
        </button>

        <button
          onClick={handleLoadClick}
          className="toolbar-button load-button"
          aria-label="Load chart from JSON file (Ctrl+O)"
          onKeyDown={(e) => handleKeyDown(e, handleLoadClick)}
          title="Load chart - Ctrl+O"
        >
          📂 Load Chart
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label="Chart file input"
        />
      </div>

      <div className="toolbar-group info-group">
        <span role="status" aria-live="polite" className="status-indicator">
          {isPlaying ? '🔴 Recording' : '⚫ Ready'}
        </span>
      </div>
    </nav>
  );
}

export default Toolbar;