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

- **同步資源**：`npx cap sync ios`
- **使用 xcodebuild 編譯**：
  ```bash
  xcodebuild -workspace ios/App/App.xcworkspace -scheme App -sdk iphonesimulator -configuration Debug build
  ```
- **控制模擬器**：
  - 列出運行中模擬器：`xcrun simctl list devices booted`
  - 啟動特定 App：`xcrun simctl launch booted com.phchu.rhythmrun`

---

*本專案已程式化開啟 Background Modes，支援背景定位與音訊播放。*
