<script setup>
import { defineProps, defineEmits, computed } from 'vue';

// 接收 `isOpen` 控制開關，`tileInfo` 傳遞資料
const props = defineProps({
    isOpen: Boolean,
    tileInfo: Object
});

const emit = defineEmits(["update:isOpen"]);

// 讓 `isOpen` 可變，但仍然透過 emit 通知父層更新
const localIsOpen = computed({
  get: () => props.isOpen,
  set: (value) => emit('update:isOpen', value)
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
        <!-- 🔥 綁定圖片來源 -->
        <img v-if="tileInfo.mergedImage" :src="tileInfo.mergedImage" alt="Merged Tile" class="w-full rounded-lg shadow" />
        <p v-else class="text-gray-500 text-sm">沒有可用的圖像</p>
      </div>
    </UCard>
  </USlideover>
</template>
