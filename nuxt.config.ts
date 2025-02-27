import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  // 啟用 Server-Side Rendering
  ssr: true,

  css: [
    '~/assets/css/main.css', // Tailwind CSS 主樣式
    'mapbox-gl/dist/mapbox-gl.css' // 確保 Mapbox 樣式正確載入
  ],

  modules: [
    '@nuxt/devtools', // Nuxt 開發工具（可選）
    '@nuxtjs/tailwindcss' // Tailwind CSS
  ],

  runtimeConfig: {
    public: {
      mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || '' // Mapbox 金鑰
    }
  },

  nitro: {
    preset: 'vercel' // 部署到 Vercel 時需要
  },

  devtools: { enabled: true },
  compatibilityDate: '2025-02-27'
});