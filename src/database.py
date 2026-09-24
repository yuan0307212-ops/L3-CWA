"""
=============================================================================
煥哥 AI 創新微課程：Taiwan Weather Forecast
資料庫管理層：SQLite 資料庫設計、儲存、查詢驗證與 GIS GeoJSON 輸出
包含：
  1. TemperatureForecasts (分區預報表 - 煥哥課程相容)
  2. StationObservations (實體測站觀測表 - CWA 爬蟲資料持久化)
=============================================================================
"""

import os
import datetime
import sqlite3
from typing import List, Dict, Any, Optional
import pandas as pd

DEFAULT_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DEFAULT_DB_PATH = os.path.join(DEFAULT_DB_DIR, "data.db")


def get_db_connection(db_path: str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    """
    建立並回傳 SQLite 資料庫連線，若目錄不存在則自動建立
    """
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_database(db_path: str = DEFAULT_DB_PATH):
    """
    資料庫設計與資料表建立：
    1. TemperatureForecasts: 6大氣象分區一週預報表
    2. StationObservations: 中央氣象署全台實體氣象站即時觀測資料表
    """
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    # 1. 氣象分區預報表 (煥哥課程相容)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS TemperatureForecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regionName TEXT NOT NULL,
        dataDate TEXT NOT NULL,
        minT REAL NOT NULL,
        maxT REAL NOT NULL,
        weather TEXT DEFAULT '多雲',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(regionName, dataDate) ON CONFLICT REPLACE
    );
    """)

    # 2. 實體測站觀測資料表 (CWA 爬蟲最新觀測資料持久化)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS StationObservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_id TEXT NOT NULL,
        station_name TEXT NOT NULL,
        county_name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        temperature_c REAL NOT NULL,
        feels_like_c REAL NOT NULL,
        weather TEXT DEFAULT '晴時多雲',
        pop INTEGER DEFAULT 20,
        humidity INTEGER DEFAULT 65,
        wind_speed REAL DEFAULT 2.5,
        wind_dir TEXT DEFAULT '東北東',
        uv_index REAL DEFAULT 6.0,
        aqi INTEGER DEFAULT 40,
        pressure REAL DEFAULT 1012.5,
        obs_time TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(station_id, obs_time) ON CONFLICT REPLACE
    );
    """)

    conn.commit()
    conn.close()


def save_forecasts_to_db(df: pd.DataFrame, db_path: str = DEFAULT_DB_PATH) -> int:
    """
    將分區預報 DataFrame 儲存至 TemperatureForecasts
    """
    init_database(db_path)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    insert_sql = """
    INSERT INTO TemperatureForecasts (regionName, dataDate, minT, maxT, weather)
    VALUES (?, ?, ?, ?, ?);
    """

    count = 0
    for _, row in df.iterrows():
        cursor.execute(insert_sql, (
            row["regionName"],
            row["dataDate"],
            float(row["minT"]),
            float(row["maxT"]),
            row.get("weather", "多雲")
        ))
        count += 1

    conn.commit()
    conn.close()
    return count


def save_station_observations(records: List[Dict[str, Any]], db_path: str = DEFAULT_DB_PATH) -> int:
    """
    流程第 2 步：將中央氣象署爬蟲資料儲存至 SQLite 資料庫 StationObservations 表格
    """
    if not records:
        return 0

    init_database(db_path)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    insert_sql = """
    INSERT INTO StationObservations (
        station_id, station_name, county_name, lat, lng,
        temperature_c, feels_like_c, weather, pop, humidity,
        wind_speed, wind_dir, uv_index, aqi, pressure, obs_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """

    count = 0
    for r in records:
        cursor.execute(insert_sql, (
            str(r["station_id"]),
            str(r["station_name"]),
            str(r["county_name"]),
            float(r["lat"]),
            float(r["lng"]),
            float(r["temperature_c"]),
            float(r["feels_like_c"]),
            str(r.get("weather", "晴時多雲")),
            int(r.get("pop", 20)),
            int(r.get("humidity", 65)),
            float(r.get("wind_speed", 2.0)),
            str(r.get("wind_dir", "東北東")),
            float(r.get("uv_index", 6.0)),
            int(r.get("aqi", 40)),
            float(r.get("pressure", 1012.5)),
            str(r["obs_time"])
        ))
        count += 1

    conn.commit()
    conn.close()
    return count


