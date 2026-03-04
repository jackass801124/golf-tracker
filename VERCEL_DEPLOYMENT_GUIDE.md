# 🚀 Vercel + PlanetScale 完整部署教學

本指南將手把手教您如何將 Golf Tracker 部署到 Vercel，並使用 PlanetScale 作為數據庫。

---

## 📋 部署前準備清單

- [ ] 已有 GitHub 帳號
- [ ] 已安裝 Git（或已有 GitHub Desktop）
- [ ] 已閱讀本指南

---

## 第一部分：環境變數說明與取得

### 什麼是環境變數？

環境變數是應用程式需要的配置信息，例如數據庫連接字串、API 密鑰等。它們不應該被提交到 GitHub（因為包含敏感信息）。

### 您需要的環境變數

| 變數名 | 說明 | 取得方式 | 示例 |
|--------|------|--------|------|
| `DATABASE_URL` | 數據庫連接字串 | PlanetScale | `mysql://user:pass@host/db` |
| `JWT_SECRET` | 會話簽名密鑰 | 自動生成 | `a1b2c3d4e5f6...` |
| `VITE_APP_ID` | Manus OAuth App ID | Manus 控制台 | `your-app-id` |
| `OAUTH_SERVER_URL` | Manus OAuth 伺服器 | 固定值 | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | Manus 登入入口 | Manus 控制台 | `https://portal.manus.im` |
| `OWNER_OPEN_ID` | 您的 Manus OpenID | Manus 控制台 | `user-xxx` |
| `OWNER_NAME` | 您的名稱 | 自己填寫 | `Jimmy Cheng` |
| `BUILT_IN_FORGE_API_URL` | Manus API URL | 固定值 | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | Manus API 密鑰（伺服器端） | Manus 控制台 | `key-xxx` |
| `VITE_FRONTEND_FORGE_API_KEY` | Manus API 密鑰（前端） | Manus 控制台 | `key-xxx` |
| `VITE_FRONTEND_FORGE_API_URL` | Manus API URL（前端） | 固定值 | `https://api.manus.im` |
| `VITE_ANALYTICS_ENDPOINT` | 分析端點 | Manus 控制台 | `https://analytics.manus.im` |
| `VITE_ANALYTICS_WEBSITE_ID` | 分析 ID | Manus 控制台 | `website-id` |
| `VITE_APP_TITLE` | 應用標題 | 自己填寫 | `47's Golf Tracker` |
| `VITE_APP_LOGO` | Logo URL | 自己填寫或留空 | `https://...` |

### 如何生成 JWT_SECRET

在終端執行以下命令：

```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 32
```

複製輸出的值，稍後會用到。

### 如何取得 Manus 信息

1. 訪問 Manus 控制台：https://manus.im
2. 登入您的帳號
3. 進入 **開發者設定** 或 **應用管理**
4. 複製以下信息：
   - `VITE_APP_ID`
   - `OWNER_OPEN_ID`
   - `BUILT_IN_FORGE_API_KEY`
   - 等等

如果您不確定在哪裡找到這些值，請參考 Manus 官方文檔或聯繫支持。

---

## 第二部分：設定 PlanetScale 數據庫

### 步驟 1：註冊 PlanetScale 帳號

1. 訪問 https://planetscale.com
2. 點擊 **Sign Up**
3. 使用 GitHub 帳號登入（推薦）
4. 完成註冊

### 步驟 2：建立新數據庫

1. 登入 PlanetScale 控制台
2. 點擊 **Create a database**
3. 填寫以下信息：
   - **Database name**: `golf-tracker`
   - **Region**: 選擇離您最近的地區（例如 Singapore）
4. 點擊 **Create database**

### 步驟 3：獲取數據庫連接字串

1. 進入剛建立的 `golf-tracker` 數據庫
2. 點擊 **Connect**
3. 選擇 **Node.js** 作為連接方式
4. 複製 **Connection string**，格式如下：
   ```
   mysql://root:password@host/golf-tracker
   ```
5. 保存此字串，稍後會用到

### 步驟 4：初始化數據庫表

您需要在 PlanetScale 中建立表。有兩種方式：

#### 方式 A：使用 PlanetScale 控制台（簡單）

1. 在 PlanetScale 中進入 **Console**
2. 執行以下 SQL 命令：

```sql
-- 建立 users 表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 建立 courses 表
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  par INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 建立 rounds 表
CREATE TABLE rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  courseId INT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  totalScore INT,
  totalPutts INT,
  girCount INT,
  notes TEXT,
  weather JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- 建立 holes 表
CREATE TABLE holes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roundId INT NOT NULL,
  holeNumber INT NOT NULL,
  par INT,
  score INT,
  putts INT,
  gir INT,
  fairwayHit INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (roundId) REFERENCES rounds(id) ON DELETE CASCADE
);
```

#### 方式 B：使用本地 Drizzle 遷移（進階）

如果您想使用 Drizzle ORM 的遷移文件：

```bash
# 在本地執行
DATABASE_URL="mysql://root:password@host/golf-tracker" pnpm drizzle-kit push
```

---

## 第三部分：推送代碼到 GitHub

### 步驟 1：初始化 Git 倉庫

```bash
cd /home/ubuntu/golf-tracker

# 初始化 Git
git init

# 配置 Git 用戶信息
git config --global user.email "your-email@github.com"
git config --global user.name "Your Name"
```

