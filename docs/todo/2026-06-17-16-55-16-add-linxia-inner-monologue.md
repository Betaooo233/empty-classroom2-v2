# 新增林夏内心独白文案（第一章6个情感峰值节点）

## 任务清单
- [x] 读取现有 docs/grd.md，确认6个情感节点的触发位置与现有流程对应关系
- [x] 在 docs/grd.md 新增「林夏内心独白」专节（第20节），逐字落地6条台词
- [x] 在 docs/grd.md 第6章流程段（6.3走廊/6.4教室/6.6主Jump与结算）对应触发点补充独白触发说明
- [x] 在 docs/grd.md 第3.0节真值表速查中补入"关键文案真值 v1.4"条目
- [x] 更新 docs/grd.md 版本号至 v1.4 / 0.2.26
- [x] 更新 docs/project_status.md，交付给代码 Agent
- [x] 在 js/config.js 新增 Monologue 配置节（6条台词文本+字速+延迟参数），版本号升至 0.2.26
- [x] 在 js/game.js 添加 showMonologue() 方法，复用对话框组件，支持 monologue/whisper 模式
- [x] ③ 走廊广播残响后：playFanAmbience() → fanBroadcastEnd 旁白关闭后触发
- [x] ④ 公告栏旁白后：handleBulletinBoard() → bulletinBoardText 旁白关闭后触发
- [x] ⑤ P3座位推理成功后：showSeatPuzzle() → seatSolvedLine 旁白关闭后触发
- [x] ⑥ 林夏抽屉打开后：openLinxiaDrawer() → linxiaDrawer 旁白关闭后触发
- [x] ⑧ 读完纸条后主Jump前：readWaterNote() → waterNote 旁白关闭后 whisper 独白，独白关闭后 200ms 触发 startMainJump
- [x] ⑨ 结算画面淡入后：showEndingModal() → 600ms 后触发 ending 独白
- [x] 在 css/style.css 添加 .monologue 和 .monologue-whisper 样式（冷青灰字色+气音效果）

## 执行记录
- 本轮纯文案增量，不新增/改动任何谜题、美术、热点、流程顺序
- ③④挂在走廊段（广播残响、公告栏）；⑤⑥挂在教室P3（座位推理、林夏抽屉）；⑧⑨挂在高潮与结算
- 独白仅表心理，不夹解法；每点1–2句；不揭破死因里层真相
- 情感强度：中段递进(③④)→情感高点(⑤)→最强峰值(⑥)→崩溃前静(⑧)→余韵留钩(⑨)
- verify_game_code 通过，Playwright 验证无 JS 错误
