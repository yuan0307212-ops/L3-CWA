"""
=============================================================================
煥哥 AI 創新微課程：資料庫一鍵初始化腳本
執行此檔案可立即建立 data/data.db 並匯入預設 6 大氣象分區之 7 天預報資料
=============================================================================
"""

import os
import sys

# 將專案根目錄加入模組搜尋路徑
sys.path.append(os.path.dirname(__file__))

from src.cwa_api import get_weather_dataset
from src.database import init_database, save_forecasts_to_db, get_all_forecasts, DEFAULT_DB_PATH

def main():
    print(f"正在初始化資料庫：{DEFAULT_DB_PATH} ...")
    init_database()
    
    print("正在生成 6 大氣象分區一週氣溫資料...")
    df = get_weather_dataset()
    
    count = save_forecasts_to_db(df)
    print(f"✓ 成功寫入 {count} 筆預報紀錄至 SQLite 資料表 [TemperatureForecasts]！")
    
    records = get_all_forecasts()
    print(f"✓ 資料庫驗證：目前共有 {len(records)} 筆紀錄。")
    print("資料庫初始化完成！")

if __name__ == "__main__":
    main()
