"""
=============================================================================
煥哥 AI 創新微課程：Taiwan Weather Forecast
單元 3~7: CWA API 資料取得、JSON 解析、提取氣溫與 Pandas 資料整理
=============================================================================
"""

import datetime
import json
import logging
from typing import Optional
import pandas as pd
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 煥哥課程標準定義的 6 大氣象分區
STANDARD_REGIONS = [
    "北部地區",
    "中部地區",
    "南部地區",
    "東北部地區",
    "東部地區",
    "東南部地區"
]

# 各地區基準天氣與氣溫參數 (用於擬真備援引擎)
REGION_BASELINE = {
    "北部地區": {"minT": 20.0, "maxT": 28.0, "weather": "多雲時晴", "lat": 25.04, "lng": 121.55},
    "東北部地區": {"minT": 19.0, "maxT": 26.0, "weather": "陰短暫雨", "lat": 24.75, "lng": 121.75},
    "中部地區": {"minT": 22.0, "maxT": 31.0, "weather": "晴朗", "lat": 24.15, "lng": 120.68},
    "南部地區": {"minT": 24.0, "maxT": 33.0, "weather": "晴時多雲", "lat": 22.85, "lng": 120.30},
    "東部地區": {"minT": 21.0, "maxT": 29.0, "weather": "多雲短暫雨", "lat": 23.98, "lng": 121.60},
    "東南部地區": {"minT": 23.0, "maxT": 30.0, "weather": "多雲", "lat": 22.75, "lng": 121.15},
}


def fetch_cwa_weather_from_api(api_key: str) -> Optional[pd.DataFrame]:
    """
    單元 4: 使用 Requests 取得中央氣象署 CWA API 的 JSON 資料
    資料集: F-C0032-001 (一般天氣預報 - 36小時天氣預報)
    """
    if not api_key:
        return None

    url = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001"
    params = {
        "Authorization": api_key,
        "format": "JSON"
    }

    try:
        logger.info("正在連線至中央氣象署 CWA API 取得氣象資料...")
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if not data.get("success"):
            logger.warning("CWA API 回應未成功，轉入擬真資料庫")
            return None

        # 單元 5: JSON 資料結構解析
        locations = data["records"]["location"]
        records = []
        today = datetime.date.today()

        # 將 22 縣市對應整合至 6 大分區
        region_mapping = {
            "臺北市": "北部地區", "新北市": "北部地區", "基隆市": "北部地區", "桃園市": "北部地區", "新竹市": "北部地區", "新竹縣": "北部地區",
            "宜蘭縣": "東北部地區",
            "臺中市": "中部地區", "苗栗縣": "中部地區", "彰化縣": "中部地區", "南投縣": "中部地區", "雲林縣": "中部地區",
            "嘉義市": "南部地區", "嘉義縣": "南部地區", "臺南市": "南部地區", "高雄市": "南部地區", "屏東縣": "南部地區",
            "花蓮縣": "東部地區",
            "臺東縣": "東南部地區"
        }

        # 彙總各區預報
        for loc in locations:
            loc_name = loc["locationName"]
            region = region_mapping.get(loc_name)
            if not region:
                continue

            elements = {e["elementName"]: e["time"] for e in loc["weatherElement"]}
            min_times = elements.get("MinT", [])
            max_times = elements.get("MaxT", [])
            wx_times = elements.get("Wx", [])

            for i in range(min(len(min_times), len(max_times))):
                start_time = min_times[i]["startTime"][:10]
                min_t = float(min_times[i]["parameter"]["parameterName"])
                max_t = float(max_times[i]["parameter"]["parameterName"])
                wx = wx_times[i]["parameter"]["parameterName"] if i < len(wx_times) else "多雲"

                records.append({
                    "regionName": region,
                    "dataDate": start_time,
                    "minT": min_t,
                    "maxT": max_t,
                    "weather": wx
                })

        df_raw = pd.DataFrame(records)
        if df_raw.empty:
            return None

        # 單元 6 & 7: 提取氣溫與 Pandas 資料整理
        df_grouped = df_raw.groupby(["regionName", "dataDate"]).agg({
            "minT": "mean",
            "maxT": "mean",
            "weather": "first"
        }).reset_index()

        df_grouped["minT"] = df_grouped["minT"].round(1)
        df_grouped["maxT"] = df_grouped["maxT"].round(1)

        # 擴充為一週 7 天完整時間序列 (若 API 僅提供 36 小時)
        df_complete = extend_to_week_forecast(df_grouped)
        return df_complete

    except Exception as e:
        logger.warning(f"CWA API 連線或解析失敗: {e}，自動啟用高擬真資料產生器。")
        return None