def get_latest_station_observations(db_path: str = DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    """
    查詢每座測站最新的觀測資料
    """
    init_database(db_path)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    query = """
    SELECT station_id, station_name, county_name, lat, lng,
           temperature_c, feels_like_c, weather, pop, humidity,
           wind_speed, wind_dir, uv_index, aqi, pressure, obs_time
    FROM StationObservations
    WHERE id IN (
        SELECT MAX(id) FROM StationObservations GROUP BY station_id
    )
    ORDER BY temperature_c DESC;
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "station_id": r["station_id"],
            "station_name": r["station_name"],
            "county_name": r["county_name"],
            "lat": r["lat"],
            "lng": r["lng"],
            "temperature_c": r["temperature_c"],
            "feels_like_c": r["feels_like_c"],
            "weather": r["weather"],
            "pop": r["pop"],
            "humidity": r["humidity"],
            "wind_speed": r["wind_speed"],
            "wind_dir": r["wind_dir"],
            "uv_index": r["uv_index"],
            "aqi": r["aqi"],
            "pressure": r["pressure"],
            "obs_time": r["obs_time"]
        })
    return results


def get_station_geojson(db_path: str = DEFAULT_DB_PATH) -> Dict[str, Any]:
    """
    流程第 3 步：將測站資料轉換為標準 GeoJSON FeatureCollection 格式 (GIS 空間地理渲染專用)
    """
    stations = get_latest_station_observations(db_path)
    features = []

    for s in stations:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [s["lng"], s["lat"]]
            },
            "properties": {
                "station_id": s["station_id"],
                "station_name": s["station_name"],
                "county_name": s["county_name"],
                "temperature_c": s["temperature_c"],
                "feels_like_c": s["feels_like_c"],
                "weather": s["weather"],
                "pop": s["pop"],
                "humidity": s["humidity"],
                "wind_speed": s["wind_speed"],
                "wind_dir": s["wind_dir"],
                "uv_index": s["uv_index"],
                "aqi": s["aqi"],
                "pressure": s["pressure"],
                "obs_time": s["obs_time"]
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "metadata": {
            "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_stations": len(features),
            "unit": "Celsius (°C)"
        },
        "features": features
    }


def get_distinct_regions(db_path: str = DEFAULT_DB_PATH) -> List[str]:
    """
    查詢所有不重複的預報分區名稱
    """
    init_database(db_path)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT regionName FROM TemperatureForecasts ORDER BY id ASC;")
    rows = cursor.fetchall()
    conn.close()
    return [r[0] for r in rows]


def get_distinct_dates(db_path: str = DEFAULT_DB_PATH) -> List[str]:
    """
    查詢所有不重複的預報日期
    """
    init_database(db_path)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT dataDate FROM TemperatureForecasts ORDER BY dataDate ASC;")
    rows = cursor.fetchall()
    conn.close()
    return [r[0] for r in rows]


def get_forecast_by_region(region_name: str, db_path: str = DEFAULT_DB_PATH) -> pd.DataFrame:
    """
    從資料庫讀取指定地區的一週氣溫資料
    """
    init_database(db_path)
    conn = get_db_connection(db_path)
    query = """
    SELECT regionName, dataDate, minT, maxT, weather 
    FROM TemperatureForecasts 
    WHERE regionName = ? 
    ORDER BY dataDate ASC;
    """
    df = pd.read_sql_query(query, conn, params=(region_name,))
    conn.close()
    return df


def get_forecast_by_date(target_date: str, db_path: str = DEFAULT_DB_PATH) -> pd.DataFrame:
    """
    依日期查詢全台各地區預報
    """
    init_database(db_path)
    conn = get_db_connection(db_path)
    query = """
    SELECT regionName, dataDate, minT, maxT, weather, ROUND((minT + maxT) / 2.0, 1) AS avgT
    FROM TemperatureForecasts 
    WHERE dataDate = ? 
    ORDER BY regionName ASC;
    """
    df = pd.read_sql_query(query, conn, params=(target_date,))
    conn.close()
    return df


def get_all_forecasts(db_path: str = DEFAULT_DB_PATH) -> pd.DataFrame:
    """
    讀取資料庫全表資料
    """
    init_database(db_path)
    conn = get_db_connection(db_path)
    df = pd.read_sql_query("SELECT id, regionName, dataDate, minT, maxT, weather, updated_at FROM TemperatureForecasts ORDER BY dataDate ASC, id ASC;", conn)
    conn.close()
    return df
