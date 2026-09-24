"""
=============================================================================
中央氣象署 (CWA) 爬蟲與資料庫自動同步腳本 (Crawl & Save Pipeline)
流程步驟 1 ➔ 步驟 2：
1. 爬取中央氣象署實體氣象站最新資料
2. 存入 SQLite 資料庫 (data/data.db: StationObservations & TemperatureForecasts)
=============================================================================
"""

import os
import sys
import datetime

# 支援 Windows 主控台 UTF-8 輸出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# 將專案根目錄加入模組搜尋路徑
sys.path.append(os.path.dirname(__file__))

from src.cwa_crawler import crawl_cwa_station_observations
from src.cwa_api import get_weather_dataset
from src.database import (
    init_database,
    save_station_observations,
    save_forecasts_to_db,
    get_latest_station_observations,
    DEFAULT_DB_PATH
)

def main():
    print("=" * 70)
    print("中央氣象署 (CWA) 爬蟲 -> SQLite 資料庫自動同步管線")
    print(f"執行時間：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"資料庫路徑：{DEFAULT_DB_PATH}")
    print("=" * 70)

    # 1. 資料庫結構初始化
    print("\n[步驟 1/3] 初始化資料庫資料表結構...")
    init_database()
    print("[OK] 資料表 [StationObservations] 與 [TemperatureForecasts] 準備就緒。")

    # 2. 爬取中央氣象署實體測站資料並儲存
    print("\n[步驟 2/3] 執行中央氣象署實體測站爬蟲...")
    station_records = crawl_cwa_station_observations()
    print(f"[OK] 爬蟲擷取成功，獲得 {len(station_records)} 座中央氣象署測站觀測數據。")

    saved_count = save_station_observations(station_records)
    print(f"[OK] 成功寫入 {saved_count} 筆即時觀測數據至資料庫 [StationObservations] 表格！")

    # 3. 同步 6 大分區預報至資料庫 (保持課程資料相容)
    print("\n[步驟 3/3] 同步 6 大氣象分區一週氣溫預報...")
    df_forecasts = get_weather_dataset()
    forecast_count = save_forecasts_to_db(df_forecasts)
    print(f"[OK] 成功同步 {forecast_count} 筆分區預報紀錄至 [TemperatureForecasts] 表格！")

    # 驗證成果
    latest = get_latest_station_observations()
    print("\n" + "=" * 70)
    print(f"[完成] 爬蟲與資料庫儲存管線執行成功！目前最新測站數：{len(latest)}")
    if latest:
        highest = latest[0]
        lowest = latest[-1]
        print(f"全台最高溫測站：{highest['county_name']} {highest['station_name']} ({highest['temperature_c']}°C)")
        print(f"全台最低溫測站：{lowest['county_name']} {lowest['station_name']} ({lowest['temperature_c']}°C)")
    print("=" * 70)

if __name__ == "__main__":
    main()
