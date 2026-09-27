import { useRef, useState } from 'preact/hooks';

export function EditorShell({ editor, dbManager, projectManager }) {
    const shellRef = useRef(null);

    const [activeTab, setActiveTab] = useState('txt');
    const [activeSubTab, setActiveSubTab] = useState('ttlcrd');
    const [activeHeaderTab, setActiveHeaderTab] = useState('annotationh');
    const [activeRatio, setActiveRatio] = useState('16/9');

    const cls = (base, isActive) => `${base}${isActive ? ' active' : ''}`;

    const openProjects = () => {
        window.dispatchEvent(new CustomEvent('dart:show-projects'));
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        for (const file of files) {
            try {
                if (typeof editor.addMediaToLibrary === 'function') {
                    await editor.addMediaToLibrary(file);
                }
            } catch (err) {
                console.error('Upload failed for', file.name, err);
                editor.showStatus?.(`Failed to add ${file.name}`, 'error');
            }
        }
        editor.showStatus?.(`Added ${files.length} file(s)`, 'success');
        e.target.value = '';
    };

    return (
        <div class="container" ref={shellRef}>
            {/* Hidden element the editor needs */}
            <div id="statusMessage" class="status" style={{ display: 'none' }}></div>

            <header style={{ marginTop: '1em' }}>
                <h1 style={{ display: 'none' }}>DART Video Editor</h1>

                <div class="tabh-container">
                    {[
                        ['annotationh', 'File'],
                        ['libraryh', 'Library'],
                        ['hashh', 'Train'],
                        ['colabh', 'Colab Integration'],
                        ['exporth', 'Export']
                    ].map(([id, label]) => (
                        <div
                            key={id}
                            class={cls('tabh', activeHeaderTab === id)}
                            onClick={() => setActiveHeaderTab(id)}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            </header>

            <div class="main-layout" style={{ display: 'flex' }}>
                <div class="preview-panel">
                    {/* ====================== HEADER TAB: FILE ====================== */}
                    <div class={cls('tabh-content', activeHeaderTab === 'annotationh')} id="annotationh-tabh">
                        <div class="aspect-ratio-selector">
                            {['16/9', '1/1', '9/16', '4/5'].map(ratio => (
                                <button
                                    key={ratio}
                                    class={`ratio-btn ${activeRatio === ratio ? 'active' : ''}`}
                                    data-ratio={ratio}
                                    onClick={() => {
                                        setActiveRatio(ratio);
                                        const container = document.querySelector('.video-container');
                                        if (container) container.style.aspectRatio = ratio;
                                    }}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>

                        <div class="video-container">
                            <video id="videoPreview" muted playsinline></video>
                            <div id="previewOverlay" class="preview-overlay"></div>
                            <div id="loadingOverlay" class="loading-overlay" style={{ display: 'none' }}>
                                Loading Video...
                            </div>

                            <div class="video-controls">
                                <button class="buttont" id="playBtn" title="Play" aria-label="Play">▶</button>
                                <button class="buttont" id="pauseBtn" title="Pause" aria-label="Pause">⏸</button>
                                <button class="buttont" id="stopBtn" title="Stop" aria-label="Stop">⏹</button>
                                <input
                                    type="range"
                                    id="playheadSlider"
                                    min="0"
                                    max="100"
                                    value="0"
                                    class="video-scrubber"
                                    aria-label="Seek"
                                />
                            </div>
                        </div>

                        <div class="timeline-container">
                            <div class="timeline-header">
                                <div class="timeline-controls">
                                    <button id="zoomInBtn">+</button>
                                    <button id="zoomOutBtn">-</button>
                                    <input type="range" id="timelineZoom" min="1" max="100" value="10" style={{ width: '100px' }} />
                                    <span id="timeDisplay">00:00 / 00:00</span>
                                    <div class="form-group timeline-controls">
                                        <label>🎵 <span id="volumeValue">4%</span></label>
                                        <input type="range" id="masterVolume" min="0" max="100" value="4" />
                                    </div>
                                </div>
                            </div>

                            <div class="time-ruler" id="timeRuler">
                                <div class="time-marker" style={{ left: '100px' }}></div>
                            </div>

                            <div class="timeline">
                                <div class="playhead" id="playhead"></div>
                                <div class="snap-indicator" id="snapIndicator"></div>

                                <div class="track">
                                    <div class="track-label">Video Track</div>
                                    <div class="track-content" id="videoTrack"></div>
                                </div>
                                <div class="track">
                                    <div class="track-label">Image Track</div>
                                    <div class="track-content" id="imageTrack"></div>
                                </div>
                                <div class="track">
                                    <div class="track-label">Audio Track</div>
                                    <div class="track-content" id="audioTrack"></div>
                                </div>
                                <div class="track">
                                    <div class="track-label">Text Track</div>
                                    <div class="track-content" id="textTrack"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ====================== HEADER TAB: LIBRARY ====================== */}
                    <div class={cls('tabh-content', activeHeaderTab === 'libraryh')} id="libraryh-tabh">
                        <h2>Project Library</h2>
                        <div class="libraryh-controls">
                            <input type="text" id="libraryhSearch" placeholder="Search library..." />
                            <select id="libraryFilter">
                                <option value="all">All files</option>
                                <option value="images">Image Only</option>
                                <option value="videos">Video Only</option>
                                <option value="audio">Audio Only</option>
                            </select>
                            <button id="clearLibraryhBtn">Clear All</button>
                        </div>
                        <div
                            class="libraryh-grid"
                            id="mediaGrid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))',
                                gap: '10px',
                                marginTop: '15px',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                padding: '10px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '6px'
                            }}
                        ></div>
                    </div>

                    <div class={cls('tabh-content', activeHeaderTab === 'hashh')} id="hashh-tabh"></div>
                    <div class={cls('tabh-content', activeHeaderTab === 'colabh')} id="colabh-tabh" style={{ width: '50%' }}></div>
                    <div class={cls('tabh-content', activeHeaderTab === 'exporth')} id="exporth-tabh"></div>
                </div>

                {/* ====================== CONTROLS PANEL ====================== */}
                <div class="controls-panel active">

                    {/* ---------- PROJECT ---------- */}
                    <div class="control-section">
                        <h3>📁 Project</h3>

                        <div class="form-group">
                            <input
                                type="text"
                                id="projectName"
                                placeholder="Project name"
                                style={{ width: '100%', marginBottom: '8px' }}
                            />
                        </div>

                        <div class="btn-group" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            marginBottom: '8px'
                        }}>
                            <button onClick={() => {
                                const name = document.getElementById('projectName')?.value;
                                window.projectManager?.saveProject(name);
                            }}>💾 Save</button>
                            <button onClick={() => {
                                const name = prompt('Save as:');
                                if (name) window.projectManager?.saveAs(name);
                            }}>💾 Save As</button>
                        </div>

                        <div class="btn-group" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            marginBottom: '8px'
                        }}>
                            <button
                                id="loadProjectBtn"
                                onClick={openProjects}
                            >📂 Open</button>
                            <button
                                id="manageProjectsBtn"
                                onClick={openProjects}
                            >🗂️ Manage</button>
                        </div>

                        <div class="btn-group" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px'
                        }}>
                            <button onClick={() => window.projectManager?.newProject()}>
                                🆕 New
                            </button>
                            <button onClick={() => document.getElementById('mediaUpload')?.click()}>
                                📥 Import
                            </button>
                        </div>

                        <div class="btn-group" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '8px',
                            marginTop: '8px'
                        }}>
                            <button onClick={() => editor?.renderVideo?.()}>
                                🎬 Export Video
                            </button>
                        </div>

                        <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            textAlign: 'center',
                            padding: '6px',
                            background: 'var(--tertiary-bg)',
                            borderRadius: '4px',
                            marginTop: '8px'
                        }}>
                            <span id="projectStatus">Ready</span>
                          
                        </div>
                      <div style={{
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '6px',
    textAlign: 'center'
}}>
    <span id="localStorageInfo">Local media: —</span>
