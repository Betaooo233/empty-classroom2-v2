(function () {
    'use strict';

    const C = window.CONFIG;
    const U = window.Utils;

    class EmptyClassroomGame {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.container = null;
            this.loadingScreen = null;
            this.loadingBar = null;
            this.loadingText = null;
            this.startScreen = null;
            this.topControls = null;
            this.inventoryBar = null;
            this.dialogueBox = null;
            this.dialogueText = null;
            this.dialogueFab = null;
            this.dialogueFabIcon = null;
            this.dialogueFabDot = null;
            this.dialogueNext = null;
            this.inventoryFab = null;
            this.inventoryFabIcon = null;
            // 玩家手动意图：是否水平收起道具栏。仅由固定按钮切换
            this.inventoryCollapsed = false;
            // 玩家手动意图：是否收起对话框。仅由固定按钮切换，任何交互都不改它
            this.dialogueCollapsed = false;
            // 收起态下有新旁白未读时为 true，用于按钮红点提示
            this.dialogueHasUnread = false;
            this.toastLayer = null;
            this.modalLayer = null;
            this.arrowLeft = null;
            this.arrowRight = null;
            this.volumeButton = null;
            this.data = window.StorageManager.createNew();
            this.started = false;
            this.running = false;
            this.lastTime = U.now();
            this.frameId = null;
            this.flashlight = {
                x: C.Flashlight.defaultX,
                y: C.Flashlight.defaultY,
                dragging: false,
                locked: false,
                radius: C.Flashlight.outerRadius
            };
            this.scenePointerActive = false;
            this.selectedItem = null;
            this.modalOpen = false;
            this.inputLocked = false;
            this.revealUntil = C.Common.zero;
            this.revealCooldownUntil = C.Common.zero;
            this.hotspotHintsEnabled = this.loadHotspotHintSetting();
            this.tapFeedback = null;
            this.flashWhiteStart = null;
            this.transition = null;
            this.blackboardRevealStart = null;
            this.fanEventStart = null;
            this.jump = null;
            this.shake = { amplitude: C.Camera.baseShake, frames: C.Common.zero };
            this.particles = [];
            this.floats = [];
            this.dialogue = null;
            this.intro = null;
            this.introSkipButton = null;
            this.pendingTimers = [];
            // 待弹出的道具介绍队列与定时器
            this.pendingItemIntros = [];
            this.itemIntroTimer = null;
        }

        init() {
            this.cacheDom();
            U.setCanvasSize(this.canvas);
            this.updateStageScale();
            this.bindStageScale();
            this.bindUi();
            this.renderInventory();
            window.InputManager.init(this.container, {
                onDown: (point, event) => this.onPointerDown(point, event),
                onMove: (point, event) => this.onPointerMove(point, event),
                onUp: (point, event) => this.onPointerUp(point, event),
                onTap: (point, event) => this.onTap(point, event),
                onSwipe: (direction, point, event) => this.onSwipe(direction, point, event)
            });
            this.running = true;
            this.lastTime = U.now();
            this.frameId = U.requestAnimationFrame((time) => this.loop(time));
        }

        cacheDom() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext(C.Canvas.context2d);
            this.container = document.getElementById('game-container');
            this.loadingScreen = document.getElementById('loading-screen');
            this.loadingBar = document.getElementById('loading-bar');
            this.loadingText = document.getElementById('loading-text');
            this.startScreen = document.getElementById('start-screen');
            this.topControls = document.getElementById('top-controls');
            this.inventoryBar = document.getElementById('inventory-bar');
            this.dialogueBox = document.getElementById('dialogue-box');
            this.dialogueText = document.getElementById('dialogue-text');
            this.dialogueFab = document.getElementById('dialogue-fab');
            this.dialogueFabIcon = this.dialogueFab ? this.dialogueFab.querySelector('.dialogue-fab-icon') : null;
            this.dialogueFabDot = document.getElementById('dialogue-fab-dot');
            this.inventoryFab = document.getElementById('inventory-fab');
            this.inventoryFabIcon = this.inventoryFab ? this.inventoryFab.querySelector('.inventory-fab-icon') : null;
            this.dialogueNext = document.getElementById('dialogue-next');
            this.toastLayer = document.getElementById('toast-layer');
            this.modalLayer = document.getElementById('modal-layer');
            this.arrowLeft = document.getElementById('arrow-left');
            this.arrowRight = document.getElementById('arrow-right');
            this.volumeButton = document.getElementById('btn-volume');
            this.hintToggleButton = document.getElementById('btn-hotspot-hint');
            this.introSkipButton = document.getElementById('intro-skip');
        }

        // 统一缩放系数：以 9:16 = 1080×1920 为唯一设计基准，
        // 计算 scale = container 实际宽度 / 1080，写入 --stage-scale / --upx，
        // 让全部 UI 组件作为一个整体按统一比例等比缩放（电脑/各种手机比例一致）。
        updateStageScale() {
            if (!this.container) {
                return;
            }
            const width = this.container.clientWidth || C.Screen.width;
            const scale = width / C.Screen.width;
            const root = document.documentElement;
            root.style.setProperty('--stage-scale', String(scale));
            root.style.setProperty('--upx', scale + 'px');
        }

        bindStageScale() {
            const handler = () => this.updateStageScale();
            window.addEventListener('resize', handler);
            window.addEventListener('orientationchange', handler);
            // 部分浏览器 orientationchange 后尺寸更新有延迟，补一帧重算
            window.addEventListener('orientationchange', () => {
                window.setTimeout(handler, C.Common.hundred);
            });
        }

        bindUi() {
            document.getElementById('btn-start').addEventListener('click', () => this.startNewGame());
            document.getElementById('btn-load-start').addEventListener('click', () => this.loadGame(true));
            this.volumeButton.addEventListener('click', () => this.toggleVolume());
            if (this.introSkipButton) {
                this.introSkipButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.skipIntro();
                });
            }
            if (this.hintToggleButton) {
                this.hintToggleButton.textContent = this.hotspotHintsEnabled ? '高亮提示：开' : '高亮提示：关';
                this.hintToggleButton.addEventListener('click', () => this.toggleHotspotHints());
            }
            this.topControls.addEventListener('click', (event) => {
                const button = event.target.closest('button');
                if (!button) {
                    return;
                }
                this.handleTopAction(button.dataset.action);
            });
            this.arrowLeft.addEventListener('click', (event) => {
                event.stopPropagation();
                this.changeViewByStep(C.Common.negativeOne);
            });
            this.arrowRight.addEventListener('click', (event) => {
                event.stopPropagation();
                this.changeViewByStep(C.Common.one);
            });
            this.dialogueBox.addEventListener('click', (event) => {
                event.stopPropagation();
                this.advanceDialogue();
            });
            if (this.dialogueFab) {
                this.dialogueFab.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.toggleDialogueCollapse();
                });
            }
            if (this.inventoryFab) {
                this.inventoryFab.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.toggleInventoryCollapse();
                });
            }
        }

        updateLoading(progress) {
            const percent = U.toPercent(progress);
            const bar = this.loadingBar || document.getElementById('loading-bar');
            const text = this.loadingText || document.getElementById('loading-text');
            if (bar) {
                bar.style.width = percent;
            }
            if (text) {
                text.textContent = percent;
            }
        }

        showStartScreen() {
            U.setActive(this.loadingScreen, false);
            U.setActive(this.startScreen, true);
            this.intro = null;
            if (this.introSkipButton) {
                this.introSkipButton.classList.add('hidden');
            }
            U.addClass(this.topControls, 'hidden');
            U.addClass(this.inventoryBar, 'hidden');
            U.addClass(this.arrowLeft, 'hidden');
            U.addClass(this.arrowRight, 'hidden');
            this.forceHideDialogue();
            this.closeModal(true);
            this.data = window.StorageManager.createNew();
            this.data.viewId = C.InitialState.startBackdropView;
            this.blackboardRevealStart = null;
        }

        startNewGame() {
            this.clearTimers();
            this.pendingItemIntros = [];
            this.itemIntroTimer = null;
            window.StorageManager.clear();
            this.data = window.StorageManager.createNew();
            this.selectedItem = null;
            this.started = true;
            this.inputLocked = false;
            this.jump = null;
            this.intro = null;
            this.blackboardRevealStart = null;
            this.flashlight.x = C.Flashlight.defaultX;
            this.flashlight.y = C.Flashlight.defaultY;
            this.flashlight.locked = false;
            U.setActive(this.startScreen, false);
            this.renderInventory();
            // 点击开始 → 先播放开场前置剧情；播放完毕或跳过后再无缝进入门厅
            if (!this.data.flags.introPlayed) {
                this.startIntro();
            } else {
                this.enterLobbyStart(true);
            }
        }

        // 正式进入门厅：与现有 LOBBY 流程衔接
        enterLobbyStart(withIntroDialogue) {
            this.intro = null;
            this.inputLocked = false;
            this.data.state = 'LOBBY';
            this.data.sceneGroup = 'lobby';
            this.data.viewId = C.InitialState.firstView;
            this.showGameUi(true);
            this.renderInventory();
            this.startAudioLoops();
            if (withIntroDialogue) {
                this.showDialogue(C.Text.startIntro, { onClose: () => this.showDialogue(C.Text.lobbyFirst) });
            }
            this.autoSave();
        }

        startIntro() {
            this.data.state = 'INTRO';
            this.inputLocked = true;
            this.showGameUi(false);
            this.forceHideDialogue();
            const now = U.now();
            this.intro = {
                frameIndex: C.Common.zero,
                phase: 'in',          // in（交叉淡入/首帧浮现）→ hold（停留+逐字旁白）→ out（结束淡入门厅）
                phaseStart: now,
                clickPlayed: false,
                voicePlayed: false,
                waitingForTap: false,
                finished: false
            };
            // 全局背景音：低频 BGM + 雨声 + 磁带沙沙
            this.startAudioLoops();
            window.AudioManager.loop('intro_tape_hiss');
            window.AudioManager.setVolume('intro_tape_hiss', C.Intro.hissVolume);
            if (this.introSkipButton) {
                this.introSkipButton.classList.remove('hidden');
            }
            this.autoSave();
        }

        skipIntro() {
            if (!this.intro || this.intro.finished) {
                return;
            }
            this.finishIntro();
        }

        // 玩家手动点击翻页：仅在当前画面旁白浮现完且停留满 1 秒后生效
        advanceIntro() {
            const intro = this.intro;
            if (!intro || intro.finished || intro.phase !== 'hold' || !intro.waitingForTap) {
                return;
            }
            if (intro.frameIndex >= C.Intro.frames.length - C.Common.one) {
                this.finishIntro();
                return;
            }
            intro.frameIndex += C.Common.one;
            intro.phase = 'in';
            intro.phaseStart = U.now();
            intro.waitingForTap = false;
        }

        finishIntro() {
            if (this.intro) {
                this.intro.finished = true;
            }
            this.clearTimers();
            if (this.introSkipButton) {
                this.introSkipButton.classList.add('hidden');
            }
            // 磁带杂音 / 广播残响淡出，雨声与 BGM 平滑过渡到门厅
            window.AudioManager.stop('intro_tape_hiss');
            window.AudioManager.stop('intro_voice_broadcast_faint');
            this.data.flags.introPlayed = true;
            this.intro = null;
            // 缓缓淡入门厅
            this.transition = { start: U.now(), duration: C.Intro.outroFadeMs };
            this.enterLobbyStart(false);
            this.setTimer(() => {
                this.showDialogue(C.Text.startIntro, { onClose: () => this.showDialogue(C.Text.lobbyFirst) });
            }, C.Intro.outroFadeMs);
        }

        updateIntro(time) {
            if (!this.intro || this.intro.finished) {
                return;
            }
            const intro = this.intro;
            const frame = C.Intro.frames[intro.frameIndex];
            const elapsed = time - intro.phaseStart;
            if (intro.phase === 'in') {
                const inDuration = intro.frameIndex === C.Common.zero ? C.Intro.firstFadeInMs : C.Intro.crossFadeMs;
                if (intro.frameIndex === C.Common.zero && !intro.clickPlayed && elapsed >= inDuration) {
                    intro.clickPlayed = true;
                    window.AudioManager.play('intro_tape_play_click');
                }
                if (intro.frameIndex === C.Common.one && !intro.voicePlayed) {
                    intro.voicePlayed = true;
                    window.AudioManager.setVolume('intro_tape_hiss', C.Intro.hissEmphasisVolume);
                    window.AudioManager.play('intro_voice_broadcast_faint');
                    this.setTimer(() => window.AudioManager.setVolume('intro_tape_hiss', C.Intro.hissVolume), C.Intro.crossFadeMs);
                }
                if (elapsed >= inDuration) {
                    intro.phase = 'hold';
                    intro.phaseStart = time;
                }
            } else if (intro.phase === 'hold') {
                const captionMs = (Array.from(frame.caption).length / C.Intro.typeCps) * C.Common.msToSeconds;
                // 旁白完整逐字浮现后，停留 1 秒，然后等待玩家手动点击翻页（不再自动跳转）
                const holdTarget = captionMs + C.Intro.holdAfterTextMs;
                if (elapsed >= holdTarget) {
                    intro.waitingForTap = true;
                }
            }
        }

        startAudioLoops() {
            window.AudioManager.loop('ambience');
            window.AudioManager.loop('bgm_low');
        }

        toggleVolume() {
            const next = !window.AudioManager.enabled;
            window.AudioManager.setEnabled(next);
            this.volumeButton.textContent = next ? '声音：开' : '声音：关';
            if (next && this.started) {
                this.startAudioLoops();
            }
        }

        showGameUi(value) {
            const hidden = !value;
            this.topControls.classList.toggle('hidden', hidden);
            this.inventoryBar.classList.toggle('hidden', hidden);
            this.arrowLeft.classList.toggle('hidden', hidden);
            this.arrowRight.classList.toggle('hidden', hidden);
            this.updateFlashlightUi();
            this.updateDialogueFab();
            this.applyInventoryState();
            this.updateInventoryFab();
        }

        updateFlashlightUi() {
            const revealButton = this.topControls ? this.topControls.querySelector('[data-action="reveal"]') : null;
            if (revealButton) {
                // 显影按钮作为去高亮后的临时探照兜底，始终保留
                revealButton.classList.remove('hidden');
            }
        }

        handleTopAction(action) {
            if (this.inputLocked && action !== 'clues') {
                return;
            }
            if (action === 'save') {
                this.saveGame(false);
            } else if (action === 'load') {
                this.loadGame(false);
            } else if (action === 'clues') {
                this.showClueBook();
            } else if (action === 'hint') {
                this.showHint();
            } else if (action === 'reveal') {
                this.revealHotspots();
            }
        }

        saveGame(silent) {
            if (!this.started) {
                return false;
            }
            this.data.usedItem = this.selectedItem;
            const ok = window.StorageManager.save(this.data);
            if (!silent) {
                this.showToast(ok ? C.Text.saved : C.Text.loadMissing);
            }
            return ok;
        }

        autoSave() {
            this.saveGame(true);
        }

        loadGame(fromStart) {
            const save = window.StorageManager.load();
            if (!save) {
                this.showToast(C.Text.loadMissing, 'error');
                return;
            }
            this.clearTimers();
            this.pendingItemIntros = [];
            this.itemIntroTimer = null;
            this.data = save;
            this.selectedItem = save.usedItem || null;
            this.started = true;
            this.inputLocked = false;
            this.jump = null;
            // 读档进入时直接跳过开场剧情
            this.intro = null;
            if (this.introSkipButton) {
                this.introSkipButton.classList.add('hidden');
            }
            this.closeModal(true);
            U.setActive(this.loadingScreen, false);
            U.setActive(this.startScreen, false);
            this.showGameUi(save.state !== 'ENDING');
            this.renderInventory();
            this.startAudioLoops();
            this.showToast(C.Text.loaded);
            if (save.state === 'MAIN_JUMP' || save.state === 'ENDING' || save.sceneGroup === 'ending') {
                this.enterEnding(false);
            } else if (fromStart) {
                this.showDialogue(C.Text.loaded);
            }
        }

        loop(time) {
            if (!this.running) {
                return;
            }
            const dt = Math.min((time - this.lastTime) / C.Common.msToSeconds, C.Common.quarter);
            this.lastTime = time;
            this.update(dt, time);
            this.render(time);
            this.frameId = U.requestAnimationFrame((next) => this.loop(next));
        }

        update(dt, time) {
            if (this.intro) {
                this.updateIntro(time);
            }
            this.updateDialogue(time);
            this.updateFlashlight(dt);
            this.updateParticles(dt);
            this.updateFloats(dt);
            this.updateTapFeedback();
            this.updateJumpDrips(dt, time);
        }

        isFlashlightEnabled() {
            return Boolean(C.Flashlight.enabled);
        }

        loadHotspotHintSetting() {
            try {
                const raw = window.localStorage.getItem(C.Exploration.settingsKey);
                if (!raw) {
                    return Boolean(C.Exploration.showHotspotHintsDefault);
                }
                const parsed = window.Utils.safeJsonParse(raw);
                if (parsed && typeof parsed.hotspotHints === 'boolean') {
                    return parsed.hotspotHints;
                }
            } catch (error) {
                return Boolean(C.Exploration.showHotspotHintsDefault);
            }
            return Boolean(C.Exploration.showHotspotHintsDefault);
        }

        saveHotspotHintSetting() {
            try {
                window.localStorage.setItem(C.Exploration.settingsKey, JSON.stringify({ hotspotHints: this.hotspotHintsEnabled }));
            } catch (error) {
                return;
            }
        }

        setHotspotHints(enabled) {
            this.hotspotHintsEnabled = Boolean(enabled);
            this.saveHotspotHintSetting();
            if (this.hintToggleButton) {
                this.hintToggleButton.textContent = this.hotspotHintsEnabled ? '高亮提示：开' : '高亮提示：关';
            }
        }

        toggleHotspotHints() {
            this.setHotspotHints(!this.hotspotHintsEnabled);
        }

        isJumpSpotlightEnabled() {
            return this.isFlashlightEnabled() && Boolean(C.Flashlight.jumpSpotlightEnabled);
        }

        updateFlashlight(dt) {
            if (!this.isFlashlightEnabled()) {
                this.flashlight.dragging = false;
                return;
            }
            if (this.flashlight.locked) {
                this.flashlight.x = U.lerp(this.flashlight.x, C.Flashlight.spotlightX, dt * C.Flashlight.returnSpeed);
                this.flashlight.y = U.lerp(this.flashlight.y, C.Flashlight.spotlightY, dt * C.Flashlight.returnSpeed);
                return;
            }
            if (!this.flashlight.dragging && !this.modalOpen) {
                this.flashlight.x = U.lerp(this.flashlight.x, C.Flashlight.defaultX, dt * C.Flashlight.returnSpeed);
                this.flashlight.y = U.lerp(this.flashlight.y, C.Flashlight.defaultY, dt * C.Flashlight.returnSpeed);
            }
        }

        updateDialogue(time) {
            if (!this.dialogue || this.dialogue.complete) {
                return;
            }
            const elapsed = (time - this.dialogue.start) / C.Common.msToSeconds;
            const chars = Math.min(this.dialogue.chars.length, Math.floor(elapsed * this.dialogue.cps));
            this.dialogue.visibleCount = chars;
            this.dialogueText.textContent = this.dialogue.chars.slice(C.Common.zero, chars).join('');
            if (chars >= this.dialogue.chars.length) {
                // 打字完成后，用静态标色版本替换纯文本，呈现关键词高亮
                this.dialogueText.innerHTML = this.highlightKeywords(this.dialogue.pages[this.dialogue.pageIndex]);
                this.dialogue.complete = true;
                this.dialogue.completedAt = time;
                this.onDialoguePageComplete(time);
            }
        }

        onDialoguePageComplete() {
            // 不再自动收起：收起/展开完全由固定按钮手动控制
            this.updateDialogueNextHint();
        }

        updateDialogueNextHint() {
            if (!this.dialogue) {
                return;
            }
            const hasMore = this.dialogue.pageIndex < this.dialogue.pages.length - C.Common.one;
            this.dialogueBox.classList.toggle('can-advance', Boolean(this.dialogue.complete && hasMore));
            if (this.dialogueNext) {
                this.dialogueNext.textContent = hasMore ? '点击继续' : '点击继续';
            }
        }

        updateParticles(dt) {
            this.particles = this.particles.filter((particle) => {
                particle.age += dt;
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.vy += particle.gravity * dt;
                return particle.age < particle.life;
            });
        }

        updateFloats(dt) {
            this.floats = this.floats.filter((floatText) => {
                floatText.age += dt;
                return floatText.age < floatText.life;
            });
        }

        updateJumpDrips(dt, time) {
            if (!this.jump || time < this.jump.start + C.Timing.jumpGhostStartMs || time > this.jump.start + C.Timing.jumpOffMs) {
                return;
            }
            this.jump.dripAccumulator += dt * C.Particles.dripRate;
            while (this.jump.dripAccumulator >= C.Common.one) {
                this.jump.dripAccumulator -= C.Common.one;
                this.spawnDrip();
            }
        }

        isUiEvent(event) {
            const target = event && event.target;
            if (!target || !target.closest) {
                return false;
            }
            return Boolean(target.closest('button, .modal-panel, .inventory-bar, .dialogue-box, .dialogue-fab, .screen-overlay'));
        }

        onPointerDown(point, event) {
            if (!this.started || this.inputLocked || this.modalOpen || this.isUiEvent(event)) {
                this.scenePointerActive = false;
                return;
            }
            this.scenePointerActive = true;
            if (!this.isFlashlightEnabled()) {
                return;
            }
            this.flashlight.dragging = true;
            this.setFlashlight(point);
        }

        onPointerMove(point) {
            if (!this.scenePointerActive || this.inputLocked || this.modalOpen || !this.isFlashlightEnabled()) {
                return;
            }
            this.setFlashlight(point);
        }

        onPointerUp() {
            this.flashlight.dragging = false;
            this.scenePointerActive = false;
        }

        onTap(point, event) {
            // 开场前置剧情：点击屏幕手动翻页
            if (this.intro && !this.intro.finished) {
                if (!this.isUiEvent(event)) {
                    this.advanceIntro();
                }
                return;
            }
            if (!this.started || this.inputLocked || this.modalOpen || this.isUiEvent(event)) {
                return;
            }
            // 注意：收起态下点击场景/交互绝不自动唤出文本框，收起状态完全由固定按钮控制
            const hotspot = this.findHotspot(point);
            if (!hotspot) {
                return;
            }
            if (!this.isHotspotLit(hotspot) && !this.isRevealActive()) {
                this.showToast(C.Text.lightTooFar, 'error');
                return;
            }
            // 即时反馈：点到可交互物时一闪高亮（不在探索时常驻）
            this.triggerTapFeedback(hotspot);
            this.handleHotspot(hotspot);
        }

        onSwipe(direction, point, event) {
            if (!this.started || this.inputLocked || this.modalOpen || this.isUiEvent(event)) {
                return;
            }
            this.changeViewByStep(direction === 'left' ? C.Common.one : C.Common.negativeOne);
        }

        setFlashlight(point) {
            this.flashlight.x = U.clamp(point.x, C.Common.zero, C.Screen.width);
            this.flashlight.y = U.clamp(point.y, C.Flashlight.minY, C.Flashlight.maxY);
        }

        findHotspot(point) {
            const hotspots = this.getAvailableHotspots();
            for (let i = hotspots.length - C.Common.one; i >= C.Common.zero; i -= C.Common.one) {
                if (U.rectContains(hotspots[i], point.x, point.y)) {
                    return hotspots[i];
                }
            }
            return null;
        }

        getAvailableHotspots() {
            const list = C.Hotspots[this.data.viewId] || [];
            return list.filter((hotspot) => this.isHotspotAvailable(hotspot));
        }

        isHotspotAvailable(hotspot) {
            const f = this.data.flags;
            if (hotspot.id === 'gate_lock') {
                return this.data.sceneGroup === 'lobby';
            }
            if (hotspot.id === 'rebar') {
                return !f.gotRebar;
            }
            if (hotspot.id === 'loose_brick') {
                return !f.brickOpened;
            }
            if (hotspot.id === 'look_up') {
                return true;
            }
            if (hotspot.id === 'fan') {
                // v1.3：吊扇改为纯氛围，始终可点（不再以 corridorBroadcastPlayed 作为消耗条件）
                return true;
            }
            if (hotspot.id === 'classroom_door') {
                // 进入走廊后始终可点
                return this.data.sceneGroup === 'corridor';
            }
            if (hotspot.id === 'bulletin_board') {
                return this.data.sceneGroup === 'corridor';
            }
            if (hotspot.id === 'faucet') {
                // 锈门未开时可以交互（陷阱）
                return !f.rustDoorOpened;
            }
            if (hotspot.id === 'machine_oil') {
                // 未拾取机油时可以拾取
                return !f.gotMachineOil && !f.rustDoorOpened;
            }
            if (hotspot.id === 'blackboard_words') {
                return true;
            }
            if (hotspot.id === 'speaker') {
                return !f.speakerPlayed;
            }
            return true;
        }

        isHotspotLit(hotspot) {
            if (!this.isFlashlightEnabled()) {
                return Boolean(C.Flashlight.alwaysShowHotspotHintsWhenDisabled);
            }
            const center = U.rectCenter(hotspot);
            return U.distance(this.flashlight.x, this.flashlight.y, center.x, center.y) <= C.Flashlight.hotspotRevealDistance;
        }

        isRevealActive() {
            return U.now() < this.revealUntil;
        }

        triggerTapFeedback(hotspot) {
            this.tapFeedback = {
                rect: { x: hotspot.x, y: hotspot.y, w: hotspot.w, h: hotspot.h },
                start: U.now()
            };
        }

        updateTapFeedback() {
            if (this.tapFeedback && U.now() - this.tapFeedback.start >= C.Exploration.tapFeedbackMs) {
                this.tapFeedback = null;
            }
        }

        drawTapFeedback(ctx, time) {
            if (!this.tapFeedback) {
                return;
            }
            const progress = U.clamp((time - this.tapFeedback.start) / C.Exploration.tapFeedbackMs, C.Common.zero, C.Common.one);
            const rect = this.tapFeedback.rect;
            const pad = C.Exploration.tapFeedbackPadding * (C.Common.one - progress);
            ctx.save();
            ctx.globalAlpha = (C.Common.one - progress) * C.Exploration.tapFeedbackAlphaMax;
            ctx.strokeStyle = C.Colors.flashlight;
            ctx.lineWidth = C.Exploration.tapFeedbackLineWidth;
            ctx.strokeRect(rect.x - pad, rect.y - pad, rect.w + pad * C.Common.two, rect.h + pad * C.Common.two);
            const glow = ctx.createRadialGradient(
                rect.x + rect.w * C.Common.half,
                rect.y + rect.h * C.Common.half,
                C.Common.zero,
                rect.x + rect.w * C.Common.half,
                rect.y + rect.h * C.Common.half,
                Math.max(rect.w, rect.h) * C.Common.half
            );
            glow.addColorStop(C.Common.zero, U.alphaColor(C.Render.rgbaLightTemplate, (C.Common.one - progress) * C.Common.quarter));
            glow.addColorStop(C.Common.one, C.Render.rgbaLightWarmEdge);
            ctx.fillStyle = glow;
            ctx.fillRect(rect.x - pad, rect.y - pad, rect.w + pad * C.Common.two, rect.h + pad * C.Common.two);
            ctx.restore();
        }

        revealHotspots() {
            const now = U.now();
            if (now < this.revealCooldownUntil) {
                this.showToast(C.Text.revealCooling, 'error');
                return;
            }
            // 兜底：临时闪现当前视角所有可交互物轮廓，不常驻
            const duration = this.isFlashlightEnabled() ? C.Timing.hotspotPulseMs : C.Exploration.revealFallbackMs;
            this.revealUntil = now + duration;
            this.revealCooldownUntil = now + C.Timing.hintCooldownMs;
        }

        handleHotspot(hotspot) {
            // 首次接触某交互物：先自动弹出介绍说明（仅首次），关闭后再执行原本交互
            const info = C.Intros[hotspot.id];
            if (info && !this.isIntroduced(hotspot.id)) {
                window.AudioManager.play('hotspot_click');
                this.markIntroduced(hotspot.id);
                this.autoSave();
                this.showIntroModal(info.title, info.text, null, () => this.handleHotspot(hotspot));
                return;
            }
            window.AudioManager.play('hotspot_click');
            if (hotspot.id === 'anonymous_photo' || hotspot.id === 'seat_map_paper') {
                this.viewAnonymousPhoto(hotspot);
            } else if (hotspot.id === 'rebar') {
                this.pickupItem('rebar', hotspot);
                this.data.flags.gotRebar = true;
                this.showDialogue(C.Text.gotRebar);
                this.autoSave();
            } else if (hotspot.id === 'loose_brick') {
                this.openLooseBrick(hotspot);
            } else if (hotspot.id === 'gate_lock') {
                this.openGate(hotspot);
            } else if (hotspot.id === 'look_up') {
                // 切到吊扇抬头视角（corridor[2] = scene_04）
                this.changeView(C.SceneGroups.corridor[C.Common.two], true);
                this.showDialogue(C.Text.lookUp);
            } else if (hotspot.id === 'fan') {
                this.playFanAmbience(hotspot);
            } else if (hotspot.id === 'classroom_door') {
                this.handleClassroomDoor(hotspot);
            } else if (hotspot.id === 'bulletin_board') {
                this.handleBulletinBoard(hotspot);
            } else if (hotspot.id === 'faucet') {
                this.handleFaucet(hotspot);
            } else if (hotspot.id === 'machine_oil') {
                this.handleMachineOil(hotspot);
            } else if (hotspot.id === 'enter_desks') {
                this.changeView(C.SceneGroups.classroom[C.Common.one], true);
            } else if (hotspot.id === 'linxia_drawer') {
                this.openLinxiaDrawer(hotspot);
            } else if (hotspot.id === 'suwan_desk') {
                this.handleSuwanDesk(hotspot);
            } else if (hotspot.id === 'blackboard_words') {
                this.triggerBlackboardWords();
            } else if (hotspot.id === 'roster') {
                this.collectClue(C.InitialState.firstClue, C.Text.rosterClue, hotspot, { showImage: true });
            } else if (hotspot.id === 'duty_table') {
                this.collectClue('dutyWindowOdd', C.Text.dutyClue, hotspot, { showImage: true });
            } else if (hotspot.id === 'timetable') {
                this.collectClue('timetableFirstLesson', C.Text.timetableClue, hotspot, { showImage: true });
            } else if (hotspot.id === 'wall_slogan') {
                this.viewWallSlogan(hotspot);
            } else if (hotspot.id === 'speaker') {
                this.playSpeaker();
            }
        }

        viewAnonymousPhoto(hotspot) {
            this.data.flags.anonymousPhotoSeen = true;
            this.addClue(C.InitialState.anonymousClue);
            const isNewSeatClue = !this.hasClue(C.InitialState.thirdClue);
            this.addItem('burnedSeatMap');
            if (hotspot) {
                this.spawnParticlesFromHotspot(hotspot, 'pickup');
            }
            // 座位表照片同时是座位推理三线索之一，在教室内给进度低语
            const progressLine = (isNewSeatClue && this.data.sceneGroup === 'classroom') ? this.getSeatClueProgressLine() : '';
            // 弹出泛黄烧角座位表照片精绘特写，玩家放大看第十三排锈红圈「苏晚」、相邻残「夏」字
            this.showClueDetail(C.Clues[C.InitialState.anonymousClue], {
                onClose: () => {
                    this.showDialogue(progressLine ? `${C.Text.photo}\n${progressLine}` : C.Text.photo, { ghost: Boolean(progressLine) });
                }
            });
            this.autoSave();
        }

        viewWallSlogan(hotspot) {
            const firstTime = !this.data.flags.wallSloganSeen;
            this.data.flags.wallSloganSeen = true;
            this.addClue('wallSlogan');
            if (hotspot) {
                this.spawnParticlesFromHotspot(hotspot, 'pickup');
            }
            const line = firstTime ? C.Text.wallSloganClue : C.Text.wallSloganSeen;
            // 弹出褪色锈红标语精绘特写，作为课程表密码的教学规则线索（画面化，非系统文字）
            this.showClueDetail(C.Clues.wallSlogan, {
                onClose: () => this.showDialogue(line, { ghost: true })
            });
            this.autoSave();
        }

        // 线索精绘特写弹窗：暗色背景上放大展示该线索的高清精绘图，玩家观察画面自主读取信息
        showClueDetail(clue, options) {
            if (!clue) {
                return;
            }
            const opts = options || {};
            const panel = this.createModalPanel(clue.name);
            panel.classList.add('clue-detail-panel');
            if (clue.image && C.Images[clue.image]) {
                const img = document.createElement('img');
                img.alt = clue.name;
                img.src = C.Images[clue.image];
                img.className = 'clue-detail-img';
                panel.appendChild(img);
            }
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            actions.appendChild(U.createButton('看完了', '', () => {
                this.closeModal(true);
                if (opts.onClose) {
                    opts.onClose();
                }
            }));
            panel.appendChild(actions);
            this.openModal(panel);
        }

        openLooseBrick(hotspot) {
            if (!this.hasItem('rebar')) {
                this.showDialogue(C.Text.looseBrickNoTool);
                return;
            }
            if (this.selectedItem && this.selectedItem !== 'rebar') {
                this.invalidUse();
                return;
            }
            this.selectedItem = null;
            this.data.flags.brickOpened = true;
            window.AudioManager.play('rebar_pry');
            this.startShake(C.Camera.correctShake, C.Camera.correctShakeFrames);
            // ④ 给反馈：砖缝灰尘飘落 + 钥匙特写小弹窗
            this.spawnDustFromHotspot(hotspot);
            this.addItem('rustyKey');
            this.showKeyClueup('rustyKey');
            this.showDialogue(C.Text.brickOpened);
            this.autoSave();
        }

        spawnDustFromHotspot(hotspot) {
            const center = U.rectCenter(hotspot);
            const count = Math.round(U.randomRange(C.Particles.dustCountMin, C.Particles.dustCountMax));
            for (let i = C.Common.zero; i < count; i += C.Common.one) {
                this.particles.push({
                    x: center.x + U.randomRange(-hotspot.w * C.Common.quarter, hotspot.w * C.Common.quarter),
                    y: center.y + U.randomRange(-hotspot.h * C.Common.quarter, C.Common.zero),
                    vx: U.randomRange(-C.Particles.dustSpeedMax, C.Particles.dustSpeedMax),
                    vy: U.randomRange(C.Particles.dustSpeedMin, C.Particles.dustSpeedMax),
                    gravity: C.Particles.dustGravity,
                    age: C.Common.zero,
                    life: C.Particles.dustLife,
                    size: U.randomRange(C.Render.particleMinSize, C.Render.particleMaxSize),
                    color: C.Particles.dustColor
                });
            }
        }

        // 关键道具特写：撬出钥匙、读出纸条等节点弹出居中小特写，停留后收入道具栏
        showKeyClueup(itemId) {
            const item = C.Items[itemId];
            if (!item) {
                return;
            }
            const panel = this.createModalPanel(item.name);
            panel.classList.add('clueup-panel');
            const img = document.createElement('img');
            img.alt = item.name;
            img.src = C.Images[item.clueImage && C.Images[item.clueImage] ? item.clueImage : item.image];
            img.className = 'clueup-img';
            panel.appendChild(img);
            const desc = document.createElement('p');
            desc.textContent = item.description;
            panel.appendChild(desc);
            this.openModal(panel);
            this.setTimer(() => {
                if (this.modalOpen) {
                    this.closeModal(true);
                }
            }, C.Timing.keyClueupCloseMs);
        }

        openGate(hotspot) {
            if (!this.hasItem('rustyKey')) {
                // ① 先教学：第一次点死锁的门，引导“找工具→看左右墙”
                if (!this.data.flags.gateLockedIntroSeen) {
                    this.data.flags.gateLockedIntroSeen = true;
                    this.showDialogue(C.Text.gateLockedIntro);
                    this.autoSave();
                } else {
                    this.showDialogue(C.Text.gateNoKey);
                }
                return;
            }
            if (this.selectedItem && this.selectedItem !== 'rustyKey') {
                this.invalidUse();
                return;
            }
            if (!this.hasItem(C.InitialState.thirdClue)) {
                this.data.flags.anonymousPhotoSeen = true;
                this.addClue(C.InitialState.anonymousClue, true);
                this.addItem(C.InitialState.thirdClue);
            }
            this.selectedItem = null;
            this.data.flags.gateUnlocked = true;
            this.startShake(C.Camera.correctShake, C.Camera.correctShakeFrames);
            this.spawnParticlesFromHotspot(hotspot, 'success');
            this.triggerFlashWhite();
            window.AudioManager.play('lock_open');
            this.showDialogue(C.Text.gateOpened, {
                onClose: () => this.transitionToGroup('corridor', C.SceneGroups.corridor[C.Common.zero], C.Text.corridorEnter)
            });
        }

        // v1.3：吊扇改为纯氛围交互，播放音效+旁白，绝不触发进教室或场景切换
        playFanAmbience(hotspot) {
            // 首次触发吊扇广播演出（仅一次完整广播）
            if (!this.data.flags.corridorBroadcastPlayed) {
                this.data.flags.corridorBroadcastPlayed = true;
                this.fanEventStart = U.now();
                window.AudioManager.play('fan_creak');
                this.startShake(C.Camera.corridorShake, C.Camera.corridorShakeFrames);
                this.setTimer(() => window.AudioManager.play('radio_static'), C.Timing.fanRadioStaticDelayMs);
                this.setTimer(() => window.AudioManager.play('voice_midday'), C.Timing.fanVoiceDelayMs);
                this.setTimer(() => {
                    this.fanEventStart = null;
                    // 屏幕轻抖结束后显示旁白，旁白关闭后接续③林夏内心独白
                    this.showDialogue(C.Text.fanBroadcastEnd, {
                        onClose: () => {
                            // ③ 林夏内心独白：广播残响戳然而止的瞬间
                            this.showMonologue(C.Monologue.broadcast);
                        }
                    });
                }, C.Timing.fanVoiceDelayMs + C.Timing.corridorPauseMs);
                this.showDialogue(C.Text.fanAmbience);
                this.autoSave();
            } else {
                // 重复点击：仅给氛围旁白+轻微音效
                window.AudioManager.play('fan_creak');
                this.showDialogue(C.Text.fanAmbience);
            }
            // 绝不触发进教室或任何场景切换
        }

        // 旧方法保留空实现（兼容可能的调用），不再使用
        playCorridorEvent() {}

        // 教室锈门交互（v1.3新增）
        handleClassroomDoor() {
            const f = this.data.flags;
            if (f.rustDoorOpened) {
                // 锈门已开：进入教室（唯一入口）
                this.transitionToGroup('classroom', C.SceneGroups.classroom[C.Common.zero], C.Text.classroomEnter);
                return;
            }
            // 如果已选中机油，直接开门
            if (this.selectedItem === 'machineOil' && this.hasItem('machineOil')) {
                this.useMachineOilOnDoor();
                return;
            }
            // 锈门未开：铺垫旁白
            if (!f.rustDoorTried) {
                f.rustDoorTried = true;
                this.showDialogue(C.Text.rustDoorFirst, {
                    onClose: () => this.showDialogue(C.Text.rustDoorHint)
                });
                this.autoSave();
            } else if (this.hasItem('machineOil')) {
                // 有机油但未选中：提示使用
                this.showToast('从道具栏选择机油，再点击门');
            } else {
                this.showDialogue(C.Text.rustDoorRetry);
            }
        }

        // 机油使用在教室门上（v1.3新增）
        useMachineOilOnDoor() {
            const f = this.data.flags;
            if (!this.hasItem('machineOil')) {
                this.showDialogue(C.Text.rustDoorRetry);
                return;
            }
            // 消耗机油
            this.data.inventory = this.data.inventory.filter((id) => id !== 'machineOil');
            this.selectedItem = null;
            this.data.usedItem = null;
            f.rustDoorOpened = true;
            f.gotMachineOil = false;
            this.renderInventory();
            // 反馈：生锈门锁打开音效 + 屏幕轻抖 + 亮度提升 + 飘字
            window.AudioManager.play('lock_open');
            this.startShake(C.Camera.correctShake, C.Camera.correctShakeFrames);
            this.triggerFlashWhite();
            this.spawnFloat('门开了', C.Screen.width * C.Common.half, C.Screen.height * C.Common.half, 'item');
            this.showDialogue(C.Text.machineOilOnDoor, {
                onClose: () => {
                    this.showDialogue(C.Text.rustDoorOpened, {
                        onClose: () => this.transitionToGroup('classroom', C.SceneGroups.classroom[C.Common.zero], C.Text.classroomEnter)
                    });
                }
            });
            this.autoSave();
        }

        // 旧公告栏氛围伏笔（v1.3新增）
        handleBulletinBoard() {
            // 弹出公告栏精绘图，纯氛围伏笔，不参与谜题
            this.showClueDetail(C.Clues.bulletinBoard, {
                onClose: () => {
                    // 旁白「这一栏的名字，看不清了。」显示完毕后接续④林夏内心独白
                    this.showDialogue(C.Text.bulletinBoardText, {
                        onClose: () => {
                            // ④ 林夏内心独白：点击公告栏时的愿俧初现
                            this.showMonologue(C.Monologue.bulletinBoard);
                        }
                    });
                }
            });
        }

        // 水龙头陷阱（v1.3新增）
        handleFaucet() {
            const f = this.data.flags;
            if (!f.usedWaterOnDoor) {
                f.usedWaterOnDoor = true;
                this.autoSave();
            }
            this.showDialogue(f.usedWaterOnDoor && this.data.flags.rustDoorTried ?
                C.Text.faucetTrapAgain : C.Text.faucetTrap
            );
        }

        // 机油拾取（v1.3新增）
        handleMachineOil(hotspot) {
            if (this.data.flags.gotMachineOil || this.hasItem('machineOil')) {
                return;
            }
            this.data.flags.gotMachineOil = true;
            this.pickupItem('machineOil', hotspot);
            this.showDialogue(C.Text.machineOilPicked);
            this.autoSave();
        }

        openLinxiaDrawer(hotspot) {
            if (this.data.flags.linxiaDrawerOpened) {
                this.showDialogue(C.Text.linxiaDrawer);
                return;
            }
            this.data.flags.linxiaDrawerOpened = true;
            window.AudioManager.play('drawer_creak');
            this.startShake(C.Camera.correctShake, C.Camera.correctShakeFrames);
            this.spawnParticlesFromHotspot(hotspot, 'success');
            this.addItem('friendshipBracelet');
            this.addItem('tapeA');
            // 道具飘字显示后，旁白关闭时接续⑥林夏内心独白（最强峰值）
            this.showDialogue(C.Text.linxiaDrawer, {
                onClose: () => {
                    // ⑥ 林夏内心独白：摸到半条友情手链时，最强峰值
                    this.showMonologue(C.Monologue.linxiaDrawer);
                }
            });
            this.autoSave();
        }

        handleSuwanDesk() {
            if (!this.data.flags.linxiaDrawerOpened) {
                this.showDialogue(C.Text.suwanBlocked);
                return;
            }
            if (!this.hasSeatClues()) {
                this.showDialogue(C.Text.missingSeatClues);
                return;
            }
            if (!this.data.flags.seatSolved) {
                this.showSeatPuzzle();
                return;
            }
            this.showPasswordModal();
        }

        hasSeatClues() {
            return this.hasClue(C.InitialState.firstClue) && this.hasClue(C.InitialState.secondClue) && this.hasClue(C.InitialState.thirdClue);
        }

        triggerBlackboardWords() {
            if (this.data.flags.blackboardWordsSeen) {
                this.maybeTeachTimetableRule();
                return;
            }
            const now = U.now();
            this.data.flags.blackboardWordsSeen = true;
            this.blackboardRevealStart = now;
            this.maybeTeachTimetableRule();
            this.autoSave();
        }

        // ① 先教学：聚焦黑板时点破密码规则方向（每天第一节课），先教规则不给答案
        maybeTeachTimetableRule() {
            if (this.data.flags.timetableRuleSeen) {
                return;
            }
            this.data.flags.timetableRuleSeen = true;
            this.setTimer(() => {
                if (this.data.viewId === C.SceneGroups.classroom[C.Common.two] && !this.dialogue) {
                    this.showDialogue(C.Text.timetableRuleIntro);
                }
            }, C.Timing.blackboardRevealMs);
            this.autoSave();
        }



        collectClue(clueId, dialogueText, hotspot, options) {
            const opts = options || {};
            const isNew = this.addClue(clueId);
            this.spawnParticlesFromHotspot(hotspot, 'pickup');
            // ④ 给反馈：座位三线索每读到一条新线索，给“线索 x/3”低语进度（不剧透答案）
            const progressLine = isNew ? this.getSeatClueProgressLine() : '';
            const speak = () => {
                this.showDialogue(progressLine ? `${dialogueText}\n${progressLine}` : dialogueText, { ghost: Boolean(progressLine) });
            };
            // 线索美术化：点击弹出该线索的精绘特写，玩家放大观察画面自主读取，旁白只做方向/规则引导
            if (opts.showImage && C.Clues[clueId] && C.Clues[clueId].image) {
                this.showClueDetail(C.Clues[clueId], { onClose: speak });
            } else {
                speak();
            }
            this.autoSave();
        }

        getSeatClueProgressLine() {
            const seatClues = [C.InitialState.firstClue, C.InitialState.secondClue, C.InitialState.thirdClue];
            const collected = seatClues.filter((id) => this.hasClue(id)).length;
            if (collected === C.Common.one) {
                return C.Text.seatProgress1;
            }
            if (collected === C.Common.two) {
                return C.Text.seatProgress2;
            }
            if (collected >= C.Common.three) {
                return C.Text.seatProgress3;
            }
            return '';
        }

        playSpeaker() {
            this.data.flags.speakerPlayed = true;
            window.AudioManager.play('radio_static');
            this.showDialogue(C.Text.speakerStatic, { ghost: true });
            this.autoSave();
        }

        transitionToGroup(group, viewId, dialogueText) {
            this.data.sceneGroup = group;
            this.data.viewId = viewId;
            this.data.state = group === 'corridor' ? 'CORRIDOR' : (group === 'classroom' ? 'CLASSROOM_ENTRY' : 'LOBBY');
            // 进入走廊时预设标志，防止 handleViewArrival 重复触发走廊旁白
            if (group === 'corridor') {
                this.data.flags.corridorFirstEntered = true;
            }
            this.transition = { start: U.now(), duration: C.Timing.fadeMs };
            this.autoSave();
            this.setTimer(() => {
                if (group === 'classroom') {
                    this.showDialogue(dialogueText, { onClose: () => this.showDialogue(C.Text.classroomEnter) });
                } else {
                    this.showDialogue(dialogueText);
                }
            }, C.Timing.fadeMs);
        }

        changeViewByStep(step) {
            if (!this.started || this.inputLocked || this.modalOpen || this.data.state === 'ENDING') {
                return;
            }
            const views = C.SceneGroups[this.data.sceneGroup] || [];
            if (!views.length) {
                return;
            }
            const index = views.indexOf(this.data.viewId);
            const safeIndex = index < C.Common.zero ? C.Common.zero : index;
            const nextIndex = (safeIndex + step + views.length) % views.length;
            this.changeView(views[nextIndex], true);
        }

        changeView(viewId, withTransition) {
            if (this.data.viewId === viewId) {
                return;
            }
            this.data.viewId = viewId;
            if (withTransition) {
                this.transition = { start: U.now(), duration: C.Timing.fadeMs };
            }
            this.handleViewArrival(viewId);
            this.autoSave();
        }

        handleViewArrival(viewId) {
            if (viewId === C.SceneGroups.classroom[C.Common.two]) {
                if (!this.data.flags.blackboardWordsSeen) {
                    this.setTimer(() => {
                        if (this.data.viewId === C.SceneGroups.classroom[C.Common.two]) {
                            this.triggerBlackboardWords();
                        }
                    }, C.Timing.fadeMs);
                }
            }
            if (viewId === C.SceneGroups.corridor[C.Common.two] && !this.data.flags.corridorBroadcastPlayed) {
                window.AudioManager.play('fan_creak');
            }
            // 锈门谜题先教学：首次进入走廊纵深，如果锈门未尝试，自动弹出走廊第一句旁白
            if (viewId === C.SceneGroups.corridor[C.Common.zero] && !this.data.flags.rustDoorTried && this.data.sceneGroup === 'corridor') {
                if (!this.data.flags.corridorFirstEntered) {
                    this.data.flags.corridorFirstEntered = true;
                    this.setTimer(() => {
                        if (this.data.viewId === C.SceneGroups.corridor[C.Common.zero] && !this.dialogue) {
                            this.showDialogue(C.Text.corridorEnter);
                        }
                    }, C.Timing.fadeMs);
                }
            }
            // ① 先教学：首次进入教室相关视角，给座位推理的方向引导（只指方向不报答案）
            if (this.data.sceneGroup === 'classroom' && !this.data.flags.seatIntroSeen && !this.data.flags.seatSolved) {
                this.data.flags.seatIntroSeen = true;
                this.setTimer(() => {
                    if (this.data.sceneGroup === 'classroom' && !this.dialogue) {
                        this.showDialogue(C.Text.seatIntro);
                    }
                }, C.Timing.fadeMs);
                this.autoSave();
            }
        }

        addItem(itemId) {
            if (!C.Items[itemId]) {
                return false;
            }
            const added = U.uniquePush(this.data.inventory, itemId);
            this.data.inventory.sort((a, b) => C.Items[a].order - C.Items[b].order);
            if (added) {
                const item = C.Items[itemId];
                if (item.clue && item.clueId) {
                    this.addClue(item.clueId, true);
                }
                this.renderInventory();
                this.spawnParticles(C.Screen.width * C.Common.half, C.UI.inventoryY, 'pickup');
                this.spawnFloat(`+${item.name}`, C.Screen.width * C.Common.half, C.UI.inventoryY, 'item');
                window.AudioManager.play('item_pickup');
                // 首次获得新道具：自动弹出该道具的介绍说明（仅首次）
                this.queueItemIntro(itemId);
            }
            return added;
        }

        // 排队弹出道具介绍：稍作延迟，避免与拾取即时反馈/特写弹窗争抢，且不重复弹出
        queueItemIntro(itemId) {
            if (this.isIntroduced(itemId)) {
                return;
            }
            this.markIntroduced(itemId);
            this.pendingItemIntros = this.pendingItemIntros || [];
            this.pendingItemIntros.push(itemId);
            if (!this.itemIntroTimer) {
                this.itemIntroTimer = this.setTimer(() => this.flushItemIntros(), C.Timing.itemIntroDelayMs);
            }
        }

        flushItemIntros() {
            this.itemIntroTimer = null;
            if (!this.pendingItemIntros || !this.pendingItemIntros.length) {
                return;
            }
            // 若当前有弹窗占用，稍后再试，避免覆盖关键特写/详情
            if (this.modalOpen) {
                this.itemIntroTimer = this.setTimer(() => this.flushItemIntros(), C.Timing.itemIntroDelayMs);
                return;
            }
            this.showNextItemIntro();
        }

        showNextItemIntro() {
            if (!this.pendingItemIntros || !this.pendingItemIntros.length) {
                return;
            }
            const itemId = this.pendingItemIntros.shift();
            const item = C.Items[itemId];
            if (!item) {
                this.showNextItemIntro();
                return;
            }
            this.showIntroModal(item.name, item.description, item.image, () => {
                if (this.pendingItemIntros.length) {
                    this.showNextItemIntro();
                }
            });
        }

        pickupItem(itemId, hotspot) {
            this.addItem(itemId);
            this.spawnParticlesFromHotspot(hotspot, 'pickup');
            this.autoSave();
        }

        // 介绍是否已弹出过（道具/交互物共用同一份记录，确保仅首次触发）
        isIntroduced(key) {
            const list = this.data.flags.introducedKeys;
            return Array.isArray(list) && list.indexOf(key) !== -C.Common.one;
        }

        markIntroduced(key) {
            if (!Array.isArray(this.data.flags.introducedKeys)) {
                this.data.flags.introducedKeys = [];
            }
            U.uniquePush(this.data.flags.introducedKeys, key);
        }

        // 通用介绍弹窗：展示标题、可选配图与介绍说明
        showIntroModal(title, text, imageKey, onClose) {
            const panel = this.createModalPanel(title);
            panel.classList.add('intro-panel');
            if (imageKey && C.Images[imageKey]) {
                const img = document.createElement('img');
                img.alt = title;
                img.src = C.Images[imageKey];
                panel.appendChild(img);
            }
            const desc = document.createElement('p');
            desc.textContent = text;
            panel.appendChild(desc);
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            actions.appendChild(U.createButton('知道了', '', () => {
                this.closeModal(true);
                if (onClose) {
                    onClose();
                }
            }));
            panel.appendChild(actions);
            this.openModal(panel);
        }



        addClue(clueId, silent) {
            if (!C.Clues[clueId]) {
                return false;
            }
            const added = U.uniquePush(this.data.clues, clueId);
            if (added && !silent) {
                this.spawnFloat(C.Clues[clueId].name, C.Screen.width * C.Common.half, C.UI.dialogY, 'clue');
                window.AudioManager.play('item_pickup');
            }
            return added;
        }

        hasItem(itemId) {
            return this.data.inventory.indexOf(itemId) !== -C.Common.one;
        }

        hasClue(clueId) {
            return this.data.clues.indexOf(clueId) !== -C.Common.one;
        }

        invalidUse() {
            this.startShake(C.Camera.invalidShake, C.Camera.invalidShakeFrames);
            this.showToast(C.Text.wrongItem, 'error');
        }

        renderInventory() {
            if (!this.inventoryBar) {
                return;
            }
            U.clearChildren(this.inventoryBar);
            for (let i = C.Common.zero; i < C.Common.six; i += C.Common.one) {
                const itemId = this.data.inventory[i];
                const slot = document.createElement('button');
                slot.type = 'button';
                slot.className = itemId ? 'inventory-slot' : 'inventory-slot empty';
                if (itemId && itemId === this.selectedItem) {
                    slot.classList.add('selected');
                }
                if (itemId) {
                    const item = C.Items[itemId];
                    const img = document.createElement('img');
                    img.alt = item.name;
                    img.src = C.Images[item.image];
                    slot.title = item.name;
                    slot.appendChild(img);
                    slot.addEventListener('click', (event) => {
                        event.stopPropagation();
                        this.showItemDetail(itemId);
                    });
                }
                this.inventoryBar.appendChild(slot);
            }
        }

        showItemDetail(itemId, options) {
            const item = C.Items[itemId];
            if (!item) {
                return;
            }
            const panel = this.createModalPanel(item.name);
            const img = document.createElement('img');
            img.alt = item.name;
            // 线索类道具优先展示其高清精绘特写（可放大读取画面信息），否则用道具图标
            if (item.clueImage && C.Images[item.clueImage]) {
                img.src = C.Images[item.clueImage];
                img.className = 'clue-detail-img';
            } else {
                img.src = C.Images[item.image];
            }
            panel.appendChild(img);
            const desc = document.createElement('p');
            desc.textContent = item.description;
            panel.appendChild(desc);
            if (item.clueId && C.Clues[item.clueId]) {
                const clue = document.createElement('p');
                clue.textContent = C.Clues[item.clueId].text;
                panel.appendChild(clue);
            } else {
                const useText = document.createElement('p');
                useText.textContent = item.useText;
                panel.appendChild(useText);
            }
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            const shouldJump = itemId === C.InitialState.waterNoteItem && !this.data.flags.jumpPlayed;
            const useLabel = shouldJump ? '继续' : '使用';
            actions.appendChild(U.createButton(useLabel, '', () => {
                if (shouldJump) {
                    this.closeModal(true);
                    this.readWaterNote();
                    return;
                }
                this.selectedItem = itemId;
                this.data.usedItem = itemId;
                this.renderInventory();
                this.closeModal(true);
                this.showToast(C.Text.itemSelected);
            }));
            actions.appendChild(U.createButton('组合', '', () => this.tryCombine(itemId)));
            actions.appendChild(U.createButton('关闭', '', () => {
                this.closeModal(true);
                if (shouldJump && (!options || options.triggerOnClose !== false)) {
                    this.readWaterNote();
                }
            }));
            panel.appendChild(actions);
            this.openModal(panel);
        }

        tryCombine(itemId) {
            if ((itemId === 'friendshipBracelet' || itemId === 'tapeA') && this.hasItem('friendshipBracelet') && this.hasItem('tapeA')) {
                this.showToast(C.Text.combineMemory);
                return;
            }
            this.showToast(C.Text.cannotCombine, 'error');
        }

        showClueBook(returnToEnding) {
            const panel = this.createModalPanel('已收集线索');
            const list = document.createElement('ul');
            list.className = 'clue-list';
            this.data.clues.forEach((clueId) => {
                const clue = C.Clues[clueId];
                if (!clue) {
                    return;
                }
                const li = document.createElement('li');
                const title = document.createElement('strong');
                title.textContent = clue.name;
                li.appendChild(title);
                // 线索册回看也展示精绘图：点击缩略图可放大查看高清特写
                if (clue.image && C.Images[clue.image]) {
                    const thumb = document.createElement('img');
                    thumb.alt = clue.name;
                    thumb.src = C.Images[clue.image];
                    thumb.className = 'clue-list-thumb';
                    thumb.addEventListener('click', (event) => {
                        event.stopPropagation();
                        this.showClueDetail(clue);
                    });
                    li.appendChild(thumb);
                    li.classList.add('has-image');
                }
                const text = document.createElement('span');
                text.textContent = clue.text;
                li.appendChild(text);
                list.appendChild(li);
            });
            const placeholders = Math.max(C.Common.zero, C.UI.cluePlaceholderCount - this.data.clues.length);
            for (let i = C.Common.zero; i < placeholders; i += C.Common.one) {
                const li = document.createElement('li');
                li.textContent = '还有没想起来的事。';
                list.appendChild(li);
            }
            panel.appendChild(list);
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            actions.appendChild(U.createButton('关闭', '', () => {
                this.closeModal(true);
                if (returnToEnding) {
                    this.showEndingModal();
                }
            }));
            panel.appendChild(actions);
            this.openModal(panel);
        }

        showSeatPuzzle() {
            const panel = this.createModalPanel('第十三排');
            const copy = document.createElement('p');
            copy.textContent = '点名册、值日表和烧角座位表叠在一起。苏晚的位置，只能有一个。';
            panel.appendChild(copy);
            const options = document.createElement('div');
            options.className = 'seat-options';
            C.SeatPuzzle.options.forEach((option) => {
                options.appendChild(U.createButton(option.label, '', () => {
                    if (option.id === C.SeatPuzzle.correctId) {
                        this.data.flags.seatSolved = true;
                        this.data.flags.suwanDeskFaced = true;
                        this.data.state = 'SEAT_PUZZLE';
                        // ④ 给反馈：定位成功，解谜成功粒子 + 镜头推近的旁白
                        this.spawnParticles(C.Screen.width * C.Common.half, C.Screen.height * C.Common.half, 'success');
                        this.startShake(C.Camera.correctShake, C.Camera.correctShakeFrames);
                        this.closeModal(true);
                        this.showDialogue(C.Text.seatSolvedLine, {
                            onClose: () => {
                                // ⑤ 林夏内心独白：锁定第十三排空座位时
                                this.showMonologue(C.Monologue.seatSolved, {
                                    onClose: () => this.showPasswordModal()
                                });
                            }
                        });
                        this.autoSave();
                    } else {
                        this.startShake(C.Camera.invalidShake, C.Camera.invalidShakeFrames);
                        this.showToast(C.Text.wrongSeat, 'error');
                    }
                }));
            });
            panel.appendChild(options);
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            actions.appendChild(U.createButton('关闭', '', () => this.closeModal(true)));
            panel.appendChild(actions);
            this.openModal(panel);
        }

        showPasswordModal() {
            if (!this.hasClue('timetableFirstLesson')) {
                this.showDialogue(C.Text.timetableNeeded);
                return;
            }
            if (this.data.flags.suwanDrawerUnlocked) {
                if (this.hasItem(C.InitialState.waterNoteItem)) {
                    this.showItemDetail(C.InitialState.waterNoteItem);
                }
                return;
            }
            this.data.state = 'PASSWORD_PUZZLE';
            const panel = this.createModalPanel('三位密码锁');
            const clue = document.createElement('p');
            clue.textContent = '苏晚的抽屉，锁着三位数字。';
            panel.appendChild(clue);
            const hint1 = document.createElement('p');
            hint1.className = 'password-hint';
            hint1.textContent = '一日之计在于晨……每天第一节，上的是什么？';
            panel.appendChild(hint1);
            const hint2 = document.createElement('p');
            hint2.className = 'password-hint';
            hint2.textContent = '书脊上的册数，或许记得答案。';
            panel.appendChild(hint2);
            const digits = C.Password.initial.slice();
            const answerDigits = Array.from(C.Password.answer).map((ch) => Number(ch));
            const digitWrap = document.createElement('div');
            digitWrap.className = 'password-digits';
            const renderDigits = () => {
                Array.from(digitWrap.querySelectorAll('.password-value')).forEach((node, index) => {
                    node.textContent = String(digits[index]);
                });
            };
            // ③ 后解锁：每拨对一位，咔哒轻响 + 该位暖黄微亮 120ms（不直说哪几位对）
            const feedbackDigit = (index, valueNode) => {
                if (digits[index] === answerDigits[index]) {
                    window.AudioManager.play('hotspot_click');
                    valueNode.classList.add('digit-correct');
                    window.setTimeout(() => valueNode.classList.remove('digit-correct'), C.Timing.digitGlowMs);
                }
            };
            for (let i = C.Common.zero; i < C.UI.passwordDigits; i += C.Common.one) {
                const col = document.createElement('div');
                col.className = 'password-digit';
                const value = document.createElement('div');
                value.className = 'password-value';
                value.textContent = String(digits[i]);
                const up = U.createButton('▲', '', () => {
                    digits[i] = digits[i] >= C.UI.passwordMaxDigit ? C.UI.passwordMinDigit : digits[i] + C.Common.one;
                    renderDigits();
                    feedbackDigit(i, value);
                });
                const down = U.createButton('▼', '', () => {
                    digits[i] = digits[i] <= C.UI.passwordMinDigit ? C.UI.passwordMaxDigit : digits[i] - C.Common.one;
                    renderDigits();
                    feedbackDigit(i, value);
                });
                col.appendChild(up);
                col.appendChild(value);
                col.appendChild(down);
                digitWrap.appendChild(col);
            }
            panel.appendChild(digitWrap);
            const actions = document.createElement('div');
            actions.className = 'lock-actions';
            actions.appendChild(U.createButton('确认', '', () => {
                if (digits.join('') === C.Password.answer) {
                    this.closeModal(true);
                    this.solvePassword();
                } else {
                    this.startShake(C.Camera.passwordShake, C.Camera.passwordShakeFrames);
                    this.showToast(C.Text.passwordWrong, 'error');
                }
            }));
            actions.appendChild(U.createButton('清空', '', () => {
                for (let i = C.Common.zero; i < C.UI.passwordDigits; i += C.Common.one) {
                    digits[i] = C.UI.passwordMinDigit;
                }
                renderDigits();
            }));
            actions.appendChild(U.createButton('关闭', '', () => this.closeModal(true)));
            panel.appendChild(actions);
            this.openModal(panel);
        }

        solvePassword() {
            this.data.flags.suwanDrawerUnlocked = true;
            this.data.state = 'PASSWORD_PUZZLE';
            window.AudioManager.play('drawer_creak');
            this.startShake(C.Camera.correctShake, C.Camera.correctShakeFrames);
            this.addItem('waterNote');
            this.spawnParticles(C.Screen.width * C.Common.half, C.Screen.height * C.Common.half, 'success');
            // ④ 给反馈：抽屉弹开 + 水渍纸条特写，停留后再进入读纸条
            this.showDialogue(C.Text.passwordRight, {
                onClose: () => {
                    this.showKeyClueup(C.InitialState.waterNoteItem);
                    this.setTimer(() => this.showItemDetail(C.InitialState.waterNoteItem), C.Timing.keyClueupCloseMs);
                }
            });
            this.autoSave();
        }

        readWaterNote() {
            if (this.data.flags.noteRead) {
                if (!this.data.flags.jumpPlayed) {
                    this.startMainJump();
                }
                return;
            }
            this.data.flags.noteRead = true;
            this.addClue('waterNote', true);
            // 纸条内容显示完毕后，先触发⑧林夏内心独白（崩溃前的静），再约200ms后触发主Jump
            const monologueDelay = C.Monologue ? C.Monologue.waterNoteDelayMs : 200;
            this.showDialogue(C.Text.waterNote, {
                ghost: true,
                onClose: () => {
                    // ⑧ 林夏内心独白：读完纸条、关窗砰然触发前一瞬（崩溃前的静，气音效果）
                    this.showMonologue(C.Monologue.waterNote, {
                        whisper: true,
                        onClose: () => {
                            // 独白关闭后约 200ms 触发主 Jump（windows_slam 音效起点）
                            this.setTimer(() => this.startMainJump(), monologueDelay);
                        }
                    });
                }
            });
            this.spawnParticles(C.Screen.width * C.Common.half, C.UI.dialogY, 'paper');
            this.autoSave();
        }

        startMainJump() {
            if (this.data.flags.jumpPlayed || this.jump) {
                return;
            }
            this.data.flags.jumpPlayed = true;
            this.data.state = 'MAIN_JUMP';
            this.closeModal(true);
            this.showGameUi(false);
            this.forceHideDialogue();
            this.inputLocked = true;
            if (this.isJumpSpotlightEnabled()) {
                this.flashlight.locked = true;
                this.flashlight.radius = C.Flashlight.lockedRadius;
            }
            const start = U.now();
            // jumpPhase: 'emerge'（苏晚浮现）→ 'jumpscare'（突脸爆发）→ 'black'（黑屏）
            this.jump = { start, dripAccumulator: C.Common.zero, jumpscareTriggered: false };
            this.updateDialogueFab();
            window.AudioManager.play('windows_slam');
            window.AudioManager.setVolume('bgm_low', C.Audio.jumpBgmVolume);
            this.startShake(C.Camera.jumpShake, C.Camera.jumpShakeFrames * C.Camera.jumpIntroShakeGroups);
            this.setTimer(() => this.startShake(C.Camera.jumpShake, C.Camera.jumpShakeFrames * C.Camera.jumpShakeGroups), C.Timing.jumpShakeMs);
            this.setTimer(() => window.AudioManager.play('radio_static'), C.Timing.jumpStaticMs);
            this.setTimer(() => window.AudioManager.play('voice_return'), C.Timing.jumpVoiceMs);
            this.setTimer(() => {
                if (navigator.vibrate) {
                    navigator.vibrate(C.Jump.vibratePattern);
                }
            }, C.Timing.jumpShakeMs);
            // 突脸爆发：2550ms 触发，剧烈抖动 + 广播音量拉至峰值 + 移动端震动
            this.setTimer(() => {
                if (!this.jump) {
                    return;
                }
                this.jump.jumpscareTriggered = true;
                this.startShake(C.Camera.jumpShake + C.Common.two, C.Camera.jumpShakeFrames * C.Common.three);
                window.AudioManager.setVolume('radio_static', C.Audio.sfxVolume);
                window.AudioManager.play('radio_static');
                if (navigator.vibrate) {
                    navigator.vibrate(C.Jump.jumpscareVibratePattern);
                }
            }, C.Timing.jumpJumpscareMs);
            if (this.isJumpSpotlightEnabled()) {
                this.setTimer(() => {
                    this.flashlight.locked = false;
                }, C.Timing.jumpOffMs);
            }
            this.setTimer(() => this.enterEnding(true), C.Timing.jumpEndingMs);
            this.autoSave();
        }

        enterEnding(save) {
            this.jump = null;
            this.inputLocked = false;
            this.flashlight.locked = false;
            this.flashlight.radius = C.Flashlight.outerRadius;
            this.data.state = 'ENDING';
            this.data.sceneGroup = 'ending';
            this.data.viewId = C.SceneGroups.ending[C.Common.zero];
            this.showGameUi(false);
            this.forceHideDialogue();
            window.AudioManager.setVolume('bgm_low', C.Audio.bgmVolume);
            if (save) {
                this.autoSave();
            }
            this.showEndingModal();
        }

        showEndingModal() {
            const panel = this.createModalPanel(C.Text.endingTitle);
            const text = document.createElement('p');
            text.textContent = C.Text.endingSubtitle;
            panel.appendChild(text);
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            actions.appendChild(U.createButton('重来', '', () => {
                this.closeModal(true);
                this.startNewGame();
            }));
            actions.appendChild(U.createButton('继续探索', '', () => this.showToast(C.Text.continued)));
            actions.appendChild(U.createButton('回看线索', '', () => this.showClueBook(true)));
            panel.appendChild(actions);
            this.openModal(panel);
            // ⑨ 林夏内心独白：结算画面淡入后 600ms 触发（余韵+第二章钉子）
            const endingDelay = C.Monologue ? C.Monologue.endingDelayMs : 600;
            this.setTimer(() => {
                // 需要确认当前仍在结算模态中
                if (this.data.state === 'ENDING') {
                    this.showMonologue(C.Monologue.ending);
                }
            }, endingDelay);
        }

        showHint() {
            const key = this.getHintKey();
            const list = C.Hints[key] || C.Hints.lobby;
            const current = this.data.hintLevels[key] || C.Common.zero;
            const next = U.clamp(current + C.Common.one, C.Common.one, list.length);
            this.data.hintLevels[key] = next;
            this.showDialogue(list[next - C.Common.one]);
            this.autoSave();
        }

        getHintKey() {
            if (this.data.state === 'ENDING' || this.data.sceneGroup === 'ending') {
                return 'ending';
            }
            if (this.data.sceneGroup === 'lobby') {
                return 'lobby';
            }
            if (this.data.sceneGroup === 'corridor') {
                return 'corridor';
            }
            if (this.data.flags.seatSolved || this.data.state === 'PASSWORD_PUZZLE') {
                return 'password';
            }
            return 'classroom';
        }

        // 关键词静态标色：将文本中的关键字/数字包裹为带颜色 span，返回 HTML 字符串。
        // 仅标真正关键的字词，避免大片标色影响阅读；不闪烁、不动画，纯静态。
        highlightKeywords(text) {
            // 转义 HTML 特殊字符，防止 XSS
            const escaped = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            // 锈红标色：重要线索词、关键人名
            const rustWords = [
                '苏晚', '夏夏', '林夏',
                '暗红色圈住', '暗红色',
                '松开手', '受伤',
                '水渍', '磁带'
            ];
            // 暖黄标色：关键数字与规则性线索
            const amberWords = [
                '13号', '第十三排', '十三排', '231',
                '第一节', '一日之计', '书脊', '册数'
            ];
            let result = escaped;
            // 先标锈红（优先级高）
            rustWords.forEach(function(word) {
                const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                result = result.split(word).join('<span class="kw-rust">' + word + '</span>');
            });
            // 再标暖黄
            amberWords.forEach(function(word) {
                // 只替换不在已有 span 内的（简单判断：不含 class= 前缀）
                if (result.indexOf('<span class="kw-rust">' + word) === -1) {
                    result = result.split(word).join('<span class="kw-amber">' + word + '</span>');
                }
            });
            return result;
        }

        paginateDialogue(text) {
            const limit = C.Timing.dialoguePageChars;
            const chars = Array.from(text);
            if (chars.length <= limit) {
                return [text];
            }
            const breakChars = ['。', '！', '？', '”', '，', '、', '；', '?', '!', '.'];
            const pages = [];
            let start = C.Common.zero;
            while (start < chars.length) {
                let end = Math.min(start + limit, chars.length);
                if (end < chars.length) {
                    let cut = -C.Common.one;
                    for (let i = end; i > start + Math.floor(limit * C.Common.half); i -= C.Common.one) {
                        if (breakChars.indexOf(chars[i - C.Common.one]) !== -C.Common.one) {
                            cut = i;
                            break;
                        }
                    }
                    if (cut > C.Common.zero) {
                        end = cut;
                    }
                }
                pages.push(chars.slice(start, end).join(''));
                start = end;
            }
            return pages;
        }

        // 林夏内心独白：复用对话框组件，字色冷青灰 #C8D4D0，字速 22字/秒
        // opts.whisper=true 时展现气音效果（透明度 0.7 + 1px轻微抖动）
        showMonologue(text, opts) {
            const options = opts || {};
            this.showDialogue(text, {
                ghost: false,
                monologue: true,
                whisper: Boolean(options.whisper),
                onClose: options.onClose || null
            });
        }

        showDialogue(text, options) {
            const opts = options || {};
            const pages = this.paginateDialogue(text);
            // monologue 模式：字速 22字/秒，对话框加 monologue 类名（字色冷青灰）
            let cps = opts.ghost ? C.Timing.typeGhostCps : C.Timing.typeNormalCps;
            if (opts.monologue) {
                cps = C.Monologue ? C.Monologue.cps : 22;
            }
            this.dialogue = {
                text,
                pages,
                pageIndex: C.Common.zero,
                chars: Array.from(pages[C.Common.zero]),
                visibleCount: C.Common.zero,
                start: U.now(),
                cps,
                ghost: Boolean(opts.ghost),
                monologue: Boolean(opts.monologue),
                whisper: Boolean(opts.whisper),
                complete: false,
                onClose: opts.onClose || null
            };
            this.dialogueText.textContent = '';
            this.dialogueBox.classList.toggle('ghost', Boolean(opts.ghost));
            this.dialogueBox.classList.toggle('monologue', Boolean(opts.monologue));
            this.dialogueBox.classList.toggle('monologue-whisper', Boolean(opts.monologue && opts.whisper));
            this.dialogueBox.classList.remove('can-advance');
            // 有新旁白需要播放（如点击交互物）时，自动展开旁白文本框
            this.dialogueCollapsed = false;
            this.dialogueHasUnread = false;
            this.openDialogueBox();
            this.updateDialogueFab();
        }

        // 打开（显示）文本框本体，应用展开过渡，不改玩家的收起意图
        openDialogueBox() {
            U.removeClass(this.dialogueBox, 'hidden');
            // 强制回流后移除 collapsed，触发上滑展开过渡
            void this.dialogueBox.offsetHeight;
            this.dialogueBox.classList.remove('collapsed');
            this.pressInventory();
            this.updateDialogueNextHint();
        }

        showDialoguePage(index) {
            this.dialogue.pageIndex = index;
            this.dialogue.chars = Array.from(this.dialogue.pages[index]);
            this.dialogue.visibleCount = C.Common.zero;
            this.dialogue.start = U.now();
            this.dialogue.complete = false;
            this.dialogue.completedAt = null;
            this.dialogueText.textContent = '';
            this.dialogueBox.classList.remove('can-advance');
        }

        advanceDialogue() {
            if (!this.dialogue || this.dialogueCollapsed) {
                return;
            }
            if (!this.dialogue.complete) {
                this.dialogue.complete = true;
                this.dialogue.visibleCount = this.dialogue.chars.length;
                this.dialogueText.innerHTML = this.highlightKeywords(this.dialogue.pages[this.dialogue.pageIndex]);
                this.dialogue.completedAt = U.now();
                this.onDialoguePageComplete(U.now());
                return;
            }
            if (this.dialogue.pageIndex < this.dialogue.pages.length - C.Common.one) {
                this.showDialoguePage(this.dialogue.pageIndex + C.Common.one);
                return;
            }
            if (this.dialogue.completedAt && U.now() - this.dialogue.completedAt < C.Timing.dialogueStayMs) {
                return;
            }
            this.closeDialogue();
        }

        closeDialogue() {
            const onClose = this.dialogue ? this.dialogue.onClose : null;
            this.dialogue = null;
            // 注意：不重置 dialogueCollapsed —— 玩家的收起/展开意图被记忆并保持
            this.dialogueHasUnread = false;
            U.addClass(this.dialogueBox, 'hidden');
            this.dialogueBox.classList.remove('ghost', 'monologue', 'monologue-whisper', 'collapsed', 'can-advance');
            this.releaseInventory();
            this.updateDialogueFab();
            if (onClose) {
                onClose();
            }
        }

        // 道具栏固定按钮点击：水平收起/展开，状态被记忆，任何交互都不改它
        toggleInventoryCollapse() {
            this.inventoryCollapsed = !this.inventoryCollapsed;
            this.applyInventoryState();
            this.updateInventoryFab();
        }

        applyInventoryState() {
            if (!this.inventoryBar) {
                return;
            }
            this.inventoryBar.classList.toggle('collapsed-x', this.inventoryCollapsed);
        }

        // 道具栏收起/展开固定按钮：位置不变、始终可见可点；图标随状态水平切换
        updateInventoryFab() {
            if (!this.inventoryFab) {
                return;
            }
            const visible = this.started && !this.intro && !this.modalOpen &&
                this.data.state !== 'ENDING' && !this.jump &&
                !this.inventoryBar.classList.contains('hidden');
            this.inventoryFab.classList.toggle('hidden', !visible);
            if (this.inventoryFabIcon) {
                // 收起态显示“展开”(‹反向)，展开态显示“收起”(›)
                this.inventoryFabIcon.textContent = this.inventoryCollapsed ? '‹' : '›';
            }
            this.inventoryFab.setAttribute('aria-label', this.inventoryCollapsed ? '展开道具栏' : '收起道具栏');
        }

        // 固定按钮点击：唯一改变收起/展开状态的入口
        toggleDialogueCollapse() {
            this.dialogueCollapsed = !this.dialogueCollapsed;
            if (!this.dialogueCollapsed) {
                // 展开：清除“有新内容”提示
                this.dialogueHasUnread = false;
            }
            this.applyDialogueState();
            this.updateDialogueFab();
        }

        // 根据当前收起/展开意图渲染文本框（仅在有对话内容时显示本体）
        applyDialogueState() {
            if (this.dialogueCollapsed) {
                if (!this.dialogueBox.classList.contains('hidden')) {
                    this.dialogueBox.classList.add('collapsed');
                }
                this.dialogueBox.classList.remove('can-advance');
                this.releaseInventory();
            } else if (this.dialogue) {
                this.openDialogueBox();
            }
        }

        // 固定常驻按钮：位置不变、始终可见可点；图标随状态切换；收起态有新旁白时点亮红点
        updateDialogueFab() {
            if (!this.dialogueFab) {
                return;
            }
            const visible = this.started && !this.intro && !this.modalOpen &&
                this.data.state !== 'ENDING' && !this.jump;
            this.dialogueFab.classList.toggle('hidden', !visible);
            if (this.dialogueFabIcon) {
                // 收起态显示“展开/打开对话”图标(∧)，展开态显示“收起”图标(∨)
                this.dialogueFabIcon.textContent = this.dialogueCollapsed ? '∧' : '∨';
            }
            this.dialogueFab.setAttribute('aria-label', this.dialogueCollapsed ? '展开对话' : '收起对话');
            if (this.dialogueFabDot) {
                const showDot = this.dialogueCollapsed && this.dialogueHasUnread && Boolean(this.dialogue);
                this.dialogueFabDot.classList.toggle('hidden', !showDot);
            }
        }

        forceHideDialogue() {
            this.dialogue = null;
            this.dialogueHasUnread = false;
            U.addClass(this.dialogueBox, 'hidden');
            this.dialogueBox.classList.remove('ghost', 'monologue', 'monologue-whisper', 'collapsed', 'can-advance');
            this.releaseInventory();
            this.updateDialogueFab();
        }

        pressInventory() {
            if (this.inventoryBar) {
                this.inventoryBar.classList.add('dimmed');
            }
        }

        releaseInventory() {
            if (this.inventoryBar) {
                this.inventoryBar.classList.remove('dimmed');
            }
        }

        showToast(text, type) {
            if (!this.toastLayer) {
                return;
            }
            const toast = document.createElement('div');
            toast.className = type === 'error' ? 'toast error' : 'toast';
            toast.textContent = text;
            this.toastLayer.appendChild(toast);
            this.setTimer(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, C.Timing.toastMs);
        }

        createModalPanel(title) {
            const panel = document.createElement('section');
            panel.className = 'modal-panel';
            const heading = document.createElement(C.DomTags.headingTwo);
            heading.textContent = title;
            panel.appendChild(heading);
            return panel;
        }

        openModal(panel) {
            U.clearChildren(this.modalLayer);
            this.modalLayer.appendChild(panel);
            U.removeClass(this.modalLayer, 'hidden');
            this.modalOpen = true;
            this.updateDialogueFab();
        }

        closeModal(silent) {
            if (!this.modalLayer) {
                return;
            }
            U.clearChildren(this.modalLayer);
            U.addClass(this.modalLayer, 'hidden');
            this.modalOpen = false;
            this.updateDialogueFab();
            if (!silent) {
                this.showToast(C.Text.saved);
            }
        }

        spawnParticlesFromHotspot(hotspot, type) {
            const center = U.rectCenter(hotspot);
            this.spawnParticles(center.x, center.y, type);
        }

        spawnParticles(x, y, type) {
            let count = C.Particles.pickupCount;
            let life = C.Particles.pickupLife;
            let speedMin = C.Particles.pickupSpeedMin;
            let speedMax = C.Particles.pickupSpeedMax;
            let color = C.Colors.flashlight;
            if (type === 'success') {
                count = C.Particles.successCount;
                life = C.Particles.successLife;
                speedMin = C.Particles.successSpeedMin;
                speedMax = C.Particles.successSpeedMax;
            } else if (type === 'paper') {
                count = C.Particles.paperCount;
                life = C.Particles.paperLife;
                speedMin = C.Particles.paperSpeedMin;
                speedMax = C.Particles.paperSpeedMax;
                color = C.Colors.moon;
            }
            for (let i = C.Common.zero; i < count; i += C.Common.one) {
                const angle = U.randomRange(C.Common.zero, C.Common.fullCircle);
                const speed = U.randomRange(speedMin, speedMax);
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity: type === 'paper' ? C.Particles.paperSpeedMin : C.Common.zero,
                    age: C.Common.zero,
                    life,
                    size: U.randomRange(C.Render.particleMinSize, C.Render.particleMaxSize),
                    color: type === 'success' ? U.pick([C.Colors.flashlight, C.Colors.moon]) : color
                });
            }
        }

        spawnDrip() {
            this.particles.push({
                x: C.Jump.ghostX + U.randomRange(C.Common.zero, C.Render.ghostDripOffsetX),
                y: C.Jump.ghostEndY + C.Render.ghostDripOffsetY,
                vx: U.randomRange(-C.Common.twenty, C.Common.twenty),
                vy: C.Particles.paperSpeedMax,
                gravity: C.Particles.paperSpeedMin,
                age: C.Common.zero,
                life: C.Particles.paperLife,
                size: C.Render.dripW,
                color: C.Render.rgbaMoonDrip,
                drip: true
            });
        }

        spawnFloat(text, x, y, type) {
            const map = {
                item: { life: C.Feedback.floatDurationItem, rise: C.Feedback.floatItemRise, size: C.Feedback.floatItemSize, color: C.Colors.flashlight },
                clue: { life: C.Feedback.floatDurationClue, rise: C.Feedback.floatClueRise, size: C.Feedback.floatClueSize, color: C.Colors.moon },
                error: { life: C.Feedback.floatDurationClue, rise: C.Feedback.floatErrorRise, size: C.Feedback.floatErrorSize, color: C.Colors.rust }
            };
            const meta = map[type] || map.clue;
            this.floats.push({ text, x, y, age: C.Common.zero, life: meta.life, rise: meta.rise, size: meta.size, color: meta.color });
        }

        startShake(amplitude, frames) {
            this.shake.amplitude = amplitude;
            this.shake.frames = Math.max(this.shake.frames, frames);
        }

        setTimer(callback, delay) {
            const id = window.setTimeout(() => {
                this.pendingTimers = this.pendingTimers.filter((timerId) => timerId !== id);
                callback();
            }, delay);
            this.pendingTimers.push(id);
            return id;
        }

        clearTimers() {
            this.pendingTimers.forEach((id) => window.clearTimeout(id));
            this.pendingTimers = [];
        }

        render(time) {
            const ctx = this.ctx;
            ctx.clearRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
            if (this.intro) {
                this.drawIntro(ctx, time);
                this.drawTransition(ctx, time);
                return;
            }
            ctx.save();
            this.applyShake(ctx);
            this.drawScene(ctx, time);
            this.drawSceneReadableOverlays(ctx, time);
            if (this.jump) {
                this.drawJump(ctx, time);
            } else if (this.data.state === 'ENDING') {
                this.drawEndingBackdrop(ctx);
            } else {
                if (this.isFlashlightEnabled()) {
                    this.drawFlashlight(ctx, this.flashlight.x, this.flashlight.y, C.Flashlight.outerRadius, C.Render.normalDarknessAlpha);
                } else {
                    this.drawAmbientLight(ctx);
                }
                this.drawHotspots(ctx, time);
                this.drawTapFeedback(ctx, time);
            }
            this.drawParticles(ctx);
            this.drawFloats(ctx);
            ctx.restore();
            this.drawTransition(ctx, time);
            this.drawFlashWhite(ctx, time);
        }

        applyShake(ctx) {
            if (this.shake.frames <= C.Common.zero) {
                return;
            }
            const x = U.randomRange(-this.shake.amplitude, this.shake.amplitude);
            const y = U.randomRange(-this.shake.amplitude, this.shake.amplitude);
            ctx.translate(x, y);
            this.shake.frames -= C.Common.one;
        }

        drawScene(ctx) {
            const scene = C.Scenes[this.data.viewId] || C.Scenes[C.InitialState.firstView];
            const img = window.Loader.getImage(scene.image);
            if (img && img.naturalWidth && img.naturalHeight) {
                const fit = U.scaleToContain(img.naturalWidth, img.naturalHeight, C.Screen.width, C.Screen.height);
                window.Loader.drawImage(ctx, scene.image, fit.x, fit.y, fit.w, fit.h);
            } else {
                window.Loader.drawImage(ctx, scene.image, C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
            }
            this.drawVignette(ctx);
            this.drawSceneTitle(ctx, scene.title);
        }

        drawAmbientLight(ctx) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const gradient = ctx.createLinearGradient(C.Common.zero, C.Common.zero, C.Common.zero, C.Screen.height);
            gradient.addColorStop(C.Common.zero, 'rgba(200,212,208,0.10)');
            gradient.addColorStop(C.Common.half, 'rgba(58,74,82,0.06)');
            gradient.addColorStop(C.Common.one, 'rgba(90,70,50,0.03)');
            ctx.fillStyle = gradient;
            ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
            ctx.restore();
        }

        drawVignette(ctx) {
            const gradient = ctx.createRadialGradient(
                C.Screen.width * C.Common.half,
                C.Screen.height * C.Common.half,
                C.Screen.width * C.Common.quarter,
                C.Screen.width * C.Common.half,
                C.Screen.height * C.Common.half,
                C.Screen.height * C.Common.half
            );
            const innerAlpha = this.isFlashlightEnabled() ? C.Render.vignetteInnerAlpha : C.Render.ambientVignetteInnerAlpha;
            const outerAlpha = this.isFlashlightEnabled() ? C.Render.vignetteOuterAlpha : C.Render.ambientVignetteOuterAlpha;
            gradient.addColorStop(C.Common.zero, U.alphaColor(C.Render.rgbaBlackTemplate, innerAlpha));
            gradient.addColorStop(C.Common.one, U.alphaColor(C.Render.rgbaBlackTemplate, outerAlpha));
            ctx.fillStyle = gradient;
            ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
        }

        drawSceneTitle(ctx, title) {
            if (this.data.state === 'START') {
                return;
            }
            ctx.save();
            ctx.font = `${C.Render.sceneTitleSize}px serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = C.Render.rgbaMoonSceneTitle;
            ctx.fillText(title, C.Render.sceneTitleX, C.Render.sceneTitleY);
            ctx.restore();
        }

        drawSceneReadableOverlays(ctx, time) {
            // 线索美术化：点名册/值日表/课程表/标语等线索信息已「画在物件里」，
            // 由背景图与点击弹出的精绘特写承载，不再用系统文字面板覆盖在黑板上。
            if (this.data.viewId === C.SceneGroups.corridor[C.Common.two]) {
                this.drawFanShadow(ctx, time);
            }
        }






        drawFanShadow(ctx, time) {
            const angle = (time / C.Common.msToSeconds) * C.Feedback.fanRotateDegPerSecond * C.Common.radiansPerDegree;
            ctx.save();
            ctx.translate(C.Render.fanCenterX, C.Render.fanCenterY);
            ctx.rotate(angle);
            ctx.fillStyle = C.Render.rgbaBlackSoft;
            for (let i = C.Common.zero; i < C.Common.four; i += C.Common.one) {
                ctx.rotate(C.Common.fullCircle / C.Common.four);
                ctx.fillRect(C.Common.zero, -C.Render.fanBladeH * C.Common.half, C.Render.fanBladeW, C.Render.fanBladeH);
            }
            ctx.beginPath();
            ctx.arc(C.Common.zero, C.Common.zero, C.Render.fanHubRadius, C.Common.zero, C.Common.fullCircle);
            ctx.fill();
            ctx.restore();
        }

        drawHotspots(ctx, time) {
            const hotspots = this.getAvailableHotspots();
            const reveal = this.isRevealActive();
            hotspots.forEach((hotspot) => {
                const lit = this.isHotspotLit(hotspot);
                // 探索时默认不显示常驻高亮；仅当玩家开启“高亮提示”开关，或正在使用“显影”兜底时才显示
                if (!reveal && !this.hotspotHintsEnabled) {
                    return;
                }
                if (!lit && !reveal) {
                    return;
                }
                const pulse = (Math.sin(time / C.Timing.hotspotPulseMs * C.Common.fullCircle) + C.Common.one) * C.Common.half;
                ctx.save();
                ctx.globalAlpha = reveal ? C.Common.half + pulse * C.Common.half : C.Common.quarter + pulse * C.Common.quarter;
                ctx.strokeStyle = C.Colors.flashlight;
                ctx.lineWidth = C.Feedback.hotspotLineWidth;
                ctx.setLineDash([C.Feedback.hotspotDash, C.Feedback.hotspotDashGap]);
                ctx.strokeRect(hotspot.x, hotspot.y, hotspot.w, hotspot.h);
                ctx.setLineDash([]);
                ctx.font = `${C.Render.hotspotLabelSize}px serif`;
                ctx.textAlign = 'center';
                ctx.fillStyle = C.Colors.flashlight;
                ctx.fillText(hotspot.label, hotspot.x + hotspot.w * C.Common.half, hotspot.y - C.Common.ten);
                ctx.restore();
            });
        }

        drawFlashlight(ctx, x, y, radius, darknessAlpha) {
            ctx.save();
            const shade = ctx.createRadialGradient(x, y, C.Common.zero, x, y, radius);
            shade.addColorStop(C.Common.zero, C.Render.rgbaBlackClear);
            shade.addColorStop(C.Render.overlayGradientStopInner, U.alphaColor(C.Render.rgbaBlackTemplate, darknessAlpha * (C.Common.one - C.Render.overlayCutAlphaInner)));
            shade.addColorStop(C.Render.overlayGradientStopMiddle, U.alphaColor(C.Render.rgbaBlackTemplate, darknessAlpha * (C.Common.one - C.Render.overlayCutAlphaMiddle)));
            shade.addColorStop(C.Common.one, U.alphaColor(C.Render.rgbaBlackTemplate, darknessAlpha));
            ctx.fillStyle = shade;
            ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
            const warm = ctx.createRadialGradient(x, y, C.Common.zero, x, y, radius);
            warm.addColorStop(C.Common.zero, U.alphaColor(C.Render.rgbaLightTemplate, C.Flashlight.centerAlpha));
            warm.addColorStop(C.Render.warmStopMiddle, C.Render.rgbaLightWarmMid);
            warm.addColorStop(C.Common.one, C.Render.rgbaLightWarmEdge);
            ctx.fillStyle = warm;
            ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
            ctx.restore();
        }

        drawJump(ctx, time) {
            const elapsed = time - this.jump.start;
            ctx.save();

            // 0~180ms：黑幕渐入
            const blackAlpha = U.clamp(elapsed / C.Timing.jumpBlackMs, C.Common.zero, C.Common.one);
            ctx.fillStyle = U.alphaColor(C.Render.rgbaBlackTemplate, blackAlpha);
            ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);

            // 突脸黑屏阶段（3050ms 后急速黑屏）
            if (elapsed >= C.Timing.jumpJumpscareBlackMs) {
                const blackoutProgress = U.clamp((elapsed - C.Timing.jumpJumpscareBlackMs) / C.Common.eighty, C.Common.zero, C.Common.one);
                ctx.fillStyle = U.alphaColor(C.Render.rgbaBlackTemplate, blackoutProgress);
                ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
                ctx.restore();
                return;
            }

            // 突脸爆发阶段（2550ms ~ 3050ms）：suwan_emerge_pose 整体等比放大推近
            if (elapsed >= C.Timing.jumpJumpscareMs) {
                const jProgress = U.clamp(
                    (elapsed - C.Timing.jumpJumpscareMs) / C.Timing.jumpJumpscareDurationMs,
                    C.Common.zero, C.Common.one
                );
                const jScale = U.lerp(C.Jump.jumpscareScaleFrom, C.Jump.jumpscareScaleTo, jProgress);
                const jAlpha = U.clamp(jProgress * C.Common.three, C.Common.zero, C.Jump.jumpscareAlphaMax);
                // 先淡出浮现图（快速）
                const emergeOutAlpha = U.clamp(C.Common.one - jProgress * C.Common.four, C.Common.zero, C.Common.one);
                if (emergeOutAlpha > C.Common.zero) {
                    this.drawSuwanEmerge(ctx, C.Common.one, emergeOutAlpha);
                }
                // 突脸图：等比 contain 缩放，以画面中心为锚点整体放大
                ctx.save();
                ctx.globalAlpha = jAlpha;
                this.drawSuwanJumpscare(ctx, jScale);
                ctx.restore();
                ctx.restore();
                return;
            }

            // 900ms ~ 2550ms：苏晚浮现演出（suwan_emerge_pose）
            if (elapsed >= C.Timing.jumpGhostStartMs && elapsed < C.Timing.jumpJumpscareMs) {
                const emergeProgress = U.clamp(
                    (elapsed - C.Timing.jumpGhostStartMs) / (C.Timing.jumpGhostEndMs - C.Timing.jumpGhostStartMs),
                    C.Common.zero, C.Common.one
                );
                const emergeAlpha = emergeProgress * C.Jump.emergeAlphaMax;
                if (!this.isJumpSpotlightEnabled()) {
                    // 背光效果
                    const ghostY = U.lerp(C.Jump.emergeStartY, C.Jump.emergeEndY, emergeProgress);
                    this.drawJumpBacklight(ctx, ghostY, emergeProgress);
                }
                this.drawSuwanEmerge(ctx, emergeProgress, emergeAlpha);
                if (this.isJumpSpotlightEnabled()) {
                    this.drawFlashlight(ctx, C.Flashlight.spotlightX, C.Flashlight.spotlightY, C.Flashlight.lockedRadius, C.Render.lockLightAlpha);
                }
            }

            ctx.restore();
        }

        // 绘制苏晚浮现立绘（suwan_emerge_pose）：等比 contain，从下方纵向浮现
        drawSuwanEmerge(ctx, progress, alpha) {
            const img = window.Loader.getImage('suwan_emerge_pose');
            if (!img || !img.naturalWidth || !img.naturalHeight) {
                // 兜底：绘制剪影
                const ghostY = U.lerp(C.Jump.emergeStartY, C.Jump.emergeEndY, progress);
                ctx.save();
                ctx.globalAlpha = alpha;
                window.Loader.drawImage(ctx, 'suwan_silhouette', C.Jump.ghostX, ghostY, C.Jump.ghostW, C.Jump.ghostH);
                ctx.restore();
                return;
            }
            // 等比 contain：以画面宽为基准，保持原始宽高比
            const targetW = C.Screen.width;
            const targetH = C.Screen.height;
            const srcW = img.naturalWidth;
            const srcH = img.naturalHeight;
            const scale = Math.min(targetW / srcW, targetH / srcH);
            const drawW = srcW * scale;
            const drawH = srcH * scale;
            const drawX = (targetW - drawW) * C.Common.half;
            // 纵向浮现：Y 从 emergeStartY 向上移动到 emergeEndY（以立绘顶部为参考）
            const topY = U.lerp(C.Jump.emergeStartY, C.Jump.emergeEndY, progress);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.drawImage(img, drawX, topY, drawW, drawH);
            ctx.restore();
        }

        // 绘制突脸爆发段：使用苏晚低头坐姿图（suwan_emerge_pose）整体等比放大推近
        // 不使用任何狰狞/惊悚脸特写素材，靠「突然逼近+音效+静默打破」营造压迫
        drawSuwanJumpscare(ctx, scale) {
            const img = window.Loader.getImage('suwan_emerge_pose');
            if (!img || !img.naturalWidth || !img.naturalHeight) {
                // 兜底：深色压迫遮罩，不使用红色或血腥元素
                ctx.save();
                ctx.fillStyle = 'rgba(8,14,18,0.92)';
                ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
                ctx.restore();
                return;
            }
            // 等比 contain：计算 1.0 倍时的绘制尺寸（铺满画面）
            const srcW = img.naturalWidth;
            const srcH = img.naturalHeight;
            const baseScale = Math.min(C.Screen.width / srcW, C.Screen.height / srcH);
            const drawW = srcW * baseScale * scale;
            const drawH = srcH * baseScale * scale;
            // 以画面中心为锚点整体等比放大，不横向压扁
            const drawX = (C.Screen.width - drawW) * C.Common.half;
            const drawY = (C.Screen.height - drawH) * C.Common.half;
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }

        drawJumpBacklight(ctx, ghostY, progress) {
            ctx.save();
            ctx.globalAlpha = U.clamp(progress, C.Common.zero, C.Common.one) * C.Jump.backlightAlphaMax;
            const centerX = C.Jump.ghostX + C.Jump.ghostW * C.Common.half;
            const centerY = ghostY + C.Jump.ghostH * C.Common.half;
            const glow = ctx.createRadialGradient(centerX, centerY, C.Jump.backlightInnerRadius, centerX, centerY, C.Jump.backlightOuterRadius);
            glow.addColorStop(C.Common.zero, C.Jump.backlightInnerColor);
            glow.addColorStop(C.Common.one, C.Jump.backlightOuterColor);
            ctx.fillStyle = glow;
            ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
            ctx.restore();
        }

        drawEndingBackdrop(ctx) {
            ctx.save();
            ctx.fillStyle = C.Colors.black;
            ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
            ctx.fillStyle = C.Colors.moon;
            ctx.textAlign = 'center';
            ctx.font = `${C.Common.forty}px serif`;
            ctx.fillText(C.Text.endingTitle, C.Screen.width * C.Common.half, C.Ending.titleY);
            ctx.font = `${C.Feedback.floatErrorSize}px serif`;
            ctx.fillStyle = C.Render.rgbaMoonEnding;
            ctx.fillText(C.Text.endingSubtitle, C.Screen.width * C.Common.half, C.Ending.subtitleY);
            ctx.restore();
        }

        drawParticles(ctx) {
            this.particles.forEach((particle) => {
                const alpha = C.Common.one - particle.age / particle.life;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = particle.color;
                if (particle.drip) {
                    ctx.fillRect(particle.x, particle.y, C.Render.dripW, C.Render.dripH);
                } else {
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, C.Common.zero, C.Common.fullCircle);
                    ctx.fill();
                }
                ctx.restore();
            });
        }

        drawFloats(ctx) {
            this.floats.forEach((floatText) => {
                const progress = floatText.age / floatText.life;
                const y = floatText.y - floatText.rise * progress;
                ctx.save();
                ctx.globalAlpha = C.Common.one - progress;
                ctx.font = `${floatText.size}px serif`;
                ctx.textAlign = 'center';
                ctx.lineWidth = C.Render.floatStrokeWidth;
                ctx.strokeStyle = C.Render.rgbaBlackMid;
                ctx.fillStyle = floatText.color;
                ctx.strokeText(floatText.text, floatText.x, y);
                ctx.fillText(floatText.text, floatText.x, y);
                ctx.restore();
            });
        }

        drawTransition(ctx, time) {
            if (!this.transition) {
                return;
            }
            const progress = U.clamp((time - this.transition.start) / this.transition.duration, C.Common.zero, C.Common.one);
            const alpha = (C.Common.one - progress) * C.Camera.transitionAlpha;
            ctx.save();
            ctx.fillStyle = U.alphaColor(C.Render.rgbaBlackTemplate, alpha);
            ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
            ctx.restore();
            if (progress >= C.Common.one) {
                this.transition = null;
            }
        }

        triggerFlashWhite() {
            this.flashWhiteStart = U.now();
        }

        drawFlashWhite(ctx, time) {
            if (this.flashWhiteStart === null) {
                return;
            }
            const progress = U.clamp((time - this.flashWhiteStart) / C.Timing.flashWhiteMs, C.Common.zero, C.Common.one);
            if (progress >= C.Common.one) {
                this.flashWhiteStart = null;
                return;
            }
            ctx.save();
            ctx.fillStyle = U.alphaColor(C.Render.rgbaLightTemplate, (C.Common.one - progress) * C.Common.half);
            ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
            ctx.restore();
        }

        drawIntro(ctx, time) {
            const intro = this.intro;
            const frameIndex = intro.frameIndex;
            const frame = C.Intro.frames[frameIndex];
            // 黑底
            ctx.fillStyle = C.Colors.black;
            ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);

            const elapsed = time - intro.phaseStart;
            let frameAlpha = C.Common.one;
            let crossPrevAlpha = C.Common.zero;
            let inProgress = C.Common.one;
            if (intro.phase === 'in') {
                const inDuration = frameIndex === C.Common.zero ? C.Intro.firstFadeInMs : C.Intro.crossFadeMs;
                inProgress = U.clamp(elapsed / inDuration, C.Common.zero, C.Common.one);
                frameAlpha = inProgress;
                // 非首帧：上一帧交叉淡出
                if (frameIndex > C.Common.zero) {
                    crossPrevAlpha = C.Common.one - inProgress;
                }
            }

            // 上一帧交叉淡出
            if (crossPrevAlpha > C.Common.zero) {
                this.drawIntroFrameImage(ctx, C.Intro.frames[frameIndex - C.Common.one], C.Common.one, crossPrevAlpha, time, frameIndex - C.Common.one);
            }
            // 当前帧
            this.drawIntroFrameImage(ctx, frame, this.getIntroZoom(frame, intro, time, inProgress), frameAlpha, time, frameIndex);

            // 画面专属轻动画叠层
            this.drawIntroFrameOverlay(ctx, frameIndex, frameAlpha, time);

            // 边缘雪花噪点（呼吸）
            this.drawIntroNoise(ctx, time, frameIndex);

            // 逐字旁白（仅在 hold 阶段显示，in 阶段渐入）
            this.drawIntroCaption(ctx, frame, intro, time);

            // 旁白完整浮现并停留满 1 秒后，提示玩家点击翻页（手动操作，不自动跳转）
            this.drawIntroTapHint(ctx, intro, time);
        }

        drawIntroTapHint(ctx, intro, time) {
            if (!intro.waitingForTap) {
                return;
            }
            const isLast = intro.frameIndex >= C.Intro.frames.length - C.Common.one;
            const label = isLast ? '点击进入 ▷' : '点击继续 ▷';
            // 缓慢闪动，老式风格、克制不抢戏
            const breath = C.Common.half + Math.sin(time / C.Common.hundred / C.Common.five * C.Common.fullCircle) * C.Common.half;
            ctx.save();
            ctx.globalAlpha = C.Common.half + breath * C.Common.half;
            ctx.font = `${C.Common.twentyFour}px "Noto Serif SC", "Songti SC", serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.lineWidth = C.Render.floatStrokeWidth;
            ctx.strokeStyle = C.Render.rgbaBlackMid;
            ctx.fillStyle = C.Colors.moon;
            const x = C.Screen.width - C.Common.forty;
            const y = C.Screen.height - C.Common.forty;
            ctx.strokeText(label, x, y);
            ctx.fillText(label, x, y);
            ctx.restore();
        }

        getIntroZoom(frame, intro, time, inProgress) {
            // hold 阶段按整段时长推进缩放，in 阶段以起始缩放为准
            let progress = C.Common.zero;
            if (intro.phase === 'hold') {
                const holdElapsed = time - intro.phaseStart;
                const span = frame.id === 'school' ? C.Intro.schoolZoomMs : frame.durationMs;
                progress = U.clamp(holdElapsed / span, C.Common.zero, C.Common.one);
            } else {
                progress = frame.id === 'tape' ? inProgress : C.Common.zero;
            }
            return U.lerp(frame.zoomFrom, frame.zoomTo, progress);
        }

        drawIntroFrameImage(ctx, frame, zoom, alpha, time, frameIndex) {
            if (alpha <= C.Common.zero) {
                return;
            }
            const img = window.Loader.getImage(frame.image);
            ctx.save();
            ctx.globalAlpha = U.clamp(alpha, C.Common.zero, C.Common.one);
            let dx = C.Common.zero;
            // 画面2：雨夜虚化层缓慢横向视差
            if (frame.id === 'walkman') {
                const t = (time % C.Intro.walkmanParallaxMs) / C.Intro.walkmanParallaxMs;
                dx = Math.sin(t * C.Common.fullCircle) * C.Intro.walkmanParallaxPx;
            }
            const baseW = C.Screen.width * zoom;
            const baseH = C.Screen.height * zoom;
            const ox = (C.Screen.width - baseW) * C.Common.half + dx;
            const oy = (C.Screen.height - baseH) * C.Common.half;
            if (img && !img.useFallback && img.complete && img.naturalWidth) {
                ctx.drawImage(img, ox, oy, baseW, baseH);
            } else {
                window.Loader.drawFallback(ctx, frame.image, C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
            }
            ctx.restore();
        }

        drawIntroFrameOverlay(ctx, frameIndex, frameAlpha, time) {
            if (frameAlpha <= C.Common.zero) {
                return;
            }
            const frame = C.Intro.frames[frameIndex];
            if (frame.id === 'walkman') {
                // 暗哑锈红指示灯微弱明灭
                const breath = C.Common.half + Math.sin(time / C.Intro.walkmanLedBreathMs * C.Common.fullCircle) * C.Common.half;
                const ledAlpha = U.lerp(C.Intro.walkmanLedAlphaMin, C.Intro.walkmanLedAlphaMax, breath) * frameAlpha;
                ctx.save();
                ctx.globalAlpha = ledAlpha;
                const glow = ctx.createRadialGradient(C.Intro.walkmanLedX, C.Intro.walkmanLedY, C.Common.zero, C.Intro.walkmanLedX, C.Intro.walkmanLedY, C.Intro.walkmanLedRadius * C.Common.three);
                glow.addColorStop(C.Common.zero, C.Colors.rust);
                glow.addColorStop(C.Common.one, C.Render.rgbaBlackClear);
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(C.Intro.walkmanLedX, C.Intro.walkmanLedY, C.Intro.walkmanLedRadius * C.Common.three, C.Common.zero, C.Common.fullCircle);
                ctx.fill();
                ctx.restore();
            } else if (frame.id === 'school') {
                // 斜向飘落雨丝
                this.drawIntroRain(ctx, time, frameAlpha);
                // 窗口冷青光极缓慢明灭
                const breath = C.Common.half + Math.sin(time / C.Intro.windowGlowBreathMs * C.Common.fullCircle) * C.Common.half;
                const glowAlpha = U.lerp(C.Intro.windowGlowAlphaMin, C.Intro.windowGlowAlphaMax, breath) * frameAlpha;
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = glowAlpha;
                const glow = ctx.createRadialGradient(C.Intro.windowGlowX, C.Intro.windowGlowY, C.Common.zero, C.Intro.windowGlowX, C.Intro.windowGlowY, C.Intro.windowGlowRadius);
                glow.addColorStop(C.Common.zero, C.Colors.moon);
                glow.addColorStop(C.Common.one, C.Render.rgbaBlackClear);
                ctx.fillStyle = glow;
                ctx.fillRect(C.Common.zero, C.Common.zero, C.Screen.width, C.Screen.height);
                ctx.restore();
            }
        }

        drawIntroRain(ctx, time, frameAlpha) {
            ctx.save();
            ctx.globalAlpha = C.Intro.rainAlpha * frameAlpha;
            ctx.strokeStyle = C.Colors.moon;
            ctx.lineWidth = C.Common.two;
            const cycle = C.Screen.height + C.Intro.rainLineLen;
            for (let i = C.Common.zero; i < C.Intro.rainLineCount; i += C.Common.one) {
                const seedX = (i * 137) % C.Screen.width;
                const offset = (time / C.Common.msToSeconds * C.Intro.rainSpeed + i * 67) % cycle;
                const y = offset - C.Intro.rainLineLen;
                const x = (seedX + offset * C.Intro.rainSlant) % C.Screen.width;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - C.Intro.rainLineLen * C.Intro.rainSlant, y + C.Intro.rainLineLen);
                ctx.stroke();
            }
            ctx.restore();
        }

        drawIntroNoise(ctx, time, frameIndex) {
            const breath = C.Common.half + Math.sin(time / C.Intro.noiseBreathMs * C.Common.fullCircle) * C.Common.half;
            let baseAlpha = U.lerp(C.Intro.noiseAlphaMin, C.Intro.noiseAlphaMax, breath);
            // 画面1按下播放键后噪点轻微增强
            if (frameIndex === C.Common.zero && this.intro && this.intro.clickPlayed) {
                baseAlpha = Math.min(C.Intro.noiseAlphaMax, baseAlpha * C.Common.two);
            }
            ctx.save();
            ctx.globalAlpha = baseAlpha;
            const cell = C.Intro.noiseCell;
            const seed = Math.floor(time / C.Common.hundred);
            // 边缘加密、中心稀疏，避免干扰阅读
            for (let y = C.Common.zero; y < C.Screen.height; y += cell) {
                for (let x = C.Common.zero; x < C.Screen.width; x += cell) {
                    const edge = (x < C.Screen.width * C.Common.quarter || x > C.Screen.width * (C.Common.one - C.Common.quarter) ||
                        y < C.Screen.height * C.Common.quarter || y > C.Screen.height * (C.Common.one - C.Common.quarter));
                    const rnd = this.introNoiseRandom(x + seed, y + seed);
                    if (!edge && rnd > C.Common.quarter) {
                        continue;
                    }
                    if (rnd > C.Common.half) {
                        const shade = Math.floor(rnd * C.Common.hundred * C.Common.two);
                        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
                        ctx.fillRect(x, y, cell * C.Common.half, cell * C.Common.half);
                    }
                }
            }
            ctx.restore();
        }

        introNoiseRandom(x, y) {
            const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return v - Math.floor(v);
        }

        drawIntroCaption(ctx, frame, intro, time) {
            const chars = Array.from(frame.caption);
            let visible = chars.length;
            let boxAlpha = C.Common.one;
            if (intro.phase === 'in') {
                // 旁白随画面渐入，逐字从 hold 起算；in 阶段先淡入底衬但暂不打字
                const inDuration = intro.frameIndex === C.Common.zero ? C.Intro.firstFadeInMs : C.Intro.crossFadeMs;
                boxAlpha = U.clamp((time - intro.phaseStart) / inDuration, C.Common.zero, C.Common.one);
                visible = C.Common.zero;
            } else {
                const holdElapsed = time - intro.phaseStart;
                visible = Math.min(chars.length, Math.floor(holdElapsed / C.Common.msToSeconds * C.Intro.typeCps));
            }
            const text = chars.slice(C.Common.zero, visible).join('');

            // 自动换行
            const lines = this.wrapIntroCaption(text, C.Intro.captionMaxCharsPerLine);
            const boxW = C.Intro.captionBoxW;
            const boxH = C.Intro.captionBoxH;
            const boxX = (C.Screen.width - boxW) * C.Common.half;
            const boxY = C.Intro.captionY - boxH * C.Common.half;

            ctx.save();
            // 半透明黑底衬底
            ctx.globalAlpha = C.Intro.captionBackdropAlpha * boxAlpha;
            const grad = ctx.createLinearGradient(C.Common.zero, boxY, C.Common.zero, boxY + boxH);
            grad.addColorStop(C.Common.zero, C.Render.rgbaBlackClear);
            grad.addColorStop(C.Common.half, U.alphaColor(C.Render.rgbaBlackTemplate, C.Common.one));
            grad.addColorStop(C.Common.one, C.Render.rgbaBlackClear);
            ctx.fillStyle = grad;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.restore();

            if (!text) {
                return;
            }
            ctx.save();
            ctx.globalAlpha = boxAlpha;
            ctx.font = `${C.Intro.captionFontSize}px "Noto Serif SC", "Songti SC", serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const totalH = (lines.length - C.Common.one) * C.Intro.captionLineHeight;
            const startY = C.Intro.captionY - totalH * C.Common.half;
            lines.forEach((line, index) => {
                const ly = startY + index * C.Intro.captionLineHeight;
                ctx.lineWidth = C.Render.floatStrokeWidth;
                ctx.strokeStyle = C.Render.rgbaBlackMid;
                ctx.strokeText(line, C.Screen.width * C.Common.half, ly);
                ctx.fillStyle = C.Colors.moon;
                ctx.fillText(line, C.Screen.width * C.Common.half, ly);
            });
            ctx.restore();
        }

        wrapIntroCaption(text, maxChars) {
            const chars = Array.from(text);
            const lines = [];
            let current = '';
            const breakChars = ['，', '。', '！', '？', '；', '、', '…'];
            chars.forEach((ch) => {
                current += ch;
                if (Array.from(current).length >= maxChars || breakChars.indexOf(ch) !== C.Common.negativeOne) {
                    lines.push(current);
                    current = '';
                }
            });
            if (current) {
                lines.push(current);
            }
            return lines.length ? lines : [''];
        }
    }

    window.Game = new EmptyClassroomGame();

    window.addEventListener('DOMContentLoaded', function () {
        window.Loader.loadAll(function () {
            window.Game.init();
            window.Game.showStartScreen();
        }, function (progress) {
            window.Game.updateLoading(progress);
        });
    });
}());
