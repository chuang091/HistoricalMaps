import { describe, it, expect } from 'vitest';
import { createEvent } from 'h3';
import { IncomingMessage, ServerResponse } from 'http';

// 匯入你的 API 處理函式
import apiHandler from '../../server/api/hello';

describe('API /hello', () => {
  it('should return a message and timestamp', async () => {
    // 模擬一個 H3 事件
    const event = createEvent({} as IncomingMessage, {} as ServerResponse);

    // 執行 API 處理函式
    const response = await apiHandler(event);

    // 檢查回傳的結構
    expect(response).toHaveProperty('message', 'Hello from Nuxt API!');
    expect(response).toHaveProperty('timestamp');

    // 確保 timestamp 是有效的日期格式
    expect(new Date(response.timestamp).toString()).not.toBe('Invalid Date');
  });
});
