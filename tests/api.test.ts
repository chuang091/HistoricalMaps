import { describe, test, expect } from 'vitest';

describe('API Tests', () => {
  test('GET /api/hello should return a message', async () => {
    const response = await fetch(`/api/hello`);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty('message');
    expect(json.message).toBe('Hello from Nuxt API!');
  });

    test('GET /api/hello should return a timestamp', async () => {
        const response = await fetch(`/api/hello`);
        const json = await response.json();
    
        expect(response.status).toBe(200);
        expect(json).toHaveProperty('timestamp');
        expect(new Date(json.timestamp)).toBeInstanceOf(Date);
    });
});
