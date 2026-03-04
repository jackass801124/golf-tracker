# Manus 平台使用指南

本指南教您如何在 Manus 平台上直接管理和修改 Golf Tracker 應用，無需轉移到本地環境。

---

## 第一部分：使用 Manus UI 編輯數據庫

### 1.1 訪問 Manus 管理面板

#### 步驟 1：登入 Manus
1. 打開 Manus 平台首頁
2. 使用您的帳號登入
3. 進入您的專案儀表板

#### 步驟 2：打開 Golf Tracker 專案
1. 在儀表板找到 **golf-tracker** 專案
2. 點擊進入專案
3. 您應該會看到以下面板：
   - **Preview** - 應用預覽
   - **Code** - 代碼文件管理
   - **Dashboard** - 儀表板
   - **Database** - 數據庫管理（這是我們需要的）
   - **Settings** - 設定

---

### 1.2 訪問數據庫管理面板

#### 打開 Database 面板
1. 在 Manus 專案中點擊 **Database** 標籤
2. 您會看到一個 CRUD UI，顯示所有數據表

#### 可用的數據表
根據 Golf Tracker 的 Schema，您應該看到以下表：

| 表名 | 說明 | 主要欄位 |
|------|------|---------|
| **users** | 用戶帳號 | id, openId, name, email, role, createdAt |
| **courses** | 球場信息 | id, userId, name, location, par, createdAt |
| **rounds** | 下場紀錄 | id, userId, courseId, date, totalScore, totalPutts, weather, createdAt |
| **holes** | 每洞成績 | id, roundId, holeNumber, par, score, putts, fairwayHit, gir, createdAt |
| **weatherRecords** | 天氣紀錄 | id, roundId, temperature, windSpeed, rainfall, conditions, createdAt |

---

### 1.3 查詢和編輯數據

#### A. 查看所有記錄

1. 在 Database 面板選擇一個表（例如 **courses**）
2. 點擊表名查看所有記錄
3. 您會看到一個表格，顯示所有該表的數據

#### B. 搜尋特定記錄

1. 在表格上方有搜尋欄
2. 輸入搜尋條件（例如球場名稱）
3. 點擊 **Search** 或按 Enter

#### C. 新增記錄

1. 點擊 **+ Add New** 或 **New Record** 按鈕
2. 填寫表單中的所有必填欄位
3. 點擊 **Save** 或 **Create**

**例如：新增球場**
```
Name: 北投高爾夫球場
Location: 台北市北投區
Par: 72
```

#### D. 編輯現有記錄

1. 在表格中找到要編輯的記錄
2. 點擊該行或點擊 **Edit** 按鈕
3. 修改所需的欄位
4. 點擊 **Save** 或 **Update**

**例如：修改下場成績**
```
原始分數: 85
新分數: 83
```

#### E. 刪除記錄

1. 在表格中找到要刪除的記錄
2. 點擊 **Delete** 按鈕
3. 確認刪除（通常會有確認對話框）

**警告**：刪除操作通常無法撤銷，請謹慎操作！

---

### 1.4 高級數據庫操作

#### A. 執行自訂 SQL 查詢

如果您需要進行複雜的查詢或批量操作，Manus 提供了 SQL 查詢工具：

1. 在 Database 面板找到 **SQL Query** 或 **Custom Query** 選項
2. 輸入您的 SQL 語句
3. 點擊 **Execute** 或 **Run**

**常用的 SQL 查詢示例**：

```sql
-- 查詢特定用戶的所有下場紀錄
SELECT * FROM rounds 
WHERE userId = 1 
ORDER BY date DESC;

-- 查詢特定球場的平均成績
SELECT 
  c.name,
  AVG(r.totalScore) as avg_score,
  COUNT(r.id) as round_count
FROM rounds r
JOIN courses c ON r.courseId = c.id
GROUP BY c.id, c.name;

-- 查詢推桿數最少的下場
SELECT * FROM rounds 
WHERE totalPutts = (SELECT MIN(totalPutts) FROM rounds)
LIMIT 1;

-- 更新特定下場的天氣信息
UPDATE weatherRecords 
SET temperature = 28, windSpeed = 15 
WHERE roundId = 5;

-- 刪除超過一年的下場紀錄
DELETE FROM rounds 
WHERE date < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

#### B. 批量操作

```sql
-- 批量更新所有下場的推桿數（例如修正數據錯誤）
UPDATE rounds 
SET totalPutts = totalPutts - 1 
WHERE userId = 1 AND date > '2026-01-01';

