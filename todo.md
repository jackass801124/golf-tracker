# Golf Tracker - Project TODO

## 資料庫 Schema
- [x] courses 球場資料表
- [x] rounds 下場紀錄資料表
- [x] holes 每洞成績資料表
- [x] weather_records 天氣紀錄資料表

## 後端 tRPC 路由
- [x] courses.list / create / update / delete
- [x] rounds.list / create / update / delete / getById
- [x] holes.upsertBatch（批次更新18洞）
- [x] stats.summary（統計儀表板數據）
- [x] stats.trends（成績趨勢數據）
- [x] stats.holeStats（各洞統計）
- [x] ai.analyze（AI 助理分析）
- [x] ai.chat（AI 對話）
- [x] ai.fullAnalysis（完整數據分析）
- [x] weather.getForRound（天氣資料）
- [x] scorecard.generateImage（成績卡圖片生成）
- [x] voice.transcribeScore（語音轉文字）

## 前端頁面
- [x] 全域樣式（International Typographic Style / Swiss Style）
- [x] GolfLayout 側邊欄導航
- [x] 首頁 / 儀表板（Dashboard）
- [x] 球場管理頁面（Courses）
- [x] 新增下場記錄頁面（New Round）
- [x] 18洞成績輸入表單（含語音輸入）
- [x] 歷史紀錄查詢頁面（History）
- [x] 數據統計儀表板（Analytics）
- [x] AI 助理頁面（AI Assistant）
- [x] 成績卡詳情頁面（RoundDetail）

## 功能模組
- [x] 球場管理 CRUD（新增、編輯、刪除球場）
- [x] 18洞成績紀錄（桿數、推桿、球道命中、上果嶺）
- [x] 歷史紀錄篩選（日期、球場）
- [x] 數據統計：平均桿數、標準桿分布、推桿統計、球道命中率
- [x] Recharts 互動圖表：成績趨勢、各洞熱力圖、進步曲線、雷達圖
- [x] AI 助理：LLM 分析弱點與個人化建議
- [x] 天氣整合：下場當日天氣資料（Open-Meteo API）
- [x] 成績卡圖片生成（Image Generation）
- [x] 語音輸入（Speech-to-Text）
- [x] Vitest 測試（17 tests passing）

## 靜態展示網頁
- [ ] 互動式靜態展示網頁（含互動圖表）
