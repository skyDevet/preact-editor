

export class VideoEditor {
    constructor() {
        this.trimStart = 0
        this.preloadVideo = null;
        this.currentVideo = null;
        this.timelineDuration = 60;
        this.maxDuration = 60;
        this.clips = [];
        this.isPlaying = false;
          this.videoEnding = false;
    this.lastVideoTime = 0;
        this.timelineZoom = 10;
        this.snapGrid = 1;
        this.defaultClipDuration = 5;
        this.currentTime = 0;
        this.animationFrame = null;
        this.draggingClip = null;
        this.draggingHandle = null;
        this.dragStartX = 0;
        this.originalClipData = null;
        this.trackContentLeft = 80;
        this.previousVideoClipId = null;
    this.isTransitioning = false;
    this.transitionTimeout = null;
        this.mediaLibrary = [];
        this.audioElements = [];
        this.videoBuffer = new Map();
        this.activeMedia = new Map();
        this.lastUpdateTime = 0;
        this.updateInterval = 100;
        this.videoFolder = './vid/';
        this.currentVideoClip = null;
        
        // Single video player for all playback
        this.mainVideoPlayer = null;
        this.videoSources = new Map();
        
        // Audio analysis properties
        this.audioContext = null;
        this.audioAnalysers = new Map();
        this.audioWaveforms = new Map();
        this.beatMarkers = [];
        this.bpm = 120;
        this.timeSignature = [4, 4];
        this.beatDetectionEnabled = false;
        this.lastBeatTime = -1;
        this.beatThreshold = 0.1;
        this.beatSensitivity = 70;
        
        // Image editor properties
        this.imageEditorActive = false;
        this.editingClip = null;
        this.canvas = null;
        this.ctx = null;
        this.originalImage = null;
        this.currentImage = null;
        this.imageScale = 1;
        this.imageRotation = 0;
        this.imageFlip = { x: 1, y: 1 };
        this.imageOffset = { x: 0, y: 0 };
        this.isCropping = false;
        this.cropStart = null;
        this.cropRect = null;
        this.cropHandles = [];
        
        // Beat sync properties
        this.imageClips = [];
        this.videoClips = [];
        this.currentImageIndex = 0;
        this.currentVideoIndex = 0;
        this.beatSyncEnabled = false;
        this.beatsPerImage = 4;
        this.beatsPerVideo = 4;
        
        // Beat visualization properties
        this.showBeatVisualization = false;
        this.vizIntensity = 0.5;
        this.showBeatNumbers = true;
        
        // Video sync properties
        this.videoSyncMode = 'cut'; // 'cut', 'transition', 'speed'
        this.syncPrecision = 'snap'; // 'exact', 'snap', 'relative'
        this.selectedClips = new Set();
        this.videoSyncData = new Map(); // Store sync data for each video
        // Title styles
this.titleStyles = {
    default: {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        fontFamily: 'Arial',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        padding: '10px 20px',
        borderRadius: '5px'
    }
};
this.currentStyleClip = null;
      //  this.init();
        
    }
    
    init() {
         this.cacheElements();
        this.setupEventListeners();
        this.setupTrimmerEventListeners();
        this.createTimeRuler();
        this.setupTimelineDrag();
        this.initAudioContext();
        this.setupImageEditor();
        this.setupVideoPlayer();
        this.setupClipContextMenu(); // ADD THIS LINE
        this.animate();
    }

