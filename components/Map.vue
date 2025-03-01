<script setup>
import { onMounted, ref, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import { useRuntimeConfig } from '#imports';

const config = useRuntimeConfig();
const MAPBOX_ACCESS_TOKEN = config.public.mapboxToken; // 讀取 Nuxt 3 環境變數

const mapContainer = ref(null);
const map = ref(null);
const isHistoricalLayerVisible = ref(true);
const isMapReady = ref(false);
const tileInfo = ref(null);

onMounted(() => {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error("❌ Missing Mapbox Access Token");
    return;
  }

  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

  if (!mapContainer.value) return;

  console.log("✅ Map container is ready!");

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [121.5, 25.03],
    zoom: 12
  });

  map.value.on('load', () => {
    console.log("🗺️ Mapbox is loaded!");

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
      layout: { visibility: isHistoricalLayerVisible.value ? 'visible' : 'none' }
    });

    isMapReady.value = true;
    console.log("📍 Historical Map Layer Added!");
  });

  map.value.on('click', async (e) => {
    console.log("🖱️ Clicked on map:", e.lngLat);

    try {
      const response = await fetch(`/api/tile-info?lat=${e.lngLat.lat}&lng=${e.lngLat.lng}`);
      const data = await response.json();

      tileInfo.value = data || { message: "沒有找到對應資料" };
    } catch (error) {
      console.error("❌ API 查詢錯誤:", error);
      tileInfo.value = { message: "查詢失敗" };
    }
  });

  map.value.on('error', (e) => {
    console.error("🚨 Mapbox Error:", e);
  });
});

// **監聽 `isHistoricalLayerVisible` 變更**
watch(isHistoricalLayerVisible, (newValue) => {
  if (!map.value || !map.value.getLayer('historical-map-layer')) return;
  map.value.setLayoutProperty(
    'historical-map-layer',
    'visibility',
    newValue ? 'visible' : 'none'
  );
});
</script>

<template>
  <div ref="mapContainer" style="width: 100%; height: 100vh; background: lightgray; position: relative;">
    <div class="absolute top-4 left-4 bg-white p-3 rounded shadow-md border border-gray-300 z-10">
      <label class="flex items-center space-x-2">
        <span class="text-gray-800 text-sm">歷史地圖</span>
        <UToggle v-model="isHistoricalLayerVisible" />
      </label>
    </div>

    <!-- ✅ 點擊地圖時顯示 XYZ 瓦片座標 -->
    <div v-if="tileInfo" class="absolute bottom-4 left-4 bg-white p-3 rounded shadow-md border border-gray-300 z-10">
      <p class="text-sm text-gray-800">X: {{ tileInfo.tileX }}</p>
      <p class="text-sm text-gray-800">Y: {{ tileInfo.tileY }}</p>
      <p class="text-sm text-gray-800">Zoom: {{ tileInfo.zoom }}</p>
      <p>{{ tileInfo.tileURL }}</p>
    </div>
  </div>
</template>
