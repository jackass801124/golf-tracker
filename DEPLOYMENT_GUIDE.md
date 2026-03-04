# Golf Tracker - Vercel 部署完整指南

本指南將引導您完成從 GitHub 到 Vercel 的完整部署流程。

---

## 📋 前置要求

在開始之前，請確保您有以下準備：

1. **GitHub 帳號**（已有 ✓）
2. **Vercel 帳號**（免費註冊）
3. **本地 Git 環境**
4. **必要的環境變數**（見下方）

---

## 第一步：準備必要的環境變數

### 您需要以下環境變數：

| 變數名 | 說明 | 來源 |
|--------|------|------|
| `DATABASE_URL` | MySQL/TiDB 連接字串 | 您的數據庫提供商 |
| `JWT_SECRET` | 會話簽名密鑰 | 生成任意 32+ 字符的隨機字串 |
| `VITE_APP_ID` | Manus OAuth 應用 ID | Manus 開發者控制台 |
| `OAUTH_SERVER_URL` | Manus OAuth 後端 URL | 通常是 `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | Manus 登入入口 URL | Manus 開發者控制台 |
| `OWNER_OPEN_ID` | 擁有者 OpenID | Manus 帳號資訊 |
| `OWNER_NAME` | 擁有者名稱 | 您的名稱 |
| `BUILT_IN_FORGE_API_URL` | Manus 內建 API URL | Manus 開發者控制台 |
| `BUILT_IN_FORGE_API_KEY` | Manus API 密鑰（伺服器端） | Manus 開發者控制台 |
| `VITE_FRONTEND_FORGE_API_KEY` | Manus API 密鑰（前端） | Manus 開發者控制台 |
| `VITE_FRONTEND_FORGE_API_URL` | Manus API URL（前端） | Manus 開發者控制台 |
| `VITE_ANALYTICS_ENDPOINT` | 分析端點 URL | 您的分析服務 |
| `VITE_ANALYTICS_WEBSITE_ID` | 分析網站 ID | 您的分析服務 |
| `VITE_APP_TITLE` | 應用標題 | 例如：`Golf Tracker` |
| `VITE_APP_LOGO` | 應用 Logo URL | CDN 或 S3 URL |

### 如何生成 JWT_SECRET：

```bash
# 在終端執行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 32
```

---

## 第二步：設定數據庫

### 推薦選項：

#### **A. 使用 PlanetScale（推薦，免費層）**
1. 前往 [PlanetScale](https://planetscale.com)
2. 註冊帳號
3. 建立新資料庫
4. 複製連接字串：`mysql://user:password@host/database?sslaccept=strict`
5. 這就是您的 `DATABASE_URL`

