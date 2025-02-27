import { describe, test, expect } from 'vitest';

describe('API Tests', () => {
  test('GET /api/hello should return a message', async () => {
    const response = await fetch('http://localhost:3000/api/hello');
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty('message');
    expect(json.message).toBe('Hello from Nuxt API!');
  });
});
