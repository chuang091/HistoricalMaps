<script setup>
import { ref, watchEffect } from 'vue';
import { useMap } from '@/composables/useMap';
import { useTileSelection } from '@/composables/useTileSelection';
import SlideOver from '@/components/SlideOver.vue';

const mapContainer = ref(null);
const { map, isMapReady } = useMap(mapContainer);
const { selectedTiles, handleMapClick, updateHighlightLayer } = useTileSelection(map);
const isHistoricalLayerVisible = ref(true);
const isSlideOverOpen = ref(false);

// 🚀 **當地圖載入時，監聽點擊事件**
watchEffect(() => {
  if (isMapReady.value && map.value) {
    map.value.on('click', handleMapClick);
  }
});

// 🚀 **監聽 `isHistoricalLayerVisible`，確保切換可見性**
watchEffect(() => {
  if (isMapReady.value && map.value) {
    const layerId = 'historical-map-layer';
    if (map.value.getLayer(layerId)) {
      map.value.setLayoutProperty(layerId, 'visibility', isHistoricalLayerVisible.value ? 'visible' : 'none');
    }
  }
});

// ✅ **確保高亮圖層更新**
watchEffect(() => {
  if (isMapReady.value) {
    updateHighlightLayer(selectedTiles.value);
  }
});
</script>

<template>
  <div ref="mapContainer" style="width: 100%; height: 100vh; background: lightgray; position: relative;">
    <!-- 圖層切換 -->
    <div class="absolute top-4 left-4 bg-white p-3 rounded shadow-md border border-gray-300 z-10">
      <label class="flex items-center space-x-2">
        <span class="text-gray-800 text-sm">歷史地圖</span>
        <UToggle v-model="isHistoricalLayerVisible" />
        <UButton @click="isSlideOverOpen = true" color="blue"
        :disabled="selectedTiles.length === 0" class="ml-4"
        >下載 {{ selectedTiles.length }} 張圖片</UButton>
      </label>
    </div>

    <!-- SlideOver (傳遞 selectedTiles) -->
    <SlideOver v-model:isOpen="isSlideOverOpen" :selectedTiles="selectedTiles" />
  </div>
</template>
