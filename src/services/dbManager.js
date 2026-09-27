// ============================================================
// SupabaseDBManager — replaces IndexedDBManager
//
// Metadata lives in Supabase. Media blobs are ALSO mirrored into
// IndexedDB via window.blobStore for reload-safety. Supabase
// stores blob_key (nullable) pointing at the IndexedDB entry.
//
// If window.blobStore is undefined, everything falls back to the
// original behaviour — no crashes, no missing features.
// ============================================================

export class SupabaseDBManager {
    constructor(client) {
        this.client = client;
        this.dbName = 'VideoEditorDBX';
        this.version = 8;
        this.db = {};
        this.editor = null;

        const savedId = localStorage.getItem('currentProjectId');
        const savedName = localStorage.getItem('currentProjectName');
        this.currentProjectId = savedId && savedId !== 'null' ? savedId : null;
        this.currentProjectName = savedName && savedName !== 'null' ? savedName : null;
        console.log('📂 Restored project ID:', this.currentProjectId);
    }

    async init() {
        if (!this.client) throw new Error('Supabase client missing');
        const { error } = await this.client.from('projects').select('id').limit(1);
        if (error) throw error;
        console.log('✅ Supabase connection verified');
        this.setupAutoSave();
        return this.db;
    }

    _saveProjectIdToStorage() {
        if (this.currentProjectId) {
            localStorage.setItem('currentProjectId', this.currentProjectId);
            localStorage.setItem('currentProjectName', this.currentProjectName || '');
        } else {
            localStorage.removeItem('currentProjectId');
            localStorage.removeItem('currentProjectName');
        }
    }

    clearCurrentProject() {
        this.currentProjectId = null;
        this.currentProjectName = null;
        this._saveProjectIdToStorage();
    }

    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------
    async saveCurrentProject(editor, isAutoSave = false) {
        if (!this.client) throw new Error('No Supabase client');
        const projectName = editor?.projectName ||
            document.getElementById('projectName')?.value ||
            `Project ${new Date().toLocaleDateString()}`;
        const now = new Date().toISOString();

        let projectId = this.currentProjectId || ('project_' + Date.now());
        this.currentProjectId = projectId;
        this.currentProjectName = projectName;
        this._saveProjectIdToStorage();

        // 1. Project row
        const projectData = {
            id: projectId,
            name: projectName,
            created_at: now,
            updated_at: now,
            clip_count: editor.clips?.length || 0,
            duration: this._calculateProjectDuration(editor),
            is_auto_save: isAutoSave,
            thumbnail: await this._generateThumbnail(editor)
        };

        const { data: existing } = await this.client
            .from('projects').select('created_at').eq('id', projectId).maybeSingle();
        if (existing?.created_at) projectData.created_at = existing.created_at;

        const { error: projErr } = await this.client
            .from('projects').upsert(projectData, { onConflict: 'id' });
        if (projErr) throw projErr;

        // 2. Media metadata (+ optional blob_key)
        await this.client.from('media').delete().eq('project_id', projectId);
        if (editor.mediaLibrary?.length) {
            const rows = editor.mediaLibrary.map(media => {
                let mediaUrl = media.url;
                if (media.url && media.url.startsWith('blob:')) {
                    const fileName = media.name || 'unknown';
                    if (media.type === 'video' || media.type === 'audio') {
                        mediaUrl = `./vid/${fileName}`;
                    }
                }
                return {
                    project_id: projectId,
                    media_id: String(media.id),
                    type: media.type,
                    name: media.name,
                    url: mediaUrl,
                    thumbnail: media.thumbnail,
                    duration: media.duration || 5,
                    blob_key: media.blobKey || null   // null when blobStore isn't used
                };
            });
            const { error } = await this.client.from('media').insert(rows);
            if (error) throw error;
            console.log(`✅ Saved ${rows.length} media rows`);
        }

        // 3. Clips
        await this.client.from('clips').delete().eq('project_id', projectId);
        if (editor.clips?.length) {
            const rows = editor.clips.map((c, i) => ({
                project_id: projectId,
                clip_id: String(c.id || `clip_${Date.now()}_${i}`),
                type: c.type || 'unknown',
                start_time: c.startTime || 0,
                duration: c.duration || 5,
                name: c.name || 'Clip',
                track: this._getTrackName(c.track),
                data: this._extractClipData(c, editor)
            }));
            const { error } = await this.client.from('clips').insert(rows);
            if (error) throw error;
        }

        // 4. Settings
        await this.client.from('settings').delete().eq('project_id', projectId);
        const settings = this._collectEditorSettings();
        const settingRows = Object.entries(settings).map(([k, v]) => ({
            project_id: projectId,
            setting_key: k,
            value: v,
            updated_at: now
        }));
        if (settingRows.length) {
            const { error } = await this.client.from('settings').insert(settingRows);
            if (error) throw error;
        }

        // 5. Audio analysis
        if (window.audioAnalysis) {
            await this.client.from('audio_analysis').upsert({
                project_id: projectId,
                audio_id: 'main',
                bpm: window.audioAnalysis.bpm,
                beats: window.audioAnalysis.beats || [],
                duration: window.audioAnalysis.duration || 0,
                updated_at: now
            }, { onConflict: 'project_id,audio_id' });
        }

        console.log('🎉 Project saved:', projectName);
        return projectId;
    }