### 步驟 2：添加所有文件

```bash
git add .
```

### 步驟 3：提交代碼

```bash
git commit -m "Initial commit: Golf Tracker App"
```

### 步驟 4：在 GitHub 建立新倉庫

1. 訪問 https://github.com/new
2. 填寫以下信息：
   - **Repository name**: `golf-tracker`
   - **Description**: `Professional Golf Score Tracking & Analysis System`
   - **Visibility**: **Public**（重要！Vercel 需要訪問）
3. 點擊 **Create repository**

### 步驟 5：推送代碼到 GitHub

複製 GitHub 頁面上顯示的命令，類似於：

```bash
git remote add origin https://github.com/YOUR_USERNAME/golf-tracker.git
git branch -M main
git push -u origin main
```

在終端執行這些命令。

### 步驟 6：驗證推送成功

1. 訪問 https://github.com/YOUR_USERNAME/golf-tracker
2. 確認所有文件都已上傳

---

## 第四部分：在 Vercel 部署

### 步驟 1：訪問 Vercel

1. 訪問 https://vercel.com
2. 點擊 **Sign Up**
3. 選擇 **Continue with GitHub**
4. 授權 Vercel 訪問您的 GitHub 帳號

### 步驟 2：導入專案

1. 在 Vercel 控制台，點擊 **Add New** → **Project**
2. 在 **Import Git Repository** 中搜索 `golf-tracker`
3. 點擊 **Import**

### 步驟 3：配置專案

Vercel 會自動檢測這是一個 Node.js 項目。確認以下設定：

- **Framework Preset**: 應該自動選擇 **Other**
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

點擊 **Deploy** 前，先進行下一步。

### 步驟 4：添加環境變數

在部署前，您需要添加所有環境變數。

1. 在 Vercel 部署頁面中，找到 **Environment Variables** 部分
2. 點擊 **Add**，為每個變數添加：

```
DATABASE_URL = mysql://root:password@host/golf-tracker
JWT_SECRET = <您生成的值>
VITE_APP_ID = <您的 Manus App ID>
OAUTH_SERVER_URL = https://api.manus.im
VITE_OAUTH_PORTAL_URL = <您的 Manus 登入入口>
OWNER_OPEN_ID = <您的 OpenID>
OWNER_NAME = Jimmy Cheng
BUILT_IN_FORGE_API_URL = https://api.manus.im
BUILT_IN_FORGE_API_KEY = <您的 API 密鑰>
VITE_FRONTEND_FORGE_API_KEY = <您的前端 API 密鑰>
VITE_FRONTEND_FORGE_API_URL = https://api.manus.im
VITE_ANALYTICS_ENDPOINT = <您的分析端點>
VITE_ANALYTICS_WEBSITE_ID = <您的分析 ID>
VITE_APP_TITLE = 47's Golf Tracker
VITE_APP_LOGO = <您的 Logo URL 或留空>
```

### 步驟 5：部署

1. 確認所有環境變數都已添加
2. 點擊 **Deploy**
3. 等待部署完成（通常需要 3-5 分鐘）

### 步驟 6：驗證部署

1. 部署完成後，Vercel 會顯示一個 URL，例如：
   ```
   https://golf-tracker-xxx.vercel.app
   ```
2. 點擊此 URL 訪問您的應用
3. 嘗試登入以驗證應用正常運行

---

## 第五部分：管理數據庫

### 在 PlanetScale 中查看和編輯數據

1. 訪問 https://planetscale.com
2. 進入 `golf-tracker` 數據庫
3. 點擊 **Console**
4. 執行 SQL 查詢以查看或編輯數據

### 常用的 SQL 查詢

```sql
-- 查看所有用戶
SELECT * FROM users;

-- 查看所有下場紀錄
SELECT r.*, c.name as course_name FROM rounds r JOIN courses c ON r.courseId = c.id;

-- 查看特定用戶的下場紀錄
SELECT * FROM rounds WHERE userId = 1 ORDER BY date DESC;

-- 修改下場成績
UPDATE rounds SET totalScore = 82 WHERE id = 5;

-- 刪除下場紀錄
DELETE FROM rounds WHERE id = 5;
```

---

## 常見問題

### Q: 部署失敗，顯示 "Build failed"

**A**: 通常是環境變數配置不正確。檢查：
1. 所有必需的環境變數都已添加
2. 環境變數的值沒有多餘的空格
3. DATABASE_URL 的格式正確

### Q: 應用部署成功但無法登入

**A**: 可能是 OAuth 配置問題。檢查：
1. `VITE_APP_ID` 和 `OAUTH_SERVER_URL` 正確
2. Manus 應用設定中允許您的 Vercel URL 作為重定向 URI

### Q: 如何更新應用？

**A**: 只需推送新代碼到 GitHub，Vercel 會自動部署：
```bash
git add .
git commit -m "Update: ..."
git push origin main
```

### Q: 如何訪問數據庫？

**A**: 使用 PlanetScale 控制台中的 **Console** 功能執行 SQL 查詢。

---

## 🎉 部署完成！

恭喜！您的 Golf Tracker 應用現在已部署到 Vercel，並使用 PlanetScale 作為數據庫。

您可以：
- 訪問應用：`https://golf-tracker-xxx.vercel.app`
- 管理數據庫：PlanetScale 控制台
- 更新應用：推送新代碼到 GitHub

如有任何問題，請參考本指南或聯繫支持。
