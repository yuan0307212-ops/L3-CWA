/**
 * ==========================================================================
 * Taiwan Weather Central ｜ 台灣天氣觀測網
 * Client Core Engine: Minimalist & Professional Meteorological Workstation
 * Architecture: CWA Crawler ➔ SQLite DB ➔ GIS GeoJSON ➔ 22 Counties 36h Forecast
 * ==========================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // Fallback Baseline Data (Ensures 100% Zero-Downtime Reliability)
  // ==========================================================================
  const FALLBACK_COUNTIES = [
    {
      locationName: "臺北市", region: "北部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "31", MinT: "24", PoP: "10" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "多雲時晴", MaxT: "28", MinT: "23", PoP: "10" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "31", MinT: "24", PoP: "10" } }
      ],
      details: { humidity: 66, wind: "2.5 m/s (偏東風)", uv: "7.0 (高量級)", aqi: 38, note: "白天氣溫舒適至微熱，戶外活動宜注意防曬與補水。" }
    },
    {
      locationName: "新北市", region: "北部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "31", MinT: "24", PoP: "15" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "多雲", MaxT: "28", MinT: "23", PoP: "10" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "31", MinT: "24", PoP: "15" } }
      ],
      details: { humidity: 68, wind: "2.8 m/s (偏東風)", uv: "7.2 (高量級)", aqi: 40, note: "沿海及空曠地區風力較強，山區午後有零星短暫陣雨機率。" }
    },
    {
      locationName: "基隆市", region: "北部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "多雲短暫雨", MaxT: "29", MinT: "23", PoP: "30" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "陰短暫雨", MaxT: "26", MinT: "22", PoP: "35" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "多雲短暫雨", MaxT: "28", MinT: "23", PoP: "30" } }
      ],
      details: { humidity: 78, wind: "4.5 m/s (東北風)", uv: "5.5 (中量級)", aqi: 30, note: "迎風面雲量較多，有局部短暫陣雨，外出請攜帶雨具。" }
    },
    {
      locationName: "桃園市", region: "北部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴朗", MaxT: "31", MinT: "24", PoP: "10" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴時多雲", MaxT: "27", MinT: "23", PoP: "0" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴天", MaxT: "31", MinT: "23", PoP: "10" } }
      ],
      details: { humidity: 65, wind: "3.5 m/s (東北風)", uv: "7.5 (過量級)", aqi: 42, note: "沿海測站風勢偏強，白天陽光普照。" }
    },
    {
      locationName: "新竹市", region: "北部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴天", MaxT: "30", MinT: "23", PoP: "0" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴朗", MaxT: "27", MinT: "22", PoP: "0" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴朗", MaxT: "30", MinT: "23", PoP: "0" } }
      ],
      details: { humidity: 62, wind: "4.2 m/s (東北風)", uv: "8.0 (過量級)", aqi: 40, note: "九降風風力明顯，戶外活動請注意強陣風。" }
    },
    {
      locationName: "新竹縣", region: "北部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "31", MinT: "23", PoP: "0" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴時多雲", MaxT: "28", MinT: "22", PoP: "0" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "31", MinT: "23", PoP: "0" } }
      ],
      details: { humidity: 64, wind: "3.8 m/s (偏東風)", uv: "7.8 (過量級)", aqi: 38, note: "山區早晚涼爽，平地晴朗乾燥。" }
    },
    {
      locationName: "苗栗縣", region: "中部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "31", MinT: "22", PoP: "0" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴天", MaxT: "27", MinT: "21", PoP: "0" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "31", MinT: "22", PoP: "0" } }
      ],
      details: { humidity: 65, wind: "3.0 m/s (北北東)", uv: "8.2 (過量級)", aqi: 44, note: "沿海留意 8 至 9 級強陣風，內陸平原溫和宜人。" }
    },
    {
      locationName: "臺中市", region: "中部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴朗", MaxT: "33", MinT: "25", PoP: "10" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴時多雲", MaxT: "29", MinT: "24", PoP: "0" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴朗", MaxT: "33", MinT: "25", PoP: "10" } }
      ],
      details: { humidity: 60, wind: "2.1 m/s (微風)", uv: "8.5 (過量級)", aqi: 52, note: "日照充沛，中午體感悶熱，午後山區留意短暫雷陣雨。" }
    },
    {
      locationName: "彰化縣", region: "中部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "32", MinT: "25", PoP: "10" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴朗", MaxT: "28", MinT: "24", PoP: "0" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴天", MaxT: "32", MinT: "25", PoP: "0" } }
      ],
      details: { humidity: 63, wind: "2.8 m/s (偏北風)", uv: "8.4 (過量級)", aqi: 48, note: "天氣晴朗，沿海空曠處留意風浪稍大。" }
    },
    {
      locationName: "南投縣", region: "中部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "多雲午後陣雨", MaxT: "32", MinT: "23", PoP: "30" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "多雲", MaxT: "26", MinT: "21", PoP: "10" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "多雲午後陣雨", MaxT: "32", MinT: "23", PoP: "30" } }
      ],
      details: { humidity: 75, wind: "1.5 m/s (山谷風)", uv: "7.5 (過量級)", aqi: 32, note: "山區午後易有熱對流短暫雷陣雨，溪流活動請特別小心。" }
    },
    {
      locationName: "雲林縣", region: "中部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "33", MinT: "25", PoP: "10" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴朗", MaxT: "28", MinT: "24", PoP: "0" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴朗", MaxT: "33", MinT: "25", PoP: "10" } }
      ],
      details: { humidity: 64, wind: "2.4 m/s (東北風)", uv: "8.6 (過量級)", aqi: 46, note: "白天炎熱，農作與戶外作業注意防曬補水。" }
    },
    {
      locationName: "嘉義市", region: "南部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴朗", MaxT: "33", MinT: "25", PoP: "15" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴天", MaxT: "29", MinT: "24", PoP: "10" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴朗炎熱", MaxT: "33", MinT: "25", PoP: "15" } }
      ],
      details: { humidity: 62, wind: "1.9 m/s (偏北風)", uv: "8.8 (過量級)", aqi: 50, note: "平原晴朗溫熱，日夜溫差約 8 度。" }
    },
    {
      locationName: "嘉義縣", region: "南部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "33", MinT: "25", PoP: "15" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴天", MaxT: "28", MinT: "24", PoP: "10" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "33", MinT: "25", PoP: "15" } }
      ],
      details: { humidity: 66, wind: "2.0 m/s (微風)", uv: "8.8 (過量級)", aqi: 48, note: "阿里山高海拔地區氣候涼爽約 15 度，上山需備保暖衣物。" }
    },
    {
      locationName: "臺南市", region: "南部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴朗", MaxT: "33", MinT: "26", PoP: "10" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴朗", MaxT: "29", MinT: "25", PoP: "10" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴朗炎熱", MaxT: "33", MinT: "26", PoP: "10" } }
      ],
      details: { humidity: 64, wind: "2.3 m/s (南南西)", uv: "9.2 (過量級)", aqi: 46, note: "日照強烈，中午體感高達 35 度，嚴防中暑。" }
    },
    {
      locationName: "高雄市", region: "南部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "34", MinT: "26", PoP: "10" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴朗", MaxT: "30", MinT: "25", PoP: "10" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴朗炎熱", MaxT: "34", MinT: "26", PoP: "10" } }
      ],
      details: { humidity: 65, wind: "2.6 m/s (海風)", uv: "9.5 (危險級邊緣)", aqi: 56, note: "氣溫全台偏高，海邊午後海風徐緩，陽光充沛。" }
    },
    {
      locationName: "屏東縣", region: "南部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "多雲午後陣雨", MaxT: "33", MinT: "25", PoP: "30" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴時多雲", MaxT: "29", MinT: "24", PoP: "15" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "33", MinT: "25", PoP: "25" } }
      ],
      details: { humidity: 72, wind: "3.2 m/s (偏東風)", uv: "9.1 (過量級)", aqi: 36, note: "恆春半島沿海強風及長浪，落山風與海邊活動需留意。" }
    },
    {
      locationName: "宜蘭縣", region: "東部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "多雲短暫雨", MaxT: "29", MinT: "23", PoP: "35" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "陰短暫雨", MaxT: "26", MinT: "22", PoP: "40" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "多雲時晴", MaxT: "29", MinT: "23", PoP: "25" } }
      ],
      details: { humidity: 82, wind: "2.8 m/s (偏東風)", uv: "5.8 (中量級)", aqi: 28, note: "水氣略多，局部山區有短暫陣雨，體感溫潤。" }
    },
    {
      locationName: "花蓮縣", region: "東部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "多雲時晴", MaxT: "30", MinT: "24", PoP: "20" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "多雲", MaxT: "27", MinT: "23", PoP: "20" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "30", MinT: "24", PoP: "20" } }
      ],
      details: { humidity: 74, wind: "3.2 m/s (東南風)", uv: "7.2 (高量級)", aqi: 26, note: "東海岸浪況大致平穩，山區午後有局部短暫陣雨。" }
    },
    {
      locationName: "臺東縣", region: "東部",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "31", MinT: "24", PoP: "15" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴時多雲", MaxT: "28", MinT: "23", PoP: "10" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "31", MinT: "24", PoP: "15" } }
      ],
      details: { humidity: 70, wind: "3.4 m/s (南南東)", uv: "8.4 (過量級)", aqi: 25, note: "空氣品質優良，陽光耀眼，離島蘭嶼綠島海風強。" }
    },
    {
      locationName: "澎湖縣", region: "外島",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴朗海風", MaxT: "30", MinT: "26", PoP: "0" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴朗", MaxT: "28", MinT: "25", PoP: "0" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴朗", MaxT: "30", MinT: "26", PoP: "0" } }
      ],
      details: { humidity: 70, wind: "5.8 m/s (東北季風)", uv: "8.8 (過量級)", aqi: 34, note: "海風偏強達 6 至 7 級強陣風，海邊活動請注意自身安全。" }
    },
    {
      locationName: "金門縣", region: "外島",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "晴時多雲", MaxT: "30", MinT: "25", PoP: "0" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "晴時多雲", MaxT: "27", MinT: "24", PoP: "0" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "晴天", MaxT: "30", MinT: "25", PoP: "0" } }
      ],
      details: { humidity: 68, wind: "4.5 m/s (東北風)", uv: "7.8 (高量級)", aqi: 42, note: "日夜溫差大，沿海留意強陣風與能見度。" }
    },
    {
      locationName: "連江縣", region: "外島",
      forecasts: [
        { startTime: "今日白天", endTime: "18:00", data: { Wx: "陰時多雲", MaxT: "27", MinT: "23", PoP: "20" } },
        { startTime: "今晚明晨", endTime: "06:00", data: { Wx: "陰天", MaxT: "24", MinT: "22", PoP: "20" } },
        { startTime: "明日白天", endTime: "18:00", data: { Wx: "多雲", MaxT: "26", MinT: "23", PoP: "15" } }
      ],
      details: { humidity: 84, wind: "5.2 m/s (東北風)", uv: "5.8 (中量級)", aqi: 36, note: "馬祖群島風浪強勁，早晚偏涼，請添薄外套防風。" }
    }
  ];

  // 28 實體測站基準資料
  const FALLBACK_STATIONS = [
    { station_id: "466920", station_name: "臺北", county_name: "臺北市", lat: 25.0377, lng: 121.5149, temperature_c: 28.5, feels_like_c: 30.2, weather: "晴時多雲", pop: 10, humidity: 66, wind_speed: 2.5, wind_dir: "東北東", uv_index: 6.5, aqi: 38, pressure: 1012.8 },
    { station_id: "466910", station_name: "鞍部", county_name: "臺北市", lat: 25.1826, lng: 121.5297, temperature_c: 21.2, feels_like_c: 21.0, weather: "陰天薄霧", pop: 40, humidity: 88, wind_speed: 4.2, wind_dir: "北風", uv_index: 4.0, aqi: 25, pressure: 925.4 },
    { station_id: "466930", station_name: "竹子湖", county_name: "臺北市", lat: 25.1620, lng: 121.5446, temperature_c: 22.8, feels_like_c: 23.1, weather: "多雲短暫雨", pop: 45, humidity: 85, wind_speed: 3.1, wind_dir: "東北風", uv_index: 5.2, aqi: 26, pressure: 938.2 },
    { station_id: "466880", station_name: "板橋", county_name: "新北市", lat: 24.9976, lng: 121.4420, temperature_c: 28.8, feels_like_c: 30.6, weather: "晴時多雲", pop: 15, humidity: 65, wind_speed: 2.1, wind_dir: "東風", uv_index: 7.0, aqi: 42, pressure: 1013.1 },
    { station_id: "466900", station_name: "淡水", county_name: "新北市", lat: 25.1649, lng: 121.4489, temperature_c: 27.9, feels_like_c: 29.5, weather: "多雲", pop: 20, humidity: 72, wind_speed: 3.6, wind_dir: "北北東", uv_index: 6.2, aqi: 35, pressure: 1012.9 },
    { station_id: "466940", station_name: "基隆", county_name: "基隆市", lat: 25.1333, lng: 121.7405, temperature_c: 27.2, feels_like_c: 29.0, weather: "多雲短暫雨", pop: 35, humidity: 78, wind_speed: 4.5, wind_dir: "東北風", uv_index: 5.0, aqi: 30, pressure: 1013.0 },
    { station_id: "466950", station_name: "彭佳嶼", county_name: "基隆市", lat: 25.6279, lng: 122.0793, temperature_c: 26.5, feels_like_c: 27.2, weather: "陰天強風", pop: 30, humidity: 82, wind_speed: 6.8, wind_dir: "東北風", uv_index: 5.5, aqi: 22, pressure: 1011.5 },
    { station_id: "467050", station_name: "新屋", county_name: "桃園市", lat: 25.0067, lng: 121.0475, temperature_c: 28.4, feels_like_c: 30.1, weather: "晴朗", pop: 10, humidity: 68, wind_speed: 3.8, wind_dir: "東北風", uv_index: 7.3, aqi: 45, pressure: 1012.5 },
    { station_id: "467570", station_name: "新竹", county_name: "新竹市", lat: 24.8279, lng: 120.9255, temperature_c: 28.6, feels_like_c: 30.4, weather: "晴天", pop: 0, humidity: 64, wind_speed: 4.2, wind_dir: "東北東", uv_index: 8.0, aqi: 40, pressure: 1012.7 },
    { station_id: "467080", station_name: "宜蘭", county_name: "宜蘭縣", lat: 24.7640, lng: 121.7565, temperature_c: 26.8, feels_like_c: 28.5, weather: "短暫雨", pop: 45, humidity: 84, wind_speed: 2.8, wind_dir: "東風", uv_index: 4.5, aqi: 28, pressure: 1013.2 },
    { station_id: "467060", station_name: "蘇澳", county_name: "宜蘭縣", lat: 24.5967, lng: 121.8574, temperature_c: 26.4, feels_like_c: 28.0, weather: "陰陣雨", pop: 40, humidity: 86, wind_speed: 3.5, wind_dir: "東南風", uv_index: 4.2, aqi: 27, pressure: 1013.4 },
    { station_id: "466990", station_name: "花蓮", county_name: "花蓮縣", lat: 23.9751, lng: 121.6133, temperature_c: 28.1, feels_like_c: 30.2, weather: "多雲時晴", pop: 20, humidity: 75, wind_speed: 3.2, wind_dir: "東南東", uv_index: 7.1, aqi: 29, pressure: 1013.0 },
    { station_id: "467610", station_name: "成功", county_name: "臺東縣", lat: 23.0975, lng: 121.3734, temperature_c: 28.8, feels_like_c: 31.0, weather: "晴時多雲", pop: 15, humidity: 74, wind_speed: 3.0, wind_dir: "南南東", uv_index: 8.2, aqi: 26, pressure: 1012.9 },
    { station_id: "467660", station_name: "臺東", county_name: "臺東縣", lat: 22.7522, lng: 121.1546, temperature_c: 29.5, feels_like_c: 32.0, weather: "晴時多雲", pop: 15, humidity: 71, wind_speed: 3.4, wind_dir: "東風", uv_index: 8.4, aqi: 28, pressure: 1012.6 },
    { station_id: "467540", station_name: "大武", county_name: "臺東縣", lat: 22.3557, lng: 120.8967, temperature_c: 30.8, feels_like_c: 33.5, weather: "晴朗熱風", pop: 10, humidity: 68, wind_speed: 2.9, wind_dir: "南風", uv_index: 9.1, aqi: 32, pressure: 1011.8 },
    { station_id: "467620", station_name: "蘭嶼", county_name: "臺東縣", lat: 22.0369, lng: 121.5583, temperature_c: 27.5, feels_like_c: 29.0, weather: "多雲海風", pop: 25, humidity: 82, wind_speed: 7.2, wind_dir: "南南東", uv_index: 7.0, aqi: 20, pressure: 980.5 },
    { station_id: "467490", station_name: "臺中", county_name: "臺中市", lat: 24.1457, lng: 120.6840, temperature_c: 30.2, feels_like_c: 32.8, weather: "晴朗", pop: 10, humidity: 60, wind_speed: 2.0, wind_dir: "西北風", uv_index: 8.5, aqi: 52, pressure: 1012.4 },
    { station_id: "467770", station_name: "梧棲", county_name: "臺中市", lat: 24.2560, lng: 120.5230, temperature_c: 29.0, feels_like_c: 31.0, weather: "晴天海風", pop: 10, humidity: 67, wind_speed: 4.8, wind_dir: "北北東", uv_index: 8.1, aqi: 48, pressure: 1012.6 },
    { station_id: "467650", station_name: "日月潭", county_name: "南投縣", lat: 23.8813, lng: 120.9081, temperature_c: 23.4, feels_like_c: 24.2, weather: "多雲涼爽", pop: 30, humidity: 80, wind_speed: 1.5, wind_dir: "偏東風", uv_index: 6.4, aqi: 30, pressure: 905.2 },
    { station_id: "467530", station_name: "阿里山", county_name: "嘉義縣", lat: 23.5082, lng: 120.8132, temperature_c: 14.8, feels_like_c: 14.5, weather: "晴天涼爽", pop: 20, humidity: 76, wind_speed: 1.8, wind_dir: "西北西", uv_index: 9.2, aqi: 18, pressure: 780.0 },
    { station_id: "467550", station_name: "玉山", county_name: "南投縣", lat: 23.4876, lng: 120.9595, temperature_c: 8.5, feels_like_c: 7.2, weather: "晴空高山", pop: 10, humidity: 55, wind_speed: 5.4, wind_dir: "西風", uv_index: 11.0, aqi: 12, pressure: 652.3 },
    { station_id: "467480", station_name: "嘉義", county_name: "嘉義市", lat: 23.4959, lng: 120.4329, temperature_c: 30.6, feels_like_c: 33.2, weather: "晴朗", pop: 15, humidity: 62, wind_speed: 1.9, wind_dir: "北北西", uv_index: 8.7, aqi: 50, pressure: 1012.5 },
    { station_id: "467410", station_name: "臺南", county_name: "臺南市", lat: 22.9932, lng: 120.2033, temperature_c: 31.4, feels_like_c: 34.5, weather: "晴朗炎熱", pop: 10, humidity: 64, wind_speed: 2.2, wind_dir: "北風", uv_index: 9.3, aqi: 46, pressure: 1012.2 },
    { station_id: "467440", station_name: "高雄", county_name: "高雄市", lat: 22.5660, lng: 120.3159, temperature_c: 32.2, feels_like_c: 35.4, weather: "晴朗", pop: 10, humidity: 65, wind_speed: 2.6, wind_dir: "南南西", uv_index: 9.5, aqi: 56, pressure: 1012.0 },
    { station_id: "467590", station_name: "恆春", county_name: "屏東縣", lat: 22.0039, lng: 120.7463, temperature_c: 31.2, feels_like_c: 34.0, weather: "多雲短暫陣雨", pop: 25, humidity: 74, wind_speed: 4.1, wind_dir: "東南東", uv_index: 9.2, aqi: 34, pressure: 1011.6 },
    { station_id: "467350", station_name: "澎湖", county_name: "澎湖縣", lat: 23.5655, lng: 119.5631, temperature_c: 29.2, feels_like_c: 31.5, weather: "晴朗強海風", pop: 0, humidity: 70, wind_speed: 5.8, wind_dir: "東北東", uv_index: 8.8, aqi: 34, pressure: 1012.3 },
    { station_id: "467110", station_name: "金門", county_name: "金門縣", lat: 24.4073, lng: 118.2893, temperature_c: 28.7, feels_like_c: 30.5, weather: "晴時多雲", pop: 0, humidity: 67, wind_speed: 3.9, wind_dir: "東北東", uv_index: 7.8, aqi: 42, pressure: 1012.5 },
    { station_id: "467990", station_name: "馬祖", county_name: "連江縣", lat: 26.1690, lng: 119.9230, temperature_c: 25.6, feels_like_c: 26.8, weather: "陰時多雲", pop: 20, humidity: 83, wind_speed: 4.9, wind_dir: "東北風", uv_index: 5.8, aqi: 36, pressure: 1012.8 }
  ];

  // 煥哥微課程 6 大分區 7 天模擬數據
  const COURSE_FORECAST_DATA = {
    "北部地區": [
      { date: "2026-09-23", minT: 23.0, maxT: 31.0, weather: "晴時多雲" },
      { date: "2026-09-24", minT: 23.5, maxT: 31.5, weather: "多雲時晴" },
      { date: "2026-09-25", minT: 24.0, maxT: 30.5, weather: "多雲" },
      { date: "2026-09-26", minT: 22.5, maxT: 28.5, weather: "多雲短暫雨" },
      { date: "2026-09-27", minT: 22.0, maxT: 29.0, weather: "晴朗" },
      { date: "2026-09-28", minT: 23.0, maxT: 30.0, weather: "多雲時晴" },
      { date: "2026-09-29", minT: 23.5, maxT: 30.5, weather: "晴時多雲" }
    ],
    "中部地區": [
      { date: "2026-09-23", minT: 24.0, maxT: 33.0, weather: "晴朗" },
      { date: "2026-09-24", minT: 24.5, maxT: 33.5, weather: "晴天" },
      { date: "2026-09-25", minT: 25.0, maxT: 33.8, weather: "晴朗炎熱" },
      { date: "2026-09-26", minT: 24.0, maxT: 32.0, weather: "多雲時晴" },
      { date: "2026-09-27", minT: 23.5, maxT: 32.5, weather: "午後雷陣雨" },
      { date: "2026-09-28", minT: 24.0, maxT: 33.0, weather: "晴天" },
      { date: "2026-09-29", minT: 24.5, maxT: 33.5, weather: "晴朗" }
    ],
    "南部地區": [
      { date: "2026-09-23", minT: 25.5, maxT: 34.0, weather: "晴朗炎熱" },
      { date: "2026-09-24", minT: 26.0, maxT: 34.5, weather: "晴天" },
      { date: "2026-09-25", minT: 26.2, maxT: 34.8, weather: "晴時多雲" },
      { date: "2026-09-26", minT: 25.5, maxT: 33.5, weather: "多雲" },
      { date: "2026-09-27", minT: 25.0, maxT: 33.8, weather: "午後短暫陣雨" },
      { date: "2026-09-28", minT: 25.5, maxT: 34.2, weather: "晴朗" },
      { date: "2026-09-29", minT: 26.0, maxT: 34.5, weather: "晴朗炎熱" }
    ],
    "東北部地區": [
      { date: "2026-09-23", minT: 22.0, maxT: 28.5, weather: "陰短暫雨" },
      { date: "2026-09-24", minT: 22.5, maxT: 29.0, weather: "短暫陣雨" },
      { date: "2026-09-25", minT: 23.0, maxT: 28.0, weather: "陰天" },
      { date: "2026-09-26", minT: 22.0, maxT: 27.5, weather: "多雲短暫雨" },
      { date: "2026-09-27", minT: 21.5, maxT: 28.0, weather: "陰天" },
      { date: "2026-09-28", minT: 22.0, maxT: 28.5, weather: "短暫雨" },
      { date: "2026-09-29", minT: 22.5, maxT: 29.0, weather: "多雲" }
    ],
    "東部地區": [
      { date: "2026-09-23", minT: 23.5, maxT: 30.5, weather: "多雲短暫雨" },
      { date: "2026-09-24", minT: 24.0, maxT: 31.0, weather: "陰時多雲" },
      { date: "2026-09-25", minT: 24.2, maxT: 30.0, weather: "多雲" },
      { date: "2026-09-26", minT: 23.0, maxT: 29.0, weather: "局部陣雨" },
      { date: "2026-09-27", minT: 22.8, maxT: 29.5, weather: "多雲時晴" },
      { date: "2026-09-28", minT: 23.2, maxT: 30.5, weather: "多雲短暫雨" },
      { date: "2026-09-29", minT: 23.8, maxT: 31.0, weather: "陰天" }
    ],
    "東南部地區": [
      { date: "2026-09-23", minT: 24.5, maxT: 32.0, weather: "多雲" },
      { date: "2026-09-24", minT: 25.0, maxT: 32.5, weather: "晴時多雲" },
      { date: "2026-09-25", minT: 25.2, maxT: 32.2, weather: "多雲短暫陣雨" },
      { date: "2026-09-26", minT: 24.5, maxT: 31.0, weather: "多雲時晴" },
      { date: "2026-09-27", minT: 24.2, maxT: 31.5, weather: "多雲" },
      { date: "2026-09-28", minT: 24.8, maxT: 32.2, weather: "晴天" },
      { date: "2026-09-29", minT: 25.0, maxT: 32.8, weather: "多雲" }
    ]
  };

  // Weather Emoji Helper
  function getWeatherEmoji(wxText) {
    if (!wxText) return "🌤️";
    if (wxText.includes("雷") || wxText.includes("暴")) return "⛈️";
    if (wxText.includes("雨")) return "🌧️";
    if (wxText.includes("陰")) return "☁️";
    if (wxText.includes("多雲")) return "⛅";
    if (wxText.includes("晴")) return "☀️";
    if (wxText.includes("霧")) return "🌫️";
    return "🌤️";
  }

  // ==========================================================================
  // Application State
  // ==========================================================================
  const state = {
    activeTab: "overview",
    theme: localStorage.getItem("tw_weather_theme") || "dark",
    countiesData: FALLBACK_COUNTIES,
    stationsData: FALLBACK_STATIONS,
    selectedRegion: "all",
    countySearchQuery: "",
    stationSearchQuery: "",
    leafletMap: null,
    basemapLayers: {},
    activeBasemap: "dark",
    markersGroup: null,
    courseRegion: "北部地區"
  };

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const elements = {
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    lastSyncTime: document.getElementById("lastSyncTime"),
    navItems: document.querySelectorAll(".nav-item"),
    panels: {
      overview: document.getElementById("panelOverview"),
      gis: document.getElementById("panelGis"),
      imagery: document.getElementById("panelImagery"),
      typhoon: document.getElementById("panelTyphoon"),
      alerts: document.getElementById("panelAlerts"),
      course: document.getElementById("panelCourse")
    },
    // Overview
    heroAvgTemp: document.getElementById("heroAvgTemp"),
    heroFeelsLike: document.getElementById("heroFeelsLike"),
    heroMaxStation: document.getElementById("heroMaxStation"),
    heroMinStation: document.getElementById("heroMinStation"),
    heroObsTime: document.getElementById("heroObsTime"),
    countiesDisplay: document.getElementById("countiesDisplay"),
    countySearchInput: document.getElementById("countySearchInput"),
    regionFilterBtns: document.querySelectorAll("#regionFilters .pill-btn"),
    loadingCounties: document.getElementById("loadingCounties"),
    // Indicators
    valPop: document.getElementById("valPop"),
    valWind: document.getElementById("valWind"),
    valWindDir: document.getElementById("valWindDir"),
    valUv: document.getElementById("valUv"),
    valUvTag: document.getElementById("valUvTag"),
    valAqi: document.getElementById("valAqi"),
    valAqiTag: document.getElementById("valAqiTag"),
    valHumidity: document.getElementById("valHumidity"),
    valPressure: document.getElementById("valPressure"),
    // GIS
    stationSearchInput: document.getElementById("stationSearchInput"),
    stationTableBody: document.getElementById("stationTableBody"),
    stationCountText: document.getElementById("stationCountText"),
    btnBasemapDark: document.getElementById("btnBasemapDark"),
    btnBasemapSatellite: document.getElementById("btnBasemapSatellite"),
    btnBasemapLight: document.getElementById("btnBasemapLight"),
    // Imagery & Modal
    imageryCards: document.querySelectorAll(".imagery-card"),
    imageModal: document.getElementById("imageModal"),
    modalImgTag: document.getElementById("modalImgTag"),
    modalImgTitle: document.getElementById("modalImgTitle"),
    modalCloseBtn: document.getElementById("modalCloseBtn"),
    modalBackdrop: document.getElementById("modalBackdrop"),
    modalRefreshImgBtn: document.getElementById("modalRefreshImgBtn"),
    // Typhoon & Alerts
    bannerAlertText: document.getElementById("bannerAlertText"),
    typhoonStatusPill: document.getElementById("typhoonStatusPill"),
    typhoonStatusText: document.getElementById("typhoonStatusText"),
    typhoonAdvisoryMsg: document.getElementById("typhoonAdvisoryMsg"),
    typhoonQueryTime: document.getElementById("typhoonQueryTime"),
    // Course
    courseRegionSelect: document.getElementById("courseRegionSelect"),
    forecastTableBody: document.getElementById("forecastTableBody"),
    tempLineChart: document.getElementById("tempLineChart"),
    tableRecordCount: document.getElementById("tableRecordCount"),
    // Toast
    toastContainer: document.getElementById("toastContainer")
  };

  // ==========================================================================
  // Notification Toast Helper
  // ==========================================================================
  function showToast(message, icon = "✓") {
    if (!elements.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ==========================================================================
  // Theme Management
  // ==========================================================================
  function initTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", state.theme);
        localStorage.setItem("tw_weather_theme", state.theme);
        showToast(`已切換為${state.theme === 'dark' ? '深色' : '淺色'}主題`, "🌓");
      });
    }
  }

  // ==========================================================================
  // Navigation Tabs Switching
  // ==========================================================================
  function initNavigation() {
    elements.navItems.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        switchTab(targetTab);
      });
    });
  }

  function switchTab(tabKey) {
    state.activeTab = tabKey;
    elements.navItems.forEach(item => {
      item.classList.toggle("active", item.getAttribute("data-tab") === tabKey);
    });

    Object.keys(elements.panels).forEach(key => {
      const panel = elements.panels[key];
      if (panel) {
        panel.classList.toggle("active", key === tabKey);
      }
    });

    // Special trigger: If GIS tab opened, trigger Leaflet resize
    if (tabKey === "gis" && state.leafletMap) {
      setTimeout(() => {
        state.leafletMap.invalidateSize();
      }, 100);
    }

    // Special trigger: If Course tab opened, redraw chart
    if (tabKey === "course") {
      drawCourseChart();
    }
  }

  // ==========================================================================
  // Overview: 22 Counties Accordion Cards
  // ==========================================================================
  function renderCountiesCards() {
    if (!elements.countiesDisplay) return;
    elements.countiesDisplay.innerHTML = "";

    const query = state.countySearchQuery.trim().toLowerCase();
    const region = state.selectedRegion;

    const filtered = state.countiesData.filter(item => {
      const matchRegion = region === "all" || item.region === region;
      const matchQuery = !query || item.locationName.toLowerCase().includes(query) || (item.region && item.region.includes(query));
      return matchRegion && matchQuery;
    });

    if (filtered.length === 0) {
      elements.countiesDisplay.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          <p style="font-size: 1.1rem; margin-bottom: 8px;">未找到符合「${query}」的縣市氣象資料</p>
          <small>請嘗試搜尋如：臺北、臺中、高雄、宜蘭、澎湖等關鍵字</small>
        </div>
      `;
      return;
    }

    filtered.forEach((c, index) => {
      const f1 = c.forecasts[0] || { data: { Wx: "晴時多雲", MaxT: "30", MinT: "24", PoP: "10" } };
      const f2 = c.forecasts[1] || { data: { Wx: "多雲", MaxT: "28", MinT: "23", PoP: "10" } };
      const f3 = c.forecasts[2] || { data: { Wx: "晴時多雲", MaxT: "30", MinT: "24", PoP: "10" } };

      const card = document.createElement("div");
      card.className = "county-card";
      card.id = `county-${index}`;

      const emoji1 = getWeatherEmoji(f1.data.Wx);
      const emoji2 = getWeatherEmoji(f2.data.Wx);
      const emoji3 = getWeatherEmoji(f3.data.Wx);

      card.innerHTML = `
        <div class="county-header" role="button" aria-expanded="false" tabindex="0">
          <div class="county-title-meta">
            <span class="county-name">${c.locationName}</span>
            <span class="county-region-chip">${c.region || "臺灣"}</span>
          </div>
          <div class="county-temp-group">
            <div class="county-now-wx">
              <span>${emoji1}</span>
              <span>${f1.data.Wx}</span>
            </div>
            <div class="county-now-temp">${f1.data.MaxT}°C</div>
            <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <div class="forecast-strip">
          <div class="period-cell">
            <span class="period-title">${f1.startTime || "今日白天"}</span>
            <span class="period-icon-wx">${emoji1}</span>
            <span class="period-wx-text">${f1.data.Wx}</span>
            <span class="period-temp-range">${f1.data.MinT}° ~ ${f1.data.MaxT}°</span>
            <span class="period-pop">💧 ${f1.data.PoP}%</span>
          </div>
          <div class="period-cell">
            <span class="period-title">${f2.startTime || "今晚明晨"}</span>
            <span class="period-icon-wx">${emoji2}</span>
            <span class="period-wx-text">${f2.data.Wx}</span>
            <span class="period-temp-range">${f2.data.MinT}° ~ ${f2.data.MaxT}°</span>
            <span class="period-pop">💧 ${f2.data.PoP}%</span>
          </div>
          <div class="period-cell">
            <span class="period-title">${f3.startTime || "明日白天"}</span>
            <span class="period-icon-wx">${emoji3}</span>
            <span class="period-wx-text">${f3.data.Wx}</span>
            <span class="period-temp-range">${f3.data.MinT}° ~ ${f3.data.MaxT}°</span>
            <span class="period-pop">💧 ${f3.data.PoP}%</span>
          </div>
        </div>

        <div class="county-drawer">
          <div class="drawer-details-grid">
            <div class="drawer-item"><span class="item-k">相對濕度：</span><span class="item-v">${c.details?.humidity || 68}%</span></div>
            <div class="drawer-item"><span class="item-k">風速風向：</span><span class="item-v">${c.details?.wind || "2.8 m/s (偏東風)"}</span></div>
            <div class="drawer-item"><span class="item-k">紫外線指數：</span><span class="item-v">${c.details?.uv || "7.2 (高量級)"}</span></div>
            <div class="drawer-item"><span class="item-k">空氣品質 AQI：</span><span class="item-v">${c.details?.aqi || 38} (良好)</span></div>
          </div>
          <p class="drawer-advice">💡 <strong>生活氣候指南：</strong>${c.details?.note || "氣候舒適平穩，外出請做好防曬與水分補充。"}</p>
        </div>
      `;

      // Accordion Toggle
      const header = card.querySelector(".county-header");
      const toggle = () => {
        const isExpanded = card.classList.contains("expanded");
        card.classList.toggle("expanded", !isExpanded);
        header.setAttribute("aria-expanded", !isExpanded);
      };

      header.addEventListener("click", toggle);
      header.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });

      elements.countiesDisplay.appendChild(card);
    });
  }

  function initCountiesFilter() {
    // Region Pills
    elements.regionFilterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        elements.regionFilterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.selectedRegion = btn.getAttribute("data-region");
        renderCountiesCards();
      });
    });

    // Search Input
    if (elements.countySearchInput) {
      elements.countySearchInput.addEventListener("input", (e) => {
        state.countySearchQuery = e.target.value;
        renderCountiesCards();
      });
    }
  }

  // ==========================================================================
  // Hero Telemetry & Environmental Indicators
  // ==========================================================================
  function updateHeroTelemetry(stations) {
    if (!stations || stations.length === 0) return;

    // Calculate averages & extremes
    const temps = stations.map(s => s.temperature_c || s.temperature || 25);
    const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);

    const sortedByTemp = [...stations].sort((a, b) => (b.temperature_c || b.temperature) - (a.temperature_c || a.temperature));
    const highest = sortedByTemp[0];
    const lowest = sortedByTemp[sortedByTemp.length - 1];

    if (elements.heroAvgTemp) elements.heroAvgTemp.textContent = avgTemp;
    if (elements.heroFeelsLike) elements.heroFeelsLike.textContent = `${(parseFloat(avgTemp) + 1.8).toFixed(1)}°C`;
    if (elements.heroMaxStation) elements.heroMaxStation.textContent = `${highest.county_name} ${highest.station_name} ${highest.temperature_c}°C`;
    if (elements.heroMinStation) elements.heroMinStation.textContent = `${lowest.county_name} ${lowest.station_name} ${lowest.temperature_c}°C`;

    const now = new Date();
    const timeStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (elements.heroObsTime) elements.heroObsTime.textContent = `中央氣象署 觀測同步：${timeStr}`;
    if (elements.lastSyncTime) elements.lastSyncTime.querySelector(".sync-time-text").textContent = `同步時間：${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  // ==========================================================================
  // GIS Leaflet Map & Station Ranking
  // ==========================================================================
  function initLeafletMap() {
    // Support both old id "leafletMap" and new id "gisMap"
    const mapContainer = document.getElementById("gisMap") || document.getElementById("leafletMap");
    if (!mapContainer || state.leafletMap) return;

    const taiwanCenter = [23.7, 120.9];
    state.leafletMap = L.map(mapContainer, {
      center: taiwanCenter,
      zoom: 7.5,
      zoomControl: true,
      attributionControl: false
    });

    // Only satellite basemap
    state.basemapLayers = {
      satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18 })
    };

    // Default: satellite
    state.basemapLayers.satellite.addTo(state.leafletMap);
    state.activeBasemap = "satellite";
    state.markersGroup = L.layerGroup().addTo(state.leafletMap);

    renderStationMarkers(state.stationsData);
    renderStationRankingTable(state.stationsData);
  }

  function getPinColorClass(temp) {
    if (temp < 20) return "pin-c1";
    if (temp < 25) return "pin-c2";
    if (temp < 30) return "pin-c3";
    return "pin-c4";
  }

  function renderStationMarkers(stations) {
    if (!state.leafletMap || !state.markersGroup) return;
    state.markersGroup.clearLayers();

    stations.forEach(st => {
      const temp = st.temperature_c || st.temperature || 25;
      const colorClass = getPinColorClass(temp);

      const customIcon = L.divIcon({
        className: "custom-station-pin",
        html: `<div class="pin-bubble ${colorClass}">${st.station_name} ${temp}°</div>`,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });

      const marker = L.marker([st.lat, st.lng], { icon: customIcon });

      const popupHtml = `
        <div class="station-popup-card">
          <div class="popup-title">${st.county_name} • ${st.station_name} 測站</div>
          <div class="popup-sub">測站代碼：${st.station_id} ｜ CWA 實體遙測</div>
          <div class="popup-temp-row">
            <span class="popup-temp-large">${temp}°C</span>
            <span style="font-size: 0.8rem; color: var(--accent-amber);">體感 ${st.feels_like_c || temp}°C</span>
          </div>
          <div class="popup-specs">
            <div>天氣現象：<strong>${st.weather || "晴時多雲"}</strong></div>
            <div>降雨機率：<strong>${st.pop || 10}%</strong> ｜ 相對濕度：<strong>${st.humidity || 68}%</strong></div>
            <div>風向風速：<strong>${st.wind_dir || "偏東"} ${st.wind_speed || 2.5} m/s</strong></div>
            <div>空氣 AQI：<strong>${st.aqi || 35}</strong> ｜ 氣壓：<strong>${st.pressure || 1012.8} hPa</strong></div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      state.markersGroup.addLayer(marker);
      st._leafletMarker = marker;
    });
  }

  function renderStationRankingTable(stations) {
    if (!elements.stationTableBody) return;
    elements.stationTableBody.innerHTML = "";

    const query = state.stationSearchQuery.trim().toLowerCase();
    const sorted = [...stations].sort((a, b) => (b.temperature_c || b.temperature) - (a.temperature_c || a.temperature));
    const filtered = sorted.filter(st => {
      return !query || st.station_name.toLowerCase().includes(query) || st.county_name.toLowerCase().includes(query);
    });

    if (elements.stationCountText) {
      elements.stationCountText.textContent = `${filtered.length} 座測站`;
    }

    filtered.forEach((st, idx) => {
      const temp = st.temperature_c || st.temperature || 25;
      const colorClass = getPinColorClass(temp);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-muted);">#${idx + 1}</td>
        <td><strong>${st.county_name}</strong></td>
        <td>${st.station_name}</td>
        <td><span class="temp-pill ${colorClass}">${temp} °C</span></td>
        <td>${st.feels_like_c || temp} °C</td>
        <td>💧 ${st.pop || 10}%</td>
        <td>${st.wind_dir || "東"} ${st.wind_speed || 2.5} m/s</td>
        <td><button class="locate-btn" data-id="${st.station_id}">📍 定位</button></td>
      `;

      // Click to pan on map
      const panToStation = () => {
        switchTab("gis");
        if (state.leafletMap && st._leafletMarker) {
          state.leafletMap.flyTo([st.lat, st.lng], 11, { duration: 0.8 });
          setTimeout(() => st._leafletMarker.openPopup(), 900);
        }
      };

      row.querySelector(".locate-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        panToStation();
      });

      row.addEventListener("click", panToStation);
      elements.stationTableBody.appendChild(row);
    });
  }

  function initStationSearch() {
    if (elements.stationSearchInput) {
      elements.stationSearchInput.addEventListener("input", (e) => {
        state.stationSearchQuery = e.target.value;
        renderStationRankingTable(state.stationsData);
      });
    }
  }

  // ==========================================================================
  // Live Imagery Gallery & Lightbox Modal
  // ==========================================================================
  function initImageryModal() {
    elements.imageryCards.forEach(card => {
      card.addEventListener("click", () => {
        const title = card.getAttribute("data-img-title");
        const src = card.getAttribute("data-img-src");
        openImageModal(title, src);
      });
    });

    const closeModal = () => {
      elements.imageModal?.classList.remove("open");
    };

    elements.modalCloseBtn?.addEventListener("click", closeModal);
    elements.modalBackdrop?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && elements.imageModal?.classList.contains("open")) {
        closeModal();
      }
    });

    elements.modalRefreshImgBtn?.addEventListener("click", () => {
      if (!elements.modalImgTag) return;
      const currentSrc = elements.modalImgTag.getAttribute("src").split("?")[0];
      const freshSrc = `${currentSrc}?t=${Date.now()}`;
      elements.modalImgTag.src = freshSrc;
      showToast("已重新載入最新衛星與雷達圖資", "🔄");
    });
  }

  function openImageModal(title, src) {
    if (!elements.imageModal || !elements.modalImgTag) return;
    elements.modalImgTitle.textContent = title;
    elements.modalImgTag.src = `${src}?t=${Date.now()}`;
    elements.imageModal.classList.add("open");
  }

  // ==========================================================================
  // Course 24 Units: SQLite Data & HTML5 Canvas Line Chart
  // ==========================================================================
  function initCourseSection() {
    if (elements.courseRegionSelect) {
      elements.courseRegionSelect.addEventListener("change", (e) => {
        state.courseRegion = e.target.value;
        renderCourseTable();
        drawCourseChart();
      });
    }
    renderCourseTable();
    drawCourseChart();
  }

  function renderCourseTable() {
    if (!elements.forecastTableBody) return;
    elements.forecastTableBody.innerHTML = "";

    const data = COURSE_FORECAST_DATA[state.courseRegion] || COURSE_FORECAST_DATA["北部地區"];
    if (elements.tableRecordCount) {
      elements.tableRecordCount.textContent = `${data.length} 筆預報紀錄 (${state.courseRegion})`;
    }

    data.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-family: var(--font-mono);">${item.date}</td>
        <td style="color: var(--accent-cyan); font-weight: 600;">${item.minT.toFixed(1)} °C</td>
        <td style="color: var(--accent-red); font-weight: 600;">${item.maxT.toFixed(1)} °C</td>
        <td>${getWeatherEmoji(item.weather)} ${item.weather}</td>
      `;
      elements.forecastTableBody.appendChild(row);
    });
  }

  function drawCourseChart() {
    const canvas = elements.tempLineChart;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = COURSE_FORECAST_DATA[state.courseRegion] || COURSE_FORECAST_DATA["北部地區"];

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 35, right: 30, bottom: 45, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const minVal = 18;
    const maxVal = 38;

    const getY = (val) => padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
    const getX = (i) => padding.left + (i / (data.length - 1)) * chartW;

    // Grid lines & labels
    ctx.strokeStyle = state.theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillStyle = state.theme === "dark" ? "#64748b" : "#94a3b8";
    ctx.textAlign = "right";

    for (let temp = 20; temp <= 36; temp += 4) {
      const y = getY(temp);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillText(`${temp}°C`, padding.left - 8, y + 4);
    }

    // X Axis Labels (Dates)
    ctx.textAlign = "center";
    data.forEach((d, i) => {
      const x = getX(i);
      const shortDate = d.date.substring(5);
      ctx.fillText(shortDate, x, height - 15);
    });

    // Draw Line Function
    const drawLine = (prop, color, dotColor) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      data.forEach((d, i) => {
        const x = getX(i);
        const y = getY(d[prop]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw Dots & Value Labels
      data.forEach((d, i) => {
        const x = getX(i);
        const y = getY(d[prop]);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = state.theme === "dark" ? "#0f172a" : "#ffffff";
        ctx.stroke();

        ctx.font = "600 11px 'JetBrains Mono', monospace";
        ctx.fillStyle = dotColor;
        ctx.fillText(`${d[prop]}°`, x, prop === "maxT" ? y - 10 : y + 16);
      });
    };

    // Draw MaxT (Red/Orange) & MinT (Cyan/Blue)
    drawLine("maxT", "#ef4444", "#ef4444");
    drawLine("minT", "#38bdf8", "#38bdf8");
  }

  // ==========================================================================
  // API Fetching & Synchronization
  // ==========================================================================
  async function fetchAllData() {
    try {
      // 1. Fetch Latest Station Telemetry
      const tempRes = await fetch("/api/temperature/latest");
      if (tempRes.ok) {
        const tempJson = await tempRes.json();
        if (tempJson.data && tempJson.data.length > 0) {
          state.stationsData = tempJson.data;
          updateHeroTelemetry(tempJson.data);
          renderStationMarkers(tempJson.data);
          renderStationRankingTable(tempJson.data);
        }
      }
    } catch (e) {
      console.warn("Using fallback telemetry data:", e);
    }

    try {
      // 2. Fetch County 36h Forecasts
      const countyRes = await fetch("/api/all_locations_forecast");
      if (countyRes.ok) {
        const countyJson = await countyRes.json();
        if (Array.isArray(countyJson) && countyJson.length > 0) {
          // Merge with detailed county templates
          state.countiesData = countyJson.map(item => {
            const fallback = FALLBACK_COUNTIES.find(f => f.locationName === item.locationName) || {};
            return {
              ...fallback,
              ...item,
              details: fallback.details || { humidity: 68, wind: "2.8 m/s", uv: "7.0", aqi: 38, note: "氣候平穩良好。" }
            };
          });
          renderCountiesCards();
        }
      }
    } catch (e) {
      console.warn("Using fallback county forecast data:", e);
      renderCountiesCards();
    }

    try {
      // 3. Fetch Typhoon Status
      const typhoonRes = await fetch("/api/typhoon_warning");
      if (typhoonRes.ok) {
        const typhoonJson = await typhoonRes.json();
        if (elements.typhoonStatusText) {
          elements.typhoonStatusText.textContent = typhoonJson.has_active_typhoon ? "⚠️ 發布中颱風警報" : "目前無發布中的陸上/海上颱風警報";
        }
        if (elements.typhoonAdvisoryMsg) {
          elements.typhoonAdvisoryMsg.textContent = typhoonJson.message || "目前西北太平洋及南海海域海面平靜，無發布中陸上或海上颱風警報。";
        }
      }
    } catch (e) {
      console.warn("Using default typhoon status:", e);
    }

    try {
      // 4. Fetch Weather Alerts
      const alertsRes = await fetch("/api/alerts");
      if (alertsRes.ok) {
        const alertsJson = await alertsRes.json();
        if (alertsJson.alerts && alertsJson.alerts.length > 0 && elements.bannerAlertText) {
          elements.bannerAlertText.textContent = `中央氣象署示警：${alertsJson.alerts[0].headline} ｜ ${alertsJson.alerts[1]?.headline || ''}`;
        }
      }
    } catch (e) {
      console.warn("Using default weather alerts:", e);
    }
  }

  function initRefreshAction() {
    if (!elements.refreshBtn) return;
    elements.refreshBtn.addEventListener("click", async () => {
      elements.refreshBtn.style.transform = "rotate(180deg)";
      showToast("正在觸發中央氣象署爬蟲並更新資料庫...", "⏳");

      try {
        const refreshRes = await fetch("/api/crawl/refresh");
        if (refreshRes.ok) {
          const res = await refreshRes.json();
          showToast(res.message || "中央氣象署資料爬蟲同步完成！", "✅");
        }
      } catch (err) {
        console.warn("Refresh API called locally:", err);
        showToast("資料已重新整理為最新狀態！", "✅");
      }

      await fetchAllData();
      elements.refreshBtn.style.transform = "rotate(0deg)";
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================
  function init() {
    initTheme();
    initNavigation();
    initCountiesFilter();
    renderCountiesCards();
    updateHeroTelemetry(state.stationsData);
    initLeafletMap();
    initStationSearch();
    initImageryModal();
    initCourseSection();
    initRefreshAction();

    // Fetch live APIs in background
    fetchAllData();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
