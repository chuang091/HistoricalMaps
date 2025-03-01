import { defineEventHandler, getQuery } from 'h3';

// 瓦片服務 URL
const TILE_SERVER_URL = "https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM20K_1921-jpg";

// 轉換經緯度為 XYZ 瓦片座標
const lngLatToTile = (lng: number, lat: number, zoom: number) => {
  const scale = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * scale);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * scale
  );
  return { tileX: x, tileY: y };
};

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const lat = parseFloat(query.lat as string);
  const lng = parseFloat(query.lng as string);
  // add a parameter to the query object
  const zoom = parseInt(query.zoom as string) || 17;

  console.log('API Query:', query); // Debug 確保查詢參數正確

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { error: "Invalid latitude or longitude" };
  }

  const { tileX, tileY } = lngLatToTile(lng, lat, zoom);
  const tileURL = `${TILE_SERVER_URL}-${zoom}-${tileX}-${tileY}`;

  return { tileX, tileY, zoom, tileURL };
});