-- 批量新增多個球場
INSERT INTO courses (userId, name, location, par) VALUES
(1, '球場 A', '台北', 72),
(1, '球場 B', '新竹', 72),
(1, '球場 C', '台中', 71);

-- 查詢並導出特定用戶的所有數據
SELECT r.*, h.*, c.name as course_name
FROM rounds r
LEFT JOIN holes h ON r.id = h.roundId
LEFT JOIN courses c ON r.courseId = c.id
WHERE r.userId = 1
ORDER BY r.date DESC;
```

#### C. 備份和導出數據

1. 在 Database 面板找到 **Export** 或 **Backup** 選項
2. 選擇要導出的表
3. 選擇導出格式（通常支持 CSV、JSON、SQL）
4. 點擊 **Download** 下載數據

---

### 1.5 常見的數據庫操作場景

#### 場景 1：修正下場成績

**情況**：您發現某次下場的成績記錄有誤

**解決步驟**：
1. 打開 **rounds** 表
2. 搜尋該下場紀錄（按日期或球場名稱）
3. 點擊編輯
4. 修改 `totalScore` 或 `totalPutts`
5. 保存

#### 場景 2：新增球場

**情況**：您想記錄在新球場的下場

**解決步驟**：
1. 打開 **courses** 表
2. 點擊 **+ Add New**
3. 填寫：
   - Name: 球場名稱
   - Location: 地點
   - Par: 標準桿數（通常 72）
4. 保存
5. 記下新球場的 ID（稍後記錄成績時需要）

#### 場景 3：查詢特定時間段的成績

**情況**：您想查看上個月的所有下場紀錄

**解決步驟**：
1. 打開 **rounds** 表
2. 使用搜尋或篩選功能
3. 輸入日期範圍（例如 2026-02-01 到 2026-02-28）
4. 查看結果

#### 場景 4：分析成績趨勢

**情況**：您想計算平均成績、最佳成績等統計數據

**解決步驟**：
1. 打開 **SQL Query** 工具
2. 執行以下查詢：

```sql
SELECT 
  COUNT(*) as total_rounds,
  AVG(totalScore) as avg_score,
  MIN(totalScore) as best_score,
  MAX(totalScore) as worst_score,
  AVG(totalPutts) as avg_putts,
  MIN(totalPutts) as best_putts
FROM rounds
WHERE userId = 1;
```

3. 查看結果統計

---

### 1.6 數據庫連接信息

如果您需要從其他工具（如 MySQL Workbench、DBeaver）連接到 Manus 數據庫：

1. 在 Manus Database 面板找到 **Connection Info** 或 **Database Settings**
2. 您會看到：
   - **Host**: 數據庫伺服器地址
   - **Port**: 通常是 3306（MySQL）
   - **Username**: 數據庫用戶名
   - **Password**: 數據庫密碼
   - **Database**: 數據庫名稱
   - **SSL**: 是否需要 SSL 連接

3. 使用這些信息在本地工具中連接

**注意**：Manus 通常會提示啟用 SSL 以確保安全連接。

---

## 第二部分：代碼修改流程

### 2.1 告訴我您的修改需求

當您想修改代碼時，請以以下格式告訴我：

#### 修改需求模板

```
【修改需求】

功能名稱: [例如：AI 助理分析]
修改類型: [前端 UI / 後端 API / 數據庫 Schema]
當前狀況: [描述目前的行為]
期望改變: [描述您想要的改變]
具體需求: [詳細說明修改內容]
優先級: [高 / 中 / 低]

