// ============================================================
// FastVideoRenderer — Phase 1
// Canvas + MediaRecorder. UI is a Preact component that
// subscribes via onProgress / onComplete / onError callbacks.
// ============================================================

export class FastVideoRenderer {
    constructor(editor) {
        this.editor = editor;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRendering = false;
        this.cancelled = false;
        this.videoCache = new Map();
        this.imageCache = new Map();
        this.renderStartTime = 0;
        this.totalFrames = 0;
        this.totalDuration = 0;

        // Callbacks — set by Preact component
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }

    cancel() {
        this.cancelled = true;
        this.isRendering = false;
    }

    async renderFast(editor, settings = {}) {
        const startTime = performance.now();
        this.isRendering = true;
        this.cancelled = false;

        const width = settings.width || 1280;
        const height = settings.height || 720;
        const fps = settings.fps || 30;
        const quality = settings.quality || 'medium';

        let totalDuration = 0;
        for (const clip of (editor.clips || [])) {
            const end = (clip.startTime || 0) + (clip.duration || 0);
            if (end > totalDuration) totalDuration = end;
        }
        if (totalDuration === 0) totalDuration = 5;

        this.totalDuration = totalDuration;
        this.totalFrames = Math.ceil(totalDuration * fps);
        this.canvas.width = width;
        this.canvas.height = height;

        this._progress(5, 'Loading media files...');
        await this.preloadMedia(editor);
        if (this.cancelled) throw new Error('Render cancelled');

        const bitrate = quality === 'high' ? 8000000 :
                        quality === 'medium' ? 4000000 : 2000000;
        const stream = this.canvas.captureStream(fps);

        const recorder = new MediaRecorder(stream, {
            mimeType: 'video/webm',
            videoBitsPerSecond: bitrate
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.start(100);

        for (let frame = 0; frame < this.totalFrames; frame++) {
            if (this.cancelled) {
                recorder.stop();
                throw new Error('Render cancelled');
            }
            const t = frame / fps;
            await this.renderFrame(editor, t, width, height);

            const progress = ((frame + 1) / this.totalFrames) * 100;
            if (frame % 10 === 0 || frame === this.totalFrames - 1) {
                const eta = this.calculateETA(startTime, frame, this.totalFrames);
                this._progress(progress,
                    `Frame ${frame + 1}/${this.totalFrames} — ${t.toFixed(1)}s — ETA ${eta}`);
            }
            if (frame % 30 === 0) await new Promise(r => setTimeout(r, 0));
        }

        const blob = await new Promise((resolve) => {
            recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
            recorder.stop();
        });

        const renderTime = (performance.now() - startTime) / 1000;
        const speedup = totalDuration / renderTime;

        this.isRendering = false;
        const result = { blob, renderTime, speedup, duration: totalDuration };
        this.onComplete?.(result);
        return result;
    }

    _progress(percent, message) {
        this.onProgress?.({ percent, message });
    }

    async preloadMedia(editor) {
        const promises = [];
        for (const clip of (editor.clips || [])) {
            if (clip.type === 'video' && clip.url && !this.videoCache.has(clip.url)) {
                promises.push(this.loadVideo(clip.url));
            } else if (clip.type === 'image' && clip.url && !this.imageCache.has(clip.url)) {
                promises.push(this.loadImage(clip.url));
            }
        }
        let loaded = 0;
        for (const p of promises) {
            if (this.cancelled) return;
            await p;
            loaded++;
            this._progress(5 + (loaded / promises.length) * 5,
                `Loaded ${loaded}/${promises.length} media files`);
        }
    }

    loadVideo(url) {
        return new Promise((resolve, reject) => {
            const v = document.createElement('video');
            v.src = url;
            v.preload = 'auto';
            v.muted = true;
            v.crossOrigin = 'anonymous';
            v.onloadedmetadata = () => {
                v.currentTime = 0;
                this.videoCache.set(url, v);
                resolve(v);
            };
            v.onerror = () => reject(new Error('Video load failed: ' + url));
            v.load();
        });
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => { this.imageCache.set(url, img); resolve(img); };
            img.onerror = () => reject(new Error('Image load failed: ' + url));
            img.src = url;
        });
    }

    async renderFrame(editor, t, width, height) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, width, height);

        const active = (editor.clips || []).filter(c =>
            t >= (c.startTime || 0) && t <= (c.startTime || 0) + (c.duration || 0)
        ).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        for (const clip of active) {
            if (clip.type === 'video') await this.drawVideoFrame(clip, t, width, height);
            else if (clip.type === 'image') this.drawImageFrame(clip, width, height);
            else if (clip.type === 'text') this.drawTextFrame(clip, width, height, t);
        }
    }

    async drawVideoFrame(clip, currentTime, width, height) {
        const v = this.videoCache.get(clip.url);
        if (!v || !v.videoWidth) return;
        const tIn = currentTime - (clip.startTime || 0);
        const seek = (clip.trimStart || 0) + tIn;
        if (Math.abs(v.currentTime - seek) > 0.05) {
            v.currentTime = seek;
            await new Promise((resolve) => {
                const onS = () => { v.removeEventListener('seeked', onS); resolve(); };
                v.addEventListener('seeked', onS);
                setTimeout(resolve, 50);
            });
        }
        if (v.readyState >= 2) {
            const a = v.videoWidth / v.videoHeight;
            const c = width / height;
            let dw, dh, x, y;
            if (a > c) { dh = height; dw = height * a; x = (width - dw) / 2; y = 0; }
            else { dw = width; dh = width / a; x = 0; y = (height - dh) / 2; }
            this.ctx.drawImage(v, x, y, dw, dh);
        }
    }

    drawImageFrame(clip, width, height) {
        const img = this.imageCache.get(clip.url);
        if (!img || !img.complete) return;
        const a = img.width / img.height;
        const c = width / height;
        let dw, dh, x, y;
        if (a > c) { dh = height; dw = height * a; x = (width - dw) / 2; y = 0; }
        else { dw = width; dh = width / a; x = 0; y = (height - dh) / 2; }
        this.ctx.drawImage(img, x, y, dw, dh);
    }

    drawTextFrame(clip, width, height, currentTime) {
        const tIn = currentTime - (clip.startTime || 0);
        const prog = tIn / (clip.duration || 1);
        let opacity = 1;
        if (prog < 0.1) opacity = prog / 0.1;
        if (prog > 0.9) opacity = (1 - prog) / 0.1;

        this.ctx.fillStyle = `rgba(0,0,0,${0.5 * opacity})`;
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const text = clip.text || 'Text';
        const maxW = width - 100;
        const words = text.split(' ');
        const lines = [];
        let cur = '';
        for (const w of words) {
            const test = cur + (cur ? ' ' : '') + w;
            if (this.ctx.measureText(test).width > maxW && cur) {
                lines.push(cur); cur = w;
            } else cur = test;
        }
        lines.push(cur);

        const lh = 60;
        const startY = (height - (lines.length - 1) * lh) / 2;
        lines.forEach((ln, i) => this.ctx.fillText(ln, width / 2, startY + i * lh));
    }

    calculateETA(startTime, currentFrame, totalFrames) {
        const elapsed = (performance.now() - startTime) / 1000;
        const fps = (currentFrame + 1) / elapsed;
        const remaining = (totalFrames - (currentFrame + 1)) / fps;
        if (remaining < 60) return Math.ceil(remaining) + 's';
        return Math.floor(remaining / 60) + 'm ' + Math.ceil(remaining % 60) + 's';
    }
}
