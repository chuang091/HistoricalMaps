<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
    isOpen: Boolean,
    pythonCode: String
});

const emit = defineEmits(["update:isOpen"]);

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
            生成的 Python 代碼
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
            @click="localIsOpen = false" />
        </div>
      </template>

      <div class="p-4 space-y-4">
        <pre class="bg-gray-900 text-white p-4 rounded-lg overflow-auto text-sm">
          {{ pythonCode }}
        </pre>
      </div>
    </UCard>
  </USlideover>
</template>
