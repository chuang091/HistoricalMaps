<script setup>
import { onMounted, ref, watchEffect } from 'vue';
import mapboxgl from 'mapbox-gl';
import { useRuntimeConfig } from '#imports';

const config = useRuntimeConfig();
const MAPBOX_ACCESS_TOKEN = config.public.mapboxToken; // 讀取 Nuxt 3 環境變數

const mapContainer = ref(null);
const map = ref(null);
const isHistoricalLayerVisible = ref(true); // 控制圖層顯示狀態

onMounted(() => {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error("❌ Missing Mapbox Access Token");
    return;
  }

  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

  watchEffect(() => {
    if (!mapContainer.value) return;

    console.log("✅ Map container is ready!");

    map.value = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [121.5, 25.03], // 台北市中心
      zoom: 12
    });

    map.value.on('load', () => {
      console.log("🗺️ Mapbox is loaded!");

      // 🔥 加入 WMTS 圖層
      map.value.addSource('historical-map', {
        type: 'raster',
        tiles: [
          'https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM20K_1921-jpg-{z}-{x}-{y}'
        ],
        tileSize: 256
      });

      map.value.addLayer({
        id: 'historical-map-layer',
        type: 'raster',
        source: 'historical-map',
        paint: {},
        layout: { visibility: 'visible' } // 初始狀態為可見
      });

      console.log("📍 Historical Map Layer Added!");
    });

    map.value.on('error', (e) => {
      console.error("🚨 Mapbox Error:", e);
    });
  });
});

// 切換圖層可見性
const toggleHistoricalLayer = () => {
  if (!map.value) return;

  const visibility = map.value.getLayoutProperty('historical-map-layer', 'visibility');

  if (visibility === 'visible') {
    map.value.setLayoutProperty('historical-map-layer', 'visibility', 'none');
    isHistoricalLayerVisible.value = false;
  } else {
    map.value.setLayoutProperty('historical-map-layer', 'visibility', 'visible');
    isHistoricalLayerVisible.value = true;
  }
};
</script>

<template>
  <div ref="mapContainer" style="width: 100%; height: 100vh; background: lightgray; position: relative;">
    <!-- Nuxt UI 的 Toggle 開關 -->
    <div class="absolute top-4 left-4 bg-white p-3 rounded shadow-md border border-gray-300">
      <label class="flex items-center space-x-2">
        <span class="text-gray-800 text-sm">歷史地圖</span>
        <UToggle v-model="isHistoricalLayerVisible" @change="toggleHistoricalLayer" />
      </label>
    </div>
  </div>
</template>
