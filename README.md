# RhythmRun 🏃‍♂️💨

**RhythmRun** 是一款專為跑者打造、結合「科學節拍」與「智慧語音」的專業跑步訓練 App。透過同步步頻與節拍器音效，協助跑者維持穩定體律，減少運動傷害並提升跑效。

## 🌟 核心功能

### 1. 智慧跑步目標系統
- **多樣化目標**：支援「自由跑」、「距離目標」及「時間目標」設定。
- **自動結算**：可開啟「達成時自動停止」功能，讓系統在達標瞬間完成紀錄。
- **即時進度視覺化**：跑步過程中顯示動態進度條與剩餘量提示。

### 2. 連動節拍器 (Cadence Metronome)
- **穩定步頻**：可手動調整 BPM (100 - 220)，幫助掌握最佳跑步節奏。
- **智慧同步**：與跑步狀態連動，開始即播放，暫停即停止。

### 3. 進階語音教練 (Voice Coach)
- **每 0.5 公里播報**：即時播報目前距離、經過時間與平均配速。
- **動態目標回饋**：根據訓練目標，自動計算並提醒「剩餘距離」或「剩餘時間」。
- **自然語言格式**：採用人性化的語音格式（如「5 分 30 秒」），大幅提升聽覺清晰度。

### 4. 專業紀錄管理
- **互動式地圖**：提供 Voyager (淺色)、Standard (繽紛) 與 Dark (深色) 三種地圖風格切換，清晰呈現跑步軌跡。
- **左滑手勢功能**：在活動列表中支援「左滑刪除」手勢，操作極速流暢。
- **安全確認機制**：所有刪除動作均具備強制確認視窗，防止誤刪珍貴數據。

### 5. NRC 風格高級 UI/UX
- **黑紅高對比設計**：延續專業跑錶風格，針對戶外強光環境下的易讀性進行優化。
- **無障礙操作**：大型互動按鈕 (Large Circular Start Button)，即使在跑動中也能輕鬆點擊。

## 🛠 技術架構

- **Frontend**: React + Vite (高效能單頁應用)
- **Styling**: Vanilla CSS (自定義專業級視覺效果)
- **Map Engine**: Leaflet + React-Leaflet
- **Service Layer**:
  - **Firebase**: 用戶身份驗證與數據持久化。
  - **Capacitor**:
    - `@capacitor/geolocation`: 高精度 GPS 位移追蹤。
    - `@capacitor-community/text-to-speech`: 本地化語音合成。
- **Data Persistence**: LocalStorage 緩存與雲端同步。

## 📲 iOS CLI 開發指引 (進階)

本專案已完成自動化配置，您可以全程透過終端機進行 iOS 的開發與部署，無需手動操作 Xcode GUI。

### 1. 自動化建置與執行
我們提供了一個整合指令碼，可自動編譯並在模擬器中啟動 App：
```bash
# 賦予執行權限
chmod +x scripts/ios-build-run.sh

# 執行建置與部署
./scripts/ios-build-run.sh
```

### 2. 手動常用指令
如果您想手動控制流程，可以使用以下指令：

# RhythmRun - 專業跑步追蹤與節奏訓練 App

RhythmRun 是一款結合了 GPS 軌跡記錄、步頻節奏器與雲端同步功能的專業跑步應用程式。

## 🚀 快速開始 (環境建置)

如果您在新的電腦上下載此專案，請依照以下步驟操作：

### 1. 前置必要條件 (Prerequisites)
- **Node.js**: 建議版本 v22.17.0 以上
- **Xcode**: 安裝最新版本 (用於建置 iOS App)
- **CocoaPods**: iOS 插件管理工具 (透過 `sudo gem install cocoapods` 安裝)
- **Firebase 帳號**: 需準備一個 Firebase 專案

### 2. 初始化專案
```bash
# 安裝相依套件
npm install

# 建立環境變數
cp .env.example .env
# 💡 請編輯 .env 並填入您的 Firebase 密鑰
```

### 3. Firebase 設定
- **Authentication**: 開啟「電子郵件/密碼」登入方式。
- **Cloud Firestore**: 
  - 建立資料庫（建議選擇「原生模式 Native Mode」）。
  - 套用以下 **安全規則 (Rules)**：
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId}/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```

### 4. 建置並執行 iOS/Android App

#### iOS (專屬 Mac)
```bash
npm run build
npx cap sync ios
open ios/App/App.xcworkspace
```

#### Android (Windows/Mac)
```bash
npm run build
npx cap sync android
# 使用 Android Studio 開啟 android 資料夾
# 點擊 Build > Build APK(s) 即可產出 .apk
```

---

## 🛠️ 技術架構說明

### 核心技術棧
- **Frontend**: React + Vite (高效能前端框架)
- **Mobile Environment**: Capacitor 6 (將 Web 轉化為 iOS 原生應用)
- **Backend/DB**: Firebase Auth + Cloud Firestore (即時雲端同步)
- **Styling**: Vanilla CSS (精緻深色模式介面)

### 同步邏輯 (Sync Engine)
本專案採用了「主動式雲端同步」架構：
- **本地優先**：跑步數據優先儲存於手機原生空間，確保離線也能記錄。
- **自動推播**：當 App 偵測到網路連線且有新紀錄時，會自動在背景將資料同步至 Firestore。
- **除重機制**：內建「10 分鐘模糊除重」演算法，防止在不穩定網路環境下產生重複數據。

---

## 📦 版本說明
- **v2.2.0 (Stable)**:
  - 實作了跨裝置雲端同步。
  - 優化了資料庫安全存取規則。
  - 移除所有除錯日誌，提升 UI 質感。
  - 修正了在 iOS 實機上的資料持久化問題。

---

*本專案已程式化開啟 Background Modes，支援背景定位與音訊播放。*
