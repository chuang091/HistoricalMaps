import { describe, it, expect } from 'vitest';
import { createEvent } from 'h3';
// 匯入 API 處理函式
import apiHandler from '@/server/api/tile-info';
import { IncomingMessage, ServerResponse } from 'http';

describe('API /tile-info', () => {
  it('應該回傳正確的 XYZ 瓦片座標與 URL', async () => {
    // 將查詢參數包含在 URL 上，讓 getQuery 能正確解析
    const event = createEvent({
      url: '/api/tile-info?lat=25.03&lng=121.5'
    }as IncomingMessage,  {} as ServerResponse);
    const response = await apiHandler(event);
    console.log('API Response:', response); // 可用於除錯

    // 驗證回傳內容正確
    expect(response).toHaveProperty('tileX');
    expect(response).toHaveProperty('tileY');
    expect(response).toHaveProperty('tileURL');
    expect(response).toHaveProperty('zoom17Tiles');
  });

  it('應該回傳錯誤訊息當參數無效', async () => {
    const event = createEvent({
      url: '/api/tile-info?lat=invalid&lng=invalid'
    }as IncomingMessage,  {} as ServerResponse);
    const response = await apiHandler(event);
    expect(response).toHaveProperty('error', 'Invalid latitude or longitude');
  });
});