示例:
功能名稱: 成績卡顯示
修改類型: 前端 UI
當前狀況: 成績卡只顯示總分和推桿數
期望改變: 成績卡還要顯示球道命中率和 GIR
具體需求: 在成績卡中新增兩個統計指標的顯示
優先級: 中
```

### 2.2 常見的代碼修改類型

#### A. 前端 UI 修改

**可修改的內容**：
- 頁面佈局和設計
- 顏色、字體、間距
- 按鈕和表單
- 圖表和視覺化
- 文字和標籤

**修改示例**：
```
功能名稱: Dashboard 儀表板
修改類型: 前端 UI
期望改變: 將儀表板的紅色主題改為藍色
具體需求: 
- 將所有紅色 (#c0392b) 改為藍色 (#2196F3)
- 更新按鈕、圖標和強調元素的顏色
```

#### B. 後端 API 修改

**可修改的內容**：
- API 邏輯和業務規則
- 數據驗證和錯誤處理
- 計算和統計方法
- 集成新的外部服務

**修改示例**：
```
功能名稱: AI 分析
修改類型: 後端 API
期望改變: 改進 AI 分析的建議邏輯
具體需求:
- 根據推桿數據提供更詳細的建議
- 考慮天氣因素影響成績分析
- 新增訓練計畫生成功能
```

#### C. 數據庫 Schema 修改

**可修改的內容**：
- 新增表或欄位
- 修改欄位類型
- 新增索引或約束
- 修改數據關係

**修改示例**：
```
功能名稱: 球具管理
修改類型: 數據庫 Schema
期望改變: 新增球具管理功能
具體需求:
- 新增 equipment 表記錄球桿信息
- 新增 round_equipment 表記錄每次下場使用的球具
- 在 rounds 表新增 equipment_notes 欄位
```

---

### 2.3 修改流程

#### 步驟 1：您提出修改需求
告訴我您想修改什麼，使用上面的模板格式。

#### 步驟 2：我進行代碼修改
- 我會在沙箱環境中修改代碼
- 進行本地測試
- 編寫或更新測試用例

#### 步驟 3：我上傳更新到 Manus
- 提交代碼更改
- 建立新的 Checkpoint
- 更新系統

#### 步驟 4：您驗證修改
- 在 Manus Preview 中查看更改
- 測試新功能
- 提供反饋

#### 步驟 5：迭代改進
如果需要進一步調整，回到步驟 1。

---

### 2.4 修改示例演示

#### 示例 1：修改 Dashboard 顏色主題

**您的需求**：
```
功能名稱: Dashboard 主題
修改類型: 前端 UI
期望改變: 將紅色主題改為綠色
具體需求: 更新所有紅色元素為綠色 (#4CAF50)
```

**我的修改流程**：
1. 編輯 `client/src/index.css` 中的 CSS 變數
2. 修改 `--red: #c0392b` 為 `--green: #4CAF50`
3. 更新所有使用紅色的組件
4. 本地測試確保沒有破壞
5. 上傳到 Manus
6. 您在 Preview 中查看結果

**修改前**：
```css
:root {
  --red: #c0392b;
  --black: #111;
}
```

**修改後**：
```css
:root {
  --green: #4CAF50;
  --black: #111;
}
```

#### 示例 2：新增球具管理功能

**您的需求**：
```
功能名稱: 球具管理
修改類型: 後端 API + 數據庫 Schema
期望改變: 新增球具管理模組
具體需求:
- 用戶可以新增和管理自己的球具
- 記錄每支球桿的使用頻率
- 在下場時選擇使用的球具
```

**我的修改流程**：
1. 在 `drizzle/schema.ts` 新增 equipment 表
2. 執行數據庫遷移
3. 在 `server/db.ts` 新增查詢輔助函式
4. 在 `server/routers.ts` 新增 API 路由
5. 在 `client/src/pages/` 新增 Equipment 頁面
6. 編寫測試用例
7. 上傳到 Manus

---

## 第三部分：系統更新機制

### 3.1 我如何上傳更新

#### 方法 1：通過 Manus UI 上傳代碼

1. 在 Manus 專案中點擊 **Code** 標籤
2. 您會看到文件樹
3. 點擊要編輯的文件
4. 在編輯器中修改代碼
5. 點擊 **Save** 保存
6. 系統會自動重新部署

#### 方法 2：通過 Git 推送更新

1. 我在本地修改代碼
2. 提交到 Git：
   ```bash
   git add .
   git commit -m "Feature: Add equipment management"
   git push origin main
   ```
3. Manus 會自動檢測到推送
4. 自動構建和部署新版本

#### 方法 3：通過 Checkpoint 更新

1. 我完成修改並測試
2. 在 Manus 中建立新的 Checkpoint
3. 您可以在 Dashboard 中看到新的 Checkpoint
4. 您可以選擇是否應用此更新

---

### 3.2 查看更新歷史

#### 在 Manus Dashboard 查看

1. 點擊 **Dashboard** 標籤
2. 向下滾動找到 **Checkpoints** 或 **Deployment History**
3. 您會看到所有的更新記錄：
   - 更新時間
   - 更新描述
   - 更新者
   - 狀態（成功/失敗）

#### 查看具體更改

1. 點擊某個 Checkpoint
2. 您會看到該版本的詳細信息
3. 可以查看修改的文件列表
4. 可以回滾到之前的版本

---

### 3.3 回滾到之前的版本

如果新版本有問題，您可以回滾：

#### 在 Manus UI 中回滾

1. 在 Dashboard 找到之前的 Checkpoint
2. 點擊 **Rollback** 按鈕
3. 確認回滾
4. 系統會恢復到該版本

#### 通過 Git 回滾

```bash
# 查看提交歷史
git log --oneline

# 回滾到特定提交
git revert <commit-hash>

# 推送回滾
git push origin main
```

---

### 3.4 修改通知和確認

#### 修改前的確認

在我進行任何修改前，我會：
1. 詢問您是否確認修改
2. 解釋修改的影響
3. 提供修改前後的對比

#### 修改後的通知

修改完成後，我會：
1. 告訴您修改已完成
2. 提供新的 Checkpoint 版本 ID
3. 提供測試步驟
4. 提供回滾方法

---

## 第四部分：最佳實踐

### 4.1 數據庫操作最佳實踐

✅ **推薦做法**：
- 定期備份數據
- 在進行批量操作前先測試
- 使用 SQL 事務確保數據一致性
- 記錄所有重要的數據修改

❌ **避免做法**：
- 直接刪除大量數據而不備份
- 在生產環境中進行未測試的 SQL 操作
- 修改系統表（如 users 表）的核心欄位

### 4.2 代碼修改最佳實踐

✅ **推薦做法**：
- 清楚地描述修改需求
- 提供具體的使用場景
- 提供修改前後的對比
- 等待修改完成後再進行下一個修改

❌ **避免做法**：
- 同時提出多個相互衝突的修改需求
- 要求修改核心安全邏輯而不提供充分說明
- 在未測試的情況下應用到生產環境

### 4.3 溝通最佳實踐

✅ **推薦做法**：
- 使用結構化的修改需求模板
- 提供具體的例子和場景
- 明確優先級
- 提供反饋和測試結果

❌ **避免做法**：
- 模糊的修改描述
- 同時提出過多修改
- 不提供任何上下文信息

---

## 常見問題

### Q1: 如果我在數據庫中手動修改了數據，會影響應用嗎？
**A**: 是的，您的修改會立即反映在應用中。確保修改是有效的，因為應用會直接讀取修改後的數據。

### Q2: 我可以在 Manus UI 中直接修改代碼嗎？
**A**: 可以，但建議通過我進行修改，因為我可以確保代碼質量、測試和相容性。

### Q3: 修改代碼後多久會生效？
**A**: 通常在 1-2 分鐘內生效。您可以在 Manus Dashboard 中查看部署狀態。

### Q4: 如果修改出錯了怎麼辦？
**A**: 您可以通過 Manus Dashboard 回滾到之前的版本，通常只需要幾秒鐘。

### Q5: 我可以同時進行多個修改嗎？
**A**: 建議一次進行一個修改，完成測試後再進行下一個。這樣可以更容易追蹤問題。

### Q6: 如何確保數據安全？
**A**: 
- 定期備份數據
- 不要刪除重要數據而不備份
- 在進行批量操作前先測試
- 使用 SQL 事務

---

## 快速參考

### 常用的 Manus UI 操作

| 操作 | 步驟 |
|------|------|
| 查看數據 | Database → 選擇表 → 查看記錄 |
| 新增記錄 | Database → 選擇表 → + Add New → 填寫表單 → Save |
| 編輯記錄 | Database → 選擇表 → 點擊記錄 → 編輯 → Save |
| 刪除記錄 | Database → 選擇表 → 點擊記錄 → Delete → 確認 |
| 執行 SQL | Database → SQL Query → 輸入 SQL → Execute |
| 查看代碼 | Code → 選擇文件 → 查看內容 |
| 查看部署 | Dashboard → Checkpoints → 查看歷史 |
| 回滾版本 | Dashboard → Checkpoints → 選擇版本 → Rollback |

---

## 聯繫和支持

如果您在使用 Manus 平台時遇到任何問題：

1. **查看 Manus 官方文檔**：https://manus.im/docs
2. **提交反饋**：https://help.manus.im
3. **告訴我您的問題**：我可以協助解決或提供替代方案

---

## 下一步

現在您已經了解如何：
- ✅ 使用 Manus UI 編輯數據庫
- ✅ 告訴我代碼修改需求
- ✅ 理解系統更新機制

**您現在可以**：
1. 在 Manus 中探索和修改數據
2. 提出任何代碼修改需求
3. 我會進行修改並上傳更新

祝您使用愉快！🎉
