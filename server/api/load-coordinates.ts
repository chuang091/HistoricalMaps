import { defineEventHandler } from 'h3';
import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'coordinates.txt'); // 確保讀取專案目錄的座標檔

export default defineEventHandler(async () => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim() !== '');

    const tiles = lines.map(line => {
      const [x, y] = line.split(',').map(Number);
      if (isNaN(x) || isNaN(y)) return null;

      // 轉換成 Zoom 15 的 top-left
      return { tileX: Math.floor(x / 4), tileY: Math.floor(y / 4), zoom: 15 };
    }).filter(Boolean);
    return { success: true, tiles };
  } catch (error) {
    console.error("❌ 讀取座標文件失敗:", error);
    return { success: false, error: '無法讀取座標文件' };
  }
});
