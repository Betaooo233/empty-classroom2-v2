# 空教室

## 目录结构

```txt
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   ├── loader.js
│   ├── utils.js
│   ├── audio.js
│   ├── storage.js
│   ├── input.js
│   └── game.js
├── assets/
│   ├── images/
│   └── audio/
└── docs/
    ├── grd.md
    ├── CHANGELOG.md
    └── game_info.json
```

## 技术决策

- 使用原生 HTML5 Canvas、CSS 和 JavaScript，不依赖构建工具、第三方库、CDN 或服务端。
- 以 `1080 x 1920` 作为 9:16 竖屏逻辑分辨率与唯一设计基准画布，容器采用等比信箱(letterbox)适配，避免画面拉伸。
- 自适应采用「统一基准舞台 + 整体等比缩放」：`#game-container` 严格保持 9:16，JS 在初始化/`resize`/`orientationchange` 时按容器实际宽度 / 1080 计算统一缩放系数，写入 CSS 变量 `--stage-scale`/`--upx`；CSS 中所有 UI 组件尺寸与字号均以 `calc(基准px × var(--upx))` 度量，禁止使用 `vw/vh/clamp(vw)`，确保电脑端与各种手机比例下组件相对比例恒定、只有整体随屏幕等比缩放；安全区只通过外层 `padding` 内缩舞台外边距，不单独缩放组件。
- 所有游戏数值、资源映射、热点、谜题答案、提示文本集中放在 `js/config.js`，便于后续调参和替换资源。
- 图片预加载具备失败兜底，单个资源加载失败时使用 Canvas 几何占位，不阻断游戏流程。
- 音频通过统一接口播放，真实音频失败时使用 Web Audio 生成低频、噪声或短促反馈占位。
- 输入统一使用 Pointer Events，并将屏幕坐标转换为逻辑画布坐标，兼容鼠标、触摸与滑动。
- 手电筒渲染保留为配置开关，第一章默认改用月光/环境光并隐藏显影操作。
- 存档使用 `localStorage`，关键流程节点自动保存，并提供手动存档与读档入口。

## 数据流向

1. `index.html` 按顺序加载样式与脚本，`config.js` 最先加载。
2. `loader.js` 预加载图片与音频资源并回报加载进度；失败图片标记为 fallback，失败音频交由降级音效兜底。
3. `game.js` 在资源准备完成后初始化画布、输入、界面和主循环。
4. 玩家输入经 `input.js` 转换为逻辑坐标，再交给游戏状态机处理视角、热点、道具和谜题。
5. 游戏状态变化写入 `storage.js`，音效触发交给 `audio.js`，画面统一由 Canvas 渲染。