  /**
 * Call AFTER Preact has mounted the DOM shell.
 * Runs cacheElements() then wires up all event listeners.
 */
start() {
    console.log('🎬 VideoEditor.start() — caching DOM + wiring listeners');
    this.cacheElements();
    this.setupEventListeners();
    this.setupTrimmerEventListeners?.();
    this.createTimeRuler?.();
    this.setupTimelineDrag?.();
    this.initAudioContext?.();
    this.setupImageEditor?.();
    this.setupVideoPlayer?.();
    this.setupClipContextMenu?.();
    this.animate?.();
    this.updateTimeRuler?.();
    this.updatePreview?.();
    console.log('✅ VideoEditor started');
}
  // --------------------------------------------------------
// Preact integration
// --------------------------------------------------------
setSupabase(client) {
    this.supabase = client;
}

subscribe(cb) {
    this._subscribers ||= new Set();
    this._subscribers.add(cb);
    return () => this._subscribers.delete(cb);
}

_notify() {
    this._subscribers?.forEach(cb => { try { cb(); } catch {} });
}

getSnapshot() {
    return {
        clipCount: this.clips.length,
        mediaCount: this.mediaLibrary.length,
        selectedCount: this.selectedClips.size,
        isPlaying: this.isPlaying
    };
}
    createTitleStyleModal() {
    if (document.getElementById('titleStyleModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'titleStyleModal';
    modal.className = 'image-editor-panel';
    modal.style.display = 'none';
    
    modal.innerHTML = `
        <div class="image-editor-content" style="max-width: 800px;">
            <div class="editor-header">
                <h3>🎨 Title Card Styles</h3>
                <button id="closeTitleStyleModal" style="background: var(--error-color);">✕ Close</button>
            </div>
            <div class="editor-body" style="flex-direction: column; padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
                    <div class="title-style-card" data-style="default" style="cursor: pointer; border: 2px solid transparent; border-radius: 8px; overflow: hidden; transition: all 0.2s;">
                        <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 30px; text-align: center;">
                            <div style="color: white; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Default</div>
                        </div>
                        <div style="background: var(--secondary-bg); padding: 10px; text-align: center;">Classic Gradient</div>
                    </div>
                    
                    <div class="title-style-card" data-style="minimal" style="cursor: pointer; border: 2px solid transparent; border-radius: 8px; overflow: hidden;">
                        <div style="background: #2c3e50; padding: 30px; text-align: center;">
                            <div style="color: #ecf0f1; font-size: 28px; font-weight: 300; letter-spacing: 2px;">Minimal</div>
                        </div>
                        <div style="background: var(--secondary-bg); padding: 10px; text-align: center;">Clean & Simple</div>
                    </div>
                    
                    <div class="title-style-card" data-style="neon" style="cursor: pointer; border: 2px solid transparent; border-radius: 8px; overflow: hidden;">
                        <div style="background: #0f0c29; padding: 30px; text-align: center;">
                            <div style="color: #fff; font-size: 28px; font-weight: bold; text-shadow: 0 0 10px #00fff9, 0 0 20px #00fff9, 0 0 30px #00fff9;">NEON</div>
                        </div>
                        <div style="background: var(--secondary-bg); padding: 10px; text-align: center;">Neon Glow</div>
                    </div>
                    
                    <div class="title-style-card" data-style="vintage" style="cursor: pointer; border: 2px solid transparent; border-radius: 8px; overflow: hidden;">
                        <div style="background: #d4a373; padding: 30px; text-align: center;">
                            <div style="color: #6b4f3f; font-size: 26px; font-family: 'Times New Roman', serif; text-shadow: 1px 1px 0 #e9c46a;">Vintage</div>
                        </div>
                        <div style="background: var(--secondary-bg); padding: 10px; text-align: center;">Retro Style</div>
                    </div>
                    
                    <div class="title-style-card" data-style="cinematic" style="cursor: pointer; border: 2px solid transparent; border-radius: 8px; overflow: hidden;">
                        <div style="background: #000; padding: 30px; text-align: center; position: relative;">
                            <div style="color: #fff; font-size: 28px; font-weight: bold; letter-spacing: 4px; text-transform: uppercase; border-bottom: 2px solid gold; display: inline-block;">CINEMA</div>
                        </div>
                        <div style="background: var(--secondary-bg); padding: 10px; text-align: center;">Letterbox Style</div>
                    </div>
                    
                    <div class="title-style-card" data-style="gradient" style="cursor: pointer; border: 2px solid transparent; border-radius: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); padding: 30px; text-align: center;">
                            <div style="color: white; font-size: 26px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">Gradient</div>
                        </div>
                        <div style="background: var(--secondary-bg); padding: 10px; text-align: center;">Color Flow</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="applyTitleStyleBtn" style="background: var(--success-color);">Apply to Selected</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const style = document.createElement('style');
    style.textContent = `
        .title-style-card:hover {
            border-color: var(--accent-color) !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .title-style-card.selected {
            border-color: #ffd700 !important;
        }
    `;
    document.head.appendChild(style);
    
    document.getElementById('closeTitleStyleModal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}
showTitleStylePicker(clip) {
    this.createTitleStyleModal();
    this.currentStyleClip = clip;
    
    const modal = document.getElementById('titleStyleModal');
    
    document.querySelectorAll('.title-style-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.style === (clip.titleStyle || 'default')) {
            card.classList.add('selected');
        }
    });
    
    document.querySelectorAll('.title-style-card').forEach(card => {
        const handler = (e) => {
            const style = card.dataset.style;
            document.querySelectorAll('.title-style-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            this.applyTitleStyleToClip(this.currentStyleClip, style);
        };
        card.removeEventListener('click', handler);
        card.addEventListener('click', handler);
    });
    
    document.getElementById('applyTitleStyleBtn').onclick = () => {
        modal.style.display = 'none';
        this.showStatus('Title style applied', 'success');
    };
    
    modal.style.display = 'flex';
}
async applyTitleStyleToClip(clip, styleName) {
    const styles = {
        default: {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            fontFamily: 'Arial',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            padding: '10px 20px',
            borderRadius: '5px'
        },
        minimal: {
            fontSize: '28px',
            color: '#ecf0f1',
            backgroundColor: 'transparent',
            fontFamily: 'Helvetica, sans-serif',
            textShadow: 'none',
            padding: '5px 15px',
            borderRadius: '0px',
            fontWeight: '300',
            letterSpacing: '2px'
        },
        neon: {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: 'transparent',
            fontFamily: 'Arial Black, sans-serif',
            textShadow: '0 0 10px #00fff9, 0 0 20px #00fff9, 0 0 30px #00fff9',
            padding: '10px 20px',
            borderRadius: '0px'
        },
        vintage: {
            fontSize: '26px',
            color: '#6b4f3f',
            backgroundColor: 'rgba(212, 163, 115, 0.3)',
            fontFamily: '"Times New Roman", serif',
            textShadow: '1px 1px 0 #e9c46a',
            padding: '10px 25px',
            borderRadius: '10px',
            border: '2px solid #d4a373'
        },
        cinematic: {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: 'transparent',
            fontFamily: 'Impact, sans-serif',
            textShadow: 'none',
            padding: '5px 0',
            borderRadius: '0px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            borderBottom: '2px solid gold'
        },
        gradient: {
            fontSize: '26px',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            fontFamily: 'Arial',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            padding: '12px 25px',
            borderRadius: '25px'
        }
    };
    
    clip.titleStyle = styleName;
    clip.style = styles[styleName] || styles.default;
    
    this.updatePreview();
    if (await this.autoSaveClipToDatabase) {
        await this.autoSaveClipToDatabase(clip);
    }
    
    console.log(`🎨 Applied ${styleName} style to text clip:`, clip);
}
deleteClip(clipId, skipSupabase = false) {
    const clipIndex = this.clips.findIndex(c => c.id == clipId);
    if (clipIndex === -1) return false;

    const clip = this.clips[clipIndex];

    // ---------------------------------------------------------
    // 1. Cancel any pending debounced autosave for this clip
    // ---------------------------------------------------------
    if (this._clipSaveTimers && this._clipSaveTimers.has(clipId)) {
        clearTimeout(this._clipSaveTimers.get(clipId));
        this._clipSaveTimers.delete(clipId);
    }
    if (this._pendingClipSaves && this._pendingClipSaves.has(clipId)) {
        this._pendingClipSaves.delete(clipId);
    }

    // ---------------------------------------------------------
    // 2. Close trimmer if this clip is being trimmed
    // ---------------------------------------------------------
    if (this.trimmingClip && this.trimmingClip.id == clipId) {
        if (typeof this.closeTrimmerModal === 'function') {
            this.closeTrimmerModal();
        }
        this.trimmingClip = null;
        this.currentTrimData = null;
    }

    // ---------------------------------------------------------
    // 3. Remove from DOM
    // ---------------------------------------------------------
    if (clip.element && clip.element.parentNode) {
        clip.element.remove();
    }

    // ---------------------------------------------------------
    // 4. Clean up audio element
    // ---------------------------------------------------------
    if (clip.audioElement) {
        try {
            clip.audioElement.pause();
            clip.audioElement.src = '';
            clip.audioElement.load();
        } catch (e) {
            console.warn('Audio cleanup warning:', e);
        }

        const audioIndex = this.audioElements.indexOf(clip.audioElement);
        if (audioIndex !== -1) {
            this.audioElements.splice(audioIndex, 1);
        }
        clip.audioElement = null;
    }

    // ---------------------------------------------------------
    // 5. Clean up video clip
    // ---------------------------------------------------------
    if (clip.type === 'video') {
        this.videoSources.delete(clip.id);

        const videoIndex = this.videoClips.findIndex(c => c.id == clipId);
        if (videoIndex !== -1) {
            this.videoClips.splice(videoIndex, 1);
        }

        if (this.currentVideoClip == clipId) {
            this.currentVideoClip = null;

            if (this.mainVideoPlayer) {
                try {
                    this.mainVideoPlayer.pause();
                    if (this.mainVideoPlayer.src === clip.url) {
                        this.mainVideoPlayer.removeAttribute('src');
                        this.mainVideoPlayer.load();
                    }
                    this.mainVideoPlayer.style.display = 'none';
                } catch (e) {
                    console.warn('Video cleanup warning:', e);
                }
            }
        }

        if (this.previousVideoClipId == clipId) {
            this.previousVideoClipId = null;
        }

        if (this.transitionTimeout && this.videoEnding) {
            clearTimeout(this.transitionTimeout);
            this.transitionTimeout = null;
            this.videoEnding = false;
            this.isTransitioning = false;
        }

        if (this.videoSyncData && this.videoSyncData.has(clip.id)) {
            this.videoSyncData.delete(clip.id);
        }
    }

    // ---------------------------------------------------------
    // 6. Clean up image clip
    // ---------------------------------------------------------
    if (clip.type === 'image') {
        const imageIndex = this.imageClips.findIndex(c => c.id == clipId);
        if (imageIndex !== -1) {
            this.imageClips.splice(imageIndex, 1);
        }
    }

    // ---------------------------------------------------------
    // 7. Revoke blob URLs to prevent memory leaks
    // ---------------------------------------------------------
    try {
        if (clip.blobUrl && clip.blobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(clip.blobUrl);
        }
        if (clip.url && clip.url.startsWith('blob:')) {
            URL.revokeObjectURL(clip.url);
        }
        if (clip.editedUrl && clip.editedUrl.startsWith('blob:')) {
            URL.revokeObjectURL(clip.editedUrl);
        }
        if (clip.trimmedBlob) {
            clip.trimmedBlob = null;
        }
    } catch (e) {
        console.warn('Blob URL cleanup warning:', e);
    }

    // ---------------------------------------------------------
    // 8. Remove from selection and main array
    // ---------------------------------------------------------
    this.selectedClips.delete(clipId);
    this.clips.splice(clipIndex, 1);

    // ---------------------------------------------------------
    // 9. Update UI
    // ---------------------------------------------------------
    this.updateTimeRuler();
    this.updatePreview();

    // ---------------------------------------------------------
    // 10. OPTIONAL: persist deletion to Supabase immediately
    //
    //     - skipSupabase = true  → caller is batching; do nothing
    //     - flag OFF             → defer to next full save
    //     - flag ON              → fire single delete request
    // ---------------------------------------------------------
    if (!skipSupabase &&
        this.deleteFromSupabaseImmediately &&
        window.dbManager?.currentProjectId &&
        window.dbManager?.client) {

        const projectId = window.dbManager.currentProjectId;
        const clipIdStr = String(clipId);
        const clipName = clip.name;

        window.dbManager.client
            .from('clips')
            .delete()
            .eq('project_id', projectId)
            .eq('clip_id', clipIdStr)
            .then(({ error }) => {
                if (error) {
                    console.warn('⚠️ Failed to delete clip from Supabase:', error);
                } else {
                    console.log('🗑️ Clip deleted from Supabase:', clipName);
                }
            });
    } else if (!skipSupabase && window.dbManager?.currentProjectId) {
        console.log('🗑️ Clip deleted locally (Supabase cleanup deferred to next save):', clip.name);
    }

    return true;
}
  
  deleteClipsByType(type) {
    const clipsOfType = this.clips.filter(clip => clip.type === type);
    if (clipsOfType.length === 0) {
        this.showStatus(`No ${type} clips in timeline`, 'info');
        return;
    }

    if (!confirm(`Delete all ${type} clips from timeline (${clipsOfType.length})?`)) {
        return;
    }

    const clipsToDelete = clipsOfType.map(clip => clip.id);

    // ---------------------------------------------------------
    // Delete each clip locally.
    // Pass `true` to skip the per-clip Supabase delete so we
    // can batch all the DB work into a single request below.
    // ---------------------------------------------------------
    clipsToDelete.forEach(clipId => {
        this.deleteClip(clipId, true);
    });

    // ---------------------------------------------------------
    // Batched Supabase delete (opt-in).
    //
    // Gated behind this.deleteFromSupabaseImmediately.
    // When OFF, the next full saveCurrentProject() will clean
    // up these rows via delete-all + re-insert.
    // ---------------------------------------------------------
    if (this.deleteFromSupabaseImmediately &&
        window.dbManager?.currentProjectId &&
        window.dbManager?.client &&
        clipsToDelete.length > 0) {

        const projectId = window.dbManager.currentProjectId;
        const idsAsStrings = clipsToDelete.map(id => String(id));

        window.dbManager.client
            .from('clips')
            .delete()
            .eq('project_id', projectId)
            .in('clip_id', idsAsStrings)
            .then(({ error }) => {
                if (error) {
                    console.warn('⚠️ Batch delete from Supabase failed:', error);
                } else {
                    console.log(`🗑️ Batch deleted ${idsAsStrings.length} clips from Supabase`);
                }
            });
    } else if (window.dbManager?.currentProjectId && clipsToDelete.length > 0) {
        console.log(`🗑️ ${clipsToDelete.length} ${type} clips deleted locally (Supabase cleanup deferred to next save)`);
    }

    // ---------------------------------------------------------
    // Update UI
    // ---------------------------------------------------------
    this.updateTimeRuler();
    this.updatePreview();

    this.showStatus(`Deleted all ${type} clips (${clipsOfType.length})`, 'success');
}
      deleteMediaFromLibrary(mediaId) {
        const mediaIndex = this.mediaLibrary.findIndex(m => m.id == mediaId);
        if (mediaIndex === -1) return;
        
        const media = this.mediaLibrary[mediaIndex];
        
        // Check if media is used in timeline
        const usedInTimeline = this.clips.some(clip => clip.mediaId == mediaId);
        
        if (usedInTimeline) {
            if (!confirm(`"${media.name}" is used in timeline. Delete anyway?`)) {
                return;
            }
            
            // Also delete all clips that use this media
            const clipsToDelete = this.clips.filter(clip => clip.mediaId == mediaId);
            clipsToDelete.forEach(clip => {
                this.deleteClip(clip.id);
            });
        } else {
            if (!confirm(`Delete "${media.name}" from media library?`)) {
                return;
            }
        }
        
        // Remove from media grid
        const mediaItem = this.mediaGrid.querySelector(`[data-id="${mediaId}"]`);
        if (mediaItem) {
            mediaItem.remove();
        }
        
        // Clean up blob URLs
        if (media.blobUrl) {
            URL.revokeObjectURL(media.blobUrl);
        }
        if (media.url && media.url.startsWith('blob:')) {
            URL.revokeObjectURL(media.url);
        }
        
        // Remove from media library
        this.mediaLibrary.splice(mediaIndex, 1);
        
        this.showStatus(`Deleted "${media.name}" from library`, 'success');
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioContext.suspend();
            console.log("Audio Context initialized");
        } catch (e) {
            console.error("Web Audio API not supported:", e);
        }
    }
    
    setupVideoPlayer() {
        // Create a single video element for all playback
        this.mainVideoPlayer = document.createElement('video');
        this.mainVideoPlayer.id = 'mainVideoPlayer';
        this.mainVideoPlayer.muted = true;
        this.mainVideoPlayer.setAttribute('playsinline', '');
        this.mainVideoPlayer.style.position = 'absolute';
        this.mainVideoPlayer.style.top = '0';
        this.mainVideoPlayer.style.left = '0';
        this.mainVideoPlayer.style.width = '100%';
        this.mainVideoPlayer.style.height = '100%';
        this.mainVideoPlayer.style.objectFit = 'contain';
        this.mainVideoPlayer.style.display = 'none';
        this.mainVideoPlayer.preload = 'auto';
        
        this.videoContainer.appendChild(this.mainVideoPlayer);
        
        // Add event listeners for smooth playback
        this.mainVideoPlayer.addEventListener('timeupdate', () => this.handleVideoTimeUpdate());
        this.mainVideoPlayer.addEventListener('ended', () => this.handleVideoEnded());
        this.mainVideoPlayer.addEventListener('error', (e) => {
            console.error('Video playback error:', e);
            this.showStatus('Video playback error', 'error');
        });
    }
    
handleVideoTimeUpdate() {
    if (!this.isPlaying || !this.currentVideoClip || this.isTransitioning) return;
    
    const activeVideoClip = this.clips.find(clip => 
        clip.id === this.currentVideoClip
    );
    
    if (!activeVideoClip || !this.mainVideoPlayer) return;
    
    const videoTime = this.mainVideoPlayer.currentTime;
    
    // CRITICAL: Clamp video time to prevent going beyond clip
    const clampedVideoTime = Math.min(videoTime, activeVideoClip.duration);
    
    // Calculate expected timeline time
    const expectedTime = activeVideoClip.startTime + clampedVideoTime;
    
    // Only update if making forward progress (prevent loops)
    if (expectedTime > this.currentTime) {
        this.currentTime = expectedTime;
        
        // Update UI
        const percentage = (this.currentTime / this.timelineDuration) * 100;
        this.playheadSlider.value = percentage;
        this.updatePlayhead();
    }
    
    // Check if video is ending
    const timeRemaining = activeVideoClip.duration - videoTime;
    const isEnding = timeRemaining < 0.5; // 500ms before end
    
    if (isEnding && !this.videoEnding) {
        this.videoEnding = true;
        this.prepareForNextVideo(activeVideoClip);
    }
}
prepareForNextVideo(currentClip) {
    // Get all video clips sorted
    const videoClips = this.clips
        .filter(clip => clip.type === 'video')
        .sort((a, b) => a.startTime - b.startTime);
    
    const currentIndex = videoClips.findIndex(clip => clip.id === currentClip.id);
    
    // If this is the last video, just let it finish
    if (currentIndex === videoClips.length - 1) {
        // Last video - don't do anything, let it finish naturally
        return;
    }
    
    // Get next video
    const nextClip = videoClips[currentIndex + 1];
    
    // Calculate when to transition
    const transitionTime = currentClip.startTime + currentClip.duration;
    const timeUntilTransition = transitionTime - this.currentTime;
    
    if (timeUntilTransition <= 0.5) { // 500ms before end
        // Set up transition
        this.scheduleVideoTransition(currentClip, nextClip);
    }
}

scheduleVideoTransition(currentClip, nextClip) {
    if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
    }
    
    // Calculate exactly when to transition (at the end of current clip)
    const transitionDelay = (currentClip.startTime + currentClip.duration) - this.currentTime;
    
    this.transitionTimeout = setTimeout(() => {
        // Move to start of next clip
        this.currentTime = nextClip.startTime;
        
        // Update UI
        const percentage = (this.currentTime / this.timelineDuration) * 100;
        this.playheadSlider.value = percentage;
        this.updatePlayhead();
        
        // Update preview (will trigger video switch)
        this.updatePreview();
        
        this.videoEnding = false;
        this.transitionTimeout = null;
    }, Math.max(0, transitionDelay * 1000)); // Convert to milliseconds
}
  // Render/Export
            renderVideo() {
                this.showStatus('Starting video render...');
                // Show render progress modal
                this.showRenderModal();
            }
                     showRenderModal() {
                // Create render modal
                const modal = document.createElement('div');
                modal.className = 'image-editor-panelm';
                modal.innerHTML = `
                    <div class="image-editor-content" style="max-width: 500px;">
                        <div class="editor-header">
                            <h3>🎬 Rendering Video</h3>
                            <button class="close-render-modal" style="background: var(--error-color);">Cancel</button>
                        </div>
                        <div class="editor-body" style="flex-direction: column; padding: 20px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                                <h4>Rendering in progress...</h4>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Progress</label>
                                <div style="background: var(--tertiary-bg); height: 20px; border-radius: 10px; overflow: hidden;">
                                    <div id="renderProgressBar" style="background: var(--accent-color); height: 100%; width: 0%; transition: width 0.3s;"></div>
                                </div>
                                <div style="text-align: center; margin-top: 10px; font-size: 12px;">
                                    <span id="renderProgressText">0%</span>
                                </div>
                            </div>
                            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: var(--text-secondary);">
                                Estimated time remaining: <span id="renderTimeRemaining">--:--</span>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Close button
                modal.querySelector('.close-render-modal').addEventListener('click', () => {
                    modal.remove();
                    this.showStatus('Render cancelled');
                });
                
                // Simulate render progress
                this.simulateRenderProgress(modal);
            }
            
            simulateRenderProgress(modal) {
                let progress = 0;
                const progressBar = modal.querySelector('#renderProgressBar');
                const progressText = modal.querySelector('#renderProgressText');
                const timeRemaining = modal.querySelector('#renderTimeRemaining');
                
                const interval = setInterval(() => {
                    progress += Math.random() * 5;
                    if (progress > 100) {
                        progress = 100;
                        clearInterval(interval);
                        
                        // Show completion
                        setTimeout(() => {
                            modal.querySelector('h4').textContent = 'Render Complete!';
                            modal.querySelector('.close-render-modal').textContent = 'Close';
                            modal.querySelector('.close-render-modal').style.backgroundColor = 'var(--success-color)';
                            progressText.textContent = '100% - Complete';
                            timeRemaining.textContent = '00:00';
                            this.showStatus('Video render complete!');
                        }, 500);
                    }
                    
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `${Math.round(progress)}%`;
                    
                    // Calculate fake remaining time
                    const remaining = Math.round((100 - progress) / 5);
                    timeRemaining.textContent = `${remaining}s`;
                    
                }, 500);
            }
handleVideoEnd(activeVideoClip) {
    // Prevent multiple end handlers
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    // Get all video clips sorted by start time
    const videoClips = this.clips
        .filter(clip => clip.type === 'video')
        .sort((a, b) => a.startTime - b.startTime);
    
    const currentIndex = videoClips.findIndex(clip => clip.id === activeVideoClip.id);
    
    // Check if there's a next video
    if (currentIndex < videoClips.length - 1) {
        const nextClip = videoClips[currentIndex + 1];
        
        // Calculate gap between clips
        const gap = nextClip.startTime - (activeVideoClip.startTime + activeVideoClip.duration);
        
        if (gap > 0.1) {
            // There's a gap between clips
            // Move to the gap and pause video
            this.currentTime = activeVideoClip.startTime + activeVideoClip.duration;
            
            // Update UI
            const percentage = (this.currentTime / this.timelineDuration) * 100;
            this.playheadSlider.value = percentage;
            this.updatePlayhead();
            
            // Hide video player
            this.hideVideoPlayer();
            this.previousVideoClipId = this.currentVideoClip;
            this.currentVideoClip = null;
            
            // Update preview
            this.updatePreview();
        } else {
            // No gap or very small gap, transition to next video
            this.currentTime = nextClip.startTime;
            
            // Update UI
            const percentage = (this.currentTime / this.timelineDuration) * 100;
            this.playheadSlider.value = percentage;
            this.updatePlayhead();
            
            // Transition to next video
            this.previousVideoClipId = this.currentVideoClip;
            this.currentVideoClip = nextClip.id;
            this.updatePreview();
        }
    } else {
        // This is the LAST video in the timeline
        // Just pause at the end, don't loop
        if (this.mainVideoPlayer && !this.mainVideoPlayer.paused) {
            this.mainVideoPlayer.pause();
        }
        
        // Stay at the end of the video
        this.currentTime = activeVideoClip.startTime + activeVideoClip.duration;
        
        // Update UI
        const percentage = (this.currentTime / this.timelineDuration) * 100;
        this.playheadSlider.value = percentage;
        this.updatePlayhead();
        
        // Keep video showing but paused
        this.currentVideoClip = activeVideoClip.id;
    }
    
    this.isTransitioning = false;
}
handleVideoEnd() {
 const activeVideoClip = this.findActiveVideoClip(this.currentTime);
    if (!activeVideoClip) return;
    
    // Find the next clip (could be video, image, or nothing)
    const nextClipStart = activeVideoClip.startTime + activeVideoClip.duration;
    
    // Pause current video
    if (this.mainVideoPlayer && !this.mainVideoPlayer.paused) {
        this.mainVideoPlayer.pause();
    }
    
    // Move to next position
    this.isTransitioning = true;
    this.currentTime = nextClipStart;
    
    // Update UI immediately
    const percentage = (this.currentTime / this.timelineDuration) * 100;
    this.playheadSlider.value = percentage;
    this.updatePlayhead();
    
    // Clear current video clip
    this.previousVideoClipId = this.currentVideoClip;
    this.currentVideoClip = null;
    
    // Update preview to show new content
    this.updatePreview();
    
    // If still playing and we have a video at the new position, it will auto-play
    this.isTransitioning = false;
}

handleVideoEnded() {
    console.log('Video ended, hiding player');
    
    // Hide the video player
    if (this.mainVideoPlayer) {
        this.mainVideoPlayer.style.display = 'none';
    }
    this.currentVideoClip = null;
    this.updatePreview();
}
    scheduleTransition(nextTime) {
    // Clear any existing transition
    if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
    }
    
    // Schedule transition 100ms before the clip actually ends
    this.transitionTimeout = setTimeout(() => {
        if (this.isPlaying) {
            this.jumpToTime(nextTime);
        }
        this.isTransitioning = false;
    }, 100);
    
    this.isTransitioning = true;
}
    cacheElements() {
         this.renderBtn = document.getElementById('renderBtn');
        this.videoPreview = document.getElementById('videoPreview');
        this.playhead = document.getElementById('playhead');
        this.snapIndicator = document.getElementById('snapIndicator');
        this.previewOverlay = document.getElementById('previewOverlay');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.timeRuler = document.getElementById('timeRuler');
        this.playheadSlider = document.getElementById('playheadSlider');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.videoTrack = document.getElementById('videoTrack');
        this.imageTrack = document.getElementById('imageTrack');
        this.audioTrack = document.getElementById('audioTrack');
        this.textTrack = document.getElementById('textTrack');
        
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.mediaUpload = document.getElementById('mediaUpload');
        this.clipDuration = document.getElementById('clipDuration');
        this.durationValue = document.getElementById('durationValue');
        this.textContent = document.getElementById('textContent');
        this.textDuration = document.getElementById('textDuration');
        this.textDurationValue = document.getElementById('textDurationValue');
        this.addTextBtn = document.getElementById('addTextBtn');
        this.snapGridSelect = document.getElementById('snapGrid');
        this.timelineZoomSlider = document.getElementById('timelineZoomSlider');
        this.timelineZoomInput = document.getElementById('timelineZoom');
        this.zoomValue = document.getElementById('zoomValue');
        this.clearTimelineBtn = document.getElementById('clearTimelineBtn');
        this.mediaGrid = document.getElementById('mediaGrid');
        this.statusMessage = document.getElementById('statusMessage');
        this.masterVolume = document.getElementById('masterVolume');
        this.volumeValue = document.getElementById('volumeValue');
        this.maxDurationInput = document.getElementById('maxDuration');
        
        this.ratioBtns = document.querySelectorAll('.ratio-btn');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        
        this.videoContainer = document.querySelector('.video-container');
        
        // Audio analysis elements
        this.analyzeAudioBtn = document.getElementById('analyzeAudioBtn');
        this.beatSyncToggle = document.getElementById('beatSyncToggle');
        this.audioAnalysisInfo = document.getElementById('audioAnalysisInfo');
        this.beatSensitivitySlider = document.getElementById('beatSensitivity');
        this.beatSensitivityValue = document.getElementById('beatSensitivityValue');
        this.autoSnapBeats = document.getElementById('autoSnapBeats');
        
        // Video sync elements
        this.syncSelectedVideosBtn = document.getElementById('syncSelectedVideosBtn');
        this.syncAllVideosBtn = document.getElementById('syncAllVideosBtn');
        this.autoSyncVideosBtn = document.getElementById('autoSyncVideosBtn');
        this.clearVideoSyncBtn = document.getElementById('clearVideoSyncBtn');
        this.beatsPerVideoSlider = document.getElementById('beatsPerVideo');
        this.beatsPerVideoValue = document.getElementById('beatsPerVideoValue');
        this.syncModeBtns = document.querySelectorAll('.sync-mode-btn');
        this.syncPrecisionSelect = document.getElementById('syncPrecision');
        
        // Image sync elements
        this.syncSelectedImagesBtn = document.getElementById('syncSelectedImagesBtn');
        this.beatsPerImageSlider = document.getElementById('beatsPerImage');
        this.beatsPerImageValue = document.getElementById('beatsPerImageValue');
        this.imageTransitionSelect = document.getElementById('imageTransition');
        
        // Beat visualization elements
        this.toggleBeatVizBtn = document.getElementById('toggleBeatVizBtn');
        this.showBeatNumbersCheckbox = document.getElementById('showBeatNumbers');
        this.vizIntensitySlider = document.getElementById('vizIntensitySlider');
        this.vizIntensityValue = document.getElementById('vizIntensityValue');
        
        // Image editor elements
        this.imageEditorPanel = document.getElementById('imageEditorPanel');
        this.editorCanvas = document.getElementById('editorCanvas');
        this.editorTitle = document.getElementById('editorTitle');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.applyEditBtn = document.getElementById('applyEditBtn');
        this.editorTabs = document.querySelectorAll('.editor-tab');
        this.tabContents = document.querySelectorAll('.editor-tab-content');
        
        // Canvas controls
        this.zoomInCanvasBtn = document.getElementById('zoomInCanvasBtn');
        this.zoomOutCanvasBtn = document.getElementById('zoomOutCanvasBtn');
        this.resetZoomBtn = document.getElementById('resetZoomBtn');
        this.resetTransformBtn = document.getElementById('resetTransformBtn');
        this.rotateLeftBtn = document.getElementById('rotateLeftBtn');
        this.rotateRightBtn = document.getElementById('rotateRightBtn');
        this.flipHorizontalBtn = document.getElementById('flipHorizontalBtn');
        this.flipVerticalBtn = document.getElementById('flipVerticalBtn');
        
        // Crop tab
        this.cropAspect = document.getElementById('cropAspect');
        this.cropCenterBtn = document.getElementById('cropCenterBtn');
        this.cropResetBtn = document.getElementById('cropResetBtn');
        this.applyCropBtn = document.getElementById('applyCropBtn');
        
        // Enhance tab
        this.brightnessSlider = document.getElementById('brightnessSlider');
        this.contrastSlider = document.getElementById('contrastSlider');
        this.saturationSlider = document.getElementById('saturationSlider');
        this.sharpnessSlider = document.getElementById('sharpnessSlider');
        this.presetBtns = document.querySelectorAll('.preset-btn');
        
        // Remove BG tab
        this.bgRemoveMethod = document.getElementById('bgRemoveMethod');
        this.thresholdControls = document.getElementById('thresholdControls');
        this.thresholdSlider = document.getElementById('thresholdSlider');
        this.chromaControls = document.getElementById('chromaControls');
        this.toleranceSlider = document.getElementById('toleranceSlider');
        this.colorSwatches = document.querySelectorAll('.color-swatch');
        this.newBackground = document.getElementById('newBackground');
        this.applyBgRemoveBtn = document.getElementById('applyBgRemoveBtn');
        this.bgPreviewCanvas = document.getElementById('bgPreviewCanvas');
        
        // Adjust tab
        this.rotationSlider = document.getElementById('rotationSlider');
        this.scaleSlider = document.getElementById('scaleSlider');
        this.opacitySlider = document.getElementById('opacitySlider');
        this.centerBtn = document.getElementById('centerBtn');
        this.topLeftBtn = document.getElementById('topLeftBtn');
        this.topRightBtn = document.getElementById('topRightBtn');
        this.bottomLeftBtn = document.getElementById('bottomLeftBtn');
        this.bottomRightBtn = document.getElementById('bottomRightBtn');
    }
   
    
    setupEventListeners() {
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.renderBtn?.addEventListener('click', () => this.renderVideo());
        this.playheadSlider.addEventListener('input', (e) => {
            const percentage = parseInt(e.target.value);
            const time = (percentage / 100) * this.timelineDuration;
            this.jumpToTime(time);
        });
        
        this.mediaUpload.addEventListener('change', (e) => this.handleMediaUpload(e));
        
       // In setupEventListeners() method
this.clipDuration.addEventListener('input', () => {
    const newDuration = parseInt(this.clipDuration.value);
    this.defaultClipDuration = newDuration;
    this.durationValue.textContent = `${newDuration}s`;
    
    // Update ALL selected clips if any are selected
    if (this.selectedClips.size > 0) {
        this.selectedClips.forEach(clipId => {
            const clip = this.clips.find(c => c.id == clipId);
            if (clip && (clip.type === 'image' || clip.type === 'video')) {
                clip.duration = newDuration;
                this.updateClipElement(clip);
            }
        });
    } else if (this.draggingClip && this.draggingHandle) {
        // Fallback to the old behavior if dragging
        const clipId = this.draggingClip.dataset.clipId;
        const clip = this.clips.find(c => c.id == clipId);
        if (clip && clip.type === 'image') {
            clip.duration = newDuration;
            this.updateClipElement(clip);
        }
    }
    
    // Also update media library for future clips
    this.updateMediaLibraryDurations(newDuration);
});
        this.textDuration.addEventListener('input', () => {
            this.textDurationValue.textContent = `${this.textDuration.value}s`;
        });
        
        this.addTextBtn.addEventListener('click', () => this.addTextClip());
        this.snapGridSelect.addEventListener('change', () => {
            this.snapGrid = parseFloat(this.snapGridSelect.value);
        });
        
        this.timelineZoomSlider.addEventListener('input', () => {
            this.timelineZoom = parseInt(this.timelineZoomSlider.value);
            this.timelineZoomInput.value = this.timelineZoom;
            this.zoomValue.textContent = `${this.timelineZoom}x (${this.timelineZoom * 10}%)`;
            this.updateTimeRuler();
            this.updateClipsPosition();
        });
        
        this.timelineZoomInput.addEventListener('input', () => {
            this.timelineZoom = parseInt(this.timelineZoomInput.value);
            this.timelineZoomSlider.value = this.timelineZoom;
            this.zoomValue.textContent = `${this.timelineZoom}x (${this.timelineZoom * 10}%)`;
            this.updateTimeRuler();
            this.updateClipsPosition();
        });
        
        this.clearTimelineBtn.addEventListener('click', () => this.clearTimeline());
        
        this.masterVolume.addEventListener('input', () => {
            const volume = this.masterVolume.value / 100;
            this.volumeValue.textContent = `${this.masterVolume.value}%`;
            this.audioElements.forEach(audio => {
                audio.volume = volume;
            });
        });
        
        this.maxDurationInput.addEventListener('change', () => {
            this.maxDuration = parseInt(this.maxDurationInput.value);
            if (this.timelineDuration > this.maxDuration) {
                this.timelineDuration = this.maxDuration;
                this.updateTimeRuler();
            }
        });
        
        this.zoomInBtn.addEventListener('click', () => {
            this.timelineZoom = Math.min(10, this.timelineZoom + 1);
            this.timelineZoomSlider.value = this.timelineZoom;
            this.timelineZoomInput.value = this.timelineZoom;
            this.zoomValue.textContent = `${this.timelineZoom}x (${this.timelineZoom * 10}%)`;
            this.updateTimeRuler();
            this.updateClipsPosition();
        });
        
        this.zoomOutBtn.addEventListener('click', () => {
            this.timelineZoom = Math.max(1, this.timelineZoom - 1);
            this.timelineZoomSlider.value = this.timelineZoom;
            this.timelineZoomInput.value = this.timelineZoom;
            this.zoomValue.textContent = `${this.timelineZoom}x (${this.timelineZoom * 10}%)`;
            this.updateTimeRuler();
            this.updateClipsPosition();
        });
        
        this.ratioBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.ratioBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const ratio = e.target.dataset.ratio;
                document.querySelector('.video-container').style.aspectRatio = ratio;
            });
        });
        
        // Audio analysis listeners
        this.analyzeAudioBtn.addEventListener('click', () => this.analyzeAllAudio());
        this.beatSyncToggle.addEventListener('change', (e) => {
            this.beatSyncEnabled = e.target.checked;
            this.showStatus(`Beat sync ${this.beatSyncEnabled ? 'enabled' : 'disabled'}`, 'info');
        });
        
        this.beatSensitivitySlider.addEventListener('input', () => {
            this.beatSensitivity = this.beatSensitivitySlider.value;
            this.beatSensitivityValue.textContent = `${this.beatSensitivity}%`;
            this.beatThreshold = (100 - this.beatSensitivity) / 100;
        });
        
        this.autoSnapBeats.addEventListener('change', (e) => {
            this.applyBeatSnapping(e.target.value);
        });
        
        // Video sync listeners
        this.syncSelectedVideosBtn.addEventListener('click', () => this.syncSelectedVideos());
        this.syncAllVideosBtn.addEventListener('click', () => this.syncAllVideos());
        this.autoSyncVideosBtn.addEventListener('click', () => this.autoSyncVideos());
        this.clearVideoSyncBtn.addEventListener('click', () => this.clearVideoSync());
        
        this.beatsPerVideoSlider.addEventListener('input', () => {
            this.beatsPerVideo = parseInt(this.beatsPerVideoSlider.value);
            this.beatsPerVideoValue.textContent = this.beatsPerVideo;
        });
        
        this.syncModeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.syncModeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.videoSyncMode = e.target.dataset.mode;
                this.showStatus(`Video sync mode: ${this.videoSyncMode}`, 'info');
            });
        });
        
        this.syncPrecisionSelect.addEventListener('change', (e) => {
            this.syncPrecision = e.target.value;
        });
        
        // Image sync listeners
        this.syncSelectedImagesBtn.addEventListener('click', () => this.syncSelectedImages());
        
        this.beatsPerImageSlider.addEventListener('input', () => {
            this.beatsPerImage = parseInt(this.beatsPerImageSlider.value);
            this.beatsPerImageValue.textContent = this.beatsPerImage;
        });
        
        // Beat visualization listeners
        this.toggleBeatVizBtn.addEventListener('click', () => this.toggleBeatVisualization());
        this.showBeatNumbersCheckbox.addEventListener('change', (e) => this.toggleBeatNumbers(e.target.checked));
        this.vizIntensitySlider.addEventListener('input', (e) => this.updateVizIntensity(e.target.value));
        
        // Image editor listeners
        this.cancelEditBtn.addEventListener('click', () => this.closeImageEditor());
        this.applyEditBtn.addEventListener('click', () => this.applyImageEdits());
        
        this.editorTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchEditorTab(tabName);
            });
        });
        
        // Canvas controls
        this.zoomInCanvasBtn.addEventListener('click', () => this.canvasZoomIn());
        this.zoomOutCanvasBtn.addEventListener('click', () => this.canvasZoomOut());
        this.resetZoomBtn.addEventListener('click', () => this.resetCanvasZoom());
        this.resetTransformBtn.addEventListener('click', () => this.resetCanvasTransform());
        this.rotateLeftBtn.addEventListener('click', () => this.rotateCanvas(-90));
        this.rotateRightBtn.addEventListener('click', () => this.rotateCanvas(90));
        this.flipHorizontalBtn.addEventListener('click', () => this.flipCanvasHorizontal());
        this.flipVerticalBtn.addEventListener('click', () => this.flipCanvasVertical());
        
        // Crop controls
        this.cropAspect.addEventListener('change', (e) => this.updateCropAspect(e.target.value));
        this.cropCenterBtn.addEventListener('click', () => this.centerCrop());
        this.cropResetBtn.addEventListener('click', () => this.resetCrop());
        this.applyCropBtn.addEventListener('click', () => this.applyCrop());
        
        // Enhance controls
        this.brightnessSlider.addEventListener('input', (e) => this.applyBrightness(e.target.value));
        this.contrastSlider.addEventListener('input', (e) => this.applyContrast(e.target.value));
        this.saturationSlider.addEventListener('input', (e) => this.applySaturation(e.target.value));
        this.sharpnessSlider.addEventListener('input', (e) => this.applySharpness(e.target.value));
        
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.applyPreset(preset);
            });
        });
        
        // Remove BG controls
        this.bgRemoveMethod.addEventListener('change', (e) => this.toggleBgMethod(e.target.value));
        this.thresholdSlider.addEventListener('input', (e) => this.previewThreshold(e.target.value));
        this.toleranceSlider.addEventListener('input', (e) => this.previewChroma(e.target.value));
        this.colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                this.colorSwatches.forEach(s => s.classList.remove('active'));
                e.target.classList.add('active');
                this.previewChroma();
            });
        });
        this.applyBgRemoveBtn.addEventListener('click', () => this.applyBackgroundRemoval());
        
        // Adjust controls
        this.rotationSlider.addEventListener('input', (e) => this.applyRotation(e.target.value));
        this.scaleSlider.addEventListener('input', (e) => this.applyScale(e.target.value));
        this.opacitySlider.addEventListener('input', (e) => this.applyOpacity(e.target.value));
        this.centerBtn.addEventListener('click', () => this.centerImage());
        this.topLeftBtn.addEventListener('click', () => this.positionImage('top-left'));
        this.topRightBtn.addEventListener('click', () => this.positionImage('top-right'));
        this.bottomLeftBtn.addEventListener('click', () => this.positionImage('bottom-left'));
        this.bottomRightBtn.addEventListener('click', () => this.positionImage('bottom-right'));
        
        // Resume audio context on user interaction
        document.addEventListener('click', () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log("Audio Context resumed");
                });
            }
        }, { once: true });
    }
    
    setupTimelineDrag() {
        document.addEventListener('mousemove', (e) => this.handleTimelineMouseMove(e));
        document.addEventListener('mouseup', () => this.handleTimelineMouseUp());
    }
    
    setupImageEditor() {
        this.canvas = this.editorCanvas;
        this.ctx = this.canvas.getContext('2d');
        
        // Setup canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleCanvasMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
    }
    
    async handleMediaUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        
        for (const file of files) {
            await this.addMediaToLibrary(file);
        }
        
        this.showStatus(`Added ${files.length} file(s) to library`, 'success');
        event.target.value = ''; // Reset file input
    }
    async addMediaToLibrary(file) {
    const type = file.type.split('/')[0];
    const fileName = file.name;
    
    let mediaUrl = '';
    let thumbnailUrl = '';
    let duration = this.defaultClipDuration; // This now uses the updated value
    
    if (type === 'video') {
        mediaUrl = URL.createObjectURL(file);
        
        try {
            this.loadingOverlay.style.display = 'flex';
            thumbnailUrl = await this.extractVideoThumbnail(file);
            duration = await this.getVideoDurationFromFile(file);
        } catch (error) {
            console.log('Could not extract thumbnail or duration:', error);
            thumbnailUrl = '';
            duration = this.defaultClipDuration; // Fallback to current default
        } finally {
            this.loadingOverlay.style.display = 'none';
        }
        
    } else if (type === 'image') {
        mediaUrl = await this.fileToDataURL(file);
        thumbnailUrl = mediaUrl;
        // Images use the defaultClipDuration from the slider
        duration = this.defaultClipDuration;
        
    } else if (type === 'audio') {
        mediaUrl = URL.createObjectURL(file);
        
        try {
            duration = await this.getAudioDurationFromFile(file);
        } catch (error) {
            duration = this.defaultClipDuration; // Fallback to current default
        }
    }
    
    const mediaItem = {
        id: Date.now() + Math.random(),
        name: fileName,
        type: type,
        url: mediaUrl,
        thumbnail: thumbnailUrl,
        duration: duration,
        file: file,
        isLocalFile: false,
        blobUrl: type !== 'image' ? mediaUrl : null
    };

    // ---- ADDITION: mirror blob into IndexedDB for reload safety ----
    if (file && window.blobStore) {
        const blobKey = `blob_${mediaItem.id}`;
        mediaItem.blobKey = blobKey;
        try {
            await window.blobStore.put(blobKey, file);
            console.log('💾 Blob mirrored to IndexedDB:', blobKey);
        } catch (err) {
            console.warn('Blob mirror failed (non-fatal):', err);
        }
    }
    // ---- END ADDITION ----
    
    this.mediaLibrary.push(mediaItem);
    this.renderMediaItem(mediaItem);
    
    this.addClipToTimeline(mediaItem);
}

async fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    updateMediaLibraryDurations(newDuration) {
    // Update future clips from media library
    this.mediaLibrary.forEach(media => {
        if (media.type === 'image') {
            media.duration = newDuration;
        }
    });
}
    async extractVideoThumbnail(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            video.preload = 'metadata';
            video.src = URL.createObjectURL(file);
            
            video.addEventListener('loadeddata', () => {
                canvas.width = video.videoWidth || 160;
                canvas.height = video.videoHeight || 90;
                
                video.currentTime = 1;
            });
            
            video.addEventListener('seeked', () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
                
                URL.revokeObjectURL(video.src);
                video.remove();
                canvas.remove();
                
                resolve(thumbnailUrl);
            });
            
            video.addEventListener('error', (e) => {
                URL.revokeObjectURL(video.src);
                video.remove();
                canvas.remove();
                reject(new Error('Failed to extract thumbnail'));
            });
            
            video.load();
        });
    }
    
    async getVideoDurationFromFile(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(file);
            
            const onLoaded = () => {
                resolve(video.duration);
                URL.revokeObjectURL(video.src);
                video.remove();
            };
            
            const onError = () => {
                resolve(this.defaultClipDuration);
                URL.revokeObjectURL(video.src);
                video.remove();
            };
            
            video.addEventListener('loadedmetadata', onLoaded);
            video.addEventListener('error', onError);
            video.load();
        });
    }
    
    async getAudioDurationFromFile(file) {
        return new Promise((resolve, reject) => {
            const audio = document.createElement('audio');
            audio.preload = 'metadata';
            audio.src = URL.createObjectURL(file);
            
            const onLoaded = () => {
                resolve(audio.duration);
                URL.revokeObjectURL(audio.src);
                audio.remove();
            };
            
            const onError = () => {
                resolve(this.defaultClipDuration);
                URL.revokeObjectURL(audio.src);
                audio.remove();
            };
            
            audio.addEventListener('loadedmetadata', onLoaded);
            audio.addEventListener('error', onError);
            audio.load();
        });
    }
    
   renderMediaItem(media) {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.dataset.id = media.id;
        
        let thumbnail = '';
        if (media.type === 'image') {
            thumbnail = `<img src="${media.url}" alt="${media.name}" class="media-thumbnail">`;
        } else if (media.type === 'video') {
            if (media.thumbnail) {
                thumbnail = `<img src="${media.thumbnail}" alt="${media.name}" class="media-thumbnail">`;
            } else {
                thumbnail = `
                    <div class="video-thumbnail">
                        <span>🎬</span>
                    </div>
                `;
            }
        } else if (media.type === 'audio') {
            thumbnail = `
                <div class="video-thumbnail">
                    <span>🎵</span>
                </div>
            `;
        }
        
        mediaItem.innerHTML = `
            <div class="media-thumbnail-container" style="position: relative;">
                ${thumbnail}
                <button class="media-delete-btn" style="
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(191, 97, 106, 0.9);
                    color: white;
                    border: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                    z-index: 10;
                " title="Delete from library">✕</button>
                <div class="media-overlay" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 30%);
                    opacity: 0;
                    transition: opacity 0.2s;
                    pointer-events: none;
                "></div>
            </div>
            <div class="media-info">
                <div style="display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;
    min-width: 0; /* Important for truncation in flexbox */">
                    <div style="overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;">${media.name}</div>
                    <span style="font-size: 0.7rem;
    opacity: 0.7;
    flex-shrink: 0; /* Don't shrink the type label */">${media.type}</span>
                </div>
                <div style=" font-size: 0.7rem;
    opacity: 0.7;
    margin-left: 5px;
    flex-shrink: 0;">
                    ${media.duration.toFixed(1)}s
                </div>
            </div>
        `;
        
        // Add click handler to add to timeline
        mediaItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('media-delete-btn')) {
                this.addClipToTimeline(media);
            }
        });
        
        // Add double-click to edit for images
        if (media.type === 'image') {
            mediaItem.addEventListener('dblclick', () => {
                this.openImageEditor(media);
            });
        }
        
        // Add delete button handler
        const deleteBtn = mediaItem.querySelector('.media-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteMediaFromLibrary(media.id);
        });
        
        // Show delete button on hover
        mediaItem.addEventListener('mouseenter', () => {
            deleteBtn.style.opacity = '1';
            mediaItem.querySelector('.media-overlay').style.opacity = '1';
        });
        
        mediaItem.addEventListener('mouseleave', () => {
            deleteBtn.style.opacity = '0';
            mediaItem.querySelector('.media-overlay').style.opacity = '0';
        });
        
        this.mediaGrid.appendChild(mediaItem);
    }
    
    addClipToTimeline(media) {
       
        const track = this.getTrackForType(media.type);
        if (!track) return;
        
        let position = this.findNextAvailablePosition(media.type, media.duration);
        
        const clip = {
            id: Date.now() + Math.random(),
            mediaId: media.id,
            type: media.type,
            name: media.name,
            url: media.url,
            duration: media.duration,
            startTime: position,
            track: track,
            element: null,
            audioElement: null,
            isLocalFile: media.isLocalFile || false,
            blobUrl: media.blobUrl,
            editedUrl: null,
            editedData: null,
            beatSynced: false,
            syncData: null
        };
        
        this.clips.push(clip);
        this.renderClip(clip);
        
        if (media.type === 'image') {
            this.imageClips.push(clip);
        } else if (media.type === 'video') {
            this.videoClips.push(clip);
            this.videoSources.set(clip.id, clip.url);
        }
        
        const newDuration = position + media.duration;
        if (newDuration > this.timelineDuration) {
            this.timelineDuration = Math.min(newDuration, this.maxDuration);
            this.updateTimeRuler();
        }
        
        if (media.type === 'audio') {
            const audio = new Audio(clip.url);
            audio.volume = this.masterVolume.value / 100;
            audio.currentTime = 0;
            audio.loop = false;
            clip.audioElement = audio;
            this.audioElements.push(audio);
        }
        
        this.showStatus(`Added ${media.name} to timeline at ${position.toFixed(1)}s`, 'success');
    }
    
    findNextAvailablePosition(type, duration) {
        const sameTypeClips = this.clips.filter(c => c.type === type);
        
        if (sameTypeClips.length === 0) {
            return 0;
        }
        
        sameTypeClips.sort((a, b) => a.startTime - b.startTime);
        
        let latestEndTime = 0;
        for (const clip of sameTypeClips) {
            const clipEndTime = clip.startTime + clip.duration;
            if (clipEndTime > latestEndTime) {
                latestEndTime = clipEndTime;
            }
        }
        
        return latestEndTime;
    }
    
    addTextClip() {
        const text = this.textContent.value.trim();
        if (!text) {
            this.showStatus('Please enter text content', 'error');
            return;
        }
        
        const duration = parseFloat(this.textDuration.value);
        const position = this.findNextAvailablePosition('text', duration);
        
        const clip = {
            id: Date.now() + Math.random(),
            type: 'text',
            name: 'Text: ' + (text.length > 10 ? text.substring(0, 10) + '...' : text),
            text: text,
            startTime: position,
            duration: duration,
            track: this.textTrack,
            element: null
        };
        
        this.clips.push(clip);
        this.renderClip(clip);
        
        const newDuration = position + duration;
        if (newDuration > this.timelineDuration) {
            this.timelineDuration = Math.min(newDuration, this.maxDuration);
            this.updateTimeRuler();
        }
        
        this.textContent.value = '';
        this.showStatus('Text clip added', 'success');
    }
    
    renderClip(clip) {
        const trackElement = clip.track;
        const clipElement = document.createElement('div');
        clipElement.className = `clip ${clip.type}-clip`;
        clipElement.dataset.clipId = clip.id;
        clipElement.style.cssText=`background-image:url('./img/${clip.name}');background-size:contain;`;
        // Get appropriate icon for clip type
        let icon = '';
        switch(clip.type) {
            case 'video': icon = '🎬'; break;
            case 'image': icon = '🖼️'; break;
            case 'audio': icon = '🎵'; break;
            case 'text': icon = '📝'; break;
        }
        
        clipElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; height: 100%; padding: 0 5px; position: relative;">
                <div style="display: flex; align-items: center; gap: 5px; flex: 1; overflow: hidden; ">
                    <span style="font-size: 0.8rem;">${icon}</span>
                    <div style="font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${clip.name}
                    </div>
                </div>
                <button class="clip-delete-btn" style="
                    background: rgba(191, 97, 106, 0.8);
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 2px 6px;
                    font-size: 0.7rem;
                    border-radius: 3px;
                    opacity: 0;
                    transition: opacity 0.2s, background 0.2s;
                    flex-shrink: 0;
                    margin-left: 5px;
                " title="Delete clip">Delete</button>
            </div>
        `;
        
        const leftHandle = document.createElement('div');
        leftHandle.className = 'clip-handle left';
        leftHandle.dataset.handle = 'left';
        
        const rightHandle = document.createElement('div');
        rightHandle.className = 'clip-handle right';
        rightHandle.dataset.handle = 'right';
        
        const durationLabel = document.createElement('div');
        durationLabel.className = 'clip-duration';
        durationLabel.textContent = `${clip.duration.toFixed(1)}s`;
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-indicator';
        timeLabel.textContent = `${clip.startTime.toFixed(1)}s`;
        
        // Add edit button for image clips
        if (clip.type === 'image') {
            const editBtn = document.createElement('button');
            editBtn.className = 'clip-edit-btn';
            editBtn.innerHTML = '✎';
            editBtn.style.cssText = `
                position: absolute;
                right: 45px;
                top: 5px;
                background: rgba(94, 129, 172, 0.8);
                border: none;
                color: white;
                width: 20px;
                height: 20px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
                opacity: 0;
                transition: opacity 0.2s;
                z-index: 5;
            `;
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openImageEditorForClip(clip);
            });
            clipElement.appendChild(editBtn);
            
            // Show edit button on hover
            clipElement.addEventListener('mouseenter', () => {
                editBtn.style.opacity = '1';
            });
            clipElement.addEventListener('mouseleave', () => {
                editBtn.style.opacity = '0';
            });
        }
        
        clipElement.appendChild(leftHandle);
        clipElement.appendChild(rightHandle);
        clipElement.appendChild(durationLabel);
        clipElement.appendChild(timeLabel);
        
        this.updateClipElement(clip, clipElement);
        
        trackElement.appendChild(clipElement);
        clip.element = clipElement;
        
        // Click handler for selection (not on delete button)
        clipElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('clip-delete-btn') && 
                !e.target.classList.contains('clip-edit-btn')) {
                this.toggleClipSelection(clip.id);
            }
        });
        
        // Double-click to jump to clip
        clipElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.jumpToTime(clip.startTime);
        });
        
        // Delete button handler
        const deleteBtn = clipElement.querySelector('.clip-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteClip(clip.id);
        });
        
        // Show delete button on hover
        clipElement.addEventListener('mouseenter', () => {
            deleteBtn.style.opacity = '1';
        });
        
        clipElement.addEventListener('mouseleave', () => {
            deleteBtn.style.opacity = '0';
        });
        
        this.setupClipInteractions(clipElement);
    }
    
setupClipContextMenu() {
    document.addEventListener('contextmenu', (e) => {
        const clipElement = e.target.closest('.clip');
        if (clipElement) {
            e.preventDefault();
            
            const clipId = clipElement.dataset.clipId;
            const clip = this.clips.find(c => c.id == clipId);
            if (!clip) return;
            
            const menu = document.createElement('div');
            menu.style.cssText = `
                position: fixed;
                top: 6em;
                left: ${e.clientX}px;
                background: var(--secondary-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 5px 0;
                min-width: 220px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            
            let menuItems = '';
            
            // Add trim option for video clips at the top
            if (clip.type === 'video') {
                menuItems += `
                    <div class="context-menu-item" data-action="trim" style="padding: 8px 12px; cursor: pointer; color: var(--text-primary); font-size: 0.9rem; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-color);">
                        ✂️ Trim Video
                    </div>
                `;
            }
            
            if (clip.type === 'text') {
                menuItems += `
                    <div class="context-menu-item title-style-picker" style="padding: 8px 12px; cursor: pointer; color: var(--text-primary); font-size: 0.9rem; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-color);">
                        🎨 Choose Title Style
                    </div>
                `;
            }
            
            if (clip.type === 'image') {
                menuItems += `
                    <div style="padding: 8px 12px; color: var(--text-primary); font-size: 0.9rem; font-weight: bold; border-bottom: 1px solid var(--border-color);">
                        🖼️ Image Options
                    </div>
                    <div class="context-menu-item" data-action="remove-black-bars" style="padding: 8px 12px; cursor: pointer; color: var(--text-primary); font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                        🔲 Remove Black Bars (Fit to Screen)
                    </div>
                    <div class="context-menu-item" data-action="crop-to-screen" style="padding: 8px 12px; cursor: pointer; color: var(--text-primary); font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                        ✂️ Crop to Screen (Cover)
                    </div>
                    <div style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">
                        <div style="font-size: 0.8rem; margin-bottom: 5px; color: var(--text-secondary);">Scale:</div>
                        <div style="display: flex; gap: 5px;">
                            <button class="scale-preset" data-scale="0.5" style="flex:1; background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">50%</button>
                            <button class="scale-preset" data-scale="1" style="flex:1; background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">100%</button>
                            <button class="scale-preset" data-scale="1.5" style="flex:1; background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">150%</button>
                            <button class="scale-preset" data-scale="2" style="flex:1; background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">200%</button>
                        </div>
                    </div>
                    <div style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">
                        <div style="font-size: 0.8rem; margin-bottom: 5px; color: var(--text-secondary);">Position:</div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
                            <button class="position-preset" data-position="top-left" style="background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">↖</button>
                            <button class="position-preset" data-position="top" style="background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">↑</button>
                            <button class="position-preset" data-position="top-right" style="background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">↗</button>
                            <button class="position-preset" data-position="left" style="background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">←</button>
                            <button class="position-preset" data-position="center" style="background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">●</button>
                            <button class="position-preset" data-position="right" style="background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">→</button>
                            <button class="position-preset" data-position="bottom-left" style="background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">↙</button>
                            <button class="position-preset" data-position="bottom" style="background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">↓</button>
                            <button class="position-preset" data-position="bottom-right" style="background: var(--tertiary-bg); border: none; color: white; padding: 4px; border-radius: 3px; cursor: pointer;">↘</button>
                        </div>
                    </div>
                    <div class="context-menu-item" data-action="reset-image-transform" style="padding: 8px 12px; cursor: pointer; color: var(--text-primary); font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                        🔄 Reset Transform
                    </div>
                `;
            }
            
            menuItems += `
                <div style="border-top: 1px solid var(--border-color); margin-top: 5px;"></div>
                <div class="context-menu-item" data-action="delete" style="padding: 8px 12px; cursor: pointer; color: var(--error-color); font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                    🗑️ Delete "${clip.name}"
                </div>
                <div class="context-menu-item" data-action="jump-to-start" style="padding: 8px 12px; cursor: pointer; color: var(--text-primary); font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                    ⏱️ Jump to start
                </div>
                <div class="context-menu-item" data-action="copy-info" style="padding: 8px 12px; cursor: pointer; color: var(--text-primary); font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                    📋 Copy clip info
                </div>
            `;
            
            menu.innerHTML = menuItems;
            document.body.appendChild(menu);
            
            // Handle trim option for video clips
            const trimItem = menu.querySelector('[data-action="trim"]');
            if (trimItem) {
                trimItem.addEventListener('click', () => {
                    if (typeof this.openVideoTrimmer === 'function') {
                        this.openVideoTrimmer(clip);
                    } else {
                        this.showStatus('Video trimmer not available', 'error');
                    }
                    menu.remove();
                });
            }
            
            const stylePicker = menu.querySelector('.title-style-picker');
            if (stylePicker) {
                stylePicker.addEventListener('click', () => {
                    this.showTitleStylePicker(clip);
                    menu.remove();
                });
            }
            
            if (clip.type === 'image') {
                const removeBlackBars = menu.querySelector('[data-action="remove-black-bars"]');
                if (removeBlackBars) {
                    removeBlackBars.addEventListener('click', async () => {
                        await this.removeImageBlackBars(clip);
                        menu.remove();
                    });
                }
                
                const cropToScreen = menu.querySelector('[data-action="crop-to-screen"]');
                if (cropToScreen) {
                    cropToScreen.addEventListener('click', async () => {
                        await this.cropImageToScreen(clip);
                        menu.remove();
                    });
                }
                
                const resetTransform = menu.querySelector('[data-action="reset-image-transform"]');
                if (resetTransform) {
                    resetTransform.addEventListener('click', async () => {
                        await this.resetImageTransform(clip);
                        menu.remove();
                    });
                }
                
                menu.querySelectorAll('.scale-preset').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const scale = parseFloat(btn.dataset.scale);
                        await this.setImageScale(clip, scale);
                        menu.remove();
                    });
                });
                
                menu.querySelectorAll('.position-preset').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const position = btn.dataset.position;
                        await this.setImagePosition(clip, position);
                        menu.remove();
                    });
                });
            }
            
            const deleteItem = menu.querySelector('[data-action="delete"]');
            if (deleteItem) {
                deleteItem.addEventListener('click', () => {
                    this.deleteClip(clip.id);
                    menu.remove();
                });
            }
            
            const jumpToStart = menu.querySelector('[data-action="jump-to-start"]');
            if (jumpToStart) {
                jumpToStart.addEventListener('click', () => {
                    this.jumpToTime(clip.startTime);
                    menu.remove();
                });
            }
            
            const copyInfo = menu.querySelector('[data-action="copy-info"]');
            if (copyInfo) {
                copyInfo.addEventListener('click', () => {
                    navigator.clipboard.writeText(`${clip.name} (${clip.type}) - Start: ${clip.startTime}s, Duration: ${clip.duration}s`);
                    this.showStatus('Clip info copied', 'success');
                    menu.remove();
                });
            }
            
            setTimeout(() => {
                const closeMenu = (e) => {
                    if (!menu.contains(e.target)) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                };
                document.addEventListener('click', closeMenu);
            }, 0);
        }
    });
}
     
  async removeImageBlackBars(clip) {
        if (!clip) return;
        
        if (!clip.imageTransform) {
            clip.imageTransform = {
                scale: 1,
                position: { x: 0, y: 0 },
                fitMode: 'contain',
                alignment: 'center'
            };
        }
        
        clip.imageTransform.fitMode = 'contain';
        clip.imageTransform.scale = 1;
        clip.imageTransform.position = { x: 0, y: 0 };
        clip.imageTransform.alignment = 'center';
        
        this.updatePreview();
        
        await this.autoSaveClipToDatabase(clip);
        
        this.showStatus('Image set to fit screen (may have black bars)', 'success');
    }
    
    async cropImageToScreen(clip) {
        if (!clip) return;
        
        if (!clip.imageTransform) {
            clip.imageTransform = {
                scale: 1,
                position: { x: 0, y: 0 },
                fitMode: 'cover',
                alignment: 'center'
            };
        }
        
        clip.imageTransform.fitMode = 'cover';
        clip.imageTransform.scale = 1;
        clip.imageTransform.position = { x: 0, y: 0 };
        clip.imageTransform.alignment = 'center';
        
        this.updatePreview();
        
        await this.autoSaveClipToDatabase(clip);
        
        this.showStatus('Image cropped to fill screen (no black bars)', 'success');
    }
    
    async setImageScale(clip, scale) {
        if (!clip) return;
        
        if (!clip.imageTransform) {
            clip.imageTransform = {
                scale: 1,
                position: { x: 0, y: 0 },
                fitMode: 'contain',
                alignment: 'center'
            };
        }
        
        clip.imageTransform.scale = scale;
        
        this.updatePreview();
        
        await this.autoSaveClipToDatabase(clip);
        
        this.showStatus(`Image scale set to ${scale * 100}%`, 'success');
    }
    
    async setImagePosition(clip, position) {
        if (!clip) return;
        
        if (!clip.imageTransform) {
            clip.imageTransform = {
                scale: 1,
                position: { x: 0, y: 0 },
                fitMode: 'contain',
                alignment: position
            };
        }
        
        clip.imageTransform.alignment = position;
        
        switch(position) {
            case 'top-left':
                clip.imageTransform.position = { x: -1, y: -1 };
                break;
            case 'top':
                clip.imageTransform.position = { x: 0, y: -1 };
                break;
            case 'top-right':
                clip.imageTransform.position = { x: 1, y: -1 };
                break;
            case 'left':
                clip.imageTransform.position = { x: -1, y: 0 };
                break;
            case 'center':
                clip.imageTransform.position = { x: 0, y: 0 };
                break;
            case 'right':
                clip.imageTransform.position = { x: 1, y: 0 };
                break;
            case 'bottom-left':
                clip.imageTransform.position = { x: -1, y: 1 };
                break;
            case 'bottom':
                clip.imageTransform.position = { x: 0, y: 1 };
                break;
            case 'bottom-right':
                clip.imageTransform.position = { x: 1, y: 1 };
                break;
        }
        
        this.updatePreview();
        
        await this.autoSaveClipToDatabase(clip);
        
        this.showStatus(`Image position set to ${position}`, 'success');
    }
    
    async resetImageTransform(clip) {
        if (!clip) return;
        
        clip.imageTransform = {
            scale: 1,
            position: { x: 0, y: 0 },
            fitMode: 'contain',
            alignment: 'center'
        };
        
        this.updatePreview();
        
        await this.autoSaveClipToDatabase(clip);
        
        this.showStatus('Image transform reset', 'success');
    }
