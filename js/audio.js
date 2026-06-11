(function () {
    'use strict';

    const C = window.CONFIG;

    class EmptyClassroomAudio {
        constructor() {
            this.enabled = C.Audio.enabled;
            this.unlocked = false;
            this.elements = {};
            this.failed = {};
            this.context = null;
            this.masterGain = null;
            this.loopingFallbacks = {};
            this.setupElements();
            this.installUnlockListeners();
        }

        setupElements() {
            Object.entries(C.Audio.files).forEach(([id, meta]) => {
                const audio = new Audio();
                audio.preload = 'auto';
                audio.src = meta.path;
                audio.loop = Boolean(meta.loop);
                audio.volume = meta.volume;
                audio.onerror = () => {
                    this.failed[id] = true;
                };
                this.elements[id] = audio;
            });
        }

        installUnlockListeners() {
            const unlock = () => this.unlock();
            window.addEventListener('pointerdown', unlock, { once: true, passive: true });
            window.addEventListener('keydown', unlock, { once: true });
        }

        unlock() {
            if (this.unlocked) {
                return;
            }
            this.unlocked = true;
            this.ensureContext();
            Object.values(this.elements).forEach((audio) => {
                const oldVolume = audio.volume;
                audio.volume = C.Audio.unlockVolume;
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = C.Common.zero;
                    audio.volume = oldVolume;
                }).catch(() => {
                    audio.volume = oldVolume;
                });
            });
        }

        ensureContext() {
            if (this.context) {
                if (this.context.state === 'suspended') {
                    this.context.resume();
                }
                return this.context;
            }
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                return null;
            }
            this.context = new AudioContext();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = C.Common.maxAlpha;
            this.masterGain.connect(this.context.destination);
            return this.context;
        }

        setEnabled(value) {
            this.enabled = Boolean(value);
            if (!this.enabled) {
                this.stopAll();
            }
        }

        play(id) {
            if (!this.enabled) {
                return;
            }
            const audio = this.elements[id];
            if (audio && !this.failed[id]) {
                try {
                    audio.loop = false;
                    audio.currentTime = C.Common.zero;
                    audio.volume = C.Audio.files[id].volume;
                    const result = audio.play();
                    if (result && result.catch) {
                        result.catch(() => this.playFallback(id));
                    }
                    return;
                } catch (error) {
                    this.failed[id] = true;
                }
            }
            this.playFallback(id);
        }

        loop(id) {
            if (!this.enabled) {
                return;
            }
            const audio = this.elements[id];
            if (audio && !this.failed[id]) {
                try {
                    audio.loop = true;
                    audio.volume = C.Audio.files[id].volume;
                    const result = audio.play();
                    if (result && result.catch) {
                        result.catch(() => this.loopFallback(id));
                    }
                    return;
                } catch (error) {
                    this.failed[id] = true;
                }
            }
            this.loopFallback(id);
        }

        stop(id) {
            const audio = this.elements[id];
            if (audio) {
                audio.pause();
                try {
                    audio.currentTime = C.Common.zero;
                } catch (error) {
                    // Some mobile browsers reject currentTime before metadata is ready.
                }
            }
            const fallback = this.loopingFallbacks[id];
            if (fallback) {
                fallback.stop();
                delete this.loopingFallbacks[id];
            }
        }

        stopAll() {
            Object.keys(this.elements).forEach((id) => this.stop(id));
        }

        setVolume(id, value) {
            const audio = this.elements[id];
            const volume = window.Utils.clamp(value, C.Common.minAlpha, C.Common.maxAlpha);
            if (audio) {
                audio.volume = volume;
            }
            if (C.Audio.files[id]) {
                C.Audio.files[id].volume = volume;
            }
        }

        playFallback(id) {
            const ctx = this.ensureContext();
            if (!ctx || !this.enabled) {
                return;
            }
            if (id === 'ambience' || id === 'bgm_low') {
                this.loopFallback(id);
                return;
            }
            if (id === 'radio_static') {
                this.noiseBurst(C.Audio.fallbackNoiseDuration, C.Audio.files[id].volume);
                return;
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const meta = C.Audio.files[id] || { volume: C.Audio.sfxVolume };
            osc.type = id.indexOf('voice') === C.Common.zero ? 'sawtooth' : 'triangle';
            osc.frequency.value = id === 'windows_slam' ? C.Audio.fallbackClickFrequency : C.Audio.fallbackDroneFrequency;
            gain.gain.setValueAtTime(meta.volume * C.Common.half, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(C.Audio.unlockVolume, ctx.currentTime + C.Audio.fallbackNoiseDuration);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(ctx.currentTime + C.Audio.fallbackNoiseDuration);
        }

        loopFallback(id) {
            const ctx = this.ensureContext();
            if (!ctx || this.loopingFallbacks[id] || !this.enabled) {
                return;
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const meta = C.Audio.files[id] || { volume: C.Audio.bgmVolume };
            osc.type = id === 'ambience' ? 'sine' : 'triangle';
            osc.frequency.value = id === 'ambience' ? C.Audio.fallbackDroneFrequency : C.Audio.fallbackDroneFrequency * C.Common.two;
            gain.gain.value = meta.volume * C.Loading.fallbackVolumeScale;
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            this.loopingFallbacks[id] = {
                stop: () => {
                    try {
                        gain.gain.exponentialRampToValueAtTime(C.Audio.unlockVolume, ctx.currentTime + C.Common.half);
                        osc.stop(ctx.currentTime + C.Common.half);
                    } catch (error) {
                        // The fallback may already be stopped by the browser.
                    }
                }
            };
        }

        noiseBurst(duration, volume) {
            const ctx = this.ensureContext();
            if (!ctx) {
                return;
            }
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(C.Common.one, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(C.Common.zero);
            for (let i = C.Common.zero; i < bufferSize; i += C.Common.one) {
                data[i] = (Math.random() * C.Common.two - C.Common.one) * (C.Common.one - i / bufferSize);
            }
            const source = ctx.createBufferSource();
            const gain = ctx.createGain();
            gain.gain.value = volume || C.Audio.sfxVolume;
            source.buffer = buffer;
            source.connect(gain);
            gain.connect(this.masterGain);
            source.start();
        }
    }

    window.AudioManager = new EmptyClassroomAudio();
}());
