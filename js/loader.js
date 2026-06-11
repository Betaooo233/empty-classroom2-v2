(function () {
    'use strict';

    const C = window.CONFIG;

    class AssetLoader {
        constructor() {
            this.images = {};
            this.fallbackImages = {};
            this.total = C.Loading.initialCount;
            this.completed = C.Loading.initialCount;
            this.progressHandler = null;
            this.ready = false;
        }

        loadAll(onComplete, onProgress) {
            this.progressHandler = onProgress || function () {};
            const imageEntries = Object.entries(C.Images);
            const audioEntries = Object.entries(C.Audio.files || {});
            this.total = imageEntries.length * C.Loading.imageWeight + audioEntries.length * C.Loading.audioWeight;
            this.completed = C.Loading.initialCount;
            this.ready = false;

            if (!this.total) {
                this.ready = true;
                this.progressHandler(C.Common.maxAlpha);
                onComplete();
                return;
            }

            imageEntries.forEach(([id, path]) => this.loadImage(id, path, onComplete));
            audioEntries.forEach(([id]) => this.loadAudio(id, onComplete));
        }

        loadImage(id, path, onComplete) {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                this.images[id] = img;
                this.tick(onComplete);
            };
            img.onerror = () => {
                img.useFallback = true;
                this.fallbackImages[id] = this.createFallback(id);
                this.images[id] = img;
                this.tick(onComplete);
            };
            img.src = path;
        }

        loadAudio(id, onComplete) {
            const manager = window.AudioManager;
            const audio = manager && manager.elements ? manager.elements[id] : null;
            if (!audio) {
                this.tick(onComplete, C.Loading.audioWeight);
                return;
            }

            let settled = false;
            let timeoutId = null;
            const finish = () => {
                if (settled) {
                    return;
                }
                settled = true;
                window.clearTimeout(timeoutId);
                audio.removeEventListener('canplaythrough', finish);
                audio.removeEventListener('loadeddata', finish);
                audio.removeEventListener('error', finish);
                this.tick(onComplete, C.Loading.audioWeight);
            };

            timeoutId = window.setTimeout(finish, C.Loading.audioTimeoutMs);
            audio.addEventListener('canplaythrough', finish);
            audio.addEventListener('loadeddata', finish);
            audio.addEventListener('error', finish);
            try {
                if (audio.readyState >= C.Common.two) {
                    finish();
                } else {
                    audio.load();
                }
            } catch (error) {
                if (manager.failed) {
                    manager.failed[id] = true;
                }
                finish();
            }
        }

        tick(onComplete, amount) {
            if (this.ready) {
                return;
            }
            this.completed += amount || C.Common.one;
            this.progressHandler(Math.min(this.completed / this.total, C.Common.maxAlpha));
            if (this.completed >= this.total) {
                this.ready = true;
                window.setTimeout(onComplete, C.Timing.loadingMinimumMs);
            }
        }

        getImage(id) {
            return this.images[id] || null;
        }

        isFallback(id) {
            const img = this.images[id];
            return Boolean(img && img.useFallback);
        }

        drawImage(ctx, id, x, y, w, h) {
            const img = this.getImage(id);
            if (img && !img.useFallback && img.complete && img.naturalWidth) {
                ctx.drawImage(img, x, y, w, h);
                return true;
            }
            this.drawFallback(ctx, id, x, y, w, h);
            return false;
        }

        drawFallback(ctx, id, x, y, w, h) {
            const fb = this.fallbackImages[id] || this.createFallback(id);
            ctx.save();
            ctx.fillStyle = fb.bg;
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = fb.line;
            ctx.lineWidth = Math.max(C.Common.two, w * C.Render.fallbackBorderScale);
            const inset = C.Render.fallbackInset;
            ctx.strokeRect(x + inset, y + inset, w - inset * C.Common.two, h - inset * C.Common.two);
            ctx.fillStyle = fb.text;
            ctx.font = `${Math.max(C.UI.largeButtonH * C.Common.quarter, w * C.Render.fallbackFontScale)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(id, x + w * C.Common.half, y + h * C.Common.half);
            ctx.restore();
        }

        createFallback(id) {
            const fallback = {
                bg: C.Colors.cold,
                line: C.Colors.flashlight,
                text: C.Colors.moon
            };
            this.fallbackImages[id] = fallback;
            return fallback;
        }
    }

    window.Loader = new AssetLoader();
}());