async updateClipElement(clip, element = clip.element) {
    if (!element) return;

    const left = (clip.startTime * this.timelineZoom) + this.trackContentLeft;
    const width = clip.duration * this.timelineZoom;

    element.style.left = `${left}px`;
    element.style.width = `${Math.max(40, width)}px`;

    if (element.querySelector('.clip-duration')) {
        element.querySelector('.clip-duration').textContent = `${clip.duration.toFixed(1)}s`;
    }
    if (element.querySelector('.time-indicator')) {
        element.querySelector('.time-indicator').textContent = `${clip.startTime.toFixed(1)}s`;
    }

    if (clip.beatSynced) {
        element.classList.add('beat-synced');
    } else {
        element.classList.remove('beat-synced');
    }

    if (this.selectedClips.has(clip.id)) {
        element.style.boxShadow = '0 0 0 2px #ffd700';
        element.style.zIndex = '2';
        element.classList.add('selected');
    } else {
        element.style.boxShadow = '';
        element.style.zIndex = '1';
        element.classList.remove('selected');
    }

    // ✅ Debounced save — don't hit Supabase on every drag frame
    this._scheduleClipSave(clip);
}

// Add these two helpers to VideoEditor:
_scheduleClipSave(clip) {
    if (!this._pendingClipSaves) this._pendingClipSaves = new Map();
    if (!this._clipSaveTimers) this._clipSaveTimers = new Map();

    this._pendingClipSaves.set(clip.id, clip);

    if (this._clipSaveTimers.has(clip.id)) {
        clearTimeout(this._clipSaveTimers.get(clip.id));
    }

    const timer = setTimeout(async () => {
        const pending = this._pendingClipSaves.get(clip.id);
        this._pendingClipSaves.delete(clip.id);
        this._clipSaveTimers.delete(clip.id);

        if (pending) {
            await this.autoSaveClipToDatabase(pending);
        }
    }, 800); // 800ms of inactivity = save

    this._clipSaveTimers.set(clip.id, timer);
}

// Optional: flush pending saves on pause/stop
async _flushPendingClipSaves() {
    if (!this._pendingClipSaves) return;
    for (const [id, clip] of this._pendingClipSaves.entries()) {
        if (this._clipSaveTimers?.has(id)) {
            clearTimeout(this._clipSaveTimers.get(id));
        }
        await this.autoSaveClipToDatabase(clip);
    }
    this._pendingClipSaves.clear();
    this._clipSaveTimers?.clear();
}
    toggleClipSelection(clipId) {
        if (this.selectedClips.has(clipId)) {
            this.selectedClips.delete(clipId);
        } else {
            this.selectedClips.add(clipId);
        }
        
        // Update visual styling for all clips
        this.clips.forEach(clip => {
            if (clip.element) {
                this.updateClipElement(clip);
            }
        });
        
        const selectedCount = this.selectedClips.size;
        if (selectedCount > 0) {
            this.showStatus(`${selectedCount} clip(s) selected`, 'info');
        }
    }
async autoSaveClipToDatabase(clip) {
    if (!window.dbManager || !window.dbManager.currentProjectId) return;
    if (!window.dbManager.client) return;

    try {
        const projectId = window.dbManager.currentProjectId;

        const clipData = {
            project_id: projectId,
            clip_id: String(clip.id),
            type: clip.type,
            start_time: clip.startTime || 0,
            duration: clip.duration || 5,
            name: clip.name || 'Clip',
            track: this._getTrackNameLocal(clip.track),
            data: this._extractClipDataLocal(clip)
        };

        const { error } = await window.dbManager.client
            .from('clips')
            .upsert(clipData, { onConflict: 'project_id,clip_id' });

        if (error) throw error;

        console.log('💾 Clip updated in Supabase:', clip.name);
    } catch (error) {
        console.warn('Failed to auto-save clip to database:', error);
    }
}
// Add these helper methods to VideoEditor class
_getTrackNameLocal(trackElement) {
    if (!trackElement) return 'videoTrack';
    if (typeof trackElement === 'string') return trackElement;
    if (trackElement.id) return trackElement.id;
    if (trackElement.className && trackElement.className.includes('track')) {
        return trackElement.className.split(' ')[0] || 'videoTrack';
    }
    return 'videoTrack';
}

_extractClipDataLocal(clip) {
    // For text clips
    if (clip.type === 'text') {
        return {
            id: clip.id,
            type: 'text',
            startTime: clip.startTime || 0,
            duration: clip.duration || 3,
            name: clip.name || 'Text Clip',
            text: clip.text || '',
            titleStyle: clip.titleStyle || 'default',
            style: clip.style || null
        };
    }
    
    // For media clips (video, image, audio)
    // Find the media item in the library - use local this.mediaLibrary
    const mediaItem = this.mediaLibrary?.find(m => m.id === clip.mediaId);
    
    let url = clip.url;
    let fileName = clip.name;
    
    if (mediaItem) {
        url = mediaItem.url;
        fileName = mediaItem.name;
    }
    
    // Check if this is a blob URL and convert to file path
    if (url && url.startsWith('blob:')) {
        const ext = clip.type === 'video' ? '.mp4' : clip.type === 'audio' ? '.mp3' : '';
        fileName = fileName || clip.name || 'unknown';
        
        if (!fileName.includes('.') && ext) {
            fileName += ext;
        }
        
        if (clip.type === 'video' || clip.type === 'audio') {
            url = `./vid/${fileName}`;
        } else if (clip.type === 'image' && clip.editedUrl) {
            url = clip.editedUrl;
        }
    }
    
    return {
        id: clip.id,
        type: clip.type,
        startTime: clip.startTime || 0,
        duration: clip.duration || 5,
        name: clip.name || 'Clip',
        mediaId: clip.mediaId || null,
        url: url,
        fileName: fileName,
        beatSynced: clip.beatSynced || false,
        syncData: clip.syncData || null
    };
}
    setupClipInteractions(clipElement) {
        clipElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (e.target.classList.contains('clip-handle')) {
                this.startResize(e, clipElement);
            } else {
                this.startDrag(e, clipElement);
            }
        });
        
        clipElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const clipId = clipElement.dataset.clipId;
            const clip = this.clips.find(c => c.id == clipId);
            if (clip) {
                if (clip.type === 'image') {
                    this.openImageEditorForClip(clip);
                } else {
                    this.jumpToTime(clip.startTime);
                }
            }
        });
    }
    startDrag(e, clipElement) {
        this.draggingClip = clipElement;
        this.dragStartX = e.clientX;
        const clipId = clipElement.dataset.clipId;
        const clip = this.clips.find(c => c.id == clipId);
        
        if (!clip) return;
        
        const currentLeft = parseFloat(clipElement.style.left || this.trackContentLeft);
        
        this.originalClipData = {
            clipId: clipId,
            clip: {...clip},
            startLeft: currentLeft,
            startTime: clip.startTime
        };
        
        clipElement.classList.add('dragging');
    }
    
   startResize(e, clipElement) {
        this.draggingClip = clipElement;
        this.draggingHandle = e.target.dataset.handle;
        this.dragStartX = e.clientX;
        const clipId = clipElement.dataset.clipId;
        const clip = this.clips.find(c => c.id == clipId);
        
        if (!clip) return;
        
        const currentLeft = parseFloat(clipElement.style.left || this.trackContentLeft);
        const currentWidth = parseFloat(clipElement.style.width || (clip.duration * this.timelineZoom));
        
        this.originalClipData = {
            clipId: clipId,
            clip: {...clip},
            startLeft: currentLeft,
            startWidth: currentWidth,
            startTime: clip.startTime,
            startDuration: clip.duration
        };
        
        clipElement.classList.add('dragging');
        
        if (clip.type === 'image') {
            this.clipDuration.value = clip.duration;
            this.durationValue.textContent = `${clip.duration.toFixed(1)}s`;
        }
    }
    
handleTimelineMouseMove(e) {
    if (this.snapGrid > 0) {
        const track = e.target.closest('.track-content');
        if (track) {
            const rect = track.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const time = (x - this.trackContentLeft) / this.timelineZoom;
            const snappedTime = Math.round(time / this.snapGrid) * this.snapGrid;
            const snappedX = (snappedTime * this.timelineZoom) + this.trackContentLeft;
            
            this.snapIndicator.style.left = `${snappedX}px`;
            this.snapIndicator.style.display = 'block';
        }
    }
    
    if (!this.draggingClip) return;
    
    const clipId = this.draggingClip.dataset.clipId;
    const clip = this.clips.find(c => c.id == clipId);
    if (!clip) return;
    
    const rect = this.draggingClip.parentElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const deltaX = e.clientX - this.dragStartX;
    
    if (this.draggingHandle) {
        if (this.draggingHandle === 'left') {
            const newLeft = this.originalClipData.startLeft + deltaX;
            const newWidth = this.originalClipData.startWidth - deltaX;
            
            if (newWidth >= 40) {
                let newStartTime = (newLeft - this.trackContentLeft) / this.timelineZoom;
                let newDuration = newWidth / this.timelineZoom;
                
                if (this.snapGrid > 0) {
                    newStartTime = Math.round(newStartTime / this.snapGrid) * this.snapGrid;
                    newDuration = Math.round(newDuration / this.snapGrid) * this.snapGrid;
                }
                
                newStartTime = Math.max(0, newStartTime);
                newDuration = Math.max(0.1, newDuration);
                
                // For video clips, we need to track trim start
                if (clip.type === 'video') {
                    // Calculate how much we're trimming from the beginning
                    const trimAmount = this.originalClipData.clip.startTime - newStartTime;
                    
                    // Store trim start if not already present
                    if (!clip.trimStart) clip.trimStart = 0;
                    
                    // Update trim start (can't go below 0 or beyond duration)
                    const newTrimStart = Math.max(0, Math.min(clip.trimStart + trimAmount, clip.duration));
                    clip.trimStart = newTrimStart;
                    
                    // Update start time and duration
                    clip.startTime = newStartTime;
                    clip.duration = newDuration;
                    
                    // If this video is currently playing, adjust its current time
                    if (this.mainVideoPlayer && this.currentVideoClip === clip.id) {
                        const timeInTrimmedClip = this.currentTime - clip.startTime;
                        const originalVideoTime = clip.trimStart + timeInTrimmedClip;
                        this.mainVideoPlayer.currentTime = originalVideoTime;
                    }
                } else {
                    // For non-video clips, just update start time and duration
                    clip.startTime = newStartTime;
                    clip.duration = newDuration;
                }
                
                const visualLeft = (newStartTime * this.timelineZoom) + this.trackContentLeft;
                const visualWidth = newDuration * this.timelineZoom;
                
                this.draggingClip.style.left = `${visualLeft}px`;
                this.draggingClip.style.width = `${Math.max(40, visualWidth)}px`;
                
                this.draggingClip.querySelector('.clip-duration').textContent = `${newDuration.toFixed(1)}s`;
                this.draggingClip.querySelector('.time-indicator').textContent = `${newStartTime.toFixed(1)}s`;
                
                if (clip.type === 'image' || clip.type === 'video') {
                    this.clipDuration.value = newDuration;
                    this.durationValue.textContent = `${newDuration.toFixed(1)}s`;
                }
                
                // Update preview
                this.updatePreview();
            }
        } else if (this.draggingHandle === 'right') {
            const newWidth = this.originalClipData.startWidth + deltaX;
            
            if (newWidth >= 40) {
                let newDuration = newWidth / this.timelineZoom;
                
                if (this.snapGrid > 0) {
                    newDuration = Math.round(newDuration / this.snapGrid) * this.snapGrid;
                }
                
                newDuration = Math.max(0.1, newDuration);
                
                // For video clips, right handle just changes duration
                clip.duration = newDuration;
                
                const visualWidth = newDuration * this.timelineZoom;
                this.draggingClip.style.width = `${Math.max(40, visualWidth)}px`;
                
                this.draggingClip.querySelector('.clip-duration').textContent = `${newDuration.toFixed(1)}s`;
                
                if (clip.type === 'image' || clip.type === 'video') {
                    this.clipDuration.value = newDuration;
                    this.durationValue.textContent = `${newDuration.toFixed(1)}s`;
                }
                
                const newEndTime = clip.startTime + newDuration;
                if (newEndTime > this.timelineDuration) {
                    this.timelineDuration = Math.min(newEndTime, this.maxDuration);
                    this.updateTimeRuler();
                }
                
                // Update preview
                this.updatePreview();
            }
        }
    } else {
        // Moving the entire clip
        const newLeft = this.originalClipData.startLeft + deltaX;
        let newStartTime = (newLeft - this.trackContentLeft) / this.timelineZoom;
        
        if (this.snapGrid > 0) {
            newStartTime = Math.round(newStartTime / this.snapGrid) * this.snapGrid;
        }
        
        newStartTime = Math.max(0, newStartTime);
        
        const canMove = this.canMoveClip(clip, newStartTime);
        if (canMove) {
            clip.startTime = newStartTime;
            
            const visualLeft = (newStartTime * this.timelineZoom) + this.trackContentLeft;
            this.draggingClip.style.left = `${visualLeft}px`;
            
            this.draggingClip.querySelector('.time-indicator').textContent = `${newStartTime.toFixed(1)}s`;
            
            // Update preview
            this.updatePreview();
        }
    }
}
    
    canResizeClip(clip, newStartTime, newDuration) {
        const sameTypeClips = this.clips.filter(c => 
            c.type === clip.type && 
            c.id !== clip.id
        );
        
        const newEndTime = newStartTime + newDuration;
        
        for (const otherClip of sameTypeClips) {
            const otherEndTime = otherClip.startTime + otherClip.duration;
            
            if (newStartTime < otherEndTime && newEndTime > otherClip.startTime) {
                return false;
            }
        }
        
        return true;
    }
    
    canMoveClip(clip, newStartTime) {
        const sameTypeClips = this.clips.filter(c => 
            c.type === clip.type && 
            c.id !== clip.id
        );
        
        const newEndTime = newStartTime + clip.duration;
        
        for (const otherClip of sameTypeClips) {
            const otherEndTime = otherClip.startTime + otherClip.duration;
            
            if (newStartTime < otherEndTime && newEndTime > otherClip.startTime) {
                return false;
            }
        }
        
        return true;
    }
    
    handleTimelineMouseUp() {
        if (this.draggingClip) {
            this.draggingClip.classList.remove('dragging');
            this.draggingClip = null;
            this.draggingHandle = null;
            this.originalClipData = null;
        }
        this.snapIndicator.style.display = 'none';
    }
    
