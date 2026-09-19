import React, { useRef } from 'react';

function AudioUploader({ onAudioUpload, audioFiles }) {
  const instInputRef = useRef(null);
  const voicesInputRef = useRef(null);

  const handleFileChange = (type, event) => {
    const file = event.target.files[0];
    if (file && file.type === 'audio/ogg') {
      onAudioUpload(type, file);
    } else {
      alert('Please upload a valid .ogg audio file');
    }
  };

  const handleInstClick = () => {
    instInputRef.current?.click();
  };

  const handleVoicesClick = () => {
    voicesInputRef.current?.click();
  };

  return (
    <div className="audio-uploader" role="region" aria-label="Audio file upload">
      <div className="audio-input-group">
        <label htmlFor="inst-upload">
          Instrumental Track (.ogg)
        </label>
        <button
          id="inst-upload-btn"
          onClick={handleInstClick}
          className="upload-button"
          aria-label="Upload instrumental audio file"
        >
          {audioFiles.inst ? `✓ ${audioFiles.inst.name}` : '📁 Choose File'}
        </button>
        <input
          ref={instInputRef}
          id="inst-upload"
          type="file"
          accept="audio/ogg"
          onChange={(e) => handleFileChange('inst', e)}
          style={{ display: 'none' }}
          aria-describedby="inst-help"
        />
        <span id="inst-help" className="help-text">
          Upload the instrumental/background music track
        </span>
      </div>

      <div className="audio-input-group">
        <label htmlFor="voices-upload">
          Voices Track (.ogg)
        </label>
        <button
          id="voices-upload-btn"
          onClick={handleVoicesClick}
          className="upload-button"
          aria-label="Upload voices audio file"
        >
          {audioFiles.voices ? `✓ ${audioFiles.voices.name}` : '📁 Choose File'}
        </button>
        <input
          ref={voicesInputRef}
          id="voices-upload"
          type="file"
          accept="audio/ogg"
          onChange={(e) => handleFileChange('voices', e)}
          style={{ display: 'none' }}
          aria-describedby="voices-help"
        />
        <span id="voices-help" className="help-text">
          Upload the voices/character vocals track
        </span>
      </div>

      {audioFiles.inst && audioFiles.voices && (
        <div className="audio-status" role="status" aria-live="polite">
          ✅ Both audio files uploaded and ready
        </div>
      )}
    </div>
  );
}

export default AudioUploader;