<script setup>
import { onMounted, ref, watchEffect } from 'vue';
import mapboxgl from 'mapbox-gl';
import { useRuntimeConfig } from '#imports';

const config = useRuntimeConfig();
const MAPBOX_ACCESS_TOKEN = config.public.mapboxToken; // 讀取 Nuxt 3 環境變數

const mapContainer = ref(null);
const map = ref(null);

onMounted(() => {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.log( config.public.mapboxAccessToken)
    console.error("❌ Missing Mapbox Access Token");
    return;
  }

  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

  // 等待 mapContainer 準備好
  watchEffect(() => {
    if (!mapContainer.value) return;

    console.log("✅ Map container is ready!");

    // 初始化 Mapbox 地圖
    map.value = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [121.5, 25.03], // 台北市中心
      zoom: 12
    });

    // 確保地圖載入時不會拋錯
    map.value.on('load', () => {
      console.log("🗺️ Mapbox is loaded!");
    });

    // 錯誤處理
    map.value.on('error', (e) => {
      console.error("🚨 Mapbox Error:", e);
    });
  });
});
</script>

<template>
  <div ref="mapContainer" style="width: 100%; height: 500px; background: lightgray;"></div>
</template>