jumpToTime(time) {
    // Prevent jumping back during transitions
    if (this.isTransitioning && time < this.currentTime) {
        return;
    }
    
    // Clamp to timeline bounds
    time = Math.max(0, Math.min(time, this.timelineDuration || 0));
    
    // Prevent jumping to same time (causes loops)
    if (Math.abs(time - this.currentTime) < 0.01) {
        return;
    }
    
    this.currentTime = time;
    
    const percentage = (time / this.timelineDuration) * 100;
    this.playheadSlider.value = percentage;
    
    this.updatePlayhead();
    
    // Find new video clip at this time
    const activeVideoClip = this.findActiveVideoClip(time);
    
    if (activeVideoClip) {
        const timeInClip = time - activeVideoClip.startTime;
        
        if (this.currentVideoClip !== activeVideoClip.id) {
            // Different video, switch to it
            this.currentVideoClip = activeVideoClip.id;
            this.switchToVideo(activeVideoClip, timeInClip);
        } else {
            // Same video, just seek
            this.seekVideoToTime(timeInClip);
        }
    } else {
        // Not in a video - hide video player (shows black)
        if (this.mainVideoPlayer && !this.mainVideoPlayer.paused) {
            this.mainVideoPlayer.pause();
        }
        this.mainVideoPlayer.style.display = 'none';
        this.currentVideoClip = null;
    }
    
    // Update audio and other previews
    this.updateAudioPlayback(); // THIS LINE IS CRITICAL
    this.updateNonVideoPreview();
}
updateClipsPosition() {
        this.clips.forEach(clip => {
            if (clip.element) {
                this.updateClipElement(clip);
            }
        });
    }
    
animate() {
    const now = Date.now();
    
    if (this.isPlaying) {
        // ALWAYS advance timeline when playing
        this.currentTime += 0.033; // ~30fps
        
        // Check if we've reached the end
        if (this.currentTime >= this.timelineDuration) {
            this.currentTime = this.timelineDuration;
            this.pause();
        }
        
        // Update UI
        const percentage = (this.currentTime / this.timelineDuration) * 100;
        this.playheadSlider.value = percentage;
        this.updatePlayhead();
        
        // Update preview at regular intervals
        if (now - this.lastUpdateTime > this.updateInterval) {
            this.updatePreview();
            this.lastUpdateTime = now;
        }
        
        // Beat detection
        if (this.beatSyncEnabled && this.beatMarkers.length > 0) {
            this.checkBeatSync();
        }
    }
    
    requestAnimationFrame(() => this.animate());
}updatePlayhead() {
        const playheadPosition = (this.currentTime * this.timelineZoom) + this.trackContentLeft;
        this.playhead.style.left = `${playheadPosition}px`;
        
        const currentTimeStr = this.formatTime(this.currentTime);
        const durationStr = this.formatTime(this.timelineDuration);
        this.timeDisplay.textContent = `${currentTimeStr} / ${durationStr}`;
    }
    
 updatePreview() {
        const activeVideoClip = this.clips.find(clip => 
            clip.type === 'video' &&
            this.currentTime >= clip.startTime && 
            this.currentTime <= clip.startTime + clip.duration
        );
        
        const activeImageClip = this.clips.find(clip => 
            clip.type === 'image' &&
            this.currentTime >= clip.startTime && 
            this.currentTime <= clip.startTime + clip.duration
        );
        
        const activeTextClip = this.clips.find(clip => 
            clip.type === 'text' &&
            this.currentTime >= clip.startTime && 
            this.currentTime <= clip.startTime + clip.duration
        );
        
        this.previewOverlay.innerHTML = '';
        
        if (activeVideoClip) {
            const timeInClip = this.currentTime - activeVideoClip.startTime;
            
            if (this.currentVideoClip !== activeVideoClip.id) {
                if (this.mainVideoPlayer.src !== activeVideoClip.url) {
                    this.mainVideoPlayer.src = activeVideoClip.url;
                    this.mainVideoPlayer.load();
                }
                
                this.mainVideoPlayer.currentTime = timeInClip;
                this.mainVideoPlayer.style.display = 'block';
                
                if (this.isPlaying) {
                    this.mainVideoPlayer.play().catch(e => {
                        console.log('Video play error:', e);
                    });
                }
                
                this.currentVideoClip = activeVideoClip.id;
            }
            
            this.videoPreview.style.display = 'none';
            
        } else {
            if (this.mainVideoPlayer && this.mainVideoPlayer.style.display !== 'none') {
                this.mainVideoPlayer.style.display = 'none';
                this.currentVideoClip = null;
            }
            
            this.videoPreview.style.display = 'none';
        }
        
        if (activeImageClip) {
            const img = document.createElement('img');
            img.src = activeImageClip.editedUrl || activeImageClip.url;
            img.className = 'preview-media';
            img.style.position = 'absolute';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.pointerEvents = 'none';
            
            if (activeImageClip.imageTransform) {
                const transform = activeImageClip.imageTransform;
                
                if (transform.fitMode === 'cover') {
                    img.style.objectFit = 'cover';
                } else if (transform.fitMode === 'contain') {
                    img.style.objectFit = 'contain';
                } else {
                    img.style.objectFit = 'contain';
                }
                
                if (transform.scale !== 1) {
                    img.style.transform = `scale(${transform.scale})`;
                }
                
                if (transform.position) {
                    const xPercent = ((transform.position.x + 1) / 2) * 100;
                    const yPercent = ((transform.position.y + 1) / 2) * 100;
                    img.style.objectPosition = `${xPercent}% ${yPercent}%`;
                }
            } else {
                img.style.objectFit = 'contain';
            }
            
            img.onerror = () => {
                console.error('Failed to load image:', activeImageClip.url);
                img.style.display = 'none';
            };
            this.previewOverlay.appendChild(img);
        }
        
        if (activeTextClip) {
            console.log('Displaying text:', activeTextClip.text);
            const textDiv = document.createElement('div');
            textDiv.className = 'preview-text';
            textDiv.textContent = activeTextClip.text || '';
            
            const style = activeTextClip.style || this.titleStyles.default;
            textDiv.style.position = 'absolute';
            textDiv.style.left = '50%';
            textDiv.style.top = '50%';
            textDiv.style.transform = 'translate(-50%, -50%)';
            textDiv.style.zIndex = '10';
            textDiv.style.pointerEvents = 'none';
            textDiv.style.maxWidth = '80%';
            textDiv.style.textAlign = 'center';
            
            Object.keys(style).forEach(key => {
                textDiv.style[key] = style[key];
            });
            
            this.previewOverlay.appendChild(textDiv);
        }
        
        this.audioElements.forEach(audio => {
            const clip = this.clips.find(c => c.audioElement === audio);
            if (clip) {
                const clipStart = clip.startTime;
                const clipEnd = clip.startTime + clip.duration;
                
                if (this.currentTime >= clipStart && this.currentTime <= clipEnd) {
                    if (audio.paused && this.isPlaying) {
                        audio.currentTime = this.currentTime - clipStart;
                        audio.play().catch(() => {});
                    }
                } else {
                    audio.pause();
                }
            }
        });
    }
showTitleStylePicker(clip) {
    this.createTitleStyleModal();
    
    const modal = document.getElementById('titleStyleModal');
    const currentClip = clip;
    
    // Highlight current style if exists
    document.querySelectorAll('.title-style-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.style === (currentClip.titleStyle || 'default')) {
            card.classList.add('selected');
        }
    });
    
    // Add click handlers
    document.querySelectorAll('.title-style-card').forEach(card => {
        const handler = async (e)  => {
            const style = card.dataset.style;
            
            // Remove selected class from all
            document.querySelectorAll('.title-style-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            // Apply style to clip
           await this.applyTitleStyleToClip(currentClip, style);
        };
        
        card.removeEventListener('click', handler);
        card.addEventListener('click', handler);
    });
    
    // Apply button
    const applyBtn = document.getElementById('applyTitleStyleBtn');
    applyBtn.onclick = () => {
        modal.style.display = 'none';
        this.showStatus('Title style applied', 'success');
    };
    
    modal.style.display = 'flex';
}
updateOverlayContent() {
    // Clear overlay
    this.previewOverlay.innerHTML = '';
    
    // Find active image clip at current time
    const activeImageClip = this.clips.find(clip => 
        clip.type === 'image' &&
        this.currentTime >= clip.startTime && 
        this.currentTime <= clip.startTime + clip.duration
    );
    
    // Find active text clip at current time
    const activeTextClip = this.clips.find(clip => 
        clip.type === 'text' &&
        this.currentTime >= clip.startTime && 
        this.currentTime <= clip.startTime + clip.duration
    );
    
    // Show image overlay
    if (activeImageClip) {
        const img = document.createElement('img');
        img.src = activeImageClip.editedUrl || activeImageClip.url;
        img.className = 'preview-media overlay-media';
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.zIndex = '5';
        img.onerror = () => {
            console.error('Failed to load image:', activeImageClip.url);
            img.style.display = 'none';
        };
        this.previewOverlay.appendChild(img);
    }
    
    // Show text overlay (always on top of video/image)
    if (activeTextClip) {
        const textDiv = document.createElement('div');
        textDiv.className = 'preview-text overlay-text';
        textDiv.textContent = activeTextClip.text;
        textDiv.style.position = 'absolute';
        textDiv.style.left = '50%';
        textDiv.style.top = '50%';
        textDiv.style.transform = 'translate(-50%, -50%)';
        textDiv.style.color = 'white';
        textDiv.style.fontSize = '24px';
        textDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        textDiv.style.zIndex = '10';
        textDiv.style.pointerEvents = 'none';
        this.previewOverlay.appendChild(textDiv);
    }
}updateTextOverVideoPreview() {
    // This is now handled by updateOverlayContent()
    this.updateOverlayContent();
}

adjustTimelinePosition(targetClip) {
    // If we're before the clip, move to start
    if (this.currentTime < targetClip.startTime) {
        this.currentTime = targetClip.startTime;
    }
    // If we're after the clip, move to end (or next content)
    else if (this.currentTime > targetClip.startTime + targetClip.duration) {
        // Check if there's another video after this one
        const videoClips = this.clips
            .filter(clip => clip.type === 'video')
            .sort((a, b) => a.startTime - b.startTime);
        
        const currentIndex = videoClips.findIndex(clip => clip.id === targetClip.id);
        
        if (currentIndex < videoClips.length - 1) {
            // There's another video after this one
            const nextClip = videoClips[currentIndex + 1];
            this.currentTime = nextClip.startTime;
            this.currentVideoClip = nextClip.id;
        } else {
            // This is the last video, move to its end
            this.currentTime = targetClip.startTime + targetClip.duration;
            this.currentVideoClip = null;
        }
    }
    
    // Update UI
    const percentage = (this.currentTime / this.timelineDuration) * 100;
    this.playheadSlider.value = percentage;
    this.updatePlayhead();
    this.updatePreview();
}
performVideoTransition(previousClip, nextClip, timeInClip) {
   // Validate the time is within the clip
    if (timeInClip < 0 || timeInClip > nextClip.duration) {
        console.warn(`Invalid timeInClip: ${timeInClip}, clip duration: ${nextClip.duration}`);
        
        // Adjust to valid time
        if (timeInClip < 0) {
            timeInClip = 0;
            this.currentTime = nextClip.startTime;
        } else if (timeInClip > nextClip.duration) {
            timeInClip = nextClip.duration - 0.1;
            this.currentTime = nextClip.startTime + timeInClip;
        }
        
        // Update UI
        const percentage = (this.currentTime / this.timelineDuration) * 100;
        this.playheadSlider.value = percentage;
        this.updatePlayhead();
    }
    
    // Store the previous video ID
    this.previousVideoClipId = previousClip ? previousClip.id : null;
    
    // Prevent multiple rapid transitions
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    
    // If we have a previous video and it's the same as next, just seek
    if (previousClip && previousClip.id === nextClip.id) {
        this.seekVideoToTime(timeInClip);
        this.isTransitioning = false;
        return;
    }
    
    // Fade out current video if exists and playing
    if (this.mainVideoPlayer && !this.mainVideoPlayer.paused) {
        this.mainVideoPlayer.style.transition = 'opacity 0.2s';
        this.mainVideoPlayer.style.opacity = '0.3';
    }
    
    // Set a small timeout to ensure fade starts
    setTimeout(() => {
        // Change source if different
        if (this.mainVideoPlayer.src !== nextClip.url) {
            this.mainVideoPlayer.src = nextClip.url;
            this.mainVideoPlayer.load();
        }
        
        const onVideoReady = () => {
            // Ensure we're still supposed to be at this time
            const currentTimeInClip = this.currentTime - nextClip.startTime;
            if (currentTimeInClip < 0 || currentTimeInClip >= nextClip.duration) {
                // We've moved outside this clip, abort
                this.isTransitioning = false;
                return;
            }
            
            // Seek to correct time
            if (Math.abs(this.mainVideoPlayer.currentTime - currentTimeInClip) > 0.1) {
                this.mainVideoPlayer.currentTime = currentTimeInClip;
            }
            
            // Play if we should be playing
            if (this.isPlaying && this.mainVideoPlayer.paused) {
                this.mainVideoPlayer.play().catch(e => {
                    console.log('Video play error:', e);
                });
            }
            
            // Fade back in
            this.mainVideoPlayer.style.opacity = '1';
            
            // Clear event listeners
            this.mainVideoPlayer.onloadeddata = null;
            this.mainVideoPlayer.onerror = null;
            
            this.isTransitioning = false;
        };
        
        // Set up event listeners
        if (this.mainVideoPlayer.readyState >= 2) { // HAVE_CURRENT_DATA or better
            onVideoReady();
        } else {
            this.mainVideoPlayer.onloadeddata = onVideoReady;
            this.mainVideoPlayer.onerror = () => {
                console.error('Failed to load video:', nextClip.url);
                this.mainVideoPlayer.style.opacity = '1';
                this.mainVideoPlayer.onloadeddata = null;
                this.mainVideoPlayer.onerror = null;
                this.isTransitioning = false;
            };
        }
        
    }, 50); // Small delay for fade effect
    
    this.mainVideoPlayer.style.display = 'block';
    this.videoPreview.style.display = 'none';
    this.previewOverlay.innerHTML = '';
}

seekVideoToTime(timeInClip) {
    if (!this.mainVideoPlayer) return;
    
    // Clamp to valid range
    const activeClip = this.findActiveVideoClip(this.currentTime);
    if (!activeClip) return;
    
    timeInClip = Math.max(0, Math.min(timeInClip, activeClip.duration));
    
    // Apply trim start to the video time
    const videoTime = (activeClip.trimStart || 0) + timeInClip;
    
    // Only seek if significantly different
    if (Math.abs(this.mainVideoPlayer.currentTime - videoTime) > 0.1) {
        this.mainVideoPlayer.currentTime = videoTime;
    }
    
    // Ensure video is visible
    this.mainVideoPlayer.style.display = 'block';
    
    // Maintain play/pause state
    if (this.isPlaying && this.mainVideoPlayer.paused) {
        this.mainVideoPlayer.play().catch(e => {
            console.log('Video play error:', e);
        });
    } else if (!this.isPlaying && !this.mainVideoPlayer.paused) {
        this.mainVideoPlayer.pause();
    }
}
getNextVideoAfterTime(time) {
    const videoClips = this.clips
        .filter(clip => clip.type === 'video')
        .sort((a, b) => a.startTime - b.startTime);
    
    for (const clip of videoClips) {
        if (clip.startTime > time) {
            return clip;
        }
    }
    
    return null; // No video after this time
}
getCurrentVideoClip() {
    return this.clips.find(clip => clip.id === this.currentVideoClip);
}

maintainVideoPlaybackState(timeInClip) {
    if (!this.isPlaying && !this.mainVideoPlayer.paused) {
        this.mainVideoPlayer.pause();
    } else if (this.isPlaying && this.mainVideoPlayer.paused) {
        this.mainVideoPlayer.play().catch(e => {
            console.log('Video play error:', e);
        });
    }
    
    if (Math.abs(this.mainVideoPlayer.currentTime - timeInClip) > 0.5) {
        this.mainVideoPlayer.currentTime = timeInClip;
    }
}

