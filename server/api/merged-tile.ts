import { defineEventHandler, getQuery } from 'h3';
import { createCanvas, loadImage } from 'canvas';

// 瓦片伺服器 URL
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

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const lat = parseFloat(query.lat as string);
  const lng = parseFloat(query.lng as string);
  const baseZoom = 14;
  const targetZoom = 17;
  const tileSize = 256; // 瓦片大小 (px)
  const scaleFactor = Math.pow(2, targetZoom - baseZoom);
  const canvasSize = tileSize * scaleFactor; // 拼接後的總大小

  if (isNaN(lat) || isNaN(lng)) {
    return { error: "Invalid latitude or longitude" };
  }

  // 計算 zoom=14 的 XYZ 瓦片座標
  const { tileX, tileY } = lngLatToTile(lng, lat, baseZoom);

  // 建立 Canvas
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext('2d');

  console.log(`🖼️ 合併瓦片，範圍: Z=${targetZoom}, X=${tileX}, Y=${tileY}, 縮放: ${scaleFactor}x${scaleFactor}`);

  // 下載所有 zoom=17 瓦片並繪製到 Canvas
  const tilePromises = [];
  for (let dx = 0; dx < scaleFactor; dx++) {
    for (let dy = 0; dy < scaleFactor; dy++) {
      const subX = tileX * scaleFactor + dx;
      const subY = tileY * scaleFactor + dy;
      const tileURL = `${TILE_SERVER_URL}-${targetZoom}-${subX}-${subY}`;

      tilePromises.push(
        loadImage(tileURL).then((img) => {
          const posX = dx * tileSize;
          const posY = dy * tileSize;
          ctx.drawImage(img, posX, posY, tileSize, tileSize);
        }).catch((error) => {
          console.error(`❌ 無法載入瓦片 ${tileURL}`, error);
        })
      );
    }
  }

  await Promise.all(tilePromises);

  // 轉換成 Base64 PNG 圖片
  const mergedImage = canvas.toDataURL('image/png');

  return {
    baseTile: { zoom: baseZoom, tileX, tileY },
    mergedImage, // Base64 圖片，可直接在 `<img>` 使用
  };
});
