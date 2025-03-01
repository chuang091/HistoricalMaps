<script setup>
import { defineProps, defineEmits, computed, ref, watch } from 'vue';

// 接收 `isOpen` 控制開關，`tileInfo` 傳遞資料
const props = defineProps({
    isOpen: Boolean,
    tileInfo: Object
});

const emit = defineEmits(["update:isOpen"]);
const localIsOpen = computed({
  get: () => props.isOpen,
  set: (value) => emit('update:isOpen', value)
});

// ✅ 物件偵測結果 (RoboFlow)
const detectionResult = ref(null);
const isLoading = ref(false); // 請求狀態

// 監聽 mergedImage，當它變動時自動發送 RoboFlow API
watch(() => props.tileInfo.mergedImage, async (newImage) => {
  if (newImage) {
    console.log("🚀 發送 RoboFlow API:", newImage);

    isLoading.value = true;
    try {
      const response = await fetch(`/api/roboflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: newImage }) // 🔥 傳 Base64 給 API
      });

      const data = await response.json();
      console.log("✅ RoboFlow 回應:", data);
      detectionResult.value = data;
    } catch (error) {
      console.error("❌ RoboFlow API 錯誤:", error);
      detectionResult.value = { error: "RoboFlow 偵測失敗" };
    } finally {
      isLoading.value = false;
    }
  }
});
</script>

<template>
  <USlideover v-model="localIsOpen" :overlay="false" class="z-20 pointer-events-none">
    <UCard class="flex flex-col flex-1 pointer-events-auto"
        :ui="{ body: { base: 'flex-1' }, ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Tile Information
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
            @click="localIsOpen = false" />
        </div>
      </template>

      <div class="p-4 space-y-4">
        <!-- ✅ 顯示地圖瓦片 -->
        <img v-if="tileInfo.mergedImage" :src="tileInfo.mergedImage" alt="Merged Tile" class="w-full rounded-lg shadow" />
        <p v-else class="text-gray-500 text-sm">沒有可用的圖像</p>

        <!-- 🔥 物件偵測結果 -->
        <div v-if="isLoading" class="text-center text-gray-500">
          🚀 檢測中...
        </div>
        <div v-else-if="detectionResult">
          <h4 class="text-lg font-semibold">🔍 偵測結果</h4>
          <ul v-if="detectionResult.predictions?.length">
            <li v-for="(item, index) in detectionResult.predictions" :key="index">
              {{ item.class }} - 置信度: {{ item.confidence }}%
            </li>
          </ul>
          <p v-else class="text-sm text-gray-500">沒有偵測到物件</p>
        </div>
      </div>
    </UCard>
  </USlideover>
</template>