hideVideoPlayer() {
    if (this.mainVideoPlayer && !this.mainVideoPlayer.paused) {
        this.mainVideoPlayer.pause();
    }
    this.mainVideoPlayer.style.display = 'none';
    this.videoPreview.style.display = 'none';
    this.currentVideoClip = null;
    
    // Show images and text
    this.updateNonVideoPreview();
}  
 updateTextOverVideoPreview() {
        // Clear overlay
        this.previewOverlay.innerHTML = '';
        
        // Find active image clip at current time
        const activeVideoClip = this.clips.find(clip => 
        clip.id === this.currentVideoClip
    );
        
        // Find active text clip at current time
        const activeTextClip = this.clips.find(clip => 
            clip.type === 'text' &&
            this.currentTime >= clip.startTime && 
            this.currentTime <= clip.startTime + clip.duration
        );
        
        // Show image
        if (activeVideoClip) {
            const img = document.createElement('img');
            img.src = activeImageClip.editedUrl || activeImageClip.url;
            img.className = 'preview-media';
            img.onerror = () => {
                console.error('Failed to load image:', activeImageClip.url);
                img.style.display = 'none';
            };
            this.previewOverlay.appendChild(img);
        }
        
        // Show text
        if (activeTextClip) {
            const textDiv = document.createElement('div');
            textDiv.className = 'preview-text';
            textDiv.textContent = activeTextClip.text;
            textDiv.style.left = '50%';
            textDiv.style.top = '50%';
            textDiv.style.transform = 'translate(-50%, -50%)';
            this.previewOverlay.appendChild(textDiv);
        }
    }
    
    updateNonVideoPreview() {
        // Clear overlay
        this.previewOverlay.innerHTML = '';
        
        // Find active image clip at current time
        const activeImageClip = this.clips.find(clip => 
            clip.type === 'image' &&
            this.currentTime >= clip.startTime && 
            this.currentTime <= clip.startTime + clip.duration
        );
        
        // Find active text clip at current time
        const activeTextClip = this.clips.find(clip => 
            clip.type === 'text' &&
            this.currentTime >= clip.startTime && 
            this.currentTime <= clip.startTime + clip.duration
        );
        
        // Show image
        if (activeImageClip) {
            const img = document.createElement('img');
            img.src = activeImageClip.editedUrl || activeImageClip.url;
            img.className = 'preview-media';
            img.onerror = () => {
                console.error('Failed to load image:', activeImageClip.url);
                img.style.display = 'none';
            };
            this.previewOverlay.appendChild(img);
        }
        
        // Show text
        if (activeTextClip) {
            const textDiv = document.createElement('div');
            textDiv.className = 'preview-text';
            textDiv.textContent = activeTextClip.text;
            textDiv.style.left = '50%';
            textDiv.style.top = '50%';
            textDiv.style.transform = 'translate(-50%, -50%)';
            this.previewOverlay.appendChild(textDiv);
        }
    }
    
    async analyzeAllAudio() {
        if (!this.audioContext) {
            this.showStatus("Audio context not available", "error");
            return;
        }
        
        const audioClips = this.clips.filter(clip => clip.type === 'audio');
        
        if (audioClips.length === 0) {
            this.showStatus("No audio clips to analyze", "info");
            return;
        }
        
        this.showStatus("Analyzing audio...", "info");
        this.analyzeAudioBtn.disabled = true;
        this.analyzeAudioBtn.textContent = "Analyzing...";
        
        try {
            // Use the first audio clip for analysis
            const audioClip = audioClips[0];
            
            // Create a new audio element for analysis
            const audio = new Audio(audioClip.url);
            audio.crossOrigin = "anonymous";
            
            // Wait for audio to load
            await new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', resolve);
                audio.addEventListener('error', reject);
                audio.load();
            });
            
            // Create audio source node
            const source = this.audioContext.createMediaElementSource(audio);
            const analyser = this.audioContext.createAnalyser();
            
            analyser.fftSize = 2048;
            source.connect(analyser);
            analyser.connect(this.audioContext.destination);
            
            // Get audio buffer data
            const response = await fetch(audioClip.url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Perform analysis
            const beats = this.detectBeatsFromBuffer(audioBuffer);
            const bpm = this.calculateBPM(beats);
            const timeSignature = this.detectTimeSignature(beats, bpm);
            
            // Store results
            this.beatMarkers = beats;
            this.bpm = bpm;
            this.timeSignature = timeSignature;
            
            // Visualize beats if visualization is enabled
            if (this.showBeatVisualization) {
                this.visualizeBeatsOnTimeline(beats);
            }
            
            // Update UI
            this.audioAnalysisInfo.innerHTML = `
                <div>BPM: <strong>${bpm.toFixed(1)}</strong></div>
                <div>Time Signature: <strong>${timeSignature[0]}/${timeSignature[1]}</strong></div>
                <div>Beats Detected: <strong>${beats.length}</strong></div>
                <div>Audio Duration: <strong>${audioBuffer.duration.toFixed(2)}s</strong></div>
            `;
            
            // Enable auto-snap options
            this.autoSnapBeats.disabled = false;
            
            this.showStatus(`Audio analyzed: ${bpm.toFixed(1)} BPM, ${beats.length} beats`, "success");
            
        } catch (error) {
            console.error("Audio analysis error:", error);
            this.showStatus("Audio analysis failed - try running from a local server (http://localhost)", "error");
        } finally {
            this.analyzeAudioBtn.disabled = false;
            this.analyzeAudioBtn.textContent = "Analyze Audio for Beats/BPM";
        }
    }
    
    detectBeatsFromBuffer(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const beats = [];
        
        // Parameters for beat detection
        const windowSize = Math.floor(sampleRate * 0.1); // 100ms window
        const minBeatInterval = 0.1 * sampleRate; // 100ms minimum
        const threshold = this.beatThreshold;
        
        let energyHistory = [];
        let lastBeatPos = -minBeatInterval;
        
        for (let i = 0; i < channelData.length - windowSize; i += Math.floor(windowSize / 2)) {
            let energy = 0;
            
            // Calculate energy in window
            for (let j = 0; j < windowSize; j++) {
                energy += Math.abs(channelData[i + j]);
            }
            energy /= windowSize;
            
            energyHistory.push(energy);
            
            // Keep last 5 energy values for average
            if (energyHistory.length > 5) {
                energyHistory.shift();
            }
            
            // Calculate average energy
            const avgEnergy = energyHistory.reduce((sum, e) => sum + e, 0) / energyHistory.length;
            
            // Detect beat if energy is above threshold
            if (energy > avgEnergy * (1 + threshold) && (i - lastBeatPos) > minBeatInterval) {
                const beatTime = i / sampleRate;
                beats.push(beatTime);
                lastBeatPos = i;
            }
        }
        
        return beats;
    }
    
    calculateBPM(beats) {
        if (beats.length < 2) return 120;
        
        const intervals = [];
        for (let i = 1; i < beats.length; i++) {
            intervals.push(beats[i] - beats[i - 1]);
        }
        
        // Sort intervals and take median
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals[Math.floor(intervals.length / 2)];
        
        return 60 / medianInterval;
    }
    
    detectTimeSignature(beats, bpm) {
        if (beats.length < 8) return [4, 4];
        
        const beatPeriod = 60 / bpm;
        let bestMatches = 0;
        let bestBeatsPerMeasure = 4;
        
        // Try different time signatures
        for (let beatsPerMeasure of [3, 4, 6, 8]) {
            let matches = 0;
            for (let i = 0; i <= beats.length - beatsPerMeasure; i += beatsPerMeasure) {
                const expectedTime = beats[i] + (beatsPerMeasure * beatPeriod);
                const actualTime = i + beatsPerMeasure < beats.length ? beats[i + beatsPerMeasure] : expectedTime;
                if (Math.abs(expectedTime - actualTime) < beatPeriod * 0.3) {
                    matches++;
                }
            }
            
            if (matches > bestMatches) {
                bestMatches = matches;
                bestBeatsPerMeasure = beatsPerMeasure;
            }
        }
        
        return [bestBeatsPerMeasure, 4];
    }
    
    // FIXED: Beat visualization only on audio track
    visualizeBeatsOnTimeline(beats) {
        // Clear previous markers
        document.querySelectorAll('.audio-track-beat-marker, .beat-label').forEach(marker => marker.remove());
        
        const audioTrack = document.getElementById('audioTrack');
        const timeline = document.querySelector('.timeline');
        
        if (!audioTrack || !timeline) return;
        
        // Calculate audio track position
        const timelineRect = timeline.getBoundingClientRect();
        const audioTrackRect = audioTrack.getBoundingClientRect();
        const audioTrackTop = audioTrackRect.top - timelineRect.top;
        
        // Find all audio clips
        const audioClips = this.clips.filter(clip => clip.type === 'audio');
        
        // Create beat markers for each audio clip
        audioClips.forEach(audioClip => {
            const clipStart = audioClip.startTime;
            const clipEnd = clipStart + audioClip.duration;
            
            // Find beats within this clip's duration
            const clipBeats = beats.filter(beatTime => 
                beatTime >= clipStart && beatTime <= clipEnd
            );
            
            // Add beat markers for this clip
            clipBeats.forEach((beatTime, index) => {
                const timeInClip = beatTime - clipStart;
                const leftPosition = (timeInClip * this.timelineZoom) + this.trackContentLeft;
                
                // Create beat marker
                const marker = document.createElement('div');
                marker.className = `audio-track-beat-marker ${index % 4 === 0 ? 'strong' : 'weak'}`;
                marker.style.left = `${leftPosition}px`;
                marker.style.top = `${audioTrackTop}px`;
                marker.style.opacity = `${0.3 + (this.vizIntensity * 0.7)}`;
                
                // Add beat number for strong beats if enabled
                if (index % 4 === 0 && this.showBeatNumbers) {
                    const label = document.createElement('div');
                    label.className = 'beat-label';
                    label.textContent = `${(index/4) + 1}`;
                    label.style.left = `${leftPosition}px`;
                    label.style.display = 'block';
                    timeline.appendChild(label);
                }
                
                timeline.appendChild(marker);
            });
        });
    }
    
    checkBeatSync() {
        const currentTime = this.currentTime;
        
        // Find closest beat
        let closestBeat = null;
        let minDiff = Infinity;
        
        for (const beatTime of this.beatMarkers) {
            const diff = Math.abs(currentTime - beatTime);
            if (diff < minDiff && diff < 0.2) { // Within 200ms
                minDiff = diff;
                closestBeat = beatTime;
            }
        }
        
        // Trigger beat visualization
        if (closestBeat !== null && closestBeat !== this.lastBeatTime) {
            this.lastBeatTime = closestBeat;
            this.visualizeBeat();
            
            // Find beat index
            const beatIndex = this.beatMarkers.findIndex(beat => Math.abs(beat - closestBeat) < 0.01);
            
            // Sync image clips to beats
            if (this.beatSyncEnabled && beatIndex % this.beatsPerImage === 0 && this.imageClips.length > 0) {
                const imageIndex = (beatIndex / this.beatsPerImage) % this.imageClips.length;
                this.onBeatImageChange(imageIndex);
            }
            
            // Sync video clips to beats
            if (this.beatSyncEnabled && this.videoClips.length > 0) {
                this.onBeatVideoSync(beatIndex);
            }
        }
    }
    
    visualizeBeat() {
        const beatIndicator = document.createElement('div');
        beatIndicator.className = 'beat-indicator';
        beatIndicator.style.position = 'absolute';
        beatIndicator.style.top = '10px';
        beatIndicator.style.right = '10px';
        beatIndicator.style.width = '20px';
        beatIndicator.style.height = '20px';
        beatIndicator.style.background = '#ff3232';
        beatIndicator.style.borderRadius = '50%';
        beatIndicator.style.opacity = '0.8';
        beatIndicator.style.zIndex = '20';
        beatIndicator.style.animation = 'beatPulse 0.3s ease-out';
        
        this.videoContainer.appendChild(beatIndicator);
        
        setTimeout(() => {
            beatIndicator.remove();
        }, 300);
    }
    
    onBeatImageChange(imageIndex) {
        // This method gets called when beat sync changes images
        console.log(`Beat sync - Image ${imageIndex + 1}`);
        
        // Update the preview to show the new image
        this.updatePreview();
        
        // Add visual indicator
        const indicator = document.createElement('div');
        indicator.textContent = `Image ${imageIndex + 1}`;
        indicator.style.position = 'absolute';
        indicator.style.bottom = '60px';
        indicator.style.right = '10px';
        indicator.style.color = 'white';
        indicator.style.background = 'rgba(0,0,0,0.7)';
        indicator.style.padding = '5px 10px';
        indicator.style.borderRadius = '5px';
        indicator.style.fontSize = '12px';
        indicator.style.zIndex = '15';
        
        this.previewOverlay.appendChild(indicator);
        
        // Remove after 1 second
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 1000);
    }
    switchToVideo(clip, timeInClip) {
    // Hide video player first
    this.mainVideoPlayer.style.display = 'none';
    
    // Set new source if different
    if (this.mainVideoPlayer.src !== clip.url) {
        this.mainVideoPlayer.src = clip.url;
        this.mainVideoPlayer.load();
        
        // Wait for video to be ready
        this.mainVideoPlayer.onloadeddata = () => {
            // Apply trim start to the video time
            const videoTime = (clip.trimStart || 0) + Math.min(timeInClip, clip.duration);
            this.mainVideoPlayer.currentTime = Math.max(0, Math.min(videoTime, clip.duration + (clip.trimStart || 0)));
            this.mainVideoPlayer.style.display = 'block';
            
            if (this.isPlaying) {
                this.mainVideoPlayer.play().catch(e => {
                    console.log('Video play error:', e);
                });
            }
            
            this.mainVideoPlayer.onloadeddata = null;
        };
    } else {
        // Same video, just seek and show with trim applied
        const videoTime = (clip.trimStart || 0) + Math.min(timeInClip, clip.duration);
        this.mainVideoPlayer.currentTime = Math.max(0, Math.min(videoTime, clip.duration + (clip.trimStart || 0)));
        this.mainVideoPlayer.style.display = 'block';
        
        if (this.isPlaying && this.mainVideoPlayer.paused) {
            this.mainVideoPlayer.play().catch(e => {
                console.log('Video play error:', e);
            });
        }
    }
}
    onBeatVideoSync(beatIndex) {
        // Apply video sync effects based on sync mode
        this.videoClips.forEach(clip => {
            if (clip.beatSynced && this.mainVideoPlayer && clip.id === this.currentVideoClip) {
                const timeInClip = this.currentTime - clip.startTime;
                const clipDuration = clip.duration;
                
                if (timeInClip >= 0 && timeInClip <= clipDuration) {
                    switch(this.videoSyncMode) {
                        case 'cut':
                            // Simple beat visualization
                            if (beatIndex % 4 === 0) {
                                this.createVideoBeatEffect(clip);
                            }
                            break;
                            
                        case 'transition':
                            // Apply video transition effects on beats
                            if (beatIndex % 2 === 0) {
                                this.applyVideoTransition(clip, timeInClip);
                            }
                            break;
                            
                        case 'speed':
                            // Adjust playback speed based on beat intensity
                            this.adjustVideoPlaybackSpeed(clip, beatIndex);
                            break;
                    }
                }
            }
        });
    }
    
    createVideoBeatEffect(clip) {
        if (!this.mainVideoPlayer) return;
        
        // Create a flash effect
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.background = 'rgba(255, 255, 255, 0.3)';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '10';
        flash.style.animation = 'fadeOut 0.2s forwards';
        
        // Add custom animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        this.videoContainer.appendChild(flash);
        
        setTimeout(() => {
            if (flash.parentNode) {
                flash.remove();
            }
            if (style.parentNode) {
                style.remove();
            }
        }, 200);
    }
    
    applyVideoTransition(clip, timeInClip) {
        if (!this.mainVideoPlayer) return;
        
        // Apply visual transition effect
        this.mainVideoPlayer.style.transition = 'filter 0.1s';
        
        if (Math.floor(timeInClip * 2) % 2 === 0) {
            this.mainVideoPlayer.style.filter = 'brightness(1.1) contrast(1.05)';
        } else {
            this.mainVideoPlayer.style.filter = 'brightness(1) contrast(1)';
        }
    }
    
    adjustVideoPlaybackSpeed(clip, beatIndex) {
        if (!this.mainVideoPlayer) return;
        
        // Calculate target speed based on beat pattern
        const baseSpeed = 1.0;
        const beatPattern = beatIndex % 4;
        let targetSpeed = baseSpeed;
        
        switch(beatPattern) {
            case 0: targetSpeed = 1.1; break; // Strong beat
            case 1: targetSpeed = 0.95; break; // Weak beat
            case 2: targetSpeed = 1.05; break; // Medium beat
            case 3: targetSpeed = 0.98; break; // Weak beat
        }
        
        // Smoothly adjust playback speed
        const currentSpeed = this.mainVideoPlayer.playbackRate;
        const newSpeed = currentSpeed + (targetSpeed - currentSpeed) * 0.1;
        this.mainVideoPlayer.playbackRate = Math.max(0.5, Math.min(2.0, newSpeed));
    }
    
    applyBeatSnapping(mode) {
        if (mode === 'off' || this.beatMarkers.length === 0) return;
        
        const beatPeriod = 60 / this.bpm;
        let snapTo = beatPeriod; // Default to quarter notes
        
        switch(mode) {
            case 'quarter': snapTo = beatPeriod; break;
            case 'half': snapTo = beatPeriod * 2; break;
            case 'whole': snapTo = beatPeriod * 4; break;
        }
        
        // Snap all image clips to nearest beat
        this.clips.forEach(clip => {
            if (clip.type === 'image') {
                const snappedTime = Math.round(clip.startTime / snapTo) * snapTo;
                clip.startTime = Math.max(0, snappedTime);
                this.updateClipElement(clip);
            }
        });
        
        this.showStatus(`Image clips snapped to ${mode} notes`, 'success');
    }
    
    // Video Sync Methods
    syncSelectedVideos() {
        if (this.selectedClips.size === 0) {
            this.showStatus('No video clips selected', 'error');
            return;
        }
        
        if (this.beatMarkers.length === 0) {
            this.showStatus('No beats analyzed yet. Please analyze audio first.', 'error');
            return;
        }
        
        const videoClips = this.clips.filter(clip => 
            clip.type === 'video' && this.selectedClips.has(clip.id)
        );
        
        if (videoClips.length === 0) {
            this.showStatus('No video clips selected', 'error');
            return;
        }
        
        this.syncVideosToBeats(videoClips);
    }
    
    syncAllVideos() {
        const videoClips = this.clips.filter(clip => clip.type === 'video');
        
        if (videoClips.length === 0) {
            this.showStatus('No video clips in timeline', 'error');
            return;
        }
        
        if (this.beatMarkers.length === 0) {
            this.showStatus('No beats analyzed yet. Please analyze audio first.', 'error');
            return;
        }
        
        this.syncVideosToBeats(videoClips);
    }
    
    syncVideosToBeats(videoClips) {
        if (this.beatMarkers.length === 0) return;
        
        const beatPeriod = 60 / this.bpm;
        const totalBeats = this.beatMarkers.length;
        
        // Sort video clips by start time
        videoClips.sort((a, b) => a.startTime - b.startTime);
        
        // Assign beats to each video clip
        videoClips.forEach((clip, index) => {
            const startBeatIndex = Math.min(index * this.beatsPerVideo, totalBeats - 1);
            const endBeatIndex = Math.min(startBeatIndex + this.beatsPerVideo - 1, totalBeats - 1);
            
            const startBeat = this.beatMarkers[startBeatIndex];
            const endBeat = this.beatMarkers[endBeatIndex];
            
            // Calculate new start time and duration
            let newStartTime, newDuration;
            
            switch(this.syncPrecision) {
                case 'exact':
                    newStartTime = startBeat;
                    newDuration = endBeat - startBeat;
                    break;
                    
                case 'snap':
                    // Snap to nearest beat
                    newStartTime = this.snapToNearestBeat(clip.startTime);
                    const snapEnd = this.snapToNearestBeat(clip.startTime + clip.duration);
                    newDuration = snapEnd - newStartTime;
                    break;
                    
                case 'relative':
                    // Keep relative position but align start to beat
                    const relativeStart = clip.startTime - this.findPreviousBeat(clip.startTime);
                    newStartTime = startBeat + relativeStart;
                    newDuration = clip.duration * (endBeat - startBeat) / (this.beatsPerVideo * beatPeriod);
                    break;
            }
            
            // Update clip
            clip.startTime = Math.max(0, newStartTime);
            clip.duration = Math.max(0.5, newDuration);
            clip.beatSynced = true;
            clip.syncData = {
                mode: this.videoSyncMode,
                beatsPerVideo: this.beatsPerVideo,
                startBeatIndex,
                endBeatIndex
            };
            
            // Update video element playback if needed
            if (this.mainVideoPlayer && clip.id === this.currentVideoClip && this.videoSyncMode === 'speed') {
                const targetDuration = endBeat - startBeat;
                const originalDuration = clip.duration;
                const speedFactor = originalDuration / targetDuration;
                this.mainVideoPlayer.playbackRate = Math.max(0.5, Math.min(2.0, speedFactor));
            }
            
            this.updateClipElement(clip);
        });
        
        this.showStatus(`Synced ${videoClips.length} video(s) to beats`, 'success');
    }
    
    autoSyncVideos() {
        const videoClips = this.clips.filter(clip => clip.type === 'video');
        
        if (videoClips.length === 0) {
            this.showStatus('No video clips in timeline', 'error');
            return;
        }
        
        if (this.beatMarkers.length === 0) {
            this.showStatus('No beats analyzed yet. Please analyze audio first.', 'error');
            return;
        }
        
        // Auto-calculate best beats per video based on video lengths
        videoClips.forEach(clip => {
            const idealBeats = Math.round(clip.duration / (60 / this.bpm));
            const beatsPerVideo = Math.max(1, Math.min(16, idealBeats));
            
            this.beatsPerVideo = beatsPerVideo;
            this.beatsPerVideoSlider.value = beatsPerVideo;
            this.beatsPerVideoValue.textContent = beatsPerVideo;
        });
        
        this.syncVideosToBeats(videoClips);
    }
    
    clearVideoSync() {
        this.clips.forEach(clip => {
            if (clip.type === 'video') {
                clip.beatSynced = false;
                clip.syncData = null;
                
                // Reset video playback rate
                if (this.mainVideoPlayer && clip.id === this.currentVideoClip) {
                    this.mainVideoPlayer.playbackRate = 1.0;
                    this.mainVideoPlayer.style.filter = '';
                }
                
                this.updateClipElement(clip);
            }
        });
        
        this.selectedClips.clear();
        this.showStatus('Cleared video sync', 'success');
    }
    
    syncSelectedImages() {
        if (this.selectedClips.size === 0) {
            this.showStatus('No image clips selected', 'error');
            return;
        }
        
        if (this.beatMarkers.length === 0) {
            this.showStatus('No beats analyzed yet. Please analyze audio first.', 'error');
            return;
        }
        
        const imageClips = this.clips.filter(clip => 
            clip.type === 'image' && this.selectedClips.has(clip.id)
        );
        
        if (imageClips.length === 0) {
            this.showStatus('No image clips selected', 'error');
            return;
        }
        
        this.syncImagesToBeats(imageClips);
    }
    
    syncImagesToBeats(imageClips) {
        if (this.beatMarkers.length === 0) return;
        
        const totalBeats = this.beatMarkers.length;
        const beatPeriod = 60 / this.bpm;
        
        // Sort image clips by start time
        imageClips.sort((a, b) => a.startTime - b.startTime);
        
        // Assign beats to each image clip
        imageClips.forEach((clip, index) => {
            const startBeatIndex = Math.min(index * this.beatsPerImage, totalBeats - 1);
            const endBeatIndex = Math.min(startBeatIndex + this.beatsPerImage - 1, totalBeats - 1);
            
            const startBeat = this.beatMarkers[startBeatIndex];
            const endBeat = this.beatMarkers[endBeatIndex];
            
            // Snap start time to beat
            const newStartTime = startBeat;
            const newDuration = endBeat - startBeat;
            
            // Update clip
            clip.startTime = Math.max(0, newStartTime);
            clip.duration = Math.max(0.5, newDuration);
            clip.beatSynced = true;
            
            this.updateClipElement(clip);
        });
        
        this.showStatus(`Synced ${imageClips.length} image(s) to beats`, 'success');
    }
    
    snapToNearestBeat(time) {
        if (this.beatMarkers.length === 0) return time;
        
        let closestBeat = this.beatMarkers[0];
        let minDiff = Math.abs(time - closestBeat);
        
        for (const beat of this.beatMarkers) {
            const diff = Math.abs(time - beat);
            if (diff < minDiff) {
                minDiff = diff;
                closestBeat = beat;
            }
        }
        
        return closestBeat;
    }
    
    findPreviousBeat(time) {
        if (this.beatMarkers.length === 0) return 0;
        
        let previousBeat = 0;
        for (const beat of this.beatMarkers) {
            if (beat <= time) {
                previousBeat = beat;
            } else {
                break;
            }
        }
        
        return previousBeat;
    }
    
    // Beat visualization controls
    toggleBeatVisualization() {
        this.showBeatVisualization = !this.showBeatVisualization;
        this.toggleBeatVizBtn.textContent = this.showBeatVisualization ? 
            'Hide Beat Visualization' : 'Show Beat Visualization';
        
        if (this.showBeatVisualization && this.beatMarkers.length > 0) {
            this.visualizeBeatsOnTimeline(this.beatMarkers);
        } else {
            document.querySelectorAll('.audio-track-beat-marker, .beat-label').forEach(el => el.remove());
        }
        
        this.showStatus(`Beat visualization ${this.showBeatVisualization ? 'shown' : 'hidden'}`, 'info');
    }
    
    toggleBeatNumbers(show) {
        this.showBeatNumbers = show;
        document.querySelectorAll('.beat-label').forEach(label => {
            label.style.display = show ? 'block' : 'none';
        });
    }
    
    updateVizIntensity(value) {
        this.vizIntensity = value / 100;
        this.vizIntensityValue.textContent = `${value}%`;
        
        document.querySelectorAll('.audio-track-beat-marker').forEach(marker => {
            marker.style.opacity = `${0.3 + (this.vizIntensity * 0.7)}`;
        });
    }
    
    // Image Editor Methods
    openImageEditor(media) {
        this.editingClip = {
            mediaId: media.id,
            url: media.url,
            name: media.name,
            type: 'image'
        };
        
        this.loadImageForEditing(media.url);
        this.imageEditorPanel.style.display = 'flex';
        this.editorTitle.textContent = `Edit: ${media.name}`;
        this.imageEditorActive = true;
    }
    
    openImageEditorForClip(clip) {
        this.editingClip = clip;
        
        // Use edited image if available
        const imageUrl = clip.editedUrl || clip.url;
        this.loadImageForEditing(imageUrl);
        this.imageEditorPanel.style.display = 'flex';
        this.editorTitle.textContent = `Edit: ${clip.name}`;
        this.imageEditorActive = true;
    }
    
    async loadImageForEditing(url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });
        
        this.originalImage = img;
        this.currentImage = img;
        
        // Setup canvas
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        
        // Reset transformations
        this.imageScale = 1;
        this.imageRotation = 0;
        this.imageFlip = { x: 1, y: 1 };
        this.imageOffset = { x: 0, y: 0 };
        
        // Draw image
        this.drawCanvas();
        
        // Reset all sliders
        this.resetEditorControls();
    }
    
    drawCanvas() {
        if (!this.currentImage) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw checkerboard background for transparency
        this.drawCheckerboard();
        
        // Save context state
        this.ctx.save();
        
        // Move to center of canvas
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        
        // Apply transformations
        this.ctx.rotate(this.imageRotation * Math.PI / 180);
        this.ctx.scale(this.imageFlip.x, this.imageFlip.y);
        
        // Calculate scaled dimensions
        const scale = this.imageScale;
        const width = this.currentImage.width * scale;
        const height = this.currentImage.height * scale;
        
        // Draw image with offset
        this.ctx.drawImage(
            this.currentImage,
            this.imageOffset.x - width / 2,
            this.imageOffset.y - height / 2,
            width,
            height
        );
        
        // Draw crop overlay if active
        if (this.isCropping && this.cropRect) {
            this.drawCropOverlay();
        }
        
        this.ctx.restore();
    }
    
    drawCheckerboard() {
        const size = 20;
        for (let y = 0; y < this.canvas.height; y += size) {
            for (let x = 0; x < this.canvas.width; x += size) {
                const isLight = ((x + y) / size) % 2 === 0;
                this.ctx.fillStyle = isLight ? '#333' : '#444';
                this.ctx.fillRect(x, y, size, size);
            }
        }
    }
    
    drawCropOverlay() {
        this.ctx.save();
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        // Draw crop rectangle
        this.ctx.strokeRect(
            this.cropRect.x,
            this.cropRect.y,
            this.cropRect.width,
            this.cropRect.height
        );
        
        // Draw dimmed outer areas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        
        // Top
        this.ctx.fillRect(0, 0, this.canvas.width, this.cropRect.y);
        // Bottom
        this.ctx.fillRect(0, this.cropRect.y + this.cropRect.height, 
                         this.canvas.width, this.canvas.height - (this.cropRect.y + this.cropRect.height));
        // Left
        this.ctx.fillRect(0, this.cropRect.y, this.cropRect.x, this.cropRect.height);
        // Right
        this.ctx.fillRect(this.cropRect.x + this.cropRect.width, this.cropRect.y,
                         this.canvas.width - (this.cropRect.x + this.cropRect.width), this.cropRect.height);
        
        this.ctx.restore();
    }
    
    handleCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isCropping) {
            this.cropStart = { x, y };
            this.cropRect = { x, y, width: 0, height: 0 };
        } else {
            // Start dragging image
            this.canvas.style.cursor = 'grabbing';
            this.dragStart = { x, y };
            this.dragImageStart = { ...this.imageOffset };
        }
    }
    
    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isCropping && this.cropStart) {
            this.cropRect.width = x - this.cropRect.x;
            this.cropRect.height = y - this.cropRect.y;
            this.drawCanvas();
        } else if (this.dragStart) {
            const dx = x - this.dragStart.x;
            const dy = y - this.dragStart.y;
            this.imageOffset.x = this.dragImageStart.x + dx;
            this.imageOffset.y = this.dragImageStart.y + dy;
            this.drawCanvas();
        }
    }
    
    handleCanvasMouseUp() {
        this.canvas.style.cursor = 'crosshair';
        this.dragStart = null;
        
        if (this.isCropping) {
            // Ensure crop rectangle is positive
            if (this.cropRect.width < 0) {
                this.cropRect.x += this.cropRect.width;
                this.cropRect.width = -this.cropRect.width;
            }
            if (this.cropRect.height < 0) {
                this.cropRect.y += this.cropRect.height;
                this.cropRect.height = -this.cropRect.height;
            }
        }
    }
    
    handleCanvasWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.imageScale *= delta;
        this.imageScale = Math.max(0.1, Math.min(10, this.imageScale));
        this.scaleSlider.value = this.imageScale * 100;
        this.updateSliderValue('scaleValue', this.imageScale * 100);
        this.drawCanvas();
    }
    
    switchEditorTab(tabName) {
        // Update active tab
        this.editorTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update active tab content
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });
        
        // Handle tab-specific actions
        if (tabName === 'crop') {
            this.isCropping = true;
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.isCropping = false;
            this.canvas.style.cursor = 'default';
        }
    }
    
    canvasZoomIn() {
        this.imageScale *= 1.2;
        this.imageScale = Math.min(10, this.imageScale);
        this.scaleSlider.value = this.imageScale * 100;
        this.updateSliderValue('scaleValue', this.imageScale * 100);
        this.drawCanvas();
    }
    
    canvasZoomOut() {
        this.imageScale *= 0.8;
        this.imageScale = Math.max(0.1, this.imageScale);
        this.scaleSlider.value = this.imageScale * 100;
        this.updateSliderValue('scaleValue', this.imageScale * 100);
        this.drawCanvas();
    }
    
    resetCanvasZoom() {
        this.imageScale = 1;
        this.scaleSlider.value = 100;
        this.updateSliderValue('scaleValue', 100);
        this.drawCanvas();
    }
    
    resetCanvasTransform() {
        this.imageScale = 1;
        this.imageRotation = 0;
        this.imageFlip = { x: 1, y: 1 };
        this.imageOffset = { x: 0, y: 0 };
        
        this.scaleSlider.value = 100;
        this.rotationSlider.value = 0;
        this.opacitySlider.value = 100;
        
        this.updateSliderValue('scaleValue', 100);
        this.updateSliderValue('rotationValue', 0);
        this.updateSliderValue('opacityValue', 100);
        
        this.drawCanvas();
    }
    
    rotateCanvas(degrees) {
        this.imageRotation += degrees;
        this.rotationSlider.value = this.imageRotation;
        this.updateSliderValue('rotationValue', this.imageRotation);
        this.drawCanvas();
    }
    
    flipCanvasHorizontal() {
        this.imageFlip.x *= -1;
        this.drawCanvas();
    }
    
    flipCanvasVertical() {
        this.imageFlip.y *= -1;
        this.drawCanvas();
    }
    
    updateCropAspect(aspect) {
        if (aspect === 'free' || !this.cropRect) return;
        
        let ratio;
        switch(aspect) {
            case '16:9': ratio = 16/9; break;
            case '4:3': ratio = 4/3; break;
            case '1:1': ratio = 1; break;
            case '9:16': ratio = 9/16; break;
            default: return;
        }
        
        this.cropRect.height = this.cropRect.width / ratio;
        this.drawCanvas();
    }
    
    centerCrop() {
        if (!this.cropRect) return;
        
        this.cropRect.x = (this.canvas.width - this.cropRect.width) / 2;
        this.cropRect.y = (this.canvas.height - this.cropRect.height) / 2;
        this.drawCanvas();
    }
    
    resetCrop() {
        this.cropRect = null;
        this.isCropping = false;
        this.drawCanvas();
    }
    
    applyCrop() {
        if (!this.cropRect || !this.currentImage) return;
        
        // Create temporary canvas for cropping
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.cropRect.width;
        tempCanvas.height = this.cropRect.height;
        
        // Draw cropped portion
        tempCtx.drawImage(
            this.canvas,
            this.cropRect.x, this.cropRect.y, this.cropRect.width, this.cropRect.height,
            0, 0, this.cropRect.width, this.cropRect.height
        );
        
        // Create new image from cropped canvas
        const croppedImage = new Image();
        croppedImage.src = tempCanvas.toDataURL();
        
        croppedImage.onload = () => {
            this.currentImage = croppedImage;
            this.resetCrop();
            this.resetCanvasTransform();
            this.showStatus('Image cropped successfully', 'success');
        };
    }
    
    applyBrightness(value) {
        this.updateSliderValue('brightnessValue', value);
        this.applyImageFilter();
    }
    
    applyContrast(value) {
        this.updateSliderValue('contrastValue', value);
        this.applyImageFilter();
    }
    
    applySaturation(value) {
        this.updateSliderValue('saturationValue', value);
        this.applyImageFilter();
    }
    
    applySharpness(value) {
        this.updateSliderValue('sharpnessValue', value);
        this.applyImageFilter();
    }
    
    applyOpacity(value) {
        this.updateSliderValue('opacityValue', value);
        this.drawCanvas(); // Opacity is applied during draw
    }
    
    applyImageFilter() {
        if (!this.currentImage) return;
        
        const brightness = this.brightnessSlider.value / 100;
        const contrast = this.contrastSlider.value / 100;
        const saturation = this.saturationSlider.value / 100;
        
        // Apply filters to canvas
        this.ctx.filter = `
            brightness(${brightness})
            contrast(${contrast})
            saturate(${saturation})
        `;
        
        this.drawCanvas();
        this.ctx.filter = 'none';
    }
    
    applyPreset(preset) {
        switch(preset) {
            case 'vibrant':
                this.brightnessSlider.value = 110;
                this.contrastSlider.value = 120;
                this.saturationSlider.value = 150;
                break;
            case 'dramatic':
                this.brightnessSlider.value = 90;
                this.contrastSlider.value = 150;
                this.saturationSlider.value = 80;
                break;
            case 'warm':
                this.brightnessSlider.value = 105;
                this.contrastSlider.value = 110;
                this.saturationSlider.value = 120;
                break;
            case 'cool':
                this.brightnessSlider.value = 95;
                this.contrastSlider.value = 110;
                this.saturationSlider.value = 80;
                break;
            case 'bw':
                this.brightnessSlider.value = 100;
                this.contrastSlider.value = 120;
                this.saturationSlider.value = 0;
                break;
            case 'reset':
                this.brightnessSlider.value = 100;
                this.contrastSlider.value = 100;
                this.saturationSlider.value = 100;
                this.sharpnessSlider.value = 0;
                break;
        }
        
        this.updateSliderValue('brightnessValue', this.brightnessSlider.value);
        this.updateSliderValue('contrastValue', this.contrastSlider.value);
        this.updateSliderValue('saturationValue', this.saturationSlider.value);
        this.updateSliderValue('sharpnessValue', this.sharpnessSlider.value);
        
        this.applyImageFilter();
    }
    
    toggleBgMethod(method) {
        this.thresholdControls.style.display = method === 'threshold' ? 'block' : 'none';
        this.chromaControls.style.display = method === 'chroma' ? 'block' : 'none';
    }
    
    previewThreshold(value) {
        this.updateSliderValue('thresholdValue', value);
        // Implement threshold preview
    }
    
    previewChroma(value) {
        if (value) this.updateSliderValue('toleranceValue', value);
        // Implement chroma key preview
    }
    
    applyBackgroundRemoval() {
        // Simple background removal simulation
        const method = this.bgRemoveMethod.value;
        
        // Create result canvas
        const resultCanvas = document.createElement('canvas');
        const resultCtx = resultCanvas.getContext('2d');
        
        resultCanvas.width = this.currentImage.width;
        resultCanvas.height = this.currentImage.height;
        
        // Draw original image
        resultCtx.drawImage(this.currentImage, 0, 0);
        
        // Get image data
        const imageData = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
        const data = imageData.data;
        
        // Simple threshold removal (demo)
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            if (avg > 200) { // Simple threshold
                data[i + 3] = 0; // Make transparent
            }
        }
        
        resultCtx.putImageData(imageData, 0, 0);
        
        // Create new image
        const newImage = new Image();
        newImage.src = resultCanvas.toDataURL();
        
        newImage.onload = () => {
            this.currentImage = newImage;
            this.drawCanvas();
            this.showStatus('Background removed (demo)', 'success');
        };
    }
    
    applyRotation(value) {
        this.imageRotation = parseInt(value);
        this.updateSliderValue('rotationValue', value);
        this.drawCanvas();
    }
    
    applyScale(value) {
        this.imageScale = value / 100;
        this.updateSliderValue('scaleValue', value);
        this.drawCanvas();
    }
    
    centerImage() {
        this.imageOffset = { x: 0, y: 0 };
        this.drawCanvas();
    }
    
    positionImage(position) {
        const bounds = {
            width: this.currentImage.width * this.imageScale,
            height: this.currentImage.height * this.imageScale
        };
        
        const canvasCenterX = this.canvas.width / 2;
        const canvasCenterY = this.canvas.height / 2;
        
        switch(position) {
            case 'top-left':
                this.imageOffset = { x: -canvasCenterX + bounds.width/2, y: -canvasCenterY + bounds.height/2 };
                break;
            case 'top-right':
                this.imageOffset = { x: canvasCenterX - bounds.width/2, y: -canvasCenterY + bounds.height/2 };
                break;
            case 'bottom-left':
                this.imageOffset = { x: -canvasCenterX + bounds.width/2, y: canvasCenterY - bounds.height/2 };
                break;
            case 'bottom-right':
                this.imageOffset = { x: canvasCenterX - bounds.width/2, y: canvasCenterY - bounds.height/2 };
                break;
        }
        
        this.drawCanvas();
    }
    
    updateSliderValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `${value}${elementId.includes('Value') ? '%' : elementId.includes('rotation') ? '°' : ''}`;
        }
    }
    
    resetEditorControls() {
        // Reset all sliders to defaults
        const sliders = [
            { id: 'brightnessSlider', value: 100 },
            { id: 'contrastSlider', value: 100 },
            { id: 'saturationSlider', value: 100 },
            { id: 'sharpnessSlider', value: 0 },
            { id: 'rotationSlider', value: 0 },
            { id: 'scaleSlider', value: 100 },
            { id: 'opacitySlider', value: 100 }
        ];
        
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            if (element) {
                element.value = slider.value;
                const valueId = slider.id.replace('Slider', 'Value');
                this.updateSliderValue(valueId, slider.value);
            }
        });
    }
    
    applyImageEdits() {
        if (!this.editingClip || !this.currentImage) return;
        
        // Get edited image as data URL
        const editedCanvas = document.createElement('canvas');
        const editedCtx = editedCanvas.getContext('2d');
        
        editedCanvas.width = this.currentImage.width;
        editedCanvas.height = this.currentImage.height;
        
        // Draw the edited image
        editedCtx.drawImage(this.currentImage, 0, 0);
        
        const editedDataUrl = editedCanvas.toDataURL('image/jpeg', 0.9);
        
        // Update the clip
        if (this.editingClip.id) {
            // Update existing clip
            const clip = this.clips.find(c => c.id === this.editingClip.id);
            if (clip) {
                clip.editedUrl = editedDataUrl;
                clip.editedData = editedDataUrl;
                
                // Update preview if this clip is active
                this.updatePreview();
            }
        } else {
            // Create new media item with edited image
            const newMedia = {
                ...this.editingClip,
                id: Date.now() + Math.random(),
                url: editedDataUrl,
                editedUrl: editedDataUrl,
                editedData: editedDataUrl
            };
            
            this.mediaLibrary.push(newMedia);
            this.renderMediaItem(newMedia);
        }
        
        this.closeImageEditor();
        this.showStatus('Image edits applied successfully', 'success');
    }
    
    closeImageEditor() {
        this.imageEditorPanel.style.display = 'none';
        this.imageEditorActive = false;
        this.editingClip = null;
        this.originalImage = null;
        this.currentImage = null;
        this.isCropping = false;
        this.cropRect = null;
    }
    
