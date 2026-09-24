"""
=============================================================================
煥哥 AI 創新微課程：Taiwan Weather Forecast
單元 17~19: Folium 台灣互動式天氣地圖視覺化
=============================================================================
"""

import folium
import pandas as pd

# 各氣象分區中心經緯度座標
REGION_COORDINATES = {
    "北部地區": (25.04, 121.55),
    "東北部地區": (24.75, 121.75),
    "中部地區": (24.15, 120.68),
    "南部地區": (22.85, 120.30),
    "東部地區": (23.98, 121.60),
    "東南部地區": (22.75, 121.15),
}


def get_temp_color(avg_temp: float) -> str:
    """
    單元 17: 根據平均氣溫對應色彩階層
    - 藍色: < 20°C (涼爽)
    - 綠色: 20 - 25°C (舒適)
    - 橘色: 25 - 30°C (微熱)
    - 紅色: > 30°C (炎熱)
    """
    if avg_temp < 20.0:
        return "#3b82f6"  # 藍色
    elif avg_temp <= 25.0:
        return "#10b981"  # 綠色
    elif avg_temp <= 30.0:
        return "#f59e0b"  # 橘色
    else:
        return "#ef4444"  # 紅色


def create_taiwan_weather_map(df_date_forecast: pd.DataFrame) -> folium.Map:
    """
    單元 17 & 18: 建立台灣各分區互動式氣象地圖
    標註圓形標記、平均氣溫色彩、氣候描述與彈出式詳細視窗 (Popup)
    """
    # 台灣中心點
    taiwan_center = [23.7, 121.0]
    m = folium.Map(
        location=taiwan_center,
        zoom_start=7,
        tiles="CartoDB positron",
        control_scale=True
    )

    # 疊加各地區氣候標記
    for _, row in df_date_forecast.iterrows():
        region = row["regionName"]
        coord = REGION_COORDINATES.get(region)
        if not coord:
            continue

        min_t = row["minT"]
        max_t = row["maxT"]
        avg_t = round((min_t + max_t) / 2.0, 1)
        weather = row.get("weather", "多雲")
        color = get_temp_color(avg_t)

        popup_html = f"""
        <div style="font-family: -apple-system, sans-serif; font-size: 13px; line-height: 1.6; min-width: 140px;">
            <b style="font-size: 15px; color: #1e293b;">{region}</b><br>
            <span style="color: #64748b;">天氣狀況:</span> <b>{weather}</b><br>
            <span style="color: #64748b;">氣溫區間:</span> <b>{min_t}°C ~ {max_t}°C</b><br>
            <span style="color: #64748b;">平均溫度:</span> <span style="color: {color}; font-weight: bold;">{avg_t}°C</span>
        </div>
        """

        # 圓形半透明底色光暈標記
        folium.CircleMarker(
            location=coord,
            radius=26,
            color=color,
            weight=3,
            fill=True,
            fill_color=color,
            fill_opacity=0.45,
            tooltip=f"{region}: {weather} {avg_t}°C (點擊查看詳情)",
            popup=folium.Popup(popup_html, max_width=250)
        ).add_to(m)

        # 文字氣溫標籤
        folium.Marker(
            location=coord,
            icon=folium.DivIcon(
                html=f"""
                <div style="
                    font-size: 12px;
                    font-weight: 800;
                    color: #0f172a;
                    background: rgba(255, 255, 255, 0.88);
                    border: 1px solid {color};
                    border-radius: 999px;
                    padding: 2px 6px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                    white-space: nowrap;
                    transform: translate(-50%, -50%);
                    text-align: center;
                ">
                    {region[:2]} {avg_t}°
                </div>
                """
            )
        ).add_to(m)

    # 注入圖例說明 (HTML Legend)
    legend_html = """
    <div style="
        position: fixed; 
        bottom: 25px; 
        left: 25px; 
        z-index: 999; 
        background-color: rgba(255, 255, 255, 0.92); 
        backdrop-filter: blur(8px);
        padding: 10px 14px; 
        border-radius: 8px; 
        border: 1px solid #cbd5e1;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-family: -apple-system, sans-serif;
        font-size: 12px;
        line-height: 1.6;
    ">
        <b style="color: #0f172a; font-size: 13px;">平均溫度色階</b><br>
        <span style="color:#3b82f6;">●</span> &lt; 20°C (涼爽)<br>
        <span style="color:#10b981;">●</span> 20 - 25°C (舒適)<br>
        <span style="color:#f59e0b;">●</span> 25 - 30°C (微熱)<br>
        <span style="color:#ef4444;">●</span> &gt; 30°C (炎熱)
    </div>
    """
    m.get_root().html.add_child(folium.Element(legend_html))

    return m
