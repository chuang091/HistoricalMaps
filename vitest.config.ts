import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [Vue()], // 讓 Vitest 支援 Vue 單檔元件
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '#imports': path.resolve(__dirname, 'tests/nuxt-mock/imports.js')
    },
  },
});
