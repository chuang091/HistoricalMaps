import { defineEventHandler, getQuery } from 'h3';

// 瓦片伺服器 URL
const TILE_SERVER_URL = "https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM20K_1921-jpg";

// 轉換經緯度為 XYZ 瓦片座標
const lngLatToTile = (lng: number, lat: number, zoom: number) => {
  const scale = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * scale);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * scale
  );
  return { x, y };
};

// 找出 `zoom=13` 下對應的 `zoom=17` 的 16 個瓦片
const getZoom17Tiles = (tileX: number, tileY: number) => {
  const tiles = [];
  const factor = Math.pow(2, 4); // zoom 13 → zoom 17 = 2^(17-13) = 16 倍細分

  for (let dx = 0; dx < factor; dx++) {
    for (let dy = 0; dy < factor; dy++) {
      const zoom17X = tileX * factor + dx;
      const zoom17Y = tileY * factor + dy;
      tiles.push({ x: zoom17X, y: zoom17Y });
    }
  }

  return tiles;
};

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const lat = parseFloat(query.lat as string);
  const lng = parseFloat(query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return { error: "Invalid latitude or longitude" };
  }

  const zoom13 = 13;
  const zoom17 = 17;

  // 取得 zoom=13 的大瓦片座標
  const { x: tileX13, y: tileY13 } = lngLatToTile(lng, lat, zoom13);

  // 取得 zoom=17 的 16 個瓦片座標
  const zoom17Tiles = getZoom17Tiles(tileX13, tileY13).map(({ x, y }) => ({
    tileX: x,
    tileY: y,
    zoom: zoom17,
    tileURL: `${TILE_SERVER_URL}-${zoom17}-${x}-${y}`
  }));

  return {
    zoom13: { tileX: tileX13, tileY: tileY13, zoom: zoom13 },
    zoom17Tiles
  };
});