play() {
    this.isPlaying = true;
    this.playBtn.disabled = true;
    this.pauseBtn.disabled = false;
    this.videoEnding = false; // Reset
    
    // Play the main video player if there's an active video clip
    const activeVideoClip = this.findActiveVideoClip(this.currentTime);
    
    if (activeVideoClip && this.mainVideoPlayer) {
        // Ensure we're at the right time
        const timeInClip = this.currentTime - activeVideoClip.startTime;
        if (Math.abs(this.mainVideoPlayer.currentTime - timeInClip) > 0.1) {
            this.mainVideoPlayer.currentTime = timeInClip;
        }
        
        if (this.mainVideoPlayer.paused) {
            this.mainVideoPlayer.play().catch(e => {
                console.log('Video play error:', e);
            });
        }
    }
    
    // Play audio elements
    this.updateAudioPlayback();
    this.updateTextOverVideoPreview();
}
updateAudioPlayback() {
    this.audioElements.forEach(audio => {
        const clip = this.clips.find(c => c.audioElement === audio);
        if (clip) {
            const clipStart = clip.startTime;
            const clipEnd = clip.startTime + clip.duration;
            
            if (this.currentTime >= clipStart && this.currentTime <= clipEnd) {
                // Calculate the correct time in the audio clip
                const audioTime = this.currentTime - clipStart;
                
                // Only update if significantly different (prevents stuttering)
                if (Math.abs(audio.currentTime - audioTime) > 0.1) {
                    audio.currentTime = audioTime;
                }
                
                if (audio.paused && this.isPlaying) {
                    audio.play().catch(() => {});
                }
            } else {
                audio.pause();
            }
        }
    });
}
  
  pause() {
    
    this._flushPendingClipSaves(); 
    this.isPlaying = false;
    this.playBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.videoEnding = false;
    // fire and forget
    
    
    // Clear any pending transitions
    if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
        this.transitionTimeout = null;
    }
    
    // Pause the main video player
    if (this.mainVideoPlayer) {
        this.mainVideoPlayer.pause();
    }
    
    // Pause audio elements
    this.audioElements.forEach(audio => {
        if (!audio.paused) {
            audio.pause();
        }
    });
}

