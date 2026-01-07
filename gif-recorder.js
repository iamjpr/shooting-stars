/**
 * GIF Recorder for Canvas Animations
 * Records canvas frames and exports as GIF using gif.js library
 */

class GifRecorder {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.frames = [];
        this.isRecording = false;
        this.frameDelay = options.frameDelay || 50; // ms between frames
        this.duration = options.duration || 5000; // total recording duration
        this.quality = options.quality || 10; // gif.js quality (1-30, lower is better)
        this.width = options.width || 480;
        this.height = options.height || 270;
    }

    start() {
        if (this.isRecording) return;
        
        this.frames = [];
        this.isRecording = true;
        this.startTime = Date.now();
        
        console.log('🎬 Recording started...');
        this.showStatus('Recording... 0%');
        
        this.captureFrame();
    }

    captureFrame() {
        if (!this.isRecording) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(100, Math.round((elapsed / this.duration) * 100));
        
        // Create a scaled-down copy of the canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, 0, 0, this.width, this.height);
        
        // Store frame data
        this.frames.push({
            data: tempCtx.getImageData(0, 0, this.width, this.height),
            delay: this.frameDelay
        });
        
        this.showStatus(`Recording... ${progress}%`);
        
        if (elapsed < this.duration) {
            setTimeout(() => this.captureFrame(), this.frameDelay);
        } else {
            this.stop();
        }
    }

    stop() {
        this.isRecording = false;
        console.log(`🎬 Recording stopped. Captured ${this.frames.length} frames.`);
        this.showStatus('Creating GIF...');
        this.createGif();
    }

    createGif() {
        // Use gif.js library
        const gif = new GIF({
            workers: 2,
            quality: this.quality,
            width: this.width,
            height: this.height,
            workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
        });

        // Add frames
        this.frames.forEach((frame, i) => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.width;
            tempCanvas.height = this.height;
            const ctx = tempCanvas.getContext('2d');
            ctx.putImageData(frame.data, 0, 0);
            gif.addFrame(tempCanvas, { delay: frame.delay, copy: true });
        });

        gif.on('progress', (p) => {
            this.showStatus(`Creating GIF... ${Math.round(p * 100)}%`);
        });

        gif.on('finished', (blob) => {
            console.log('✅ GIF created!');
            this.downloadGif(blob);
            this.hideStatus();
        });

        gif.render();
    }

    downloadGif(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'starfield.gif';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📥 GIF downloaded as starfield.gif');
    }

    showStatus(text) {
        let statusEl = document.getElementById('gif-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'gif-status';
            statusEl.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px 30px;
                border-radius: 8px;
                font-family: system-ui, sans-serif;
                font-size: 16px;
                z-index: 10000;
                border: 1px solid rgba(255, 255, 255, 0.2);
            `;
            document.body.appendChild(statusEl);
        }
        statusEl.textContent = text;
    }

    hideStatus() {
        const statusEl = document.getElementById('gif-status');
        if (statusEl) {
            statusEl.textContent = '✅ GIF downloaded!';
            setTimeout(() => statusEl.remove(), 2000);
        }
    }
}

// Create global recorder instance
let gifRecorder = null;

function startGifRecording() {
    const canvas = document.getElementById('starfield');
    gifRecorder = new GifRecorder(canvas, {
        duration: 3000,     // 3 seconds (faster!)
        frameDelay: 100,    // 10 fps (fewer frames)
        width: 400,         // Smaller width
        height: 225,        // 16:9 ratio
        quality: 20         // Faster encoding (20 is faster than 10)
    });
    gifRecorder.start();
}

// Add keyboard shortcut: Press 'G' to record
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'g' && !gifRecorder?.isRecording) {
        startGifRecording();
    }
});

console.log('💡 Press "G" to record a 6-second GIF of the starfield');
