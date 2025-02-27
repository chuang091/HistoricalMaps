import { defineEventHandler } from 'h3';

export default defineEventHandler(() => {
    return {
      message: 'Hello from Nuxt API!',
      timestamp: new Date().toISOString()
    };
  });
  