#### **B. 使用 Supabase PostgreSQL**
1. 前往 [Supabase](https://supabase.com)
2. 建立新專案
3. 複製 PostgreSQL 連接字串
4. 修改 `drizzle/schema.ts` 改用 PostgreSQL 驅動

#### **C. 本地 MySQL**
如果您已有本地 MySQL，確保 Vercel 可以訪問（需要開放防火牆或使用 SSH 隧道）

---

## 第三步：上傳到 GitHub

### 3.1 在 GitHub 建立新倉庫

1. 登入 [GitHub](https://github.com)
2. 點擊右上角 **+** → **New repository**
3. 填寫以下資訊：
   - **Repository name**: `golf-tracker`
   - **Description**: `Professional Golf Score Tracking & Analysis System`
   - **Visibility**: 選擇 **Public**（Vercel 可以訪問）
   - **Initialize this repository**: 不勾選（我們會推送本地代碼）
4. 點擊 **Create repository**

### 3.2 在本地初始化 Git 並推送代碼

```bash
# 進入專案目錄
cd /home/ubuntu/golf-tracker

# 初始化 Git 倉庫
git init

# 添加所有文件
git add .

# 提交初始版本
git commit -m "Initial commit: Golf Tracker App with AI analysis"

# 添加遠端倉庫（替換 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/golf-tracker.git

# 重命名分支為 main（如果需要）
git branch -M main

# 推送到 GitHub
git push -u origin main
```

### 3.3 驗證推送成功

在瀏覽器打開 `https://github.com/YOUR_USERNAME/golf-tracker`，確認代碼已上傳。

---

## 第四步：在 Vercel 部署

### 4.1 連接 GitHub 到 Vercel

1. 前往 [Vercel](https://vercel.com)
2. 使用 GitHub 帳號登入（或註冊）
3. 授權 Vercel 訪問您的 GitHub 帳號

### 4.2 導入專案

1. 在 Vercel 儀表板點擊 **Add New** → **Project**
2. 在 **Import Git Repository** 中搜尋 `golf-tracker`
3. 點擊 **Import**

### 4.3 配置環境變數

1. 在 **Environment Variables** 部分，添加所有必要的環境變數
2. 對於每個變數：
   - **Name**: 輸入變數名（例如 `DATABASE_URL`）
   - **Value**: 輸入對應的值
   - **Environment**: 選擇 **Production** 和 **Preview**
3. 逐一添加所有變數

**快速添加方法**：
```
DATABASE_URL = mysql://user:password@host/database
JWT_SECRET = <生成的隨機字串>
VITE_APP_ID = <您的 Manus App ID>
OAUTH_SERVER_URL = https://api.manus.im
VITE_OAUTH_PORTAL_URL = <Manus 入口 URL>
OWNER_OPEN_ID = <您的 OpenID>
OWNER_NAME = <您的名稱>
BUILT_IN_FORGE_API_URL = <Manus API URL>
BUILT_IN_FORGE_API_KEY = <API 密鑰>
VITE_FRONTEND_FORGE_API_KEY = <前端 API 密鑰>
VITE_FRONTEND_FORGE_API_URL = <Manus API URL>
VITE_ANALYTICS_ENDPOINT = <分析端點>
VITE_ANALYTICS_WEBSITE_ID = <分析 ID>
VITE_APP_TITLE = Golf Tracker
VITE_APP_LOGO = <Logo URL>
```

### 4.4 配置構建設定

Vercel 應該會自動檢測設定，但如果需要手動調整：

- **Framework Preset**: `Vite`
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install --frozen-lockfile`

### 4.5 部署

1. 確認所有設定無誤
2. 點擊 **Deploy**
3. 等待部署完成（通常 2-5 分鐘）

---

## 第五步：驗證部署

### 5.1 檢查部署狀態

1. 在 Vercel 儀表板查看部署進度
2. 如果顯示綠色 ✓，表示部署成功
3. 點擊 **Visit** 打開您的應用

### 5.2 測試應用功能

- [ ] 訪問首頁
- [ ] 測試登入流程
- [ ] 建立新球場
- [ ] 記錄下場成績
- [ ] 查看數據分析
- [ ] 測試 AI 助理

### 5.3 檢查日誌

如果部署失敗，查看日誌：

1. 在 Vercel 儀表板點擊 **Deployments**
2. 點擊失敗的部署
3. 點擊 **Logs** 查看錯誤信息

---

## 常見問題與解決方案

### ❌ 部署失敗：`Build failed`

**原因**：通常是依賴安裝或編譯錯誤

**解決**：
```bash
# 本地測試構建
pnpm install
pnpm build

# 檢查錯誤信息
```

### ❌ 部署失敗：`DATABASE_URL is required`

**原因**：環境變數未正確設定

**解決**：
1. 檢查 Vercel 環境變數是否正確添加
2. 確保 `DATABASE_URL` 格式正確
3. 重新部署

### ❌ 應用啟動失敗：`Cannot find module`

**原因**：依賴未正確安裝

**解決**：
1. 在 Vercel 儀表板點擊 **Settings** → **Build & Development Settings**
2. 清除構建快取：**Settings** → **Git** → **Redeploy**
3. 重新部署

### ❌ 數據庫連接失敗

**原因**：數據庫 URL 無效或網絡不可達

**解決**：
1. 測試本地連接：`mysql -u user -p -h host database`
2. 確認防火牆設定允許 Vercel 連接
3. 如使用 PlanetScale，確保已建立密碼

### ❌ OAuth 登入失敗

**原因**：OAuth 回調 URL 不匹配

**解決**：
1. 在 Manus 開發者控制台設定正確的回調 URL
2. 回調 URL 應為：`https://your-vercel-domain.vercel.app/api/oauth/callback`
3. 重新部署

---

## 第六步：設定自訂域名（可選）

### 6.1 在 Vercel 添加域名

1. 在 Vercel 專案設定中點擊 **Domains**
2. 輸入您的域名（例如 `golf-tracker.com`）
3. 點擊 **Add**

### 6.2 配置 DNS

根據您的域名提供商，添加以下 DNS 記錄：

**CNAME 記錄**：
```
Name: golf-tracker
Type: CNAME
Value: cname.vercel-dns.com
```

或按照 Vercel 提供的具體指示操作。

### 6.3 驗證域名

Vercel 會自動驗證，通常需要 5-30 分鐘。

---

## 第七步：設定自動部署

### 7.1 啟用自動部署

1. 在 Vercel 專案設定中點擊 **Git**
2. 確保 **Deploy on every push to main** 已啟用
3. 保存設定

### 7.2 測試自動部署

```bash
# 在本地修改代碼
echo "# Updated" >> README.md

# 提交並推送
git add .
git commit -m "Update README"
git push origin main

# Vercel 應該會自動部署
```

---

## 監控與維護

### 監控應用健康

1. 定期檢查 Vercel 儀表板的 **Analytics**
2. 監控 **Function Logs** 查看錯誤
3. 設定 **Alerts** 接收部署失敗通知

### 定期備份

```bash
# 定期備份數據庫
mysqldump -u user -p database > backup.sql

# 備份代碼到本地
git pull origin main
```

---

## 完整檢查清單

- [ ] 生成 JWT_SECRET
- [ ] 設定數據庫（PlanetScale/Supabase）
- [ ] 收集所有環境變數
- [ ] 在 GitHub 建立倉庫
- [ ] 推送代碼到 GitHub
- [ ] 在 Vercel 連接 GitHub
- [ ] 添加所有環境變數
- [ ] 配置構建設定
- [ ] 部署應用
- [ ] 測試所有功能
- [ ] 設定自訂域名（可選）
- [ ] 啟用自動部署
- [ ] 設定監控告警

---

## 需要幫助？

如果部署過程中遇到問題，請：

1. 查看 [Vercel 官方文檔](https://vercel.com/docs)
2. 檢查 Vercel 儀表板的部署日誌
3. 在本地測試：`pnpm dev`

祝部署順利！🚀
