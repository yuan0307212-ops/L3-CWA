"""
=============================================================================
煥哥 AI 創新微課程：Taiwan Weather Forecast
從氣象資料到互動式天氣預報應用 (CWA API × JSON × Python × SQLite × Streamlit)
=============================================================================
"""

import os
import streamlit as st
import pandas as pd
import altair as alt
from streamlit_folium import st_folium

from src.cwa_api import get_weather_dataset, STANDARD_REGIONS
from src.database import (
    init_database,
    save_forecasts_to_db,
    get_distinct_regions,
    get_distinct_dates,
    get_forecast_by_region,
    get_forecast_by_date,
    get_all_forecasts,
    DEFAULT_DB_PATH
)
from src.map_utils import create_taiwan_weather_map

# =============================================================================
# 單元 11: Streamlit 頁面基礎設定
# =============================================================================
st.set_page_config(
    page_title="Taiwan Weather Forecast | 煥哥 AI 創新微課程",
    page_icon="🌤️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 自訂高質感現代 CSS 樣式
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 0.2rem;
        letter-spacing: -0.02em;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #64748b;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(241,245,249,0.9));
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .badge-cwa {
        background: #0284c7;
        color: white;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 700;
    }
</style>
""", unsafe_allow_html=True)


# =============================================================================
# 單元 20: 資料庫初始啟動與自動備援檢查 (模組結構清晰、錯誤處理)
# =============================================================================
def ensure_database_ready():
    """
    確保 SQLite 資料庫已初始化並填入基礎天氣預報資料
    """
    if not os.path.exists(DEFAULT_DB_PATH):
        init_database()
        df_init = get_weather_dataset()
        save_forecasts_to_db(df_init)
    else:
        # 若資料表為空則自動補入
        existing = get_all_forecasts()
        if existing.empty:
            df_init = get_weather_dataset()
            save_forecasts_to_db(df_init)

ensure_database_ready()


# =============================================================================
# 單元 3 & 4: 側邊欄設定 (API Key 填入與資料更新按鈕)
# =============================================================================
with st.sidebar:
    st.image("https://opendata.cwa.gov.tw/dist/logo.png", width=180, caption="交通部中央氣象署")
    st.markdown("### 🛠️ 氣象資料同步設定")

    api_key_input = st.text_input(
        "中央氣象署 CWA API 授權碼",
        type="password",
        placeholder="CWA-XXXXXXXX...",
        help="登入中央氣象署氣象資料開放平臺取得免費授權碼。若未填寫，將使用高擬真預設資料庫。"
    )

    if st.button("🔄 立即從 CWA API 更新資料庫", use_container_width=True):
        with st.spinner("正在連線至中央氣象署並同步寫入 SQLite..."):
            df_new = get_weather_dataset(api_key_input.strip() if api_key_input else None)
            inserted_count = save_forecasts_to_db(df_new)
            st.success(f"成功更新 {inserted_count} 筆氣象預報至 SQLite (data.db)！")

    st.markdown("---")
    st.markdown("### 🎓 課程與架構說明")
    st.markdown("""
    - **課程**：煥哥 AI 創新微課程
    - **技術棧**：
      - CWA API (氣象資料)
      - JSON (資料交換)
      - Python (資料管線)
      - SQLite (關聯資料庫)
      - Streamlit (互動 Web App)
      - Folium (互動地圖)
    """)

    st.markdown("---")
    st.caption("AI for Learning • AI for a Better Taiwan")


# =============================================================================
# 主畫面標題與專案介紹
# =============================================================================
st.markdown('<div class="main-header">🌤️ Taiwan Weather Forecast</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-header">煥哥 AI 創新微課程 • 從氣象資料到互動式天氣預報應用 (CWA API × JSON × Python × SQLite × Streamlit)</div>',
    unsafe_allow_html=True
)

# 讀取可選地區清單
regions = get_distinct_regions()
if not regions:
    regions = STANDARD_REGIONS

# 讀取可選日期清單
dates = get_distinct_dates()
if not dates:
    dates = [pd.Timestamp.today().strftime("%Y-%m-%d")]


# =============================================================================
# 單元 13: 下拉選單選擇地區
# =============================================================================
col_control1, col_control2 = st.columns([1, 1])

with col_control1:
    selected_region = st.selectbox(
        "📍 選擇預報地區 (Select Region)",
        options=regions,
        index=0 if "北部地區" in regions else 0,
        help="單元 13: 透過互動式下拉選單動態切換氣象分區"
    )

with col_control2:
    selected_date = st.selectbox(
        "📅 選擇地圖觀測日期 (Select Date)",
        options=dates,
        index=0,
        help="單元 18: 選擇日期即時連動右下方台灣氣溫熱力分佈地圖"
    )


# =============================================================================
# 單元 12: 從資料庫讀取所選地區之資料
# =============================================================================
df_region = get_forecast_by_region(selected_region)

if not df_region.empty:
    today_row = df_region.iloc[0]
    
    # 醒目指標摘要列
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric(label=f"當前觀測分區", value=selected_region)
    with m2:
        st.metric(label="首日預測氣候", value=today_row.get("weather", "多雲"))
    with m3:
        st.metric(label="最低氣溫 (MinT)", value=f"{today_row['minT']} °C")
    with m4:
        st.metric(label="最高氣溫 (MaxT)", value=f"{today_row['maxT']} °C")

st.markdown("---")


# =============================================================================
# 單元 14 & 15 & 16: 繪製一週最高最低氣溫折線圖 + 資料表格
# =============================================================================
col_chart, col_table = st.columns([3, 2])

with col_chart:
    st.subheader(f"📈 {selected_region} 一週最高與最低氣溫走勢 (MinT / MaxT)")
    if not df_region.empty:
        # 重塑 DataFrame 格式以使用 Altair 繪製精美折線圖
        df_melted = df_region.melt(
            id_vars=["dataDate"],
            value_vars=["minT", "maxT"],
            var_name="溫度類型",
            value_name="氣溫"
        )
        df_melted["溫度類型"] = df_melted["溫度類型"].map({"minT": "最低溫 (MinT)", "maxT": "最高溫 (MaxT)"})

        chart = alt.Chart(df_melted).mark_line(point=True, strokeWidth=3).encode(
            x=alt.X("dataDate:N", title="預報日期", axis=alt.Axis(labelAngle=-25)),
            y=alt.Y("氣溫:Q", title="氣溫 (°C)", scale=alt.Scale(zero=False, padding=1)),
            color=alt.Color(
                "溫度類型:N",
                scale=alt.Scale(domain=["最低溫 (MinT)", "最高溫 (MaxT)"], range=["#3b82f6", "#ef4444"]),
                legend=alt.Legend(title="指標")
            ),
            tooltip=["dataDate", "溫度類型", "氣溫"]
        ).properties(height=340)

        st.altair_chart(chart, use_container_width=True)
    else:
        st.info("尚無該地區預報資料。")

with col_table:
    st.subheader(f"📋 {selected_region} 完整一週資料表格")
    if not df_region.empty:
        display_df = df_region.rename(columns={
            "dataDate": "日期 (Date)",
            "minT": "最低溫 (°C)",
            "maxT": "最高溫 (°C)",
            "weather": "天氣狀況"
        })[["日期 (Date)", "最低溫 (°C)", "最高溫 (°C)", "天氣狀況"]]
        st.dataframe(display_df, use_container_width=True, hide_index=True)
    else:
        st.info("尚無表格資料。")

st.markdown("---")


# =============================================================================
# 單元 17 & 18: 進階：台灣地圖視覺化 (Folium + Streamlit)
# =============================================================================
st.subheader(f"🗺️ 台灣分區氣象熱力互動地圖（觀測日期：{selected_date}）")
st.caption("單元 17~18: 點選各地區圓圈可查看詳細氣溫區間；顏色代表平均溫度：藍色(<20°C)、綠色(20-25°C)、橘色(25-30°C)、紅色(>30°C)")

df_date = get_forecast_by_date(selected_date)
if not df_date.empty:
    taiwan_map = create_taiwan_weather_map(df_date)
    st_folium(taiwan_map, width="100%", height=460)
else:
    st.info("該日期無地圖預報資料。")

st.markdown("---")


# =============================================================================
# 單元 9 & 10: SQLite 資料庫結構驗證與檢視器
# =============================================================================
with st.expander("🔍 資料庫底層檢視 (SQLite Inspection & SQL Query)"):
    st.markdown("""
    **資料表結構 (TemperatureForecasts)**：
    - `id` (INTEGER PRIMARY KEY)
    - `regionName` (TEXT)
    - `dataDate` (TEXT)
    - `minT` (REAL)
    - `maxT` (REAL)
    - `weather` (TEXT)
    - `updated_at` (TIMESTAMP)
    """)
    all_records = get_all_forecasts()
    st.write(f"目前資料庫中共有 **{len(all_records)}** 筆紀錄：")
    st.dataframe(all_records, use_container_width=True, hide_index=True)

st.markdown("""
<div style="text-align: center; color: #94a3b8; font-size: 0.85rem; margin-top: 2rem;">
    L3-CWA • 煥哥 AI 創新微課程實作成果 | 結合 Antigravity × Gemini × GitHub Vibe Coding
</div>
""", unsafe_allow_html=True)
