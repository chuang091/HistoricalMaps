import { describe, test, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('API Tests', () => {
  test('GET /api/hello should return a message', async () => {
    const response = await fetch(`${BASE_URL}/api/hello`);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty('message');
    expect(json.message).toBe('Hello from Nuxt API!');
  });
});
