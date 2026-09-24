# 🇹🇼 台灣各地目前幾度？ | CWA × FastAPI × Leaflet × Windy

> ### 🚀 **線上即時網站（點擊直接前往）**  
> 👉 **[https://l3-cwa.vercel.app/](https://l3-cwa.vercel.app/)** 👈

[![即刻體驗線上網站](https://img.shields.io/badge/🌐_線上即時網站-點此直接前往-0070f3?style=for-the-badge&logo=google-chrome&logoColor=white)](https://l3-cwa.vercel.app/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Live_Site-success?style=for-the-badge&logo=github)](https://l3-cwa.vercel.app/)

---

> **中央氣象署真實氣象站資料 ➔ FastAPI (Python) 清理整理 ➔ `/api/temperature/latest` ➔ Leaflet 測站標註 ➔ Windy 動態風場地圖 ➔ 使用者即時看見全台氣溫**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet)](https://leafletjs.com/)
[![Windy](https://img.shields.io/badge/Windy-Embed_API-blue?logo=windy)](https://www.windy.com/)
[![CWA OpenData](https://img.shields.io/badge/CWA_OpenData-O--A0001--001-orange)](https://opendata.cwa.gov.tw/)

🔗 **專案倉庫**：[https://github.com/yuan0307212-ops/L3-CWA](https://github.com/yuan0307212-ops/L3-CWA)  
🌐 **線上網站網址**：[https://l3-cwa.vercel.app/](https://l3-cwa.vercel.app/)

---

## 🌊 核心資料流程 (Architecture Flow)

```text
中央氣象署 CWA (官方真實氣象站觀測資料 O-A0001-001 / O-A0003-001)
       ↓
提供真實氣象站資料 (臺北、板橋、新竹、臺中、日月潭、阿里山、玉山、臺南、高雄、宜蘭、花蓮、臺東、澎湖、金門、馬祖...)
       ↓
FastAPI（Python）後端服務 (server.py)
       ↓
清理、整理、檢查資料 (過濾無效值 -99/-999、經緯度與溫度邊界檢查、數值四捨五入、排序)
       ↓
/api/temperature/latest (標準 RESTful JSON API 端點)
       ↓
前端 JavaScript (app.js) 非同步擷取與狀態管理
       ↓
Leaflet 把測站畫上去 (自訂溫度氣泡、顏色級距、點擊彈窗、平移定位)
       ↓
Windy 地圖 (ECMWF 全球動態風場與即時氣溫流線圖層)
       ↓
使用者看到：「台灣各地目前幾度」

## ✨ 系統亮點功能與全新首頁佈局

### 1. 🌡️ 首頁核心焦點：動態氣象溫度圖與多元環境指標
- **首頁 Hero 焦點區塊**：將 **Windy 全球流線風場與動態氣溫圖層** 移至首頁最醒目的主視覺位置，結合歐洲中期天氣預報 (ECMWF 9km) 高精度模型，全幅動態展示台灣各地目前即時氣溫與粒子流線。
- **6 大首頁即時環境指標卡片**：
  - 🌧️ **降雨機率 (PoP)**：即時掌握降雨趨勢與出門攜帶雨具提醒。
  - 💨 **即時風速與風向**：顯示即時風速 (m/s)、蒲福風級與東南西北即時風向。
  - ☀️ **紫外線指數 (UV Index)**：即時標註紫外線等級（低量、中量、過量、危險）與防曬建議。
  - 🍃 **空氣品質指標 (AQI)**：全台環境空氣品質等級（良好、普通、敏感不健康）。
  - 💧 **相對濕度 (Humidity)**：即時環境乾濕度監測。
  - ⏲️ **大氣壓力 (Pressure)**：提供百帕 (hPa) 實時大氣壓數值。
- **即時氣象快報跑馬燈**：首頁頂部即時輪播中央氣象署發布之強風、大雨特報與天氣提醒。

### 2. 📍 實體氣象站觀測（與首頁溫度圖換位）
- **Leaflet 實體測站地圖**：下移至第二重點專區，與**測站排行搜尋表**並列。以自訂色彩氣泡標註中央氣象署 28 座重要實體測站。
- **四段氣溫色標**：
  - 🔵 **藍色**：`< 20.0°C`（高山或涼爽環境）
  - 🟢 **綠色**：`20.0 ~ 25.0°C`（舒適宜人）
  - 🟠 **橘色**：`25.0 ~ 30.0°C`（溫暖微熱）
  - 🔴 **紅色**：`> 30.0°C`（炎熱高溫）
- **即時排行與模糊搜尋**：即時依氣溫排序，即時過濾縣市與測站名，點擊自動平移（FlyTo）放大至該測站。

### 3. ⚡ FastAPI 高效後端 API (`server.py`)
- 提供標準端點 `/api/temperature/latest`。
- 自動化資料清理管線：
  - 剔除氣象局無效標記碼（如 `-99.0`, `-999.0`）。
  - 結合風速、濕度計算體感溫度 (Feels-like Temperature)。
  - 清理整理降雨機率、風向、紫外線與即時特報。
- 內建 Swagger 自動化文件：`http://localhost:8000/docs`。

---

## 🚀 快速啟動指引 (Quick Start)

### 步驟 1：安裝 Python 依賴套件
```bash
pip install -r requirements.txt
```

### 步驟 2：啟動 FastAPI 後端伺服器
```bash
uvicorn server:app --reload --port 8000
```
- 後端 API 端點：[http://localhost:8000/api/temperature/latest](http://localhost:8000/api/temperature/latest)
- Swagger 互動式 API 文件：[http://localhost:8000/docs](http://localhost:8000/docs)
- 前端頁面（經由 FastAPI 掛載）：[http://localhost:8000/](http://localhost:8000/)

### 步驟 3：免安裝純前端預覽（GitHub Pages）
若未啟動 Python 後端，前端內建**智慧雙模備援**：
- 直接雙擊開啟根目錄下的 [index.html](file:///c:/Users/user/Desktop/L3%20CWA/index.html) 或至 [GitHub Pages](https://l3-cwa.vercel.app/) 線上瀏覽，系統會自動載入官方測站基準資料庫，動態氣象溫度圖與實體測站皆能 100% 完整互動！

---

## 📂 專案檔案清單

```text
├── server.py              # FastAPI 後端（提供 /api/temperature/latest，資料清洗與多指標整合）
├── index.html             # 主介面（首頁溫度圖 Hero、降雨機率/風速/UV卡片、測站專區）
├── style.css              # 玻璃擬態現代 UI、動態氣溫卡片、指標網格、響應式佈局
├── app.js                 # 前端 Fetch、Leaflet 測站地圖渲染、搜尋、指標更新與主題切換
├── requirements.txt       # 後端套件（fastapi, uvicorn, requests, pydantic 等）
├── src/                   # 煥哥課程 Python 與資料庫模組
│   ├── cwa_api.py         # CWA 資料集串接與整理
│   ├── database.py        # SQLite 資料庫 CRUD
│   └── map_utils.py       # Folium 地圖工具
├── app.py                 # Streamlit 備援微課程應用
└── README.md              # 專案流程與架構全指南
```

---

## 📄 API 回傳範例 (`/api/temperature/latest`)

```json
{
  "status": "success",
  "source": "交通部中央氣象署 (CWA) 氣象觀測站",
  "query_time": "2026-09-23 10:30:00",
  "total_stations": 28,
  "summary": {
    "highest": { "station": "高雄市 高雄", "temp": 31.8 },
    "lowest": { "station": "南投縣 玉山", "temp": 8.5 },
    "average": 26.8
  },
  "alerts": [
    "強風特報：臺灣北部海面及臺灣海峽平均風力可達6級，請作業船隻注意。",
    "高溫資訊：南部局部地區今日中午前後氣溫可達 32 度以上，請注意防曬多補充水分。"
  ],
  "data": [
    {
      "station_id": "467440",
      "station_name": "高雄",
      "county_name": "高雄市",
      "lat": 22.566,
      "lng": 120.3159,
      "temperature": 31.8,
      "feels_like": 34.2,
      "weather": "晴朗",
      "humidity": 65,
      "wind_speed": 2.6,
      "wind_dir": "西南風",
      "pop": 10,
      "uv_index": 8.5,
      "aqi": 42,
      "pressure": 1012.3,
      "obs_time": "2026-09-23 10:30:00"
    }
  ]
}
```
（經由 FastAPI 掛載）：[http://localhost:8000/](http://localhost:8000/)

### 步驟 3：免安裝純前端預覽（GitHub Pages）
若未啟動 Python 後端，前端內建**智慧雙模備援**：
- 直接雙擊開啟根目錄下的 [index.html](file:///c:/Users/user/Desktop/L3%20CWA/index.html) 或至 [GitHub Pages](https://l3-cwa.vercel.app/) 線上瀏覽，系統會自動載入官方測站基準資料庫，Leaflet 與 Windy 地圖皆能 100% 完整互動！

---

## 📂 專案檔案清單

```text
├── server.py              # FastAPI 後端（提供 /api/temperature/latest，資料清洗）
├── index.html             # 主介面（Leaflet 地圖、Windy 切換、氣溫總覽與測站排行）
├── style.css              # 玻璃擬態現代 UI、自訂 Leaflet 氣溫氣泡、響應式佈局
├── app.js                 # 前端 Fetch、Leaflet 測站地圖渲染、搜尋與 Windy 切換
├── requirements.txt       # 後端套件（fastapi, uvicorn, requests, pydantic 等）
├── src/                   # 煥哥課程 Python 與資料庫模組
│   ├── cwa_api.py         # CWA 資料集串接與整理
│   ├── database.py        # SQLite 資料庫 CRUD
│   └── map_utils.py       # Folium 地圖工具
├── app.py                 # Streamlit 備援微課程應用
└── README.md              # 專案流程與架構全指南
```

---

## 📄 API 回傳範例 (`/api/temperature/latest`)

```json
{
  "status": "success",
  "source": "交通部中央氣象署 (CWA) 氣象觀測站",
  "query_time": "2026-09-23 10:30:00",
  "total_stations": 28,
  "summary": {
    "highest": { "station": "高雄市 高雄", "temp": 31.8 },
    "lowest": { "station": "南投縣 玉山", "temp": 8.5 },
    "average": 26.8
  },
  "data": [
    {
      "station_id": "467440",
      "station_name": "高雄",
      "county_name": "高雄市",
      "lat": 22.566,
      "lng": 120.3159,
      "temperature": 31.8,
      "weather": "晴朗",
      "humidity": 65,
      "wind_speed": 2.6,
      "obs_time": "2026-09-23 10:30:00"
    }
  ]
}
```