def generate_mock_weather_data() -> pd.DataFrame:
    """
    單元 6 & 7: 建立完全相容 煥哥 課程範例的高擬真一週天氣資料表
    包含：北部地區、中部地區、南部地區、東北部地區、東部地區、東南部地區
    日期：當前日期起算連續 7 天
    欄位：regionName, dataDate, minT, maxT, weather
    """
    today = datetime.date.today()
    records = []

    # 7 天趨勢變化微調曲線
    trend_offsets = [0, 1.0, 1.5, 0.5, -1.0, 0.0, 0.5]
    weather_variations = {
        "北部地區": ["晴時多雲", "多雲時晴", "多雲", "多雲短暫雨", "晴朗", "多雲時晴", "晴時多雲"],
        "東北部地區": ["陰短暫雨", "短暫陣雨", "陰天", "多雲短暫雨", "陰天", "短暫雨", "多雲"],
        "中部地區": ["晴朗", "晴天", "晴朗炎熱", "多雲時晴", "午後雷陣雨", "晴天", "晴朗"],
        "南部地區": ["晴朗炎熱", "晴天", "晴時多雲", "多雲", "午後短暫雷陣雨", "晴朗", "晴朗炎熱"],
        "東部地區": ["多雲短暫雨", "陰時多雲", "多雲", "局部陣雨", "多雲時晴", "多雲短暫雨", "陰天"],
        "東南部地區": ["多雲", "晴時多雲", "多雲短暫陣雨", "多雲時晴", "多雲", "晴天", "多雲"],
    }

    for region in STANDARD_REGIONS:
        base = REGION_BASELINE[region]
        for day_idx in range(7):
            date_str = (today + datetime.timedelta(days=day_idx)).strftime("%Y-%m-%d")
            offset = trend_offsets[day_idx]
            min_t = round(base["minT"] + offset, 1)
            max_t = round(base["maxT"] + offset + (0.5 if day_idx % 2 == 0 else -0.5), 1)
            wx = weather_variations[region][day_idx]

            records.append({
                "regionName": region,
                "dataDate": date_str,
                "minT": min_t,
                "maxT": max_t,
                "weather": wx
            })

    df = pd.DataFrame(records)
    return df


def extend_to_week_forecast(df_existing: pd.DataFrame) -> pd.DataFrame:
    """
    確保各分區均有一週 (7天) 之預報記錄，若現有 API 僅回傳部分日期則自動擬真補全。
    """
    today = datetime.date.today()
    target_dates = [(today + datetime.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]

    all_records = []
    for region in STANDARD_REGIONS:
        base = REGION_BASELINE[region]
        for i, d_str in enumerate(target_dates):
            match = df_existing[(df_existing["regionName"] == region) & (df_existing["dataDate"] == d_str)]
            if not match.empty:
                all_records.append(match.iloc[0].to_dict())
            else:
                all_records.append({
                    "regionName": region,
                    "dataDate": d_str,
                    "minT": round(base["minT"] + (i % 3 - 1), 1),
                    "maxT": round(base["maxT"] + (i % 3 - 1), 1),
                    "weather": base["weather"]
                })

    return pd.DataFrame(all_records)


def get_weather_dataset(api_key: Optional[str] = None) -> pd.DataFrame:
    """
    整合入口函式：優先使用 CWA 實體 API，若未提供金鑰或呼叫失敗則平滑切換至擬真資料。
    """
    if api_key:
        df = fetch_cwa_weather_from_api(api_key)
        if df is not None and not df.empty:
            return df

    return generate_mock_weather_data()
