<script setup>
import { defineProps, defineEmits, computed, ref, watch, nextTick } from 'vue';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';

const props = defineProps({
  isOpen: Boolean,
  selectedTiles: Array
});

const emit = defineEmits(["update:isOpen"]);
const localIsOpen = computed({
  get: () => props.isOpen,
  set: (value) => emit('update:isOpen', value)
});

// ✅ 生成 Python 代碼
const pythonCode = computed(() => {
  if (!props.selectedTiles.length) return "# 沒有選取任何瓦片\nprint('No tiles selected')";

  let tileCoords = props.selectedTiles.map(tile => `(${tile.tileX}, ${tile.tileY})`).join(",\n    ");
  return `
import os
import math
import requests
from io import BytesIO
from PIL import Image

# 瓦片伺服器 URL
TILE_SERVER_URL = "https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM20K_1921-jpg"

# 影像拼接設定
INPUT_ZOOM = 15  # 輸入 zoom
TARGET_ZOOM = 17  # 目標 zoom
TILE_SIZE = 256  # 單個瓦片大小 (px)
SCALE_FACTOR = 2 ** (TARGET_ZOOM - INPUT_ZOOM)  # 放大倍率 (4 倍)
GRID_SIZE = 4  # 需要的 zoom=17 瓦片數量 (4x4)

def get_tile_image(x, y, zoom):
    """從伺服器下載瓦片"""
    tile_url = f"{TILE_SERVER_URL}-{zoom}-{x}-{y}"
    try:
        response = requests.get(tile_url, timeout=10)
        if response.status_code == 200:
            return Image.open(BytesIO(response.content))
        else:
            print(f"⚠️ 無法下載瓦片: {tile_url}")
    except Exception as e:
        print(f"❌ 錯誤: {e}")
    return None

def merge_tiles(base_x, base_y, output_path="stitched.png"):
    stitched_image = Image.new("RGB", (TILE_SIZE * GRID_SIZE, TILE_SIZE * GRID_SIZE))

    for dx in range(GRID_SIZE):
        for dy in range(GRID_SIZE):
            tile_x = base_x + dx
            tile_y = base_y + dy
            img = get_tile_image(tile_x, tile_y, TARGET_ZOOM)
            if img:
                stitched_image.paste(img, (dx * TILE_SIZE, dy * TILE_SIZE))

    # 儲存影像
    stitched_image.save(output_path)
    print(f"✅ 影像已成功存為: {output_path}")

if __name__ == "__main__":
    tiles = [
        ${tileCoords}
    ]
    
    for x, y in tiles:
        zoom_17_x = x * SCALE_FACTOR
        zoom_17_y = y * SCALE_FACTOR
        output_filename = f"{zoom_17_x}_{zoom_17_y}.jpg"
        merge_tiles(zoom_17_x, zoom_17_y, output_filename)
`;
});

// ✅ 代碼高亮 (確保高亮在 DOM 更新後執行)
const codeBlock = ref(null);

const highlightCode = async () => {
  await nextTick(); // **確保 DOM 更新完成**
  if (codeBlock.value) {
    Prism.highlightElement(codeBlock.value);
  }
};

// ✅ **監聽 `pythonCode` 變化時重新高亮**
watch(pythonCode, async () => {
  await nextTick();
  highlightCode();
});

// ✅ **監聽 `isOpen`，當開啟 `SlideOver` 時強制重新高亮**
watch(localIsOpen, (newVal) => {
  if (newVal) {
    setTimeout(highlightCode, 100); // **確保 Prism.js 正確應用樣式**
  }
});

// ✅ **複製代碼**
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(pythonCode.value);
    alert("✅ 代碼已複製！");
  } catch (err) {
    console.error("❌ 無法複製代碼:", err);
  }
};
</script>

<template>
  <USlideover v-model="localIsOpen" :overlay="false" class="z-20 pointer-events-none">
    <UCard class="flex flex-col h-full pointer-events-auto"
        :ui="{ body: { base: 'flex-1' }, ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            生成的 Python 代碼
          </h3>
          <div class="flex space-x-2">
            <!-- 🔥 複製按鈕 -->
            <UButton color="gray" variant="ghost" icon="i-heroicons-clipboard-document" @click="copyCode" />
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="localIsOpen = false" />
          </div>
        </div>
      </template>

      <div class="h-full flex-1 overflow-auto">
        <pre class="rounded-lg overflow-auto text-sm max-h-[80vh]">
          <code ref="codeBlock" class="language-python">{{ pythonCode }}</code>
        </pre>
      </div>

    </UCard>
  </USlideover>
</template>

<style scoped>
pre {
  background: #1e1e1e;
  color: #ffffff;
  border-radius: 8px;
  padding: 10px;
  max-height: 80vh; /* **讓代碼可以滾動** */
  overflow: auto;
  font-size: 14px;
}
</style>
