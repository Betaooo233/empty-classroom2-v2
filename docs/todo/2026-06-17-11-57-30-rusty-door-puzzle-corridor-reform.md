# 走廊段改造：锈门谜题新增 + 入口逻辑归属调整

## 任务清单

- [x] 生成走廊纵深新版场景图 `scene_03_corridor_depth_v2.png`（含教室门/机油/公告栏）
- [x] 生成走廊清洁工具角落视角图 `scene_03b_corridor_tools_corner.png`（水龙头+机油特写）
- [x] 生成机油道具图标 `item_machine_oil_transparent.png`
- [x] 生成旧公告栏线索图 `clue_bulletin_board.png`
- [x] 更新 docs/grd.md：新增锈门谜题（5.1节新场景、6.3节流程、9.X节谜题设计、12节热点、13节线索册、14节状态机）
- [x] 更新 docs/grd.md：入口逻辑改造（吊扇取消入口功能、锈门成唯一入口）
- [x] 更新 docs/grd.md：道具清单新增⑧机油
- [x] 更新 docs/grd.md：真值表速查升级至v1.3
- [x] 更新 docs/grd.md：热点-物体对应表同步
- [x] 更新 docs/hotspot_object_map.md（v1.3：新增4个热点、修改吊扇热点行为）
- [x] 更新 docs/project_status.md
- [x] 代码实现：新增 playFanAmbience（吊扇纯氛围，绝不触发进教室）
- [x] 代码实现：废弃 playCorridorEvent 中的 transitionToGroup classroom 残留
- [x] 代码实现：新增 handleClassroomDoor（锈门铺垫→机油使用→进教室唯一入口）
- [x] 代码实现：新增 useMachineOilOnDoor（机油消耗+开门反馈演出）
- [x] 代码实现：新增 handleBulletinBoard（公告栏氛围伏笔）
- [x] 代码实现：新增 handleFaucet（水龙头陷阱）
- [x] 代码实现：新增 handleMachineOil（机油拾取）
- [x] 代码实现：修复吊扇阴影视角判断（corridor[1]→corridor[2]）
- [x] 代码实现：修复吊扇声音触发视角（corridor[1]→corridor[2]）
- [x] 代码实现：storage.js 新增 corridorFirstEntered flag
- [x] 更新 docs/CHANGELOG.md

## 执行记录

- 本轮为纯增量+入口归属调整，谜题1/2/3及前后逻辑、答案、道具①~⑦完全不改动
- 新增道具⑧机油：用于门轴润滑，用后即消耗，不滞留道具栏
- 走廊新增2个视角面：scene_03_corridor_depth_v2（走廊纵深含教室门全景）、scene_03b（清洁工具角落特写）
- 走廊新增4个热点：classroom_door（教室门）、machine_oil（机油）、faucet（水龙头）、bulletin_board（公告栏）
- 吊扇(fan)热点：取消入口触发，改为纯氛围交互，点击仅旁白+轻微音效，不再 transitionToGroup
- 真值表升级至v1.3：流程第2步走廊明确「吊扇=氛围、锈门=唯一入口」；道具清单新增⑧机油
- 已对照真值表v1.2校验，谜题1/2/3答案、道具①~⑦、苏晚设定、班级名称等全部锁定项均未改动
