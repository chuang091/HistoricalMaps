<script setup>
import { onMounted, ref, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import { useRuntimeConfig, useFetch } from '#imports';

const config = useRuntimeConfig();
const MAPBOX_ACCESS_TOKEN = config.public.mapboxToken;

const mapContainer = ref(null);
const map = ref(null);
const isHistoricalLayerVisible = ref(true);
const isMapReady = ref(false);
const selectedTiles = ref([]); // 用戶選取的瓦片區域
const presetTiles = ref([]); // 從 `coordinates.txt` 讀取的瓦片區域

onMounted(async () => {
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

  map.value.on('load', async () => {
    console.log("🗺️ Mapbox is loaded!");

    // **加入歷史地圖圖層**
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

    // **建立 "預載入瓦片" 圖層 (從 coordinates.txt 讀取)**
    map.value.addSource('preset-layer', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.value.addLayer({
      id: 'preset-layer',
      type: 'fill',
      source: 'preset-layer',
      paint: {
        'fill-color': '#008000', // **綠色**
        'fill-opacity': 0.3
      }
    });

    // **建立 "使用者選取" 圖層**
    map.value.addSource('highlight-layer', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.value.addLayer({
      id: 'highlight-layer',
      type: 'fill',
      source: 'highlight-layer',
      paint: {
        'fill-color': '#ff0000', // **紅色**
        'fill-opacity': 0.5
      }
    });

    isMapReady.value = true;
    console.log("📍 Layers Added!");

    // **讀取 API 獲取 Zoom 15 預選範圍**
    const { data } = await useFetch('/api/load-coordinates');
    if (data.value?.success) {
      presetTiles.value = data.value.tiles;
      updatePresetLayer(); // **更新預載入圖層**
    }
  });

  // **處理點擊事件**
  map.value.on('click', async (e) => {
    console.log("🖱️ Clicked on map:", e.lngLat);

    try {
      const response = await fetch(`/api/tile-info?lat=${e.lngLat.lat}&lng=${e.lngLat.lng}&zoom=15`);
      const data = await response.json();

      if (data.error) {
        console.error("❌ API 回應錯誤:", data.error);
        return;
      }

      // **檢查是否已經選取**
      const existingIndex = selectedTiles.value.findIndex(
        tile => tile.tileX === data.tileX && tile.tileY === data.tileY
      );

      if (existingIndex !== -1) {
        // **如果已選取，則取消選取**
        selectedTiles.value.splice(existingIndex, 1);
      } else {
        // **否則加入選取的列表**
        selectedTiles.value.push(data);
      }

      updateHighlightLayer(); // **更新地圖上的高亮區域**
    } catch (error) {
      console.error("❌ API 查詢錯誤:", error);
    }
  });

  map.value.on('error', (e) => {
    console.error("🚨 Mapbox Error:", e);
  });
});

// **更新 "使用者選取" 圖層**
const updateHighlightLayer = () => {
  if (!map.value) return;
  const highlightSource = map.value.getSource('highlight-layer');

  if (highlightSource) {
    highlightSource.setData({
      type: 'FeatureCollection',
      features: selectedTiles.value.map(tile => createPolygon(tile, '#ff0000'))
    });
  }
};

// **更新 "預載入" 圖層**
const updatePresetLayer = () => {
  if (!map.value) return;
  const presetSource = map.value.getSource('preset-layer');

  if (presetSource) {
    presetSource.setData({
      type: 'FeatureCollection',
      features: presetTiles.value.map(tile => createPolygon(tile, '#008000'))
    });
  }
};

// **建立瓦片的 Polygon**
const createPolygon = (tile, color) => ({
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      tileToLngLat(tile.tileX, tile.tileY),
      tileToLngLat(tile.tileX + 1, tile.tileY),
      tileToLngLat(tile.tileX + 1, tile.tileY + 1),
      tileToLngLat(tile.tileX, tile.tileY + 1),
      tileToLngLat(tile.tileX, tile.tileY) // **閉合區域**
    ]]
  },
  properties: { color }
});

// **轉換 Tile X/Y 到經緯度**
const tileToLngLat = (x, y, zoom = 15) => {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
  const lat = (latRad * 180) / Math.PI;
  return [lng, lat];
};

// **監聽歷史地圖開關**
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
  </div>
</template>