    // --------------------------------------------------------
    // LOAD
    // --------------------------------------------------------
    async loadProject(projectId, editor) {
        const { data: project, error } = await this.client
            .from('projects').select('*').eq('id', projectId).maybeSingle();
        if (error) throw error;
        if (!project) throw new Error(`Project not found: ${projectId}`);

        this.currentProjectId = projectId;
        this.currentProjectName = project.name;
        this._saveProjectIdToStorage();

        if (editor.clearTimeline) editor.clearTimeline();
        if (editor.mediaGrid) editor.mediaGrid.innerHTML = '';
        if (editor.mediaLibrary) editor.mediaLibrary = [];

        // Media
        const { data: mediaItems } = await this.client
            .from('media').select('*').eq('project_id', projectId);

        const normalized = (mediaItems || []).map(m => ({
            projectId: m.project_id,
            mediaId: m.media_id,
            type: m.type,
            name: m.name,
            url: m.url,
            thumbnail: m.thumbnail,
            duration: m.duration,
            blobKey: m.blob_key || null
        }));

        for (const md of normalized) {
            await this._restoreMedia(editor, md);
        }

        // Clips
        const { data: clipRows } = await this.client
            .from('clips').select('*').eq('project_id', projectId)
            .order('start_time', { ascending: true });

        for (const c of (clipRows || [])) {
            await this._restoreClip(editor, {
                projectId: c.project_id,
                clipId: c.clip_id,
                type: c.type,
                startTime: c.start_time,
                duration: c.duration,
                name: c.name,
                track: c.track,
                data: c.data
            });
        }

        // Settings
        const { data: settings } = await this.client
            .from('settings').select('*').eq('project_id', projectId);
        this._applySettings(editor, (settings || []).map(s => ({
            settingKey: s.setting_key,
            value: s.value
        })));

        // Audio analysis
        const { data: aa } = await this.client
            .from('audio_analysis').select('*')
            .eq('project_id', projectId).limit(1);
        if (aa?.[0]) {
            window.audioAnalysis = {
                bpm: aa[0].bpm,
                beats: aa[0].beats || [],
                duration: aa[0].duration || 0
            };
            this._updateAudioAnalysisUI(editor);
        }

        if (editor.updateTimeRuler) editor.updateTimeRuler();
        if (editor.updatePreview) editor.updatePreview();
        editor.clips?.forEach(c => editor.updateClipElement?.(c));

        return project;
    }

    async getAllProjects() {
        const { data, error } = await this.client
            .from('projects').select('*')
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(p => ({
            id: p.id,
            name: p.name,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            clipCount: p.clip_count || 0,
            duration: p.duration || 0,
            isAutoSave: p.is_auto_save || false,
            thumbnail: p.thumbnail
        }));
    }

    async deleteProject(projectId) {
        // Optional: clean up IndexedDB blobs belonging to this project
        try {
            if (window.blobStore) {
                const { data: mediaRows } = await this.client
                    .from('media').select('blob_key')
                    .eq('project_id', projectId);

                if (mediaRows?.length) {
                    for (const row of mediaRows) {
                        if (row.blob_key) {
                            try { await window.blobStore.delete(row.blob_key); } catch {}
                        }
                    }
                    console.log(`🗑️ Removed ${mediaRows.length} blobs from IndexedDB`);
                }
            }
        } catch (err) {
            console.warn('Blob cleanup warning (non-fatal):', err);
        }

        const { error } = await this.client
            .from('projects').delete().eq('id', projectId);
        if (error) throw error;
        if (this.currentProjectId === projectId) this.clearCurrentProject();
    }

    // --------------------------------------------------------
    // Helpers
    // --------------------------------------------------------
    _collectEditorSettings() {
        const ab = document.querySelector('.ratio-btn.active');
        return {
            aspectRatio: ab?.dataset.ratio || '16/9',
            clipDuration: parseInt(document.getElementById('clipDuration')?.value) || 5,
            snapGrid: parseFloat(document.getElementById('snapGrid')?.value) || 1,
            masterVolume: parseInt(document.getElementById('masterVolume')?.value) || 50,
            beatSyncEnabled: document.getElementById('beatSyncToggle')?.checked || false,
            beatSensitivity: parseInt(document.getElementById('beatSensitivity')?.value) || 70,
            maxDuration: parseInt(document.getElementById('maxDuration')?.value) || 60,
            showBeatNumbers: document.getElementById('showBeatNumbers')?.checked || false,
            vizIntensity: parseInt(document.getElementById('vizIntensitySlider')?.value) || 50,
            timelineZoom: window.videoEditor?.timelineZoom || 10,
            updatedAt: new Date().toISOString()
        };
    }