stop() {
    this.pause();
    this.currentTime = 0;
    this.playheadSlider.value = 0;
    this.updatePlayhead();
    this.videoEnding = false;
    
    this._flushPendingClipSaves(); 
    // Clear transitions
    if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
        this.transitionTimeout = null;
    }
    
    // Reset video
    if (this.mainVideoPlayer) {
        this.mainVideoPlayer.pause();
        this.mainVideoPlayer.currentTime = 0;
        this.mainVideoPlayer.style.display = 'none';
    }
    
    // Reset audio
    this.audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    
    this.currentVideoClip = null;
    this.previousVideoClipId = null;
    this.lastBeatTime = -1;
    this.updatePreview();
}// Add this helper method to find the active video clip
findActiveVideoClip(time) {
    // Get all video clips sorted by start time
    const videoClips = this.clips
        .filter(clip => clip.type === 'video')
        .sort((a, b) => a.startTime - b.startTime);
    
    // Find the clip that contains this time
    for (const clip of videoClips) {
        if (time >= clip.startTime && time <= clip.startTime + clip.duration) {
            return clip;
        }
    }
    
    return null; // No video at this time
}
// Add this helper method
isValidVideoPosition(clip, timeInClip) {
    return timeInClip >= 0 && timeInClip <= clip.duration;
}  
    createTimeRuler() {
        this.timeRuler.innerHTML = '';
        const width = this.timeRuler.offsetWidth - this.trackContentLeft;
        const totalSeconds = Math.ceil(this.timelineDuration);
        
        for (let i = 0; i <= totalSeconds; i++) {
            const left = (i * this.timelineZoom) + this.trackContentLeft;
            
            const marker = document.createElement('div');
            marker.className = 'time-marker';
            marker.style.left = `${left}px`;
            
            if (i % 5 === 0) {
                const label = document.createElement('div');
                label.className = 'time-label';
                label.textContent = this.formatTime(i);
                label.style.left = `${left}px`;
                this.timeRuler.appendChild(label);
            }
            
            this.timeRuler.appendChild(marker);
        }
    }
    
    updateTimeRuler() {
        this.createTimeRuler();
    }
    
    clearTimeline() {
        if (this.clips.length === 0) return;
        this.isTransitioning = false;
    this.previousVideoClipId = null;
    
    // Clear any pending transitions
    if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
        this.transitionTimeout = null;
    }
        if (confirm('Clear entire timeline? This cannot be undone.')) {
            this.clips.forEach(clip => {
                if (clip.element) {
                    clip.element.remove();
                }
                if (clip.audioElement) {
                    clip.audioElement.pause();
                    const index = this.audioElements.indexOf(clip.audioElement);
                    if (index > -1) {
                        this.audioElements.splice(index, 1);
                    }
                }
                // Clean up blob URLs
                if (clip.blobUrl) {
                    URL.revokeObjectURL(clip.blobUrl);
                }
            });
            
            // Clean up main video player
            if (this.mainVideoPlayer) {
                this.mainVideoPlayer.pause();
                this.mainVideoPlayer.src = '';
                this.mainVideoPlayer.load();
            }
            
            this.clips = [];
            this.imageClips = [];
            this.videoClips = [];
            this.selectedClips.clear();
            this.timelineDuration = this.maxDuration;
            this.currentTime = 0;
            this.playheadSlider.value = 0;
            this.previewOverlay.innerHTML = '';
            this.activeMedia.clear();
            this.videoBuffer.clear();
            this.videoSources.clear();
            this.audioWaveforms.clear();
            this.beatMarkers = [];
            this.lastBeatTime = -1;
            
            // Clear beat markers
            document.querySelectorAll('.audio-track-beat-marker, .beat-label').forEach(el => el.remove());
            
            // Reset audio analysis UI
            if (this.audioAnalysisInfo) {
                this.audioAnalysisInfo.innerHTML = 'No audio analyzed yet';
            }
            
            this.videoPreview.src = '';
            this.videoPreview.style.display = 'none';
            this.currentVideoClip = null;
            this.updatePlayhead();
            this.updateTimeRuler();
            
            this.showStatus('Timeline cleared', 'success');
        }
    }
    
    getTrackForType(type) {
        switch(type) {
            case 'video': return this.videoTrack;
            case 'image': return this.imageTrack;
            case 'audio': return this.audioTrack;
           // case 'text': return this.videoTrack;
             case 'text': return this.textTrack;
            default: return null;
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status ${type}`;
        
        setTimeout(() => {
            this.statusMessage.textContent = '';
            this.statusMessage.className = 'status';
        }, 3000);
    }
 // ==============================================
    // VIDEO TRIMMING MODAL FUNCTIONALITY
    // ==============================================
    
    createVideoTrimmerModal() {
        if (document.getElementById('videoTrimmerModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'videoTrimmerModal';
        modal.className = 'image-editor-panel';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <div class="image-editor-content" style="max-width: 900px; height: auto; min-height: 600px;max-height: 100vh;">
                <div class="editor-header">
                    <h3 id="trimmerTitle">✂️ Trim Video Clip</h3>
                    <div class="btn-group">
                        <button id="closeTrimmerBtn" style="background: var(--error-color);">Cancel</button>
                        <button id="applyTrimBtn" class="primary" style="background: var(--success-color);">Apply Trim</button>
                    </div>
                </div>
                <div class="editor-body" style="flex-direction: column; padding: 20px; overflow-y: auto;">
                    <!-- Video Preview Area -->
                    <div style="background: black; border-radius: 8px; overflow: hidden; margin-bottom: 20px; position: relative; aspect-ratio: 16/9;">
                        <video id="trimmerVideo" controls style="width: 100%; height: 100%; object-fit: contain;"></video>
                    </div>
                    
                    <!-- Timeline Controls -->
                    <div style="background: var(--tertiary-bg); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center;">
                            <div style="display: flex; gap: 10px;">
                                <div style="background: var(--secondary-bg); padding: 5px 10px; border-radius: 4px;">
                                    <span style="color: var(--text-secondary);">Start:</span>
                                    <strong id="trimStartDisplay">00:00</strong>
                                </div>
                                <div style="background: var(--secondary-bg); padding: 5px 10px; border-radius: 4px;">
                                    <span style="color: var(--text-secondary);">End:</span>
                                    <strong id="trimEndDisplay">00:00</strong>
                                </div>
                                <div style="background: var(--secondary-bg); padding: 5px 10px; border-radius: 4px;">
                                    <span style="color: var(--text-secondary);">Duration:</span>
                                    <strong id="trimDurationDisplay">00:00</strong>
                                </div>
                            </div>
                            <div>
                                <button id="resetTrimBtn" style="background: var(--accent-color);">Reset</button>
                            </div>
                        </div>
                        
                        <!-- Trim Sliders -->
                        <div style="margin: 20px 0;">
                            <label style="display: flex; align-items: center; gap: 5px; margin-bottom: 5px;">
                                <span style="min-width: 60px;">Start Time:</span>
                                <input type="range" id="trimStartSlider" min="0" max="100" value="0" style="flex: 1;">
                                <span id="trimStartValue">0.0s</span>
                            </label>
                            
                            <label style="display: flex; align-items: center; gap: 5px;">
                                <span style="min-width: 60px;">End Time:</span>
                                <input type="range" id="trimEndSlider" min="0" max="100" value="100" style="flex: 1;">
                                <span id="trimEndValue">0.0s</span>
                            </label>
                        </div>
                        
                        <!-- Timeline Visualization -->
                        <div style="position: relative; height: 40px; background: var(--primary-bg); border-radius: 4px; margin-top: 10px;">
                            <div id="trimSelection" style="position: absolute; height: 100%; background: rgba(94, 129, 172, 0.5); border: 2px solid var(--accent-color); border-radius: 4px; left: 0%; width: 100%; pointer-events: none;"></div>
                            <div style="position: absolute; height: 100%; width: 2px; background: #ffd700; left: 0%; pointer-events: none;"></div>
                        </div>
                        
                        <!-- Frame Preview Strip (optional) -->
                        <div style="display: flex; gap: 2px; margin-top: 10px; overflow-x: auto; padding: 5px 0;">
                            ${this.generateFramePreviews()}
                        </div>
                    </div>
                    
                    <!-- Trim Controls -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        <button class="trim-preset" data-seconds="1">+1s Start</button>
                        <button class="trim-preset" data-seconds="-1">-1s Start</button>
                        <button class="trim-preset" data-seconds="mark-start">Set to Current</button>
                        <button class="trim-preset" data-seconds="1e">+1s End</button>
                        <button class="trim-preset" data-seconds="-1e">-1s End</button>
                        <button class="trim-preset" data-seconds="mark-end">Set to Current</button>
                    </div>
                    
                    <!-- Info Box -->
                    <div style="margin-top: 20px; padding: 10px; background: var(--secondary-bg); border-radius: 4px; font-size: 0.9rem;">
                        <strong>Original Duration:</strong> <span id="originalDuration">0s</span> | 
                        <strong>Trimmed Duration:</strong> <span id="newDuration">0s</span> | 
                        <strong>Trim Start:</strong> <span id="trimOffset">0s</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add CSS for the modal
        const style = document.createElement('style');
        style.textContent = `
            .trim-preset {
                padding: 8px;
                background: var(--tertiary-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.2s;
            }
            .trim-preset:hover {
                background: var(--accent-color);
            }
            #trimSelection {
                pointer-events: none;
            }
            .frame-preview {
                height: 40px;
                width: 70px;
                background: var(--secondary-bg);
                border-radius: 2px;
                flex-shrink: 0;
                cursor: pointer;
                transition: transform 0.2s;
                object-fit: cover;
            }
            .frame-preview:hover {
                transform: translateY(-2px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            .frame-preview.active {
                border: 2px solid var(--accent-color);
            }
        `;
        document.head.appendChild(style);
        
        this.setupTrimmerEventListeners();
    }
    
    generateFramePreviews() {
        let frames = '';
        for (let i = 0; i < 10; i++) {
            frames += `<img class="frame-preview" id="framePreview${i}" style="display: none;">`;
        }
        return frames;
    }
    
    setupTrimmerEventListeners() {
        const modal = document.getElementById('videoTrimmerModal');
        if (!modal) return;
        
        const closeBtn = document.getElementById('closeTrimmerBtn');
        const applyBtn = document.getElementById('applyTrimBtn');
        const resetBtn = document.getElementById('resetTrimBtn');
        const startSlider = document.getElementById('trimStartSlider');
        const endSlider = document.getElementById('trimEndSlider');
        const video = document.getElementById('trimmerVideo');
        
        closeBtn.addEventListener('click', () => {
            this.closeTrimmerModal();
        });
        
        applyBtn.addEventListener('click', () => {
            this.applyVideoTrim();
        });
        
        resetBtn.addEventListener('click', () => {
            this.resetTrimSliders();
        });
        
        startSlider.addEventListener('input', (e) => {
            this.updateTrimFromSliders();
        });
        
        endSlider.addEventListener('input', (e) => {
            this.updateTrimFromSliders();
        });
        
        // Preset buttons
        document.querySelectorAll('.trim-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.seconds;
                this.handleTrimPreset(action);
            });
        });
        
        // Update video time when clicking on timeline
        const timeline = modal.querySelector('#trimSelection').parentElement;
        timeline.addEventListener('click', (e) => {
            const rect = timeline.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            const time = (percentage / 100) * video.duration;
            video.currentTime = time;
        });
        
        // Generate frame previews when video is loaded
        video.addEventListener('loadedmetadata', () => {
            this.generateFramePreviewsFromVideo(video);
        });
        
        video.addEventListener('timeupdate', () => {
            this.updateCurrentTimeIndicator(video);
        });
    }
    
    generateFramePreviewsFromVideo(video) {
        const duration = video.duration;
        const step = duration / 10;
        
        for (let i = 0; i < 10; i++) {
            const time = i * step;
            this.captureFramePreview(video, time, i);
        }
    }
    
    captureFramePreview(video, time, index) {
        const canvas = document.createElement('canvas');
        canvas.width = 70;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // Seek to time and capture
        video.currentTime = time;
        
        const captureFrame = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameImg = document.getElementById(`framePreview${index}`);
            if (frameImg) {
                frameImg.src = canvas.toDataURL();
                frameImg.style.display = 'block';
                frameImg.dataset.time = time;
                
                // Add click handler to jump to this time
                frameImg.onclick = () => {
                    video.currentTime = time;
                };
            }
        };
        
        if (video.readyState >= 2) {
            captureFrame();
        } else {
            video.addEventListener('seeked', captureFrame, { once: true });
        }
    }
    
    updateCurrentTimeIndicator(video) {
        const indicator = document.querySelector('#trimSelection').parentElement.querySelector('div[style*="background: #ffd700"]');
        if (indicator && video.duration) {
            const percentage = (video.currentTime / video.duration) * 100;
            indicator.style.left = `${percentage}%`;
        }
    }
    
    handleTrimPreset(action) {
        const video = document.getElementById('trimmerVideo');
        if (!video || !video.duration) return;
        
        const startSlider = document.getElementById('trimStartSlider');
        const endSlider = document.getElementById('trimEndSlider');
        
        const currentStart = parseFloat(startSlider.value);
        const currentEnd = parseFloat(endSlider.value);
        const step = (1 / video.duration) * 100;
        
        switch(action) {
            case '1':
                startSlider.value = Math.min(currentEnd - step, currentStart + step);
                break;
            case '-1':
                startSlider.value = Math.max(0, currentStart - step);
                break;
            case 'mark-start':
                const currentTimePercent = (video.currentTime / video.duration) * 100;
                startSlider.value = Math.min(currentEnd - step, currentTimePercent);
                break;
            case '1e':
                endSlider.value = Math.max(currentStart + step, currentEnd - step);
                break;
            case '-1e':
                endSlider.value = Math.min(100, currentEnd + step);
                break;
            case 'mark-end':
                const currentTimePercentEnd = (video.currentTime / video.duration) * 100;
                endSlider.value = Math.max(currentStart + step, currentTimePercentEnd);
                break;
        }
        
        this.updateTrimFromSliders();
    }
    
    updateTrimFromSliders() {
        const video = document.getElementById('trimmerVideo');
        if (!video || !video.duration) return;
        
        const startSlider = document.getElementById('trimStartSlider');
        const endSlider = document.getElementById('trimEndSlider');
        const startDisplay = document.getElementById('trimStartDisplay');
        const endDisplay = document.getElementById('trimEndDisplay');
        const durationDisplay = document.getElementById('trimDurationDisplay');
        const startValue = document.getElementById('trimStartValue');
        const endValue = document.getElementById('trimEndValue');
        const originalDuration = document.getElementById('originalDuration');
        const newDuration = document.getElementById('newDuration');
        const trimOffset = document.getElementById('trimOffset');
        const selection = document.getElementById('trimSelection');
        
        // Ensure start <= end
        let start = parseFloat(startSlider.value);
        let end = parseFloat(endSlider.value);
        
        if (start > end) {
            start = end;
            startSlider.value = start;
        }
        
        const startTime = (start / 100) * video.duration;
        const endTime = (end / 100) * video.duration;
        const trimmedDuration = endTime - startTime;
        
        // Update displays
        startDisplay.textContent = this.formatTime(startTime);
        endDisplay.textContent = this.formatTime(endTime);
        durationDisplay.textContent = this.formatTime(trimmedDuration);
        startValue.textContent = startTime.toFixed(1) + 's';
        endValue.textContent = endTime.toFixed(1) + 's';
        
        originalDuration.textContent = this.formatTime(video.duration);
        newDuration.textContent = this.formatTime(trimmedDuration);
        trimOffset.textContent = startTime.toFixed(1) + 's';
        
        // Update selection overlay
        selection.style.left = start + '%';
        selection.style.width = (end - start) + '%';
        
        // Store trim data for later use
        this.currentTrimData = {
            startTime: startTime,
            endTime: endTime,
            duration: trimmedDuration,
            startPercent: start,
            endPercent: end
        };
    }
    
    resetTrimSliders() {
        const startSlider = document.getElementById('trimStartSlider');
        const endSlider = document.getElementById('trimEndSlider');
        
        startSlider.value = 0;
        endSlider.value = 100;
        
        this.updateTrimFromSliders();
    }
    
    openVideoTrimmer(clip) {
        this.createVideoTrimmerModal();
        
        const modal = document.getElementById('videoTrimmerModal');
        const video = document.getElementById('trimmerVideo');
        const title = document.getElementById('trimmerTitle');
        
        this.trimmingClip = clip;
        
        title.textContent = `✂️ Trim: ${clip.name}`;
        
        // Load video
        video.src = clip.url;
        video.load();
        
        // Set up video loaded handler
        video.onloadedmetadata = () => {
            // Reset sliders
            this.resetTrimSliders();
            
            // Set video to start
            video.currentTime = 0;
            
            // Store original duration
            this.originalVideoDuration = video.duration;
        };
        
        modal.style.display = 'flex';
    }
    
    closeTrimmerModal() {
        const modal = document.getElementById('videoTrimmerModal');
        if (modal) {
            const video = document.getElementById('trimmerVideo');
            video.pause();
            video.src = '';
            modal.style.display = 'none';
        }
        this.trimmingClip = null;
        this.currentTrimData = null;
    }
    
    applyVideoTrim() {
    if (!this.trimmingClip || !this.currentTrimData) {
        this.showStatus('No trim data available', 'error');
        return;
    }
    
    const clip = this.trimmingClip;
    const trimData = this.currentTrimData;
    
    this.showStatus('Processing trimmed video...', 'info');
    
    // Create a new video element to extract the trimmed segment
    const tempVideo = document.createElement('video');
    tempVideo.crossOrigin = 'anonymous';
    tempVideo.src = clip.url;
    tempVideo.currentTime = trimData.startTime;
    
    // Create canvas for frame capture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set up MediaRecorder with better codec support
    let mediaRecorder;
    let chunks = [];
    
    // Function to start recording
    const startRecording = () => {
        // Try different MIME types for better compatibility
        const mimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];
        
        let selectedMimeType = '';
        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                selectedMimeType = mimeType;
                break;
            }
        }
        
        try {
            const stream = canvas.captureStream(30); // 30 FPS
            const options = {
                mimeType: selectedMimeType,
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            };
            
            mediaRecorder = new MediaRecorder(stream, options);
            chunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: selectedMimeType || 'video/webm' });
                const trimmedUrl = URL.createObjectURL(blob);
                
                // Update the clip with trimmed data
                clip.url = trimmedUrl;
                clip.duration = trimData.duration;
                clip.trimStart = trimData.startTime;
                clip.trimEnd = trimData.endTime;
                clip.isTrimmed = true;
                clip.trimmedBlob = blob;
                clip.originalUrl = this.trimmingClip.url; // Store original URL for reference
                
                // Update clip element in timeline
                this.updateClipElement(clip);
                
                // If this clip is currently playing, update the video player
                if (this.currentVideoClip === clip.id && this.mainVideoPlayer) {
                    this.mainVideoPlayer.src = trimmedUrl;
                    this.mainVideoPlayer.load();
                    this.mainVideoPlayer.currentTime = 0;
                    
                    if (this.isPlaying) {
                        this.mainVideoPlayer.play().catch(e => {
                            console.log('Video play error:', e);
                        });
                    }
                }
                
                // Update preview
                this.updatePreview();
                
                // Save to database if available
                if (typeof this.autoSaveClipToDatabase === 'function') {
                    this.autoSaveClipToDatabase(clip);
                }
                
                this.showStatus(`Video trimmed to ${this.formatTime(trimData.duration)}`, 'success');
                
                // Close modal
                this.closeTrimmerModal();
                
                // Clean up
                stream.getTracks().forEach(track => track.stop());
            };
            
            // Start recording
            mediaRecorder.start();
            
            // Stop recording after duration
            setTimeout(() => {
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
            }, trimData.duration * 1000);
            
        } catch (error) {
            console.error('MediaRecorder error:', error);
            this.showStatus('Failed to trim video: ' + error.message, 'error');
        }
    };
    
    // Function to draw video frames to canvas
    const drawFrame = () => {
        if (!tempVideo.paused && !tempVideo.ended) {
            // Set canvas dimensions to match video
            if (canvas.width !== tempVideo.videoWidth || canvas.height !== tempVideo.videoHeight) {
                canvas.width = tempVideo.videoWidth;
                canvas.height = tempVideo.videoHeight;
            }
            
            // Draw current frame
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            
            requestAnimationFrame(drawFrame);
        }
    };
    
    // Set up video event handlers
    tempVideo.addEventListener('loadedmetadata', () => {
        canvas.width = tempVideo.videoWidth;
        canvas.height = tempVideo.videoHeight;
    });
    
    tempVideo.addEventListener('seeked', () => {
        // Start playing and drawing frames
        tempVideo.play();
        drawFrame();
        startRecording();
    }, { once: true });
    
    tempVideo.addEventListener('error', (e) => {
        console.error('Video error:', e);
        this.showStatus('Error loading video for trimming', 'error');
        this.closeTrimmerModal();
    });
    
    // Load and seek to start time
    tempVideo.load();
}
    
    // Helper method to add trim option to context menu
    addTrimToContextMenu(menu, clip) {
        if (clip.type === 'video') {
            const trimItem = document.createElement('div');
            trimItem.className = 'context-menu-item';
            trimItem.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                color: var(--text-primary);
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 8px;
                border-bottom: 1px solid var(--border-color);
            `;
            trimItem.innerHTML = '✂️ Trim Video Clip';
            
            trimItem.addEventListener('click', () => {
                this.openVideoTrimmer(clip);
                menu.remove();
            });
            
            menu.insertBefore(trimItem, menu.firstChild);
        }
    }}
