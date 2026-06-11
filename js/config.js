(function () {
    'use strict';

    const CONFIG = {
        Version: '0.2.17',
        SaveKey: 'emptyClassroom.save.v1',
        Screen: {
            width: 1080,
            height: 1920,
            sceneHeight: 1520,
            ratioWidth: 9,
            ratioHeight: 16
        },
        Common: {
            zero: 0,
            one: 1,
            negativeOne: -1,
            quarter: 0.25,
            radiansPerDegree: Math.PI / 180,
            two: 2,
            three: 3,
            four: 4,
            five: 5,
            six: 6,
            seven: 7,
            eight: 8,
            nine: 9,
            ten: 10,
            eleven: 11,
            twelve: 12,
            thirteen: 13,
            fourteen: 14,
            fifteen: 15,
            sixteen: 16,
            eighteen: 18,
            twenty: 20,
            twentyFour: 24,
            thirty: 30,
            forty: 40,
            fifty: 50,
            sixty: 60,
            ninety: 90,
            hundred: 100,
            half: 0.5,
            fullCircle: Math.PI * 2,
            msToSeconds: 1000,
            maxAlpha: 1,
            minAlpha: 0
        },
        Colors: {
            ink: '#0b1114',
            cold: '#3A4A52',
            brown: '#5A4632',
            moon: '#C8D4D0',
            flashlight: '#E8C87A',
            rust: '#9E2B2B',
            white: '#f2efe6',
            black: '#000000'
        },
        Loading: {
            imageWeight: 1,
            audioWeight: 1,
            audioTimeoutMs: 1200,
            initialCount: 0,
            fallbackVolumeScale: 0.18,
            completePercent: 100,
            percentDecimals: 0
        },
        Input: {
            dragThreshold: 16,
            swipeThreshold: 96
        },
        Timing: {
            loadingMinimumMs: 300,
            fadeMs: 350,
            dialogueStayMs: 1000,
            toastMs: 1800,
            hintCooldownMs: 3000,
            hotspotPulseMs: 1200,
            autoSaveNoticeMs: 900,
            blackboardRevealMs: 2200,
            blackboardSeepMs: 6200,
            blackboardSeepAudioCooldownMs: 2400,
            corridorPauseMs: 800,
            fanRadioStaticDelayMs: 1400,
            fanVoiceDelayMs: 2000,
            jumpBlackMs: 180,
            jumpStaticMs: 300,
            jumpLightMs: 650,
            jumpGhostStartMs: 900,
            jumpGhostEndMs: 2100,
            jumpVoiceMs: 950,
            jumpShakeMs: 1200,
            jumpOffMs: 2600,
            jumpEndingMs: 3400,
            typeNormalCps: 28,
            typeGhostCps: 16,
            dialogueAutoCollapseMs: 2500,
            dialoguePageChars: 56,
            keyClueupCloseMs: 1000,
            flashWhiteMs: 120,
            digitGlowMs: 120,
            itemIntroDelayMs: 650
        },
        Camera: {
            baseShake: 0,
            invalidShake: 3,
            invalidShakeFrames: 3,
            correctShake: 2,
            correctShakeFrames: 2,
            jumpShake: 8,
            jumpShakeFrames: 5,
            jumpShakeGroups: 4,
            jumpIntroShakeGroups: 2,
            passwordShake: 3,
            passwordShakeFrames: 3,
            corridorShake: 2,
            corridorShakeFrames: 3,
            transitionAlpha: 0.65
        },
        Exploration: {
            // 默认关闭可交互物常驻高亮，提升探索自主性
            showHotspotHintsDefault: false,
            settingsKey: 'emptyClassroom.settings.v1',
            // 点击命中可交互物时的即时反馈（一闪高亮）
            tapFeedbackMs: 360,
            tapFeedbackLineWidth: 4,
            tapFeedbackPadding: 8,
            tapFeedbackAlphaMax: 0.85,
            // 显影兜底：高亮关闭时点“显影”仍可临时闪现热点轮廓
            revealFallbackMs: 1400
        },
        Flashlight: {
            enabled: false,
            jumpSpotlightEnabled: false,
            alwaysShowHotspotHintsWhenDisabled: true,
            defaultX: 690,
            defaultY: 1080,
            minY: 260,
            maxY: 1480,
            innerRadius: 110,
            middleRadius: 260,
            outerRadius: 520,
            lockedRadius: 180,
            centerAlpha: 0.5,
            darknessAlphaMin: 0.76,
            darknessAlphaMax: 0.86,
            returnSpeed: 3.5,
            hotspotRevealDistance: 260,
            spotlightX: 540,
            spotlightY: 720
        },
        UI: {
            inventoryX: 54,
            inventoryY: 1668,
            inventoryW: 972,
            inventoryH: 180,
            slotSize: 132,
            slotGap: 22,
            dialogX: 72,
            dialogY: 1370,
            dialogW: 936,
            dialogH: 220,
            leftArrowX: 28,
            leftArrowY: 860,
            leftArrowW: 88,
            leftArrowH: 128,
            rightArrowX: 964,
            rightArrowY: 860,
            rightArrowW: 88,
            rightArrowH: 128,
            topButtonY: 72,
            topButtonRight: 42,
            topButtonW: 150,
            topButtonH: 58,
            topButtonGap: 14,
            modalX: 90,
            modalY: 360,
            modalW: 900,
            modalH: 960,
            lockX: 120,
            lockY: 520,
            lockW: 840,
            lockH: 680,
            detailIconSize: 520,
            detailClueIconSize: 680,
            largeButtonH: 78,
            modalPadding: 48,
            toastX: 540,
            toastY: 1320,
            cluePlaceholderCount: 3,
            passwordDigits: 3,
            passwordMinDigit: 0,
            passwordMaxDigit: 9
        },
        Particles: {
            pickupCount: 12,
            pickupRadius: 60,
            pickupLife: 0.55,
            pickupSpeedMin: 80,
            pickupSpeedMax: 160,
            successCount: 18,
            successRadius: 90,
            successLife: 0.7,
            successSpeedMin: 120,
            successSpeedMax: 220,
            paperCount: 24,
            paperLife: 1.2,
            paperSpeedMin: 40,
            paperSpeedMax: 120,
            dripRate: 1.5,
            dripFall: 160,
            dustCountMin: 8,
            dustCountMax: 12,
            dustLife: 0.7,
            dustSpeedMin: 12,
            dustSpeedMax: 48,
            dustGravity: 60,
            dustColor: '#9aa19c'
        },
        Render: {
            backgroundCoverScale: 1,
            fallbackBorderScale: 0.01,
            fallbackFontScale: 0.04,
            fallbackInset: 6,
            vignetteOuterAlpha: 0.45,
            vignetteInnerAlpha: 0.08,
            ambientVignetteOuterAlpha: 0.24,
            ambientVignetteInnerAlpha: 0.03,
            sceneTitleX: 54,
            sceneTitleY: 82,
            sceneTitleSize: 28,
            chalkX: 210,
            chalkY: 800,
            chalkFontSize: 54,
            cluePaperAlpha: 0.82,
            fanCenterX: 560,
            fanCenterY: 780,
            fanBladeW: 620,
            fanBladeH: 34,
            fanHubRadius: 42,
            hotspotLabelSize: 24,
            floatStrokeWidth: 4,
            particleMinSize: 4,
            particleMaxSize: 9,
            dripW: 4,
            dripH: 18,
            ghostDripOffsetX: 180,
            ghostDripOffsetY: 720,
            lockLightAlpha: 0.92,
            overlayGradientStopInner: 0.18,
            overlayGradientStopMiddle: 0.5,
            overlayCutAlphaInner: 0.9,
            overlayCutAlphaMiddle: 0.45,
            warmStopMiddle: 0.35,
            normalDarknessAlpha: 0.82,
            rgbaBlackClear: 'rgba(0,0,0,0)',
            rgbaBlackSoft: 'rgba(0,0,0,0.28)',
            rgbaBlackMid: 'rgba(0,0,0,0.72)',
            rgbaMoonSceneTitle: 'rgba(200,212,208,0.55)',
            rgbaMoonEnding: 'rgba(200,212,208,0.72)',
            rgbaMoonDrip: 'rgba(200,212,208,0.45)',
            rgbaBlackboardSeep: 'rgba(176,204,200,{alpha})',
            rgbaBlackboardSeepDark: 'rgba(8,18,18,{alpha})',
            rgbaBlackboardWetBloom: 'rgba(196,215,211,{alpha})',
            rgbaPaperPanel: 'rgba(19,24,23,0.74)',
            rgbaLightStroke: 'rgba(232,200,122,0.36)',
            rgbaLightWarmMid: 'rgba(232,200,122,0.16)',
            rgbaLightWarmEdge: 'rgba(232,200,122,0)',
            rgbaBlackTemplate: 'rgba(0,0,0,{alpha})',
            rgbaLightTemplate: 'rgba(232,200,122,{alpha})'
        },
        Feedback: {
            floatItemSize: 34,
            floatClueSize: 30,
            floatErrorSize: 28,
            floatGhostSize: 32,
            floatItemRise: 52,
            floatClueRise: 44,
            floatErrorRise: 26,
            floatDurationItem: 0.9,
            floatDurationClue: 1.0,
            floatDurationPaper: 1.2,
            hotspotLineWidth: 4,
            hotspotDash: 18,
            hotspotDashGap: 12,
            modalBackdropAlpha: 0.72,
            chalkAlpha: 0.78,
            fanRotateDegPerSecond: 6
        },
        Audio: {
            enabled: true,
            ambienceVolume: 0.28,
            bgmVolume: 0.18,
            jumpBgmVolume: 0.05,
            sfxVolume: 0.82,
            voiceVolume: 0.9,
            fallbackDroneFrequency: 58,
            fallbackClickFrequency: 180,
            fallbackNoiseDuration: 0.22,
            unlockVolume: 0.0001,
            files: {
                ambience: { path: 'assets/audio/ambience_rain_thunder_creak.mp3', type: 'ambient', volume: 0.28, loop: true },
                bgm_low: { path: 'assets/audio/bgm_low_pressure_loop.mp3', type: 'bgm', volume: 0.18, loop: true },
                intro_tape_play_click: { path: 'assets/audio/intro_tape_play_click.mp3', type: 'sfx', volume: 0.7, loop: false },
                intro_tape_hiss: { path: 'assets/audio/intro_tape_hiss.mp3', type: 'ambient', volume: 0.3, loop: true },
                intro_voice_broadcast_faint: { path: 'assets/audio/intro_voice_broadcast_faint.mp3', type: 'voice', volume: 0.5, loop: false },
                fan_creak: { path: 'assets/audio/sfx_ceiling_fan_creak.mp3', type: 'sfx', volume: 0.82, loop: false },
                radio_static: { path: 'assets/audio/sfx_radio_static.mp3', type: 'sfx', volume: 0.72, loop: false },
                windows_slam: { path: 'assets/audio/sfx_windows_slam.mp3', type: 'sfx', volume: 0.9, loop: false },
                drawer_creak: { path: 'assets/audio/sfx_drawer_creak.mp3', type: 'sfx', volume: 0.86, loop: false },
                item_pickup: { path: 'assets/audio/sfx_item_pickup.mp3', type: 'sfx', volume: 0.78, loop: false },
                lock_open: { path: 'assets/audio/sfx_rusty_lock_open.mp3', type: 'sfx', volume: 0.9, loop: false },
                rebar_pry: { path: 'assets/audio/sfx_rebar_pry_brick.mp3', type: 'sfx', volume: 0.86, loop: false },
                hotspot_click: { path: 'assets/audio/sfx_hotspot_click.mp3', type: 'sfx', volume: 0.58, loop: false },
                blackboard_drip: { path: 'assets/audio/sfx_blackboard_drip.mp3', type: 'sfx', volume: 0.24, loop: false },
                voice_midday: { path: 'assets/audio/voice_midday_broadcast.mp3', type: 'voice', volume: 0.88, loop: false },
                voice_return: { path: 'assets/audio/voice_suwan_returned_xiaxia.mp3', type: 'voice', volume: 0.92, loop: false }
            }
        },
        BlackboardSeep: {
            clip: { x: 200, y: 690, w: 740, h: 500 },
            lineAlpha: 0.58,
            darkAlpha: 0.34,
            dropAlpha: 0.76,
            bloomAlpha: 0.16,
            idleAlphaScale: 0.36,
            delayScale: 100,
            idleLoopMs: 7800,
            paths: [
                { x: 246, y: 836, len: 190, drift: -12, width: 3, delay: 2 },
                { x: 306, y: 812, len: 145, drift: 9, width: 2, delay: 11 },
                { x: 365, y: 850, len: 220, drift: -8, width: 4, delay: 20 },
                { x: 447, y: 835, len: 170, drift: 14, width: 3, delay: 28 },
                { x: 535, y: 862, len: 238, drift: -16, width: 3, delay: 35 },
                { x: 628, y: 872, len: 210, drift: 10, width: 4, delay: 44 },
                { x: 736, y: 858, len: 158, drift: -7, width: 2, delay: 53 },
                { x: 426, y: 1002, len: 150, drift: -10, width: 3, delay: 18 },
                { x: 520, y: 988, len: 205, drift: 13, width: 4, delay: 31 },
                { x: 610, y: 996, len: 180, drift: -9, width: 3, delay: 43 },
                { x: 700, y: 984, len: 132, drift: 8, width: 2, delay: 56 }
            ]
        },
        Images: {
            cover_main_menu: 'assets/images/cover_main_menu.png',
            intro_01_tape: 'assets/images/intro_01_tape.png',
            intro_02_walkman: 'assets/images/intro_02_walkman.png',
            intro_03_school_rain: 'assets/images/intro_03_school_rain.png',
            scene_01_lobby_gate: 'assets/images/scene_01_lobby_gate.png',
            scene_02_lobby_sidewall: 'assets/images/scene_02_lobby_sidewall.png',
            scene_03_corridor_depth: 'assets/images/scene_03_corridor_depth.png',
            scene_04_corridor_fan_up: 'assets/images/scene_04_corridor_fan_up.png',
            scene_05_classroom_entry: 'assets/images/scene_05_classroom_entry.png',
            scene_06_double_desks_close: 'assets/images/scene_06_double_desks_close.png',
            scene_07_blackboard_close: 'assets/images/scene_07_blackboard_close.png',
            scene_08_podium_door: 'assets/images/scene_08_podium_door.png',
            suwan_silhouette: 'assets/images/suwan_silhouette_transparent_transparent.png',
            style_benchmark: 'assets/images/style_benchmark_double_desks.png',
            docs_adaptive_compare: 'assets/images/docs_adaptive_compare.png',
            item_rebar: 'assets/images/item_icons_transparent_transparent_cut_1.png',
            item_rustyKey: 'assets/images/item_icons_transparent_transparent_cut_2.png',
            item_burnedSeatMap: 'assets/images/item_icons_transparent_transparent_cut_3.png',
            item_tapeA: 'assets/images/item_icons_transparent_transparent_cut_4.png',
            item_waterNote: 'assets/images/item_icons_transparent_transparent_cut_5.png',
            item_friendshipBracelet: 'assets/images/item_icons_transparent_transparent_cut_6.png',
            item_spare1: 'assets/images/item_icons_transparent_transparent_cut_7.png',
            item_spare2: 'assets/images/item_icons_transparent_transparent_cut_8.png',
            item_spare3: 'assets/images/item_icons_transparent_transparent_cut_9.png',
            clue_roster_book: 'assets/images/clue_roster_book_transparent.png',
            clue_duty_table: 'assets/images/clue_duty_table_transparent.png',
            clue_timetable: 'assets/images/clue_timetable.png',
            clue_seatmap_photo: 'assets/images/clue_seatmap_photo_transparent.png',
            clue_wall_slogan: 'assets/images/clue_wall_slogan.png',
            clue_water_note: 'assets/images/clue_water_note_transparent.png'
        },
        InitialState: {
            startBackdropView: 'scene_05_classroom_entry',
            firstView: 'scene_01_lobby_gate',
            stateStart: 'START',
            groupLobby: 'lobby',
            firstClue: 'rosterSuwan13',
            secondClue: 'dutyWindowOdd',
            thirdClue: 'burnedSeatMap',
            anonymousClue: 'anonymousSeatPhoto',
            waterNoteItem: 'waterNote'
        },
        Canvas: {
            context2d: '2d'
        },
        DomTags: {
            headingTwo: 'h2'
        },
        SceneGroups: {
            lobby: ['scene_01_lobby_gate', 'scene_02_lobby_sidewall'],
            corridor: ['scene_03_corridor_depth', 'scene_04_corridor_fan_up'],
            classroom: ['scene_05_classroom_entry', 'scene_06_double_desks_close', 'scene_07_blackboard_close', 'scene_08_podium_door'],
            ending: ['scene_06_double_desks_close']
        },
        Scenes: {
            scene_01_lobby_gate: { group: 'lobby', title: '门厅铁门', image: 'scene_01_lobby_gate' },
            scene_02_lobby_sidewall: { group: 'lobby', title: '门厅侧墙', image: 'scene_02_lobby_sidewall' },
            scene_03_corridor_depth: { group: 'corridor', title: '走廊纵深', image: 'scene_03_corridor_depth' },
            scene_04_corridor_fan_up: { group: 'corridor', title: '吊扇抬头', image: 'scene_04_corridor_fan_up' },
            scene_05_classroom_entry: { group: 'classroom', title: '教室门口', image: 'scene_05_classroom_entry' },
            scene_06_double_desks_close: { group: 'classroom', title: '第十三排', image: 'scene_06_double_desks_close' },
            scene_07_blackboard_close: { group: 'classroom', title: '黑板', image: 'scene_07_blackboard_close' },
            scene_08_podium_door: { group: 'classroom', title: '讲台门后', image: 'scene_08_podium_door' }
        },
        Items: {
            rebar: {
                id: 'rebar',
                name: '半截钢筋',
                image: 'item_rebar',
                order: 1,
                clue: false,
                description: '铁锈蹭在手心里，像从墙缝里硬拽出来的一段旧骨头。',
                useText: '它能伸进很窄的砖缝。'
            },
            rustyKey: {
                id: 'rustyKey',
                name: '生锈钥匙',
                image: 'item_rustyKey',
                order: 2,
                clue: false,
                description: '钥匙齿已经钝了，铁门上的锁却像一直等着它。',
                useText: '试着打开那扇铁门。'
            },
            burnedSeatMap: {
                id: 'burnedSeatMap',
                name: '烧角座位表',
                image: 'item_burnedSeatMap',
                clueImage: 'clue_seatmap_photo',
                order: 3,
                clue: true,
                clueId: 'burnedSeatMap',
                description: '边角被烧焦，暗红色圈住的名字没有被火带走。',
                useText: '第十三排，只剩并排的两张桌子。'
            },
            tapeA: {
                id: 'tapeA',
                name: '磁带 A 面',
                image: 'item_tapeA',
                order: 5,
                clue: true,
                clueId: 'tapeA',
                description: '标签写着“午间广播 A 面”，磁带边缘有潮气。',
                useText: '现在没有能播放它的设备。'
            },
            waterNote: {
                id: 'waterNote',
                name: '水渍纸条',
                image: 'item_waterNote',
                clueImage: 'clue_water_note',
                order: 6,
                clue: true,
                clueId: 'waterNote',
                description: '纸面像刚从雨水里捞出，字迹却新得刺眼。',
                useText: '读完它之后，教室忽然安静了。'
            },
            friendshipBracelet: {
                id: 'friendshipBracelet',
                name: '半条友情手链',
                image: 'item_friendshipBracelet',
                order: 4,
                clue: true,
                clueId: 'friendshipBracelet',
                description: '褪色塑料珠上刻着 L 和 W，中间断开很久了。',
                useText: '这不是用来开门的东西，是用来想起人的。'
            }
        },
        Clues: {
            anonymousSeatPhoto: {
                id: 'anonymousSeatPhoto',
                name: '匿名座位表照片',
                image: 'clue_seatmap_photo',
                text: '照片里，高三13班座位表被烧掉一角。苏晚的名字被暗红色圈住。'
            },
            rosterSuwan13: {
                id: 'rosterSuwan13',
                name: '点名册',
                image: 'clue_roster_book',
                text: '13号，苏晚。广播员。名字旁有一小块水渍。'
            },
            dutyWindowOdd: {
                id: 'dutyWindowOdd',
                name: '值日表',
                image: 'clue_duty_table',
                text: '靠窗第一列从前排开始编号，单号沿第一列向后排递增。'
            },
            burnedSeatMap: {
                id: 'burnedSeatMap',
                name: '烧角座位表',
                image: 'clue_seatmap_photo',
                text: '第十三排的两张桌子还画得很清楚，一张旁边残留“夏”，另一张被圈住。'
            },
            timetableFirstLesson: {
                id: 'timetableFirstLesson',
                name: '课程表',
                image: 'clue_timetable',
                text: '第一节，别迟到。周三数学=2，周四英语=3，周五语文=1。'
            },
            wallSlogan: {
                id: 'wallSlogan',
                name: '后墙标语',
                image: 'clue_wall_slogan',
                text: '褪色的墙面上写着“一日之计在于晨”。要紧的，是每天的第一节课。'
            },
            friendshipBracelet: {
                id: 'friendshipBracelet',
                name: '半条友情手链',
                text: '褪色的塑料珠子上刻着 L 和 W，中间断开很久了。'
            },
            tapeA: {
                id: 'tapeA',
                name: '磁带 A 面',
                text: '标签写着“午间广播 A 面”，磁带边缘有潮气。'
            },
            waterNote: {
                id: 'waterNote',
                name: '水渍纸条',
                image: 'clue_water_note',
                text: '他们说只要我不出声就没人会受伤，可为什么受伤的一直是我？'
            }
        },
        Intros: {
            // 首次接触交互物时弹出的介绍说明（仅首次触发）
            gate_lock: { title: '门厅铁门', text: '锈死的旧铁门，沉得像一段记忆。锁孔被红锈填满，需要一把对得上的钥匙。' },
            anonymous_photo: { title: '座位表照片', text: '一张匿名寄来的高三13班座位表，被烧掉一角，苏晚的名字被暗红色圈住。' },
            seat_map_paper: { title: '座位表照片', text: '一张匿名寄来的高三13班座位表，被烧掉一角，苏晚的名字被暗红色圈住。' },
            loose_brick: { title: '松动的砖', text: '墙角这块砖明显凸出、砖缝里全是深色阴影，像被人反复抠动过。徒手撬不动它。' },
            look_up: { title: '头顶的声音', text: '走廊尽头没有门，可那很慢的摩擦声，却像从头顶的黑暗里一点点落下来。' },
            fan: { title: '无风吊扇', text: '没有一丝风，吊扇却在头顶慢慢转动，旧广播的杂讯正从它后面渗出来。' },
            enter_desks: { title: '第十三排', text: '一脏一净两张并排的课桌。靠里那张积着厚灰，靠外那张干净得反常。' },
            linxia_drawer: { title: '林夏的抽屉', text: '积灰的旧抽屉，刻着“林夏”。它该先于那张干净的桌子被打开。' },
            suwan_desk: { title: '干净的课桌', text: '苏晚的课桌干净得像刚被擦过，抽屉上着一把三位数字的密码锁。' },
            blackboard_words: { title: '渗水的字迹', text: '黑板上的粉笔字正缓缓渗出水痕，歪扭的笔画在潮气里一点点往下流。' },
            roster: { title: '点名册', text: '讲台上摊开的点名册，名字和学号还清晰可读，某个名字旁有一小块水渍。' },
            duty_table: { title: '值日表', text: '门后钉着的值日表，纸已发黄，写着靠窗第一列的编号规则。' },
            timetable: { title: '课程表', text: '黑板边残留的课程表，只有每天的第一节课还看得清。' },
            wall_slogan: { title: '后墙标语', text: '黑板上方的墙面，褪色的锈红标语依稀还能辨认。凑近些看清那几个字。' },
            speaker: { title: '旧广播', text: '墙上那只旧广播喇叭蒙着灰，凑近时仿佛还残着一口湿冷的气。' }
        },
        Hints: {
            lobby: [
                '墙角有东西反了一下光。',
                '那块松动的砖缝太窄，徒手打不开。',
                '先拾取半截钢筋，再对侧墙下方松动砖使用它，砖后藏着钥匙。'
            ],
            corridor: [
                '走廊尽头没有门，声音却像从头顶落下来。',
                '试着抬头看吊扇，它在无风的地方转动。',
                '切到吊扇视角并点击上方吊扇，听完广播后教室会打开。'
            ],
            classroom: [
                '点名册上的数字，不只是学号。',
                '值日表告诉你从哪一列、哪个方向开始数。',
                '苏晚是13号。沿靠窗第一列从前排往后数到第十三排，先打开积灰的林夏抽屉，再去看干净的苏晚课桌。'
            ],
            password: [
                '黑板上留下的不是整张课程表，只有第一节课最清楚。',
                '按日期顺序，把每天第一节课换成旁边的科目编号。',
                '周三数学=2，周四英语=3，周五语文=1，密码是231。'
            ],
            ending: [
                '这间教室暂时不会再回答你。',
                '你已经回到第十三排。',
                '第一章结束，剩下的声音还在磁带里。'
            ]
        },
        OverlayTexts: {
            roster: '13号 苏晚 / 广播员',
            duty: '靠窗第一列\n单号向后',
            timetable: '周三 数学=2\n周四 英语=3\n周五 语文=1'
        },
        Password: {
            answer: '231',
            initial: [0, 0, 0],
            subjects: [
                { date: '6月11日 周三', name: '数学', code: '2' },
                { date: '6月12日 周四', name: '英语', code: '3' },
                { date: '6月13日 周五', name: '语文', code: '1' }
            ]
        },
        SeatPuzzle: {
            correctId: 'row13_window_linxia',
            options: [
                { id: 'row7_center', label: '第七排，中间，离讲台最近的一张' },
                { id: 'row13_window_linxia', label: '第十三排，靠窗侧，与林夏并排' },
                { id: 'row13_aisle_alone', label: '第十三排，靠过道，单独一张' }
            ]
        },
        Hotspots: {
            scene_01_lobby_gate: [
                { id: 'gate_lock', x: 568, y: 1262, w: 120, h: 120, label: '铁门锁', type: 'use', item: 'rustyKey' }
            ],
            scene_02_lobby_sidewall: [
                { id: 'anonymous_photo', x: 560, y: 470, w: 430, h: 490, label: '座位表照片', type: 'clue' },
                { id: 'rebar', x: 581, y: 1302, w: 207, h: 449, label: '半截钢筋', type: 'pickup', item: 'rebar' },
                { id: 'loose_brick', x: 775, y: 1535, w: 155, h: 135, label: '松动砖', type: 'use', item: 'rebar' }
            ],
            scene_03_corridor_depth: [
                { id: 'look_up', x: 200, y: 60, w: 680, h: 620, label: '头顶的声音', type: 'view' }
            ],
            scene_04_corridor_fan_up: [
                { id: 'fan', x: 80, y: 190, w: 940, h: 950, label: '无风吊扇', type: 'event' }
            ],
            scene_05_classroom_entry: [
                { id: 'enter_desks', x: 215, y: 940, w: 600, h: 470, label: '第十三排', type: 'view' }
            ],
            scene_06_double_desks_close: [
                { id: 'linxia_drawer', x: 0, y: 1180, w: 480, h: 250, label: '积灰抽屉', type: 'drawer' },
                { id: 'suwan_desk', x: 500, y: 835, w: 560, h: 1000, label: '干净课桌', type: 'password' }
            ],
            scene_07_blackboard_close: [
                { id: 'blackboard_words', x: 290, y: 534, w: 634, h: 300, label: '渗水字迹', type: 'event' },
                { id: 'wall_slogan', x: 300, y: 45, w: 510, h: 165, label: '后墙标语', type: 'clue' },
                { id: 'roster', x: 110, y: 1365, w: 540, h: 296, label: '点名册', type: 'clue' },
                { id: 'duty_table', x: 672, y: 1492, w: 365, h: 284, label: '值日表', type: 'clue' },
                { id: 'timetable', x: 44, y: 835, w: 328, h: 334, label: '课程表', type: 'clue' }
            ],
            scene_08_podium_door: [
                { id: 'speaker', x: 450, y: 218, w: 140, h: 140, label: '旧广播', type: 'event' }
            ]
        },
        Text: {
            startIntro: '匿名照片发来时，雨刚好停在旧教学楼门口。苏晚的名字，被一圈暗红色圈住。',
            lobbyFirst: '门厅里潮得发冷。月光斜斜落进来，铁门和墙缝都像在避开你。',
            gateLockedIntro: '门锈死了，硬拉没用。得找个能撬动它的东西……先看看左右两边的墙。',
            gotRebar: '你捡起半截钢筋。铁锈让掌心发麻。',
            looseBrickNoTool: '这块砖松了，但手指抠不动，得用根硬东西撬。',
            brickOpened: '砖块被撬开，里面躺着一把生锈钥匙。',
            gateNoKey: '锁孔里全是锈，钥匙不在你手里。',
            gateOpened: '钥匙转动的声音很轻，门后的走廊却像醒了。',
            corridorEnter: '这里比记忆里更长。',
            lookUp: '头顶传来很慢的摩擦声。',
            fanEnd: '女声戛然而止，走廊尽头露出教室门缝。',
            classroomEnter: '教室里没有人。第十三排，却有一张桌子干净得像刚被擦过。',
            seatIntro: '讲台上那本点名册还摊着，门后钉着发黄的值日表……再看看手里那张烧角的座位表照片。把它们对起来，苏晚的位置才认得出。',
            seatProgress1: '线索 1/3：先记下名字旁的那个数字。',
            seatProgress2: '线索 2/3：再看清从哪一列、哪个方向开始数。',
            seatProgress3: '线索 3/3：照片上被圈住的桌子，对得上了。',
            seatSolvedLine: '……是这里。我怎么会忘。',
            timetableRuleIntro: '“一日之计在于晨”……要紧的，是每天的第一节课。',
            blackboard: '连你也松开手了，是不是？',
            photo: '照片里，高三13班座位表被烧掉一角。苏晚的名字被暗红色圈住。',
            roster: '13号，苏晚。广播员。名字旁有一小块水渍。',
            duty: '靠窗第一列从前排开始编号，单号沿第一列向后排递增。',
            timetable: '第一节，别迟到。周三数学=2，周四英语=3，周五语文=1。',
            rosterClue: '点名册摊在讲台上。把名单里那个名字和它的学号，仔细记下来。',
            dutyClue: '门后的值日表写着编号的规矩——从哪一列、哪个方向开始数，看清楚。',
            timetableClue: '黑板上的课程表只剩第一节课还清楚。每天的第一节，对着旁边的科目编号看。',
            wallSloganClue: '“一日之计在于晨”……要紧的，是每天那第一节课。',
            wallSloganSeen: '“一日之计在于晨”。每天的第一节课，别忘了。',
            linxiaDrawer: '林夏的抽屉里，半条友情手链和一盘磁带粘在一起。',
            suwanBlocked: '那张桌子太干净了，像在等你先想起自己的位置。',
            seatNotSolved: '第十三排，靠窗侧，与林夏并排。这个答案慢慢浮上来。',
            passwordWrong: '顺序不对，像有人把第一节课擦掉了。',
            passwordRight: '锁芯轻轻松开。抽屉里只有一张湿透的纸条。',
            waterNote: '他们说只要我不出声就没人会受伤，可为什么受伤的一直是我？',
            lightTooFar: '手电光还没照稳。',
            missingSeatClues: '还缺少黑板旁留下的记录。',
            timetableNeeded: '黑板上的课程表还没有看清，第一节课的顺序仍然缺了一块。',
            itemSelected: '你把它攥紧了。',
            cannotCombine: '现在还拼不回完整的声音。',
            revealCooling: '显影还在冷却。',
            combineMemory: '手链和磁带贴在掌心里，午间广播里的笑声像隔着水传来。',
            wrongItem: '不是它。这里没有给你第二次逃开的借口。',
            noItemSelected: '先从道具栏里选一件能用的东西。',
            saved: '已经记住这一刻。',
            loadMissing: '还没有可以回去的时刻。',
            loaded: '雨声又回到了耳边。',
            continued: '第一章的门已经关上，继续探索会在后续开放。',
            speakerStatic: '刺啦——旧广播里只剩一口湿冷的气。',
            wrongSeat: '不是这里。那张干净的桌子仍然没有动。',
            endingTitle: '第一章·空教室 结束',
            endingSubtitle: '你回到了第十三排',
            introSkip: '跳过 ▷'
        },
        Ending: {
            titleY: 760,
            subtitleY: 840,
            buttonY: 980,
            buttonGap: 96
        },
        Intro: {
            // 全局演出
            crossFadeMs: 700,            // 画面间交叉淡入时长（≥600ms）
            firstFadeInMs: 1200,         // 画面1黑场浮现时长
            holdAfterTextMs: 1000,       // 旁白完整逐字浮现后只停留 1 秒即自动翻页
            outroFadeMs: 1400,           // 结束淡入门厅时长
            typeCps: 28,                 // 逐字旁白字速
            noiseAlphaMin: 0.06,         // 雪花噪点 alpha 呼吸下限
            noiseAlphaMax: 0.12,         // 雪花噪点 alpha 呼吸上限
            noiseCell: 26,               // 雪花噪点网格颗粒尺寸
            noiseBreathMs: 2600,         // 噪点呼吸周期
            // 旁白排版
            captionY: 1560,              // 旁白底衬区中心 Y
            captionBoxW: 980,            // 底衬宽
            captionBoxH: 220,            // 底衬高
            captionFontSize: 40,         // 旁白字号
            captionLineHeight: 58,       // 旁白行高
            captionMaxCharsPerLine: 18,  // 每行最多字符（用于自动换行）
            captionBackdropAlpha: 0.55,  // 旁白底衬 alpha
            // 画面1·磁带齿轮呼吸
            tapeGearBreathMs: 1400,
            // 画面2·指示灯明灭 + 雨夜视差
            walkmanLedX: 290,
            walkmanLedY: 1120,
            walkmanLedRadius: 24,
            walkmanLedBreathMs: 1200,
            walkmanLedAlphaMin: 0.3,
            walkmanLedAlphaMax: 0.85,
            walkmanParallaxPx: 8,
            walkmanParallaxMs: 9000,
            // 画面3·Ken Burns 推近 + 雨丝 + 窗光明灭
            schoolZoomFrom: 1.0,
            schoolZoomTo: 1.05,
            schoolZoomMs: 7000,
            rainLineCount: 60,
            rainLineLen: 70,
            rainSpeed: 900,
            rainSlant: 0.32,
            rainAlpha: 0.22,
            windowGlowX: 700,
            windowGlowY: 400,
            windowGlowRadius: 120,
            windowGlowBreathMs: 2200,
            windowGlowAlphaMin: 0.12,
            windowGlowAlphaMax: 0.4,
            // 音量
            hissVolume: 0.3,
            hissEmphasisVolume: 0.4,
            // 跳过按钮
            skipBtnW: 220,
            skipBtnH: 96,
            // 三画面节拍（durationMs 为该画面停留时长，不含交叉淡入；caption 为逐字旁白）
            frames: [
                {
                    id: 'tape',
                    image: 'intro_01_tape',
                    durationMs: 16000,
                    caption: '这盘磁带，是我亲手录的。我以为我这辈子都不会再按下播放键。',
                    zoomFrom: 1.06,
                    zoomTo: 1.0
                },
                {
                    id: 'walkman',
                    image: 'intro_02_walkman',
                    durationMs: 15000,
                    caption: '可它昨天，自己寄回到了我手上。',
                    zoomFrom: 1.0,
                    zoomTo: 1.0
                },
                {
                    id: 'school',
                    image: 'intro_03_school_rain',
                    durationMs: 19000,
                    caption: '清和中学……苏晚……我得回去一趟。哪怕只是为了，再听一次那天到底发生了什么。',
                    zoomFrom: 1.0,
                    zoomTo: 1.05
                }
            ]
        },
        Jump: {
            ghostStartY: 860,
            ghostEndY: 530,
            ghostX: 500,
            ghostW: 420,
            ghostH: 1080,
            ghostAlphaMax: 0.92,
            backlightAlphaMax: 0.34,
            backlightInnerRadius: 90,
            backlightOuterRadius: 420,
            backlightInnerColor: 'rgba(200,212,208,0.56)',
            backlightOuterColor: 'rgba(200,212,208,0)',
            vibratePattern: [120, 80, 180, 60, 220]
        }
    };

    window.CONFIG = CONFIG;
}());
