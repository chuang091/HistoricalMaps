<script setup>
import { onMounted, ref, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import { useRuntimeConfig } from '#imports';
import SlideOver from '@/components/SlideOver.vue';

const config = useRuntimeConfig();
const MAPBOX_ACCESS_TOKEN = config.public.mapboxToken;

const mapContainer = ref(null);
const map = ref(null);
const isHistoricalLayerVisible = ref(true);
const isMapReady = ref(false);
const tileInfo = ref({}); // 確保 tileInfo 有初始值
const isSlideOverOpen = ref(false);

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

  // 點擊地圖時，呼叫 API 取得合併瓦片
  map.value.on('click', async (e) => {
    console.log("🖱️ Clicked on map:", e.lngLat);

    try {
      const response = await fetch(`/api/merged-tile?lat=${e.lngLat.lat}&lng=${e.lngLat.lng}`);
      const data = await response.json();

      if (data.mergedImage) {
        tileInfo.value = {
          ...data,
          mergedImage: data.mergedImage
        };
      } else {
        tileInfo.value = { message: "無法取得合併圖片" };
      }

      console.log("🔍 API 查詢結果:", data);

      // 重新打開 SlideOver
      isSlideOverOpen.value = false;
      setTimeout(() => {
        isSlideOverOpen.value = true;
      }, 100);
    } catch (error) {
      console.error("❌ API 查詢錯誤:", error);
      tileInfo.value = { message: "查詢失敗" };
      isSlideOverOpen.value = true;
    }
  });

  map.value.on('error', (e) => {
    console.error("🚨 Mapbox Error:", e);
  });
});

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
    <!-- 圖層切換 -->
    <div class="absolute top-4 left-4 bg-white p-3 rounded shadow-md border border-gray-300 z-10">
      <label class="flex items-center space-x-2">
        <span class="text-gray-800 text-sm">歷史地圖</span>
        <UToggle v-model="isHistoricalLayerVisible" />
      </label>
    </div>

    <!-- ✅ 引入 `SlideOver.vue` -->
    <SlideOver v-model:isOpen="isSlideOverOpen" :tileInfo="tileInfo" />
  </div>
</template>