</div>
                    </div>

                    {/* ---------- PLAYBACK ---------- */}
                    <div class="control-section">
                        <h3>▶ Playback</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '8px'
                        }}>
                            <button onClick={() => editor?.play?.()}>▶ Play</button>
                            <button onClick={() => editor?.pause?.()}>⏸ Pause</button>
                            <button onClick={() => editor?.stop?.()}>⏹ Stop</button>
                        </div>
                    </div>

                    {/* ---------- TABS ---------- */}
                    <div class="tabr-container">
                        {[
                            ['txt', '✏️ Text'],
                            ['annotation', '⚙️'],
                            ['colab', '🎵'],
                            ['colab5', '🎬'],
                            ['export', '📁']
                        ].map(([id, label]) => (
                            <button
                                key={id}
                                class={cls('tabr', activeTab === id)}
                                onClick={() => setActiveTab(id)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ====================== TAB: TXT ====================== */}
                    <div class={cls('tabr-content', activeTab === 'txt')} id="txt-tab">
                        <div class="control-section">
                            <div class="tabt-container">
                                {[
                                    ['ttlcrd', '✏️'],
                                    ['annotationv', '⚙️'],
                                    ['colabv', '🎵'],
                                    ['colab5y', '🎬'],
                                    ['exportn', '📁']
                                ].map(([id, label]) => (
                                    <div
                                        key={id}
                                        class={cls('tabt', activeSubTab === id)}
                                        onClick={() => setActiveSubTab(id)}
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>

                            <div class={cls('tabt-content', activeSubTab === 'ttlcrd')} id="ttlcrd-tab">
                                <h3>Text Overlay</h3>
                                <div class="form-group">
                                    <label>Text Content</label>
                                    <input type="text" id="textContent" placeholder="Enter text" />
                                </div>
                                <div class="form-group">
                                    <label>Duration (seconds): <span id="textDurationValue">3s</span></label>
                                    <input
                                        type="range"
                                        id="textDuration"
                                        min="1"
                                        max="10"
                                        value="3"
                                        onInput={(e) => {
                                            const el = document.getElementById('textDurationValue');
                                            if (el) el.textContent = `${e.target.value}s`;
                                        }}
                                    />
                                </div>
                                <div class="form-group">
                                    <label>Title Card Style</label>
                                    <select id="titleCard">
                                        <option value="default">Default</option>
                                        <option value="minimal">Minimal</option>
                                        <option value="neon">Neon</option>
                                        <option value="vintage">Vintage</option>
                                        <option value="cinematic">Cinematic</option>
                                        <option value="gradient">Gradient</option>
                                    </select>
                                </div>
                                <button
                                    id="addTextBtn"
                                    onClick={() => editor.addTextClip?.()}
                                >
                                    Add Text to Timeline
                                </button>
                            </div>

                            <div class={cls('tabt-content', activeSubTab === 'annotationv')} id="annotationv-tab">
                                <h3>Media</h3>
                                <div class="media-gridt" id="mediaGridx2"></div>
                            </div>

                            <div class={cls('tabt-content', activeSubTab === 'colabv')} id="colabv-tab">
                                <h3>Tools</h3>
                            </div>

                            <div class={cls('tabt-content', activeSubTab === 'colab5y')} id="colab5y-tab">
                                <h3>Video</h3>
                            </div>

                            <div class={cls('tabt-content', activeSubTab === 'exportn')} id="exportn-tab">
                                <h3>Export</h3>
                            </div>
                        </div>
                    </div>

                    {/* ====================== TAB: ANNOTATION ====================== */}
                    <div class={cls('tabr-content', activeTab === 'annotation')} id="annotation-tab">
                        <div class="control-section">
                            <h3>📁 Add Media</h3>
                            <div class="form-group">
                                <label>Upload Media</label>
                                <input
                                    type="file"
                                    id="mediaUpload"
                                    accept="image/*,video/*,audio/*"
                                    multiple
                                    onChange={handleFileUpload}
                                />
                                <button
                                    id="importBtn"
                                    onClick={() => document.getElementById('mediaUpload')?.click()}
                                >
                                    Import Media
                                </button>
                            </div>
                            <div class="form-group">
                                <label>Default Clip Duration: <span id="durationValue">5s</span></label>
                                <input
                                    type="range"
                                    id="clipDuration"
                                    min="1"
                                    max="30"
                                    value="5"
                                    onInput={(e) => {
                                        const el = document.getElementById('durationValue');
                                        if (el) el.textContent = `${e.target.value}s`;
                                    }}
                                />
                            </div>
                            <div class="form-group">
                                <label>Snap to Grid</label>
                                <select id="snapGrid">
                                    <option value="0.5">0.5s</option>
                                    <option value="1" selected>1s</option>
                                    <option value="2">2s</option>
                                    <option value="0">Off</option>
                                </select>
                            </div>
                            <button
                                id="clearTimelineBtn"
                                onClick={() => editor.clearTimeline?.()}
                            >
                                Clear Timeline
                            </button>
                        </div>

                        <div class="control-section">
                            <h3>🎵 Audio Analysis</h3>
                            <button
                                id="analyzeAudioBtn"
                                style={{ width: '100%', marginBottom: '10px' }}
                                onClick={() => editor.analyzeAllAudio?.()}
                            >
                                Analyze Audio for Beats/BPM
                            </button>
                            <div class="beat-sync-toggle">
                                <input
                                    type="checkbox"
                                    id="beatSyncToggle"
                                    onChange={(e) => {
                                        editor.beatSyncEnabled = e.target.checked;
                                    }}
                                />
                                <label for="beatSyncToggle">Sync to Beats</label>
                            </div>
                            <div class="form-group">
                                <label>Beat Sensitivity: <span id="beatSensitivityValue">70%</span></label>
                                <input type="range" id="beatSensitivity" min="1" max="100" value="70" />
                            </div>
                            <div id="audioAnalysisInfo" class="audio-analysis-info">
                                No audio analyzed yet
                            </div>
                        </div>
                    </div>

                    {/* ====================== TAB: COLAB ====================== */}
                    <div class={cls('tabr-content', activeTab === 'colab')} id="colab-tab">
                        <div class="control-section">
                            <h3>🎬 Video Beat Sync</h3>
                            <button id="syncSelectedVideosBtn">Sync Selected</button>
                            <button id="syncAllVideosBtn">Sync All</button>
                            <button id="autoSyncVideosBtn">Auto Sync</button>
                            <button id="clearVideoSyncBtn">Clear Sync</button>
                            <div class="form-group">
                                <label>Beats per Video: <span id="beatsPerVideoValue">4</span></label>
                                <input type="range" id="beatsPerVideo" min="1" max="16" value="4" />
                            </div>
                            <select id="syncPrecision">
                                <option value="exact">Exact</option>
                                <option value="snap" selected>Snap to Beat</option>
                                <option value="relative">Relative</option>
                            </select>
                        </div>

                        <div class="control-section">
                            <h3>🖼️ Image Beat Sync</h3>
                            <button id="syncSelectedImagesBtn" style={{ width: '100%' }}>Sync Selected Images</button>
                            <div class="form-group">
                                <label>Beats per Image: <span id="beatsPerImageValue">4</span></label>
                                <input type="range" id="beatsPerImage" min="1" max="16" value="4" />
                            </div>
                            <div class="form-group">
                                <label>Image Transition</label>
                                <select id="imageTransition">
                                    <option value="cut">Cut</option>
                                    <option value="fade" selected>Fade</option>
                                    <option value="slide">Slide</option>
                                </select>
                            </div>
                        </div>

                        <div class="control-section">
                            <h3>🎵 Beat Visualization</h3>
                            <button id="toggleBeatVizBtn" style={{ width: '100%' }}>Show Beat Visualization</button>
                            <div class="beat-sync-toggle">
                                <input type="checkbox" id="showBeatNumbers" checked />
                                <label for="showBeatNumbers">Show Beat Numbers</label>
                            </div>
                            <div class="form-group">
                                <label>Viz Intensity: <span id="vizIntensityValue">50%</span></label>
                                <input type="range" id="vizIntensitySlider" min="10" max="100" value="50" />
                            </div>
                        </div>
                    </div>

                    {/* ====================== TAB: COLAB5 ====================== */}
                    <div class={cls('tabr-content', activeTab === 'colab5')} id="colab5-tab">
                        <div class="control-section">
                            <h3>⚙️ Timeline Settings</h3>
                            <div class="form-group">
                                <label>Zoom: <span id="zoomValue">10x</span></label>
                                <input type="range" id="timelineZoomSlider" min="1" max="10" value="10" />
                            </div>
                            <div class="form-group">
                                <label>Max Duration</label>
                                <input type="number" id="maxDuration" min="10" max="600" value="60" />
                            </div>
                            <div class="form-group">
                                <label>Auto-beat Snap</label>
                                <select id="autoSnapBeats">
                                    <option value="half">Half</option>
                                    <option value="off">Off</option>
                                    <option value="quarter">Quarter</option>
                                    <option value="whole">Whole</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ====================== TAB: EXPORT ====================== */}
                    <div class={cls('tabr-content', activeTab === 'export')} id="export-tab">
                        <div class="control-section">
                            <h3>📤 Export</h3>
                            <button
                                class="btn"
                                id="renderVideoBtn"
                                style={{ width: '100%' }}
                                onClick={() => editor?.renderVideo?.()}
                            >
                                🎬 Start Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="upload-section" style={{ display: 'none' }}>
                <h3>Media Library</h3>
                <div class="media-library" id="mediaGridx"></div>
            </div>

            <div id="statusMessagex" class="status"></div>
        </div>
    );
}