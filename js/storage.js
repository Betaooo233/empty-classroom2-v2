(function () {
    'use strict';

    const C = window.CONFIG;

    const StorageManager = {
        defaultFlags() {
            return {
                introPlayed: false,
                gotRebar: false,
                brickOpened: false,
                gateUnlocked: false,
                gateLockedIntroSeen: false,
                anonymousPhotoSeen: false,
                corridorBroadcastPlayed: false,
                blackboardWordsSeen: false,
                wallSloganSeen: false,
                timetableRuleSeen: false,
                seatIntroSeen: false,
                linxiaDrawerOpened: false,
                seatSolved: false,
                suwanDeskFaced: false,
                suwanDrawerUnlocked: false,
                noteRead: false,
                jumpPlayed: false,
                speakerPlayed: false,
                // 记录已弹出过介绍的道具/交互物 ID，确保介绍仅首次触发
                introducedKeys: []
            };
        },

        createNew() {
            return {
                version: C.Version,
                state: C.InitialState.stateStart,
                sceneGroup: C.InitialState.groupLobby,
                viewId: C.InitialState.firstView,
                inventory: [],
                clues: [],
                usedItem: null,
                hintLevels: {
                    lobby: C.Loading.initialCount,
                    corridor: C.Loading.initialCount,
                    classroom: C.Loading.initialCount,
                    password: C.Loading.initialCount,
                    ending: C.Loading.initialCount
                },
                flags: this.defaultFlags(),
                timestamp: Date.now()
            };
        },

        normalize(save) {
            const fresh = this.createNew();
            if (!save || typeof save !== 'object') {
                return fresh;
            }
            return {
                version: save.version || fresh.version,
                state: save.state || fresh.state,
                sceneGroup: save.sceneGroup || fresh.sceneGroup,
                viewId: save.viewId || fresh.viewId,
                inventory: Array.isArray(save.inventory) ? save.inventory.filter(Boolean) : fresh.inventory,
                clues: Array.isArray(save.clues) ? save.clues.filter(Boolean) : fresh.clues,
                usedItem: save.usedItem || null,
                hintLevels: Object.assign({}, fresh.hintLevels, save.hintLevels || {}),
                flags: this.normalizeFlags(fresh.flags, save.flags),
                timestamp: save.timestamp || Date.now()
            };
        },

        normalizeFlags(freshFlags, saveFlags) {
            const merged = Object.assign({}, freshFlags, saveFlags || {});
            // 确保介绍记录始终为数组，兼容旧存档
            merged.introducedKeys = Array.isArray(merged.introducedKeys) ? merged.introducedKeys.filter(Boolean) : [];
            return merged;
        },

        save(data) {
            const normalized = this.normalize(data);
            normalized.timestamp = Date.now();
            try {
                window.localStorage.setItem(C.SaveKey, JSON.stringify(normalized));
                return true;
            } catch (error) {
                return false;
            }
        },

        load() {
            try {
                const raw = window.localStorage.getItem(C.SaveKey);
                if (!raw) {
                    return null;
                }
                return this.normalize(window.Utils.safeJsonParse(raw));
            } catch (error) {
                return null;
            }
        },

        clear() {
            try {
                window.localStorage.removeItem(C.SaveKey);
                return true;
            } catch (error) {
                return false;
            }
        }
    };

    window.StorageManager = StorageManager;
}());