    _applySettings(editor, arr) {
        const s = {};
        arr.forEach(x => s[x.settingKey] = x.value);
        const set = (id, v) => {
            const el = document.getElementById(id);
            if (el && v !== undefined) {
                el.value = v;
                el.oninput?.();
                el.onchange?.();
            }
        };
        document.querySelectorAll('.ratio-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.ratio === s.aspectRatio));
        set('clipDuration', s.clipDuration);
        set('snapGrid', s.snapGrid);
        set('masterVolume', s.masterVolume);
        set('beatSensitivity', s.beatSensitivity);
        set('maxDuration', s.maxDuration);
        set('vizIntensitySlider', s.vizIntensity);
        if (s.timelineZoom && editor.updateTimelineZoom) {
            editor.timelineZoom = s.timelineZoom;
            editor.updateTimelineZoom();
        }
        const b1 = document.getElementById('beatSyncToggle');
        if (b1 && s.beatSyncEnabled !== undefined) b1.checked = s.beatSyncEnabled;
        const b2 = document.getElementById('showBeatNumbers');
        if (b2 && s.showBeatNumbers !== undefined) b2.checked = s.showBeatNumbers;
    }

    _extractClipData(clip, editor) {
        if (clip.type === 'text') {
            return {
                id: clip.id, type: 'text',
                startTime: clip.startTime || 0,
                duration: clip.duration || 3,
                name: clip.name || 'Text Clip',
                text: clip.text || '',
                titleStyle: clip.titleStyle || 'default',
                style: clip.style || null
            };
        }
        const mediaItem = editor.mediaLibrary?.find(m => m.id === clip.mediaId);
        let url = clip.url, fileName = clip.name;
        if (mediaItem) { url = mediaItem.url; fileName = mediaItem.name; }
        if (url?.startsWith('blob:')) {
            const ext = clip.type === 'video' ? '.mp4' : clip.type === 'audio' ? '.mp3' : '';
            fileName = fileName || 'unknown';
            if (!fileName.includes('.') && ext) fileName += ext;
            if (clip.type === 'video' || clip.type === 'audio') url = `./vid/${fileName}`;
            else if (clip.type === 'image' && clip.editedUrl) url = clip.editedUrl;
        }
        return {
            id: clip.id, type: clip.type,
            startTime: clip.startTime || 0,
            duration: clip.duration || 5,
            name: clip.name || 'Clip',
            mediaId: clip.mediaId || null,
            url, fileName,
            beatSynced: clip.beatSynced || false,
            syncData: clip.syncData || null
        };
    }

    _getTrackName(el) {
        if (!el) return 'videoTrack';
        if (typeof el === 'string') return el;
        if (el.id) return el.id;
        if (el.className?.includes('track')) return el.className.split(' ')[0];
        return 'videoTrack';
    }

    // --------------------------------------------------------
    // MEDIA RESTORE
    // Original behaviour preserved. Adds ONE optional step at
    // the top: if the DB URL is a dead blob: URL and we have a
    // blobKey + blobStore, rebuild a fresh blob URL from IDB.
    // --------------------------------------------------------
    async _restoreMedia(editor, mediaData) {
        try {
            // ---- ADDITION: try to rebuild blob: URLs from IndexedDB ----
            let freshBlobUrl = null;
            if (mediaData.blobKey && window.blobStore &&
                (!mediaData.url || mediaData.url.startsWith('blob:'))) {
                try {
                    const blob = await window.blobStore.get(mediaData.blobKey);
                    if (blob) {
                        freshBlobUrl = URL.createObjectURL(blob);
                        console.log('♻️ Restored blob from IndexedDB:', mediaData.blobKey);
                    } else {
                        console.warn('⚠️ Blob missing in IndexedDB:', mediaData.blobKey);
                    }
                } catch (err) {
                    console.warn('Blob restore failed:', err);
                }
            }
            // ---- END ADDITION ----

            if (mediaData.type === 'video' || mediaData.type === 'audio') {
                let mediaUrl = mediaData.url;
                const isBrokenBlob = mediaUrl && mediaUrl.startsWith('blob:');
                const isMissing = !mediaUrl;
                if (isBrokenBlob || isMissing) {
                    mediaUrl = `./vid/${mediaData.name}`;
                }

                // Prefer freshly restored blob if we got one
                const finalUrl = freshBlobUrl || mediaUrl;

                const mediaItem = {
                    id: mediaData.mediaId || Date.now(),
                    name: mediaData.name,
                    type: mediaData.type,
                    url: finalUrl,
                    duration: mediaData.duration || 5,
                    isLocalFile: !freshBlobUrl && finalUrl.startsWith('./vid/'),
                    filePath: !freshBlobUrl && finalUrl.startsWith('./vid/') ? finalUrl : null,
                    thumbnail: mediaData.thumbnail || null,
                    blobKey: mediaData.blobKey || null
                };

                if (!editor.mediaLibrary) editor.mediaLibrary = [];
                editor.mediaLibrary.push(mediaItem);
                if (editor.renderMediaItem) editor.renderMediaItem(mediaItem);

            } else if (mediaData.type === 'image') {
                const finalUrl = freshBlobUrl || mediaData.url;

                const mediaItem = {
                    id: mediaData.mediaId || Date.now(),
                    name: mediaData.name,
                    type: mediaData.type,
                    url: finalUrl,
                    thumbnail: freshBlobUrl || mediaData.thumbnail || mediaData.url,
                    duration: mediaData.duration || 5,
                    isLocalFile: false,
                    blobKey: mediaData.blobKey || null
                };

                if (!editor.mediaLibrary) editor.mediaLibrary = [];
                editor.mediaLibrary.push(mediaItem);
                if (editor.renderMediaItem) editor.renderMediaItem(mediaItem);
            }
        } catch (error) {
            console.warn('Failed to restore media:', mediaData?.name, error);
        }
    }

    async _restoreClip(editor, clipData) {
        try {
            const info = clipData.data || clipData;

            if (info.type === 'text') {
                const clip = {
                    id: info.id || Date.now() + Math.random(),
                    type: 'text',
                    name: info.name || 'Text Clip',
                    text: info.text || info.data?.text || 'Text',
                    startTime: info.startTime || 0,
                    duration: info.duration || 3,
                    track: editor.textTrack,
                    element: null,
                    titleStyle: info.titleStyle || 'default',
                    style: info.style || null
                };
                editor.clips.push(clip);
                editor.renderClip?.(clip);
                editor.updatePreview?.();
                return;
            }

            if (['video', 'image', 'audio'].includes(info.type)) {
                let media = editor.mediaLibrary?.find(m => m.id == info.mediaId);
                if (!media && info.url) {
                    media = {
                        id: info.mediaId || Date.now(),
                        name: info.name || info.type,
                        type: info.type,
                        url: info.url,
                        duration: info.duration || 5
                    };
                    editor.mediaLibrary.push(media);
                    editor.renderMediaItem?.(media);
                }
                if (media && editor.addClipToTimeline) {
                    editor.addClipToTimeline(media);
                    const nc = editor.clips[editor.clips.length - 1];
                    if (nc) {
                        nc.startTime = info.startTime || 0;
                        nc.duration = info.duration || 5;
                        editor.updateClipElement?.(nc);
                    }
                }
            }
        } catch (e) {
            console.warn('restore clip failed:', e);
        }
    }

    _calculateProjectDuration(editor) {
        if (!editor.clips?.length) return 0;
        return editor.clips.reduce((m, c) =>
            Math.max(m, (c.startTime || 0) + (c.duration || 0)), 0);
    }

    async _generateThumbnail(editor) {
        try {
            const vp = editor.videoPlayer || document.getElementById('videoPreview');
            if (vp && vp.videoWidth > 0) {
                const c = document.createElement('canvas');
                c.width = vp.videoWidth; c.height = vp.videoHeight;
                c.getContext('2d').drawImage(vp, 0, 0);
                return c.toDataURL('image/jpeg', 0.7);
            }
        } catch {}
        return null;
    }

    _updateAudioAnalysisUI(editor) {
        const info = document.getElementById('audioAnalysisInfo');
        if (info && editor.audioAnalysis) {
            info.innerHTML = `
                <strong>BPM:</strong> ${editor.audioAnalysis.bpm}<br>
                <strong>Beats:</strong> ${editor.audioAnalysis.beats?.length || 0}<br>
                <strong>Duration:</strong> ${editor.audioAnalysis.duration?.toFixed(1) || 0}s`;
        }
    }

    getCurrentProjectId() { return this.currentProjectId; }
    getCurrentProjectName() { return this.currentProjectName; }

    setupAutoSave() {
        if (this.autoSaveInterval) return;
        this.autoSaveInterval = setInterval(async () => {
            if (this.editor?.clips?.length > 0 && !this.isLoading && this.currentProjectId) {
                try { await this.saveCurrentProject(this.editor, true); }
                catch (e) { console.error('Auto-save failed:', e); }
            }
        }, 2 * 60 * 1000);
    }
